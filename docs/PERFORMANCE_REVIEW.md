# ZCrystal Plugin Performance Review

**Date:** 2026-04-25  
**Reviewer:** Ophelia Prime (Subagent)  
**Scope:** Hook execution, FTS5 indexing, Self-Evolution Engine, Tool execution  
**Test Status:** 117/117 passing

---

## Summary

The ZCrystal plugin has a solid architectural foundation (harness patterns, layered design) but contains several performance bottlenecks—primarily Python subprocess spawning on hot paths and lazy cleanup of in-memory Maps. Five bottlenecks are **High** impact (blocking or memory growth), four are **Medium**, and two are **Low**.

| # | Bottleneck | Location | Impact | Type |
|---|------------|----------|--------|------|
| 1 | Python subprocess per message hook | `index.ts` (message:received/sent) | **High** | Blocking I/O |
| 2 | Python subprocess in zcrystal_search tool | `core-tools.ts` | **High** | Process spawn |
| 3 | Python subprocess in memory progressive tools | `memory/progressive.ts` | **High** | Process spawn |
| 4 | before_prompt_build Python subprocess (fire-and-forget) | `index.ts` | **High** | Process spawn |
| 5 | pendingEvaluations Map cleanup only on access | `self-evolution.ts` | **High** | Memory leak |
| 6 | backups Map cleanup only on rollback | `self-evolution.ts` | **Medium** | Memory leak |
| 7 | EvolutionScheduler.getSkills() does full rediscovery each hour | `index.ts` + `skill-manager.ts` | **Medium** | Redundant I/O |
| 8 | Heartbeat + Proactive intervals are separate setIntervals | `index.ts` | **Medium** | Redundant timer |
| 9 | ensureWorkspace called on every Honcho API call | `honcho-client.ts` | **Medium** | Redundant HTTP |
| 10 | Dynamic import inside before_prompt_build hook | `index.ts` | **Low** | Import overhead |

---

## Detailed Analysis

### B1: Python subprocess per message hook 🔴 HIGH

**File:** `src/index.ts` lines ~460–490  
**Issue:** Every `message:received` and `message:sent` event spawns a detached Python process:

```typescript
spawn('python3', [FTS5_REALTIME_INDEXER, msgData], { detached: true, stdio: 'ignore' });
```

Even with `detached: true, stdio: 'ignore'`, Node.js still:
- Resolves/validates the script path
- Fork a new process via `child_process`
- Initialize Python interpreter (~50–100ms cold start)
- Execute the FTS5 indexer script

For a busy chat channel (100 messages/day), this creates 200 Python processes daily, most of which outlive their usefulness (FTS5 writes are batching-safe).

**Fix:** 
1. **Queue-and-flush pattern**: Accumulate messages in a buffer (max 10 or 5 seconds), then spawn ONE Python process to batch-index all pending messages.
2. **Or**: Use a persistent Python subprocess with stdin pipe (reusing warm process).

**Impact:** High — affects every incoming/outgoing message.

---

### B2: Python subprocess in zcrystal_search tool 🔴 HIGH

**File:** `src/tools/core-tools.ts` lines ~70–95  
**Issue:** Direct inline Python spawn for every search:

```typescript
const py = spawn('python3', [
  '-c',
  `import sys; sys.path.insert(0, '/home/snow/.openclaw'); from skills.fts5 import search; ...`
]);
```

This creates a new Python process per tool invocation (synchronous `await` blocking). Python cold-start overhead (~50–100ms) dominates search latency when FTS5 server is available.

**Fix:**
1. Prefer the HTTP MCP FTS5 client (`fts5HttpSearch` in `fts5-bridge.ts`) which reuses HTTP keep-alive connections.
2. Only fall back to Python subprocess when HTTP FTS5 is truly unavailable.

**Impact:** High — adds ~50–100ms per search call.

---

### B3: Python subprocess in memory progressive tools 🔴 HIGH

**File:** `src/memory/progressive.ts` (two spawns)

```typescript
// Layer 1: getMemoryIndex
const py = spawn('python3', ['-c', script]);

// Layer 3: getMemoryEntryById  
const py = spawn('python3', ['-c', script]);
```

Same issue as B2 — new Python process per call, but these are less frequently used (triggered by specific tool calls).

**Fix:** Same as B2 — use HTTP FTS5 client or batch these into the same Python subprocess pool.

**Impact:** High per call, but lower frequency than B1/B2.

---

### B4: before_prompt_build Python subprocess 🔴 HIGH

**File:** `src/index.ts` lines ~530–560  
**Issue:** Inline Python script via `spawn('python3', ['-c', searchScript])` with `detached: true`:

```typescript
spawn('python3', ['-c', searchScript], { detached: true, stdio: 'ignore' });
```

The script does a FTS5 search but results are **not piped back** to the hook — it's purely for logging. This means:
1. A Python process spawns for every message with memory-gap triggers
2. The results are lost (fire-and-forget)
3. The spawn overhead is pure waste

Also uses `await import('node:child_process')` dynamically inside the hook — extra module resolution cost.

**Fix:**
1. Remove the detached spawn if results aren't consumed — just log locally.
2. If FTS5 context injection is needed, pipe results back via a proper async queue.
3. If not needed, remove the entire Python subprocess call from the hook.

**Impact:** High — spawns Python process on potentially frequent hook calls, results are discarded.

---

### B5: pendingEvaluations Map — cleanup only on access 🔴 HIGH

**File:** `src/self-evolution.ts` (~line 470)

```typescript
private cleanupPendingEvaluations(): void {
  const now = Date.now();
  for (const [key, entry] of this.pendingEvaluations.entries()) {
    if (now - entry.timestamp > MAX_PENDING_TTL_MS) {
      this.pendingEvaluations.delete(key);
    }
  }
  // Also enforce max size
  if (this.pendingEvaluations.size > 100) { ... }
}
```

`cleanupPendingEvaluations()` is only called from `scoreCandidateAsync()`, which means:
- If `scoreCandidateAsync` is not called frequently, stale entries accumulate
- TTL of 30 seconds means at most 30 seconds of buildup, but if `scoreCandidateAsync` is not called for a while (e.g., no evolution activity), the Map grows unbounded

**Fix:** Call `cleanupPendingEvaluations()` in `SelfEvolutionEngine.initialize()` and also on a periodic timer (e.g., every 5 minutes) even when no evolution is running.

**Impact:** Medium memory growth (bounded to 100 entries by max-size check, but TTL cleanup is unreliable).

---

### B6: backups Map — cleanup only on rollback 🔴 MEDIUM

**File:** `src/self-evolution.ts` (~line 120)

```typescript
private readonly BACKUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
private cleanupBackups(): void { ... }

// cleanupBackups() is only called in:
private async performRollback(skillSlug: string): Promise<boolean> {
  this.cleanupBackups(); // Called here
  const entry = this.backups.get(skillSlug);
  ...
}
```

`cleanupBackups()` is **never called on a timer**. It's only called during `performRollback()`. This means:
- Backups accumulate in memory for skills that never get rolled back
- TTL of 24 hours is never enforced — backups live forever until rollback
- For a plugin with 20+ skills, each with 1 backup = Map grows indefinitely

**Fix:** Add cleanup call to `SelfEvolutionEngine.initialize()` and/or add a periodic cleanup in `startScheduler()`.

**Impact:** Memory leak — grows unbounded over time.

---

### B7: EvolutionScheduler.getSkills() full rediscovery 🔴 MEDIUM

**File:** `src/index.ts` (~line 130)

```typescript
const getSkills = async () => {
  try {
    if (state?.skillManager) {
      const result = await state.skillManager.discover(); // FULL rediscover each hour
      ...
    }
  } catch (e) { ... }
  return [];
};
const evolutionScheduler = new EvolutionScheduler(coordinator, getSkills, 60 * 60 * 1000);
evolutionScheduler.start();
```

`SkillManager.discover()` does full filesystem scan + parse every hour. With 5-minute cache in `SkillManager`, this is usually cached, but:
- If plugin restarts, cache is cleared → first scheduled run does full discovery
- Cache TTL is 5 minutes, but scheduler runs every 60 minutes → always uncached

**Fix:**
1. Add an explicit `getSkills()` to `SkillManager` that returns cached skills without re-discovering.
2. Or cache the skill list in `EvolutionScheduler` itself (update on `skillManager.discover()` result).

**Impact:** Medium — filesystem I/O and parsing overhead on each scheduler run.

---

### B8: Heartbeat + Proactive as separate setIntervals 🔴 MEDIUM

**File:** `src/index.ts` (~line 170–195)

```typescript
const heartbeatInterval = setInterval(async () => {
  // healthCheck + getEvolutionStatus → 2 HTTP calls
}, 5 * 60 * 1000);

const proactiveInterval = setInterval(async () => {
  // memoryLoad + getUpgradeSuggestions → 2 HTTP calls
}, 10 * 60 * 1000);
```

Two separate timers with no coordination:
- Heartbeat at 5 min, Proactive at 10 min → redundant timing
- Each makes 2 HTTP calls to Honcho API
- Could be combined into one 5-minute tick with both operations

**Fix:** Merge into single 5-minute interval:

```typescript
const monitorInterval = setInterval(async () => {
  // healthCheck + evolutionStatus (parallel)
  // memoryLoad + upgradeSuggestions (parallel)
}, 5 * 60 * 1000);
```

**Impact:** Medium — reduces HTTP calls by ~50%.

---

### B9: ensureWorkspace called on every Honcho API call 🔴 MEDIUM

**File:** `src/honcho-client.ts` (~line 60)

```typescript
async ensureWorkspace(): Promise<boolean> {
  // Always checks workspace existence first
  const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}`, ...);
  // Then creates if doesn't exist
}
```

Workspace validation (GET + conditional POST) is called on:
- `addMessages()`
- `getMessages()`
- `session()`
- `listSessions()`
- etc.

Even with 60-second TTL caching on the validity check, the first call per TTL window hits the network. For high-throughput scenarios, this adds up.

**Fix:** Workspace check is already cached for 60s — this is acceptable. No change needed unless Honcho API latency becomes a problem.

**Impact:** Low-Medium — already cached, acceptable.

---

### B10: Dynamic import inside before_prompt_build hook 🔴 LOW

**File:** `src/index.ts` (~line 533)

```typescript
const { spawn } = await import('node:child_process');
```

Dynamic import of `node:child_process` inside `before_prompt_build`. The module is already loaded at startup (top-level imports), so this adds unnecessary module resolution overhead on each hook call.

**Fix:** Remove the dynamic import — `spawn` is already available from top-level `import { spawn } from 'node:child_process'`.

**Impact:** Low — extra module resolution per hook call.

---

## Specific Configuration Checks

### EvolutionScheduler interval: 1 hour

**Finding:** 1 hour (3600000ms) is **reasonable** for scheduled evolution.

Rationale:
- Self-evolution is resource-intensive (candidate generation + LLM scoring + verification)
- Running more frequently would compete for CPU/IO resources
- Auto-trigger (on low success rate) handles urgent cases
- The `getSkills()` rediscovery issue (B7) is separate from the interval choice

**Recommendation:** Keep 1-hour interval. Fix B7 (caching) to make each run cheaper.

---

### pendingEvaluations Map cleanup

**Finding:** Cleanup only runs on access — could accumulate stale entries.

**Recommendation:** Add proactive cleanup:
```typescript
// In initialize()
this.cleanupPendingEvaluations();
// Also on a timer in startScheduler()
```

---

### backups Map eviction

**Finding:** No automatic eviction — Map grows unbounded.

**Recommendation:** Call `cleanupBackups()` in `initialize()` and add periodic cleanup in scheduler loop.

---

### FTS5 index write frequency

**Finding:** Each message hook spawns a Python subprocess with single-message payload.

**Recommendation:** Implement queue-and-flush (batch multiple messages per spawn). Target: max 1 spawn per 5 seconds or 10 messages.

---

## Recommended Priority Actions

1. **P0 (Immediate):** Fix B5 and B6 — add proactive cleanup for `pendingEvaluations` and `backups` Maps in `initialize()`.

2. **P0 (Immediate):** Fix B4 — remove the useless detached Python spawn from `before_prompt_build` hook (results are discarded anyway).

3. **P1 (This week):** Fix B1 — implement message batching for FTS5 indexing to reduce Python process spawn rate.

4. **P1 (This week):** Fix B2 — prioritize HTTP FTS5 client over Python subprocess in `zcrystal_search`.

5. **P2 (Next sprint):** Fix B8 — merge heartbeat + proactive intervals.

6. **P2 (Next sprint):** Fix B7 — cache skill list in EvolutionScheduler to avoid full rediscovery.

7. **P3 (Nice to have):** Fix B10 — remove dynamic import in `before_prompt_build`.

---

## Testing Recommendations

1. Measure Python subprocess spawn overhead: Instrument `index.ts` to log spawn events with timestamps, run for 1 hour under normal load, count spawns.
2. Memory growth: Monitor `backups` and `pendingEvaluations` Map sizes over 24+ hours.
3. Evolution scheduler: Add timing logs to `runScheduledEvolution()` to measure skill discovery overhead.
4. Before/after latency for `zcrystal_search` comparing HTTP vs subprocess approach.

---

*End of Performance Review*