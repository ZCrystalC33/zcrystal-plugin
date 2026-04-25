# Why + How to Apply Integration for ZCrystal Plugin

> **Goal:** Make self-evolution feedback actionable, not just descriptive.
> Currently ZCrystal records *what changed* but not *why it matters* or *when to reuse the principle*.
> This document adds the **Why + How to Apply** fields inspired by Claude-Memory-Framework's feedback pattern.

---

## 1. The Pattern

Claude-Memory-Framework Feedback entry structure:

```
[What happened]  ← descriptive event
**Why:** [Principle]  ← generalizable cause
**How to apply:** [Rule]  ← actionable reuse instruction
```

Example:

```
User asked about crypto. Replied with outdated info.
**Why:** Always verify current prices before discussing specific tickers.
**How to apply:** When user mentions a coin/ticker, check live price first.
```

**Why** makes feedback generalizable (transfers to new contexts).
**How to apply** makes it procedurally reusable (not just "be more careful").

---

## 2. Current State in ZCrystal

### 2.1 `EvolutionCandidate` (types.ts + self-evolution.ts)

```typescript
export interface EvolutionCandidate {
  id: string;
  content: string;
  score: number;
  mutations: Mutation[];  // ← only captures what changed
}

export interface Mutation {
  type: 'description' | 'instruction' | 'example' | 'parameter' | 'reflexion';
  original: string;
  mutated: string;
  rationale: string;  // ← closest to "Why", but freeform
}
```

### 2.2 `LLMEvaluationResult` (self-evolution.ts)

```typescript
export interface LLMEvaluationResult {
  score: number;
  clarity: number;
  completeness: number;
  actionability: number;
  reasoning: string;  // ← freeform, not structured
}
```

### 2.3 `SkillImprovement` (types.ts)

```typescript
export interface SkillImprovement {
  field: 'description' | 'instructions' | 'examples' | 'metadata';
  original: string;
  improved: string;
  rationale: string;  // ← freeform
}
```

### 2.4 `corrections.md` (memory)

```
## 修正 [timestamp]

### 錯誤描述
[描述]

### 原因分析  ← partially "Why"
[原因]

### 正確做法
[做法]  ← partially "How to apply"

### 預防措施
[措施]
```

---

## 3. Integration Plan

### 3.1 Add `FeedbackEntry` to `types.ts`

```typescript
/**
 * Actionable feedback entry (Claude-Memory-Framework pattern).
 * Records what happened, why it happened, and how to apply the lesson.
 */
export interface FeedbackEntry {
  /** What happened (concrete event description) */
  what: string;
  /** Why this happened (generalizable principle) */
  why: string;
  /** How to apply the principle (actionable rule) */
  howToApply: string;
  /** When this feedback is relevant (context triggers) */
  trigger: string;
  /** Confidence: how generalizable this principle is [0-1] */
  confidence: number;
  /** Timestamp when this feedback was created */
  timestamp: number;
}
```

### 3.2 Extend `Mutation` in `types.ts`

```typescript
export interface Mutation {
  type: 'description' | 'instruction' | 'example' | 'parameter' | 'reflexion';
  original: string;
  mutated: string;
  rationale: string;
  // NEW: Why + How to Apply
  principle: string;       // WHY: generalizable principle
  applicationRule: string;  // HOW: actionable rule for future cases
}
```

### 3.3 Extend `LLMEvaluationResult` in `self-evolution.ts`

```typescript
export interface LLMEvaluationResult {
  score: number;
  clarity: number;
  completeness: number;
  actionability: number;
  reasoning: string;
  // NEW: Structured Why + How to Apply
  evaluationFeedback: {
    whyScore: string;       // WHY: why this score was given
    howToImprove: string;  // HOW: specific action to improve this type of content
  };
}
```

### 3.4 New `FeedbackStore` class (new file: `feedback-store.ts`)

```typescript
/**
 * FeedbackStore - stores Why+How entries for pattern reuse.
 * Backed by disk for crash recovery (Memory Persistence Pattern 1).
 * FIFO eviction with max size limit.
 */
export class FeedbackStore {
  private entries: FeedbackEntry[] = [];
  private readonly MAX_ENTRIES = 200;
  private readonly DATA_FILE = 'feedback-store.json';
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.load();
  }

  add(entry: Omit<FeedbackEntry, 'timestamp'>): void {
    const full: FeedbackEntry = { ...entry, timestamp: Date.now() };
    this.entries.push(full);
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift(); // FIFO eviction
    }
    this.persist();
  }

  search(trigger: string): FeedbackEntry[] {
    return this.entries.filter(e =>
      e.trigger.includes(trigger) || e.what.includes(trigger)
    );
  }

  // Pattern match for Self-Evolution context injection
  getRelevantForEvaluation(candidateContent: string): FeedbackEntry[] {
    // Return up to 3 most relevant entries based on keyword overlap
    return this.entries.slice(-20).filter(e =>
      e.trigger.split(',').some(t => candidateContent.includes(t.trim()))
    ).slice(0, 3);
  }

  private async persist(): Promise<void> { /* disk write */ }
  private async load(): Promise<void> { /* disk read */ }
}
```

---

## 4. Prompt Changes for LLM Generation

### 4.1 Evaluation Prompt (in `buildEvaluationPrompt`)

Change the prompt sent to Honcho from:

```
Output ONLY valid JSON:
{"score": 0.8, "clarity": 8, "completeness": 7, "actionability": 9, "reasoning": "Brief explanation"}
```

To:

```
Output ONLY valid JSON:
{
  "score": 0.8,
  "clarity": 8,
  "completeness": 7,
  "actionability": 9,
  "reasoning": "Brief explanation",
  "evaluationFeedback": {
    "whyScore": "Why this overall score (specific weakness or strength)",
    "howToImprove": "Concrete, actionable rule to improve this type of prompt"
  }
}
```

**Constraint:** `whyScore` must be ≤ 100 chars, `howToImprove` must be ≤ 150 chars.

### 4.2 Reflexion Prompt (in `diagnoseProblem`)

Change from:

```
Output ONLY valid JSON:
{"diagnosis": "What exactly is wrong", "suggestions": ["Fix 1", "Fix 2"]}
```

To include **Why + How**:

```
Output ONLY valid JSON:
{
  "diagnosis": "What exactly is wrong",
  "principle": "Why this weakness exists (generalizable cause, ≤100 chars)",
  "applicationRule": "How to fix and prevent this class of problem (≤150 chars)",
  "suggestions": ["Fix 1", "Fix 2"]
}
```

### 4.3 Mutation Generation Prompt (new, in `generateCandidates`)

When generating mutations, also ask the LLM to fill in `principle` and `applicationRule`:

```
For each mutation generated, also output:
{
  "mutationType": "example",
  "principle": "Why adding an example improves the prompt (≤100 chars)",
  "applicationRule": "When to add examples in future prompts (≤150 chars)"
}
```

Store these alongside the mutation.

---

## 5. Backward Compatibility

| Field | Strategy |
|-------|----------|
| `Mutation.rationale` | Keep as-is. `principle`/`applicationRule` are new supplemental fields. |
| `LLMEvaluationResult.reasoning` | Keep as-is. `evaluationFeedback` is new. |
| `SkillImprovement.rationale` | Keep as-is. Add optional `principle`/`applicationRule` fields. |
| `FeedbackStore` | Gracefully empty on first load. No breaking changes to existing code. |

**Migration:** When loading old `EvolutionCandidate` or `SkillImprovement` from disk, set `principle = rationale` (copy rationale into principle) and `applicationRule = "See original rationale"` as a fallback. This ensures old data is forward-compatible.

---

## 6. Specific File Changes

### 6.1 `src/types.ts`

**Add after `SkillImprovement`:**

```typescript
export interface FeedbackEntry {
  what: string;
  why: string;
  howToApply: string;
  trigger: string;
  confidence: number;
  timestamp: number;
}
```

**Update `Mutation`:**

```typescript
export interface Mutation {
  type: 'description' | 'instruction' | 'example' | 'parameter' | 'reflexion';
  original: string;
  mutated: string;
  rationale: string;
  principle?: string;       // NEW
  applicationRule?: string; // NEW
}
```

### 6.2 `src/self-evolution.ts`

**Add new imports:**

```typescript
import { FeedbackStore } from './feedback-store.js';
```

**Add to `SelfEvolutionEngine` state:**

```typescript
private feedbackStore: FeedbackStore;
```

**Add to constructor:**

```typescript
this.feedbackStore = new FeedbackStore(this.dataDir);
```

**Update `buildEvaluationPrompt` to request structured feedback.**

**Update `parseEvaluation` to extract `evaluationFeedback` from LLM response.**

**Update `parseDiagnosisResponse` to extract `principle` and `applicationRule`.**

**Update `createCandidate` to copy `principle`/`applicationRule` into the mutation:**

```typescript
private createCandidate(...): EvolutionCandidate {
  const evaluationFeedback = this.extractEvaluationFeedback(parsed);
  return {
    id: `candidate-${index}`,
    content,
    score,
    mutations: this.identifyMutations(skill, content, evaluationFeedback),
  };
}
```

**Update `identifyMutations` signature:**

```typescript
private identifyMutations(
  skill: Skill,
  candidateContent: string,
  feedback?: { whyScore: string; howToImprove: string }
): EvolutionCandidate['mutations'] {
  const mutations: EvolutionCandidate['mutations'] = [];
  // ... existing logic ...
  if (feedback) {
    // Add feedback-driven mutations
    mutations.push({
      type: 'reflexion',
      original: feedback.whyScore,
      mutated: feedback.howToImprove,
      rationale: `Feedback-based improvement: ${feedback.whyScore}`,
      principle: feedback.whyScore,        // NEW
      applicationRule: feedback.howToImprove, // NEW
    });
  }
  return mutations;
}
```

**Add `extractEvaluationFeedback` helper:**

```typescript
private extractEvaluationFeedback(parsed: Partial<LLMEvaluationResult>): { whyScore: string; howToImprove: string } | undefined {
  if (!parsed.evaluationFeedback) return undefined;
  return {
    whyScore: (parsed.evaluationFeedback as any).whyScore ?? '',
    howToImprove: (parsed.evaluationFeedback as any).howToImprove ?? '',
  };
}
```

**In `reflexionCorrection`, store the new principle+rule as a FeedbackEntry:**

```typescript
if (reEval.score > evaluation.score + 0.1) {
  // NEW: Record feedback for future reuse
  this.feedbackStore.add({
    what: `Candidate ${candidate.id} improved by reflexion (${evaluation.score.toFixed(2)} → ${reEval.score.toFixed(2)})`,
    why: diagnosis,
    howToApply: remedy,
    trigger: skill.slug,
    confidence: 0.7,
  });
  return { /* ... */ };
}
```

### 6.3 New file: `src/feedback-store.ts`

```typescript
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FeedbackEntry } from './types.js';

/**
 * FeedbackStore - persistent storage for Why+How feedback entries.
 * Implements Memory Persistence Pattern 1 (dual storage: memory + disk).
 * Local memory always wins.
 */
export class FeedbackStore {
  private entries: FeedbackEntry[] = [];
  private readonly MAX_ENTRIES = 200;
  private readonly DATA_FILE = 'feedback-store.json';
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.load();
  }

  add(entry: Omit<FeedbackEntry, 'timestamp'>): FeedbackEntry {
    const full: FeedbackEntry = { ...entry, timestamp: Date.now() };
    this.entries.push(full);
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift();
    }
    this.persist().catch(err => {
      console.error('[FeedbackStore] Persist failed:', err);
    });
    return full;
  }

  search(trigger: string): FeedbackEntry[] {
    return this.entries.filter(e =>
      e.trigger.includes(trigger) || e.what.includes(trigger)
    );
  }

  getRelevantForSkill(skillSlug: string, limit = 3): FeedbackEntry[] {
    return this.entries
      .filter(e => e.trigger === skillSlug || e.trigger.includes(skillSlug))
      .slice(-10)
      .slice(-limit);
  }

  private async ensureDataDir(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.ensureDataDir();
      const filePath = join(this.dataDir, this.DATA_FILE);
      await writeFile(filePath, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch (err) {
      console.error('[FeedbackStore] Persist error:', err);
    }
  }

  private async load(): Promise<void> {
    try {
      await this.ensureDataDir();
      const filePath = join(this.dataDir, this.DATA_FILE);
      if (!existsSync(filePath)) return;
      const raw = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.entries = parsed;
      }
    } catch (err) {
      console.error('[FeedbackStore] Load error:', err);
    }
  }
}
```

### 6.4 `src/self-evolution.ts` — Closed-loop auto-trigger integration

When `checkAutoTrigger` fires and triggers evolution, inject relevant feedback entries into the candidate generation context:

```typescript
private async runScheduledEvolution(): Promise<void> {
  // ...
  for (const skill of skills) {
    // Inject relevant feedback before evolution
    const relevantFeedback = this.feedbackStore.getRelevantForSkill(skill.slug);
    if (relevantFeedback.length > 0) {
      const feedbackContext = relevantFeedback
        .map(f => `**Feedback:** ${f.what}\n**Why:** ${f.why}\n**How:** ${f.howToApply}`)
        .join('\n\n');
      console.log(`[SelfEvolution] Injecting ${relevantFeedback.length} feedback entries for ${skill.slug}`);
    }
    // ...
  }
}
```

---

## 7. Hooks Integration

When a `user-analyzer.ts` correction is recorded, create a `FeedbackEntry`:

```typescript
// In user-analyzer.ts or a dedicated feedback hook
function recordCorrection(
  what: string,
  why: string,
  howToApply: string,
  trigger: string
): void {
  const store = getFeedbackStore(); // singleton
  store.add({ what, why, howToApply, trigger, confidence: 0.8 });
}
```

This ensures corrections made during normal operation are captured and reused in the next self-evolution cycle.

---

## 8. Evaluation Prompt — Full Revised Version

```typescript
private buildEvaluationPrompt(candidate: string): string {
  return `Evaluate the following prompt quality:

${candidate}

Evaluation dimensions (each 1-10):
1. Clarity: Are instructions clear and specific?
2. Completeness: Does it cover all necessary cases?
3. Actionability: Can the AI execute it correctly?

Output ONLY valid JSON with this exact shape:
{
  "score": 0.0-1.0,
  "clarity": 1-10,
  "completeness": 1-10,
  "actionability": 1-10,
  "reasoning": "Brief explanation (≤200 chars)",
  "evaluationFeedback": {
    "whyScore": "Why this overall score (specific weakness or strength) (≤100 chars)",
    "howToImprove": "Concrete actionable rule to improve this type of prompt (≤150 chars)"
  }
}`;
}
```

---

## 9. Summary of Changes

| File | Change |
|------|--------|
| `src/types.ts` | Add `FeedbackEntry`, extend `Mutation` with `principle`/`applicationRule` |
| `src/self-evolution.ts` | Update prompts, parse new fields, inject feedback into evolution, add `FeedbackStore` field |
| `src/feedback-store.ts` | **New file** — `FeedbackStore` class with disk-backed storage |
| `src/user-analyzer.ts` | Hook correction → `FeedbackEntry` creation |

**No breaking changes.** All new fields are optional. Old data is migrated via fallback copy.

---

*Document version: 1.0 | Created: 2026-04-25*
