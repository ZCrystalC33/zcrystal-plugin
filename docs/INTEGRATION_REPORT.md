# Claude-Mem Integration Report: ZCrystal Plugin Enhancement Plan

**Date:** 2026-04-25
**Author:** Ophelia Prime (Subagent)
**Purpose:** Evaluate Claude-Mem features and create a prioritized integration plan for ZCrystal Plugin

---

## Executive Summary

Claude-Mem is a persistent memory compression system for Claude Code with strong architectural patterns that ZCrystal Plugin could adopt. After studying its architecture, six key features were identified as candidates for integration.

**Recommended Priority Order:**
1. **Privacy Tags** (P0) — trivial to implement, high trust impact
2. **Token Cost Visibility** (P1) — simple index format change, high efficiency impact
3. **Progressive Disclosure** (P1) — moderate complexity, high impact on context quality
4. **Lifecycle Hooks** (P2) — requires OpenClaw hook system extension, high impact
5. **Web UI Viewer** (P3) — moderate complexity but diverges from terminal-focused UX
6. **ChromaDB Vector Search** (P4) — high complexity, marginal benefit over existing FTS5

---

## ZCrystal Plugin Current State

| Component | Status |
|-----------|--------|
| FTS5 Search | HTTP MCP bridge (port 18795), working |
| Hook System | Basic (PreTool, PostTool, etc.) |
| Session Management | Per-session, no cross-session memory |
| Privacy Control | None |
| Token Budget Visibility | None |
| Web UI | None |
| Context Injection | Raw search results, no progressive disclosure |

---

## Feature Analysis

### Feature 1: Privacy Tags (`<private>`)

**What it does:** Marks content in the live conversation that should not be persisted to memory. Stripped before storage, visible during session.

**Complexity:** 🟢 Low
**Impact:** 🟢 High (trust)

| Aspect | Detail |
|--------|--------|
| Implementation | Regex strip `<private>...</private>` blocks at storage layer (PostToolUse hook + user prompt save) |
| Storage location | Pre-write filter in hook handlers |
| OpenClaw fit | Drop into existing hook flow — strip tags before calling fts5-bridge |

**Implementation Approach:**

```typescript
// src/utils/privacy-filter.ts
const PRIVATE_TAG_REGEX = /<private>[\s\S]*?<\/private>/gi;

export function stripPrivateTags(content: string): string {
  return content.replace(PRIVATE_TAG_REGEX, '');
}

// Usage in hook handlers before persisting
function beforePersist(rawContent: string): string {
  return stripPrivateTags(rawContent);
}
```

**Key files to modify:**
- `src/tools/*.ts` (all tool handlers that write to storage)
- `src/fts5-bridge.ts` (pre-write hook)

---

### Feature 2: Token Cost Visibility in Context Injection

**What it does:** The SessionStart index shows each observation with its token count, letting the agent make informed retrieval decisions.

**Complexity:** 🟢 Low
**Impact:** 🟢 High (efficiency + context quality)

| Aspect | Detail |
|--------|--------|
| Implementation | Index format change: add `| ~NNN |` column to observation rows |
| Existing FTS5 | Already has token counts in results — just surface them |
| OpenClaw fit | Modify FTS5 index format to display token cost per result |

**Current ZCrystal index (hypothetical):**
```
### Recent Memory
- Modified auth handler (2026-04-25)
- Fixed nginx proxy pass (2026-04-24)
```

**Enhanced with token costs:**
```
### Recent Memory (~2,400 tokens total)
| ID | Date | Title | Cost |
|----|------|-------|------|
| #412 | Apr-25 | Modified auth handler | ~180 |
| #413 | Apr-25 | Fixed nginx proxy pass | ~220 |
| ... |
💡 **Progressive disclosure:** Search results show retrieval cost.
  Fetch details with `memory.get id=NNN` on demand.
```

**Implementation:**
```typescript
// In fts5-bridge.ts — enhance index format
interface MemoryEntry {
  id: string;
  title: string;
  timestamp: number;
  tokenEstimate: number;  // Already computed, just surface it
  type: string;           // Already categorized
}

// Format as markdown table with token column
function formatMemoryIndex(entries: MemoryEntry[]): string {
  const totalTokens = entries.reduce((s, e) => s + e.tokenEstimate, 0);
  let md = `### Memory Index (~${totalTokens} tokens)\n\n`;
  md += `| ID | Date | Title | Cost |\n`;
  md += `|----|------|-------|------|\n`;
  for (const e of entries) {
    md += `| #${e.id} | ${formatDate(e.timestamp)} | ${e.title} | ~${e.tokenEstimate} |\n`;
  }
  md += `\n💡 **Progressive disclosure:** Fetch details on demand with \`memory.get id=N\`\n`;
  return md;
}
```

---

### Feature 3: Progressive Disclosure

**What it does:** Session start shows a compact index (~800 tokens) instead of full context. Agent fetches details only when needed (3-layer: index → timeline → deep-dive).

**Complexity:** 🟡 Medium
**Impact:** 🟢 High

| Aspect | Detail |
|--------|--------|
| Layer 1 | Index: metadata only (titles, dates, types, token costs) |
| Layer 2 | Timeline: chronological narrative of a session |
| Layer 3 | Deep-dive: original source/observation content |
| OpenClaw fit | Replace "dump all search results" with tiered retrieval |

**Current ZCrystal behavior:** FTS5 search returns full content in one shot.
**Enhanced behavior:** Return index first, defer full content retrieval.

**Implementation:**

```typescript
// src/memory/progressive.ts

export interface MemoryIndexEntry {
  id: string;
  title: string;
  type: string;       // decision, bugfix, feature, etc.
  timestamp: number;
  tokenEstimate: number;
  filePath?: string;
}

// Layer 1: Get index (search returns just metadata)
export async function getMemoryIndex(query: string): Promise<MemoryIndexEntry[]> {
  const results = await fts5HttpSearch(query, 50);
  return results.map(r => ({
    id: extractId(r.content),
    title: extractTitle(r.content),
    type: classifyType(r.content),
    timestamp: r.timestamp ?? Date.now(),
    tokenEstimate: estimateTokens(r.content),
  }));
}

// Layer 2: Get timeline (chronological narrative for a session)
export async function getMemoryTimeline(sessionId: string): Promise<string> {
  const entries = await db.query(
    `SELECT * FROM memory WHERE session_id = ? ORDER BY timestamp`,
    [sessionId]
  );
  return formatAsNarrative(entries);
}

// Layer 3: Get full observation
export async function getFullObservation(id: string): Promise<string> {
  const entry = await db.query(`SELECT * FROM memory WHERE id = ?`, [id]);
  return entry.content;
}
```

**OpenClaw Tool Definition:**
```json
{
  "name": "memory_index",
  "description": "Get lightweight index of memory entries matching query. Returns titles, types, token costs only (~50 tokens per entry). Use this first to find relevant entries before fetching details.",
  "params": { "query": "string", "limit": 20 }
}
```

---

### Feature 4: Lifecycle Hooks (SessionStart / SessionEnd)

**What it does:** Five-stage hook system: SessionStart → UserPromptSubmit → PostToolUse → Stop → SessionEnd. Enables comprehensive session tracking and cleanup.

**Complexity:** 🟡 Medium
**Impact:** 🟢 High

| Aspect | Detail |
|--------|--------|
| Current ZCrystal | PreTool/PostTool hooks exist |
| Missing | SessionStart (context injection), SessionEnd (cleanup/summary) |
| OpenClaw fit | Extend hook system with SessionStart + SessionEnd handlers |

**Implementation Approach:**

OpenClaw already has a hook system. Extend with two new hooks:

```typescript
// src/hooks/session-lifecycle.ts

export interface SessionLifecycleHooks {
  onSessionStart(sessionId: string): Promise<void>;
  onUserPromptSubmit(sessionId: string, prompt: string): Promise<void>;
  onPostToolUse(sessionId: string, tool: ToolCall): Promise<void>;
  onStop(sessionId: string): Promise<void>;
  onSessionEnd(sessionId: string): Promise<void>;
}
```

**Hook execution chain for SessionStart:**
```json
// hooks.json integration
"SessionStart": [
  { "command": "node scripts/ensure-fresh-memory.js", "timeout": 30 },
  { "command": "node scripts/inject-context.js", "timeout": 60 }
]
```

**Context injection at SessionStart:**
```typescript
// scripts/inject-context.js
// 1. Fetch last N sessions' summaries from FTS5
// 2. Format as progressive disclosure index
// 3. Return via hook output (hookSpecificOutput.additionalContext)
```

**SessionEnd cleanup:**
```typescript
// scripts/cleanup-session.js
// 1. Mark session as complete in DB
// 2. Trigger summary generation (async)
// 3. Release resources
```

---

### Feature 5: Web UI Viewer (localhost:37777)

**What it does:** Real-time memory stream visualization at `localhost:37777` using React + SSE. Shows observations, sessions, search results with infinite scroll.

**Complexity:** 🟡 Medium (frontend); 🟢 Low (backend)
**Impact:** 🟡 Medium (UX divergence)

| Aspect | Detail |
|--------|--------|
| Technology | React + TypeScript + SSE (Server-Sent Events) |
| Port | 37777 (configurable) |
| Features | Real-time observation feed, project filtering, infinite scroll |
| OpenClaw fit | Moderate — ZCrystal is terminal-first, this adds a web dependency |

**Implementation Approach:**

```
Backend (already exists in ZCrystal):
- Worker HTTP service (Express on port 18795 or new port)
- SSE endpoint for real-time observation stream

Frontend (new):
- React app at /src/ui/viewer/
- Bundled as single HTML for portability
- Connects to existing worker via SSE
```

**Minimal implementation for ZCrystal:**
1. Reuse existing worker HTTP server
2. Add SSE endpoint: `GET /api/stream/observations`
3. Bundle a minimal React viewer using `viewer.html` pattern
4. Serve at `localhost:18777` (separate from MCP port)

**Concern:** ZCrystal is terminal-focused. A web UI is useful for debugging but not core UX. Recommend as optional enhancement.

---

### Feature 6: ChromaDB Vector Search

**What it does:** Semantic vector embeddings for observations, enabling similarity search beyond keyword/FTS5.

**Complexity:** 🔴 High
**Impact:** 🟡 Medium

| Aspect | Detail |
|--------|--------|
| Current ZCrystal | FTS5 full-text search (keyword + phrase matching) |
| ChromaDB addition | Semantic similarity (find "related" ideas, not just exact words) |
| Complexity | Requires: ChromaDB server, embedding model, sync pipeline |
| OpenClaw fit | High friction — adds external dependency, marginal over FTS5 for our use case |

**Why deprioritize:**
1. FTS5 is already highly capable for code/search contexts
2. ChromaDB requires a running server (additional process to manage)
3. Embedding model choice affects quality (another variable)
4. OpenClaw's FTS5 already handles most semantic needs via keyword combinations

**If integrated later:**
```typescript
// Hybrid search: FTS5 + ChromaDB combined
export async function hybridSearch(query: string, limit = 20) {
  const [ftsResults, vectorResults] = await Promise.all([
    fts5HttpSearch(query, limit),
    vectorSearch(query, limit),
  ]);
  // Merge and re-rank by score
  return mergeResults(ftsResults, vectorResults);
}
```

---

## Summary Table

| # | Feature | Complexity | Impact | Priority | Notes |
|---|---------|------------|--------|----------|-------|
| 1 | Privacy Tags | 🟢 Low | 🟢 High | **P0** | Drop-in regex filter, high trust value |
| 2 | Token Cost Visibility | 🟢 Low | 🟢 High | **P1** | Index format change, enables smart retrieval |
| 3 | Progressive Disclosure | 🟡 Medium | 🟢 High | **P1** | 3-layer retrieval pattern, major context quality win |
| 4 | Lifecycle Hooks | 🟡 Medium | 🟢 High | **P2** | Extend OpenClaw hook system, SessionStart/End |
| 5 | Web UI Viewer | 🟡 Medium | 🟡 Medium | **P3** | Optional enhancement, terminal-first divergence |
| 6 | ChromaDB Vector Search | 🔴 High | 🟡 Medium | **P4** | External dependency, marginal over FTS5 |

---

## Recommended Implementation Sequence

### Phase 0: Quick Wins (1-2 days)
**Privacy Tags + Token Cost Visibility**

```typescript
// src/utils/privacy-filter.ts — NEW
export function stripPrivateTags(content: string): string {
  return content.replace(/<private>[\s\S]*?<\/private>/gi, '');
}

// Integration: wrap all storage writes
function persistObservation(raw: string) {
  return db.insert(stripPrivateTags(raw));
}
```

```typescript
// src/fts5-bridge.ts — MODIFY formatMemoryIndex()
interface MemoryEntry {
  id: string;
  title: string;
  tokenEstimate: number;  // Already tracked — surface it
}
```

### Phase 1: Progressive Disclosure (3-5 days)
**3-layer retrieval pattern**

```typescript
// src/memory/progressive.ts — NEW
// Layer 1: index (metadata only)
// Layer 2: timeline (narrative arc)
// Layer 3: observation (full content)
```

Add tool: `memory_index(query, limit)` returning compact metadata.

### Phase 2: Lifecycle Hooks (5-7 days)
**SessionStart context injection + SessionEnd cleanup**

Requires OpenClaw hook system extension. Coordinate with core OpenClaw.

### Phase 3: Web UI (Optional, 5-7 days)
**Minimal React viewer**

Reuse existing worker server, add SSE endpoint + React bundle.

---

## Integration with Existing Architecture

```
Current ZCrystal Flow:
  Tool Call → PostTool Hook → FTS5 MCP (HTTP) → SQLite

Enhanced Flow (with Progressive Disclosure):
  Tool Call → PostTool Hook → SQLite
                              ↓
  SessionStart → Inject Memory Index (~800 tokens)
                     ↓
  Agent decides to fetch → memory_index() → metadata table
                     ↓
  Agent decides to deep-dive → memory_get(id) → full content
```

**Storage layer:**
- SQLite remains (already used by ZCrystal)
- FTS5 virtual tables already in place
- Add `token_estimate` column to memory entries
- ChromaDB: optional future layer (not now)

**Hook integration:**
```
PostToolUse → stripPrivateTags() → persist()
SessionStart → injectMemoryIndex()
SessionEnd → markComplete()
```

---

## Key Implementation Files

| File | Action |
|------|--------|
| `src/utils/privacy-filter.ts` | **New** — private tag stripper |
| `src/fts5-bridge.ts` | **Modify** — add token cost to index format |
| `src/memory/progressive.ts` | **New** — 3-layer retrieval |
| `src/hooks/session-lifecycle.ts` | **New** — SessionStart/SessionEnd hooks |
| `src/tools/core-tools.ts` | **Modify** — add `memory_index` tool |
| `openclaw.plugin.json` | **Modify** — register new hooks |

---

## Conclusion

The highest-value features to integrate are **Privacy Tags** and **Progressive Disclosure**. Both are well-understood patterns that map cleanly onto ZCrystal's existing architecture. Privacy Tags require only a regex filter; Progressive Disclosure requires a 3-layer retrieval design but is architecturally straightforward.

**ChromaDB vector search** should be treated as a future Phase 4 item — the complexity-to-benefit ratio is unfavorable given that FTS5 already handles our primary use cases well.

The **Web UI** is useful for debugging but diverges from ZCrystal's terminal-first philosophy. Recommend making it optional.

---

*Report generated by Ophelia Prime subagent — 2026-04-25*