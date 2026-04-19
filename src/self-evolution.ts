/**
 * Self-Evolution Engine for ZCrystal Plugin
 * 
 * Aligns with: https://github.com/nousresearch/hermes-agent-self-evolution
 * 
 * Features:
 * - DSPy + GEPA (Genetic-Pareto Prompt Evolution)
 * - LLM-as-Judge evaluation
 * - Reflexion correction
 * - Skill optimization
 * 
 * 13 Harness Patterns Compliance:
 * 1. Memory Persistence - Dual storage (memory + disk)
 * 2. Skill Runtime - Lazy-load with trigger前置
 * 3. Tool & Safety - Fail-closed, per-call bounds
 * 4. Select - Memoize promise not result
 * 5. Compress - Recovery pointer for truncation
 * 6. Isolate - Zero-inheritance, single responsibility
 * 7. Agent Orchestration - Coordinator pattern
 * 8. Hook Lifecycle - Single dispatch
 * 9. Task Decomposition - Typed IDs, disk output, two-phase
 * 10. Bootstrap Sequence - Dependency ordering
 * 11. Multi-Agent Research - Async parallel evaluation
 * 12. Long-Running Agents - Initializer pattern
 * 13. Codex/AI Coding - Context-first design
 */

import type {
  EvolutionConfig,
  EvolutionResult,
  EvolutionCandidate,
  Skill,
  ExecutionTrace,
} from './types.js';
import { SkillManager } from './skill-manager.js';
import { HonchoClient } from './honcho-client.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ============================================================
// Constants (Magic Number Replacement)
// ============================================================

const SCORE_THRESHOLD_HIGH = 0.7;      // High quality threshold
const SCORE_THRESHOLD_LOW = 0.3;      // Failure threshold
const SCORE_DEFAULT = 0.5;            // Default score
const SKILL_SIZE_LIMIT = 15 * 1024;   // 15KB size limit
const TOOL_DESC_LIMIT = 500;          // Tool description limit
const MAX_CANDIDATES = 10;            // Max mutation candidates
const MAX_TRACES = 100;               // Max traces per skill
const RECOVERY_POINTER_VERSION = 1;   // Recovery pointer version

// ============================================================
// New: Closed-Loop Evolution Constants
// ============================================================

const SUCCESS_RATE_THRESHOLD = 0.6;      // Trigger evolution if success rate < 60%
const VERIFICATION_COUNT = 20;           // Verify with 20 traces before confirming
const DEGRADATION_THRESHOLD = 0.5;        // Rollback if verified success rate < 50%
const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000;  // 1 hour between scheduled checks
const MIN_TRACES_FOR_ANALYSIS = 10;       // Min traces to analyze before triggering

// ============================================================
// Typed IDs (Task Decomposition - Pattern 9)
// ============================================================

type EvolutionId = `${string}:${string}`;  // "skill:slug" or "tool:name"
type TraceId = `${string}:trace:${number}`;  // "skill:slug:timestamp"

// Evolution Target Type
export type EvolutionTarget = 'skill' | 'tool' | 'system-prompt' | 'all';

function createEvolutionId(type: 'skill' | 'tool', name: string): EvolutionId {
  return `${type}:${name}`;
}

function createTraceId(skillSlug: string, timestamp: number): TraceId {
  return `${skillSlug}:trace:${timestamp}`;
}

// ============================================================
// Evolution Options
// ============================================================

export interface EvolutionOptions {
  target: EvolutionTarget;
  iterations?: number;
  evalSource?: 'synthetic' | 'sessiondb';
  provider?: string;
  model?: string;
  outputDir?: string;
}

// ============================================================
// Applied Candidate (Verification Mechanism)
// ============================================================

interface AppliedCandidate {
  content: string;
  score: number;
  tracesCount: number;
  successCount: number;
  appliedAt: number;
}

// ============================================================
// Backup for Rollback
// ============================================================

interface Backup {
  content: string;
  timestamp: number;
}

// ============================================================
// Mutation Rules (GEPA-inspired)
// ============================================================

interface MutationRule {
  name: string;
  description: string;
  apply: (content: string) => string[];
}

const MUTATION_RULES: MutationRule[] = [
  {
    name: 'clarity',
    description: 'Make instructions clearer and more specific',
    apply: (content: string) => [
      content.replace(/\./g, '.').replace(/([a-z])\./g, '$1. '),
      content.length < 100 ? content + '\n\nProvide specific examples.' : content,
    ],
  },
  {
    name: 'structure',
    description: 'Improve structure with better formatting',
    apply: (content: string) => {
      if (!content.includes('\n## ')) {
        return [
          content.replace(/^([^#\n]+)/, '## Overview\n\n$1'),
          content.replace(/\n\n/g, '\n\n## Details\n\n'),
        ];
      }
      return [content];
    },
  },
  {
    name: 'examples',
    description: 'Add or expand examples',
    apply: (content: string) => {
      if (content.includes('Example:') || content.includes('```')) {
        return [content];
      }
      return [
        content + '\n\n## Example\n\n```\n/example usage\n```',
      ];
    },
  },
  {
    name: 'constraints',
    description: 'Add explicit constraints',
    apply: (content: string) => {
      if (content.includes('Constraint') || content.includes('Must')) {
        return [content];
      }
      return [
        content + '\n\n## Constraints\n\n- Keep responses concise\n- Prioritize safety',
      ];
    },
  },
];

// ============================================================
// Recovery Pointer (Compress - Pattern 5)
// ============================================================

interface RecoveryPointer {
  version: number;
  originalContent: string;
  timestamp: number;
  candidateId: string;
}

// ============================================================
// Evaluation Result (LLM-as-Judge)
// ============================================================

export interface LLMEvaluationResult {
  score: number;           // 0-1 overall score
  clarity: number;         // 1-10
  completeness: number;    // 1-10
  actionability: number;   // 1-10
  reasoning: string;       // Why this score
}

// Diagnosis response from Reflexion
interface DiagnosisResponse {
  diagnosis: string;
  suggestions: string[];
}

// ============================================================
// Self-Evolution Engine (Isolate - Pattern 6)
// ============================================================

export class SelfEvolutionEngine {
  // State (Memory Persistence - Pattern 1)
  private skillManager: SkillManager;
  private honcho?: HonchoClient;
  private traces: Map<string, ExecutionTrace[]> = new Map();
  private dataDir: string = process.env.ZCRYSTAL_TEMP_PATH || join(tmpdir(), 'zcrystal');
  private evolutionHistory: EvolutionResult[] = [];
  private recoveryPoints: Map<EvolutionId, RecoveryPointer> = new Map();
  private config: EvolutionConfig;
  
  // Promise memoization (Select - Pattern 4)
  private pendingEvaluations: Map<string, Promise<LLMEvaluationResult>> = new Map();
  
  // Initializer state (Long-Running - Pattern 12)
  private initialized = false;
  private initPromise?: Promise<void>;
  
  // Closed-Loop: Applied candidate verification
  private appliedCandidates: Map<string, AppliedCandidate> = new Map();
  
  // Closed-Loop: Backups for rollback
  private backups: Map<string, Backup> = new Map();
  
  // Closed-Loop: Scheduler
  private schedulerInterval?: ReturnType<typeof setInterval>;

  constructor(
    skillManager: SkillManager, 
    config: Partial<EvolutionConfig> = {}, 
    honcho?: HonchoClient
  ) {
    this.skillManager = skillManager;
    this.honcho = honcho;
    this.config = {
      target: config.target || 'all',
      iterations: config.iterations || MAX_CANDIDATES,
      evalSource: config.evalSource || 'synthetic',
      provider: config.provider,
      model: config.model,
    };
  }

  // ============================================================
  // Bootstrap Sequence (Pattern 10)
  // ============================================================

  /**
   * Initialize engine with dependency ordering
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Prevent double initialization
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initialized = true;
  }

  private async doInitialize(): Promise<void> {
    // 1. First: Load traces from disk (if persistence exists)
    // 2. Second: Discover skills (Skill Runtime - Pattern 2)
    try {
      await this.skillManager.discover();
    } catch {
      // Skill discovery is best-effort
    }
    // 3. Third: Restore recovery points
    this.loadRecoveryPoints();
    // 4. Fourth: Start scheduler for periodic evolution
    this.startScheduler();
  }
  
  // ============================================================
  // Closed-Loop: Scheduler (Periodic Evolution)
  // ============================================================
  
  private startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    
    this.schedulerInterval = setInterval(() => {
      this.runScheduledEvolution().catch(err => {
        console.error('[SelfEvolution] Scheduler error:', err);
      });
    }, SCHEDULER_INTERVAL_MS);
    
    console.log('[SelfEvolution] Scheduler started (interval: 1 hour)');
  }
  
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
      console.log('[SelfEvolution] Scheduler stopped');
    }
  }
  
  private async runScheduledEvolution(): Promise<void> {
    console.log('[SelfEvolution] Running scheduled evolution check');
    
    const skills = this.skillManager.getSkills();
    let evolved = 0;
    
    for (const skill of skills) {
      const traces = this.getTraces(skill.slug);
      
      if (traces.length >= MIN_TRACES_FOR_ANALYSIS) {
        const recentTraces = traces.slice(-MIN_TRACES_FOR_ANALYSIS);
        const successRate = recentTraces.filter(t => t.success).length / recentTraces.length;
        
        if (successRate < SUCCESS_RATE_THRESHOLD) {
          console.log(`[SelfEvolution] Scheduled evolution for ${skill.slug} (success rate: ${(successRate * 100).toFixed(0)}%)`);
          try {
            await this.evolveSkill(skill);
            evolved++;
          } catch (err) {
            console.error(`[SelfEvolution] Scheduled evolution failed for ${skill.slug}:`, err);
          }
        }
      }
    }
    
    if (evolved === 0) {
      console.log('[SelfEvolution] No skills需要 scheduled evolution');
    }
  }

  // ============================================================
  // Memory Persistence (Pattern 1) - Dual Storage
  // ============================================================

  /**
   * Record trace with dual storage
   * Local memory always wins
   */
  recordTrace(skillSlug: string, trace: ExecutionTrace): void {
    // Local storage (primary)
    const existing = this.traces.get(skillSlug) || [];
    existing.push(trace);
    
    // Enforce max traces (eviction)
    if (existing.length > MAX_TRACES) {
      existing.shift(); // FIFO eviction
    }
    
    this.traces.set(skillSlug, existing);
    
    // Disk persistence (secondary) - async, non-blocking
    this.persistTrace(skillSlug, trace).catch(() => {
      // Disk persistence failure is non-fatal
    });
    
    // ============================================================
    // Closed-Loop: Auto-trigger based on success rate
    // ============================================================
    this.checkAutoTrigger(skillSlug);
    
    // ============================================================
    // Closed-Loop: Verify applied candidates
    // ============================================================
    this.verifyAppliedCandidate(skillSlug, trace);
  }
  
  private checkAutoTrigger(skillSlug: string): void {
    const traces = this.getTraces(skillSlug);
    
    // Need enough traces to make a decision
    if (traces.length < MIN_TRACES_FOR_ANALYSIS) {
      return;
    }
    
    const recentTraces = traces.slice(-MIN_TRACES_FOR_ANALYSIS);
    const successRate = recentTraces.filter(t => t.success).length / MIN_TRACES_FOR_ANALYSIS;
    
    // If success rate is below threshold, trigger evolution
    if (successRate < SUCCESS_RATE_THRESHOLD) {
      console.log(`[SelfEvolution] Auto-trigger: ${skillSlug} success rate ${(successRate * 100).toFixed(0)}% < ${(SUCCESS_RATE_THRESHOLD * 100).toFixed(0)}%`);
      
      const skill = this.skillManager.getSkill(skillSlug);
      if (skill) {
        // Fire and forget - evolution runs in background
        this.evolveSkill(skill).catch(err => {
          console.error(`[SelfEvolution] Auto-trigger evolution failed for ${skillSlug}:`, err);
        });
      }
    }
  }
  
  private verifyAppliedCandidate(skillSlug: string, trace: ExecutionTrace): void {
    const applied = this.appliedCandidates.get(skillSlug);
    if (!applied) {
      return;
    }
    
    // Count this trace
    applied.tracesCount++;
    if (trace.success) {
      applied.successCount++;
    }
    
    // Check if we've collected enough verification traces
    if (applied.tracesCount >= VERIFICATION_COUNT) {
      const verifiedRate = applied.successCount / applied.tracesCount;
      
      console.log(`[SelfEvolution] Verification complete for ${skillSlug}: ${(verifiedRate * 100).toFixed(0)}% success rate over ${applied.tracesCount} traces`);
      
      // If verified success rate is below threshold, rollback
      if (verifiedRate < DEGRADATION_THRESHOLD) {
        console.log(`[SelfEvolution] Degradation detected for ${skillSlug}: ${(verifiedRate * 100).toFixed(0)}% < ${(DEGRADATION_THRESHOLD * 100).toFixed(0)}%, rolling back`);
        this.performRollback(skillSlug);
      }
      
      // Clean up verification tracking
      this.appliedCandidates.delete(skillSlug);
    }
  }

  getTraces(skillSlug: string): ExecutionTrace[] {
    // Local always wins (Pattern 1)
    return this.traces.get(skillSlug) || [];
  }

  clearTraces(skillSlug?: string): void {
    if (skillSlug) {
      this.traces.delete(skillSlug);
    } else {
      this.traces.clear();
    }
  }

  // ============================================================
  // Tool & Safety (Pattern 3) - Fail-closed, per-call bounds
  // ============================================================

  /**
   * Canonical score bounds check
   */
  private clampScore(value: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Canonical dimension bounds check
   */
  private clampDimension(value: number): number {
    return Math.max(1, Math.min(10, value));
  }

  // ============================================================
  // Task Decomposition (Pattern 9) - Typed IDs + Two-Phase
  // ============================================================

  /**
   * Phase 1: Prepare evolution (create recovery point)
   */
  async prepareEvolution(skill: Skill): Promise<EvolutionId> {
    const id = createEvolutionId('skill', skill.slug);
    
    // Save recovery point before any mutation
    const content = await this.skillManager.readSkillContent(skill);
    this.recoveryPoints.set(id, {
      version: RECOVERY_POINTER_VERSION,
      originalContent: content,
      timestamp: Date.now(),
      candidateId: 'none',
    });
    
    return id;
  }

  /**
   * Phase 2: Commit evolution (apply best candidate)
   * Only if Phase 1 was called
   */
  async commitEvolution(id: EvolutionId, result: EvolutionResult): Promise<boolean> {
    const recovery = this.recoveryPoints.get(id);
    if (!recovery) {
      console.warn(`[SelfEvolution] No recovery point for ${id}`);
      return false;
    }

    if (!result.bestCandidate) {
      return false;
    }

    const skillSlug = id.replace('skill:', '');
    const skill = this.skillManager.getSkill(skillSlug);
    if (!skill) {
      return false;
    }

    // Update recovery point with applied candidate
    this.recoveryPoints.set(id, {
      ...recovery,
      candidateId: result.bestCandidate.id,
    });

    // ============================================================
    // Closed-Loop: Create backup before applying (for rollback)
    // ============================================================
    (async () => {
      try {
        const currentContent = await this.skillManager.readSkillContent(skill);
        this.backups.set(skillSlug, {
          content: currentContent,
          timestamp: Date.now(),
        });
        console.log(`[SelfEvolution] Backup created for ${skillSlug}`);
      } catch (err) {
        console.error(`[SelfEvolution] Backup creation failed for ${skillSlug}:`, err);
      }
    })();

    // Set up verification tracking
    this.appliedCandidates.set(skillSlug, {
      content: result.bestCandidate.content,
      score: result.bestCandidate.score,
      tracesCount: 0,
      successCount: 0,
      appliedAt: Date.now(),
    });
    
    console.log(`[SelfEvolution] Verification tracking started for ${skillSlug} (need ${VERIFICATION_COUNT} traces)`);

    return this.skillManager.writeSkillContent(skill, result.bestCandidate.content);
  }

  /**
   * Rollback to recovery point
   */
  async rollbackEvolution(id: EvolutionId): Promise<boolean> {
    const recovery = this.recoveryPoints.get(id);
    if (!recovery) {
      return false;
    }

    const skillSlug = id.replace('skill:', '');
    const skill = this.skillManager.getSkill(skillSlug);
    if (!skill) {
      return false;
    }

    // Restore original content
    const success = await this.skillManager.writeSkillContent(skill, recovery.originalContent);
    
    // Clean up recovery point
    this.recoveryPoints.delete(id);
    
    return success;
  }

  // ============================================================
  // Evolution Main (Agent Orchestration - Pattern 7)
  // ============================================================

  async evolveSkill(skill: Skill, options?: Partial<EvolutionOptions>): Promise<EvolutionResult> {
    // Ensure initialized (Bootstrap - Pattern 10)
    await this.initialize();
    
    const iterations = options?.iterations || this.config.iterations || MAX_CANDIDATES;
    const candidates: EvolutionCandidate[] = [];
    
    // Read current content
    const currentContent = await this.skillManager.readSkillContent(skill);
    
    // Generate candidates (Task Decomposition - Pattern 9)
    const allVariants = this.generateCandidates(currentContent, iterations);
    
    // Score each candidate (Memoize promise - Pattern 4)
    const scoredPromises = allVariants.map((variant, index) => 
      this.scoreCandidateAsync(skill, variant, index)
    );
    
    // Wait for all evaluations (Multi-Agent - Pattern 11)
    const scoredCandidates = await Promise.all(scoredPromises);
    candidates.push(...scoredCandidates);
    
    // Sort by score (Select - Pattern 4)
    candidates.sort((a, b) => b.score - a.score);
    
    // Route evolution (Agent Orchestration - Pattern 7)
    const result = await this.routeEvolution(candidates, skill);
    
    this.evolutionHistory.push(result);
    
    return result;
  }

  /**
   * Generate mutation candidates
   */
  private generateCandidates(content: string, limit: number): string[] {
    const variants = new Set<string>([content]);
    
    for (const rule of MUTATION_RULES) {
      for (const variant of [...variants]) {
        const mutations = rule.apply(variant);
        for (const m of mutations) {
          if (variants.size >= limit) break;
          variants.add(m);
        }
      }
    }
    
    return [...variants].slice(0, limit);
  }

  // ============================================================
  // LLM-as-Judge Evaluation (Phase 2)
  // ============================================================

  /**
   * Async evaluation with promise memoization (Select - Pattern 4)
   */
  private async scoreCandidateAsync(
    skill: Skill,
    content: string,
    index: number
  ): Promise<EvolutionCandidate> {
    // Create memoization key
    const memoKey = `${skill.slug}:${index}:${content.substring(0, 50)}`;
    
    // Check if already pending
    const pending = this.pendingEvaluations.get(memoKey);
    if (pending) {
      const evaluation = await pending;
      return this.createCandidate(content, index, evaluation, skill);
    }
    
    // Create and memoize promise
    const evalPromise = this.evaluateWithLLM(content);
    this.pendingEvaluations.set(memoKey, evalPromise);
    
    try {
      const evaluation = await evalPromise;
      return this.createCandidate(content, index, evaluation, skill);
    } finally {
      // Clean up memoization
      this.pendingEvaluations.delete(memoKey);
    }
  }

  private createCandidate(
    content: string,
    index: number,
    evaluation: LLMEvaluationResult,
    skill: Skill
  ): EvolutionCandidate {
    // Apply size bounds (Tool & Safety - Pattern 3)
    let score = evaluation.score;
    if (content.length > SKILL_SIZE_LIMIT) {
      score = this.clampScore(score - 0.3);
    }
    
    // Bonus for structure
    if (content.includes('## ') && content.includes('\n')) {
      score = this.clampScore(score + 0.1);
    }
    
    // Bonus for examples
    if (content.includes('```') || content.includes('Example:')) {
      score = this.clampScore(score + 0.1);
    }
    
    return {
      id: `candidate-${index}`,
      content,
      score,
      mutations: this.identifyMutations(skill, content),
    };
  }

  /**
   * LLM-as-Judge evaluation (with fallback)
   */
  async evaluateWithLLM(candidate: string): Promise<LLMEvaluationResult> {
    // Input validation (Tool & Safety - Pattern 3)
    if (typeof candidate !== 'string' || candidate.length === 0) {
      return this.ruleBasedEvaluate('');
    }

    // Fallback if no Honcho (Skill Runtime - Pattern 2)
    if (!this.honcho) {
      return this.ruleBasedEvaluate(candidate);
    }

    try {
      const response = await this.honcho.ask('system', this.buildEvaluationPrompt(candidate));
      return this.parseEvaluation(response, candidate);
    } catch (err) {
      console.error('[SelfEvolution] LLM evaluation failed:', err);
      return this.ruleBasedEvaluate(candidate);
    }
  }

  private buildEvaluationPrompt(candidate: string): string {
    return `Evaluate the following Prompt quality:

${candidate}

Evaluation dimensions (each 1-10):
1. Clarity: Are instructions clear and specific?
2. Completeness: Does it cover all necessary cases?
3. Actionability: Can the AI execute it correctly?

Output ONLY valid JSON:
{"score": 0.8, "clarity": 8, "completeness": 7, "actionability": 9, "reasoning": "Brief explanation"}`;
  }

  private parseEvaluation(response: string, fallbackContent: string): LLMEvaluationResult {
    // Robust JSON parsing
    const parsed = this.parseJSONResponse(response);
    if (!parsed) {
      return this.ruleBasedEvaluate(fallbackContent);
    }

    // Apply bounds (Tool & Safety - Pattern 3)
    return {
      score: this.clampScore(parsed.score ?? SCORE_DEFAULT),
      clarity: this.clampDimension(parsed.clarity ?? 5),
      completeness: this.clampDimension(parsed.completeness ?? 5),
      actionability: this.clampDimension(parsed.actionability ?? 5),
      reasoning: parsed.reasoning ?? 'No reasoning provided',
    };
  }

  private parseJSONResponse(response: string): Partial<LLMEvaluationResult> | null {
    try {
      return JSON.parse(response);
    } catch {
      // Try extract from markdown
      const match = response.match(/\{[^{}]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private parseDiagnosisResponse(response: string): DiagnosisResponse | null {
    try {
      return JSON.parse(response);
    } catch {
      // Try extract from markdown
      const match = response.match(/\{[^{}]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Fallback rule-based evaluation
   */
  private ruleBasedEvaluate(candidate: string): LLMEvaluationResult {
    let clarity = 5;
    let completeness = 5;
    let actionability = 5;

    // Clarity heuristics
    if (candidate.length > 50) clarity += 1;
    if (candidate.includes('##')) clarity += 1;
    if (candidate.includes(':')) clarity += 1;
    if (candidate.split('.').length > 3) clarity += 1;

    // Completeness heuristics
    if (candidate.includes('Example')) completeness += 2;
    if (candidate.includes('Constraint')) completeness += 1;
    if (candidate.includes('#')) completeness += 1;

    // Actionability heuristics
    if (candidate.includes('```')) actionability += 2;
    if (/\b(should|must|will|can)\b/i.test(candidate)) actionability += 1;
    if (candidate.includes('Return')) actionability += 1;

    // Apply bounds
    clarity = this.clampDimension(clarity);
    completeness = this.clampDimension(completeness);
    actionability = this.clampDimension(actionability);

    const score = (clarity + completeness + actionability) / 30;

    return {
      score: this.clampScore(score),
      clarity,
      completeness,
      actionability,
      reasoning: 'Rule-based evaluation (fallback)',
    };
  }

  // ============================================================
  // Reflexion Correction (Phase 4)
  // ============================================================

  /**
   * Reflexion-style correction for low-quality candidates
   */
  async reflexionCorrection(
    candidate: EvolutionCandidate,
    evaluation: LLMEvaluationResult
  ): Promise<EvolutionCandidate | null> {
    // Require Honcho for Reflexion
    if (!this.honcho) {
      return null;
    }

    try {
      // Step 1: Diagnose (Hook Lifecycle - Pattern 8)
      const diagnosis = await this.diagnoseProblem(candidate, evaluation);
      if (!diagnosis) return null;

      // Step 2: Generate remedy
      const remedy = await this.generateRemedy(candidate, diagnosis);
      if (!remedy) return null;

      // Step 3: Re-evaluate
      const reEval = await this.evaluateWithLLM(remedy);

      // Step 4: Accept if improved
      if (reEval.score > evaluation.score + 0.1) {
        return {
          id: `${candidate.id}-reflexion`,
          content: remedy,
          score: reEval.score,
          mutations: [
            ...candidate.mutations,
            {
              type: 'reflexion',
              original: evaluation.reasoning,
              mutated: diagnosis,
              rationale: `Score improved from ${evaluation.score.toFixed(2)} to ${reEval.score.toFixed(2)}`,
            },
          ],
        };
      }

      return null;
    } catch (err) {
      console.error('[SelfEvolution] Reflexion failed:', err);
      return null;
    }
  }

  private async diagnoseProblem(
    candidate: EvolutionCandidate,
    evaluation: LLMEvaluationResult
  ): Promise<string | null> {
    if (!this.honcho) return null;
    
    try {
      const response = await this.honcho.ask('system', `Analyze this Prompt's problems:

${candidate.content}

Current score: ${evaluation.score.toFixed(2)}
Issues: ${evaluation.reasoning}

Output ONLY valid JSON:
{"diagnosis": "What exactly is wrong", "suggestions": ["Fix 1", "Fix 2"]}`,
        'quick'
      );
      
      const parsed = this.parseDiagnosisResponse(response);
      return parsed?.diagnosis ?? null;
    } catch {
      return null;
    }
  }

  private async generateRemedy(
    candidate: EvolutionCandidate,
    diagnosis: string
  ): Promise<string | null> {
    if (!this.honcho) return null;
    
    try {
      const response = await this.honcho.ask('system', `Based on the diagnosis, generate an improved Prompt:

Original Prompt:
${candidate.content}

Diagnosis:
${diagnosis}

Output ONLY the improved Prompt (no JSON, no commentary):`,
        'quick'
      );
      
      return response.trim();
    } catch {
      return null;
    }
  }

  // ============================================================
  // Phase 3: Routing Logic (Agent Orchestration - Pattern 7)
  // ============================================================

  /**
   * Route evolution based on score threshold
   */
  async routeEvolution(
    candidates: EvolutionCandidate[],
    skill: Skill
  ): Promise<EvolutionResult> {
    const threshold = SCORE_THRESHOLD_HIGH;
    const reflexionQueue: EvolutionCandidate[] = [];

    // Phase 3a: Identify candidates needing Reflexion
    for (const candidate of candidates) {
      if (candidate.score < threshold) {
        reflexionQueue.push(candidate);
      }
    }

    // Phase 3b: Apply Reflexion in parallel (Multi-Agent - Pattern 11)
    if (reflexionQueue.length > 0) {
      const reflexionPromises = reflexionQueue.map(async (c) => {
        const eval_ = { score: c.score, reasoning: '', clarity: 5, completeness: 5, actionability: 5 };
        return this.reflexionCorrection(c, eval_);
      });

      const reflexionResults = await Promise.allSettled(reflexionPromises);

      // Apply successful reflexions
      for (const result of reflexionResults) {
        if (result.status === 'fulfilled' && result.value) {
          const idx = candidates.findIndex(c => c.id === result.value!.id.replace('-reflexion', ''));
          if (idx !== -1) {
            candidates[idx] = result.value;
          }
        }
      }
    }

    // Re-sort after reflexion
    candidates.sort((a, b) => b.score - a.score);

    return {
      target: createEvolutionId('skill', skill.slug),
      candidates,
      bestCandidate: candidates[0],
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  private identifyMutations(skill: Skill, candidateContent: string): EvolutionCandidate['mutations'] {
    const mutations: EvolutionCandidate['mutations'] = [];

    if (candidateContent.includes('## Overview') && !skill.description.includes('## Overview')) {
      mutations.push({
        type: 'description',
        original: 'No structure',
        mutated: 'Added ## Overview section',
        rationale: 'Improves readability',
      });
    }

    if (candidateContent.includes('```') && !skill.description.includes('```')) {
      mutations.push({
        type: 'example',
        original: 'No examples',
        mutated: 'Added code example',
        rationale: 'Provides concrete usage',
      });
    }

    return mutations;
  }

  // ============================================================
  // Persistence (Memory Persistence - Pattern 1)
  // ============================================================

  private async persistTrace(skillSlug: string, trace: ExecutionTrace): Promise<void> {
    // Placeholder for disk persistence
    // In production, this would write to a JSON file or SQLite
    const traceId = createTraceId(skillSlug, trace.timestamp);
    console.debug(`[SelfEvolution] Persisting trace: ${traceId}`);
  }

  private loadRecoveryPoints(): void {
    // Placeholder for loading recovery points from disk
    // In production, this would read from a recovery file
  }

  // ============================================================
  // Public API
  // ============================================================
  // Closed-Loop: Rollback
  // ============================================================
  
  private async performRollback(skillSlug: string): Promise<boolean> {
    const backup = this.backups.get(skillSlug);
    if (!backup) {
      console.warn(`[SelfEvolution] No backup found for ${skillSlug}, cannot rollback`);
      return false;
    }
    
    const skill = this.skillManager.getSkill(skillSlug);
    if (!skill) {
      console.warn(`[SelfEvolution] Skill not found for rollback: ${skillSlug}`);
      return false;
    }
    
    try {
      // Restore backup content
      await this.skillManager.writeSkillContent(skill, backup.content);
      this.backups.delete(skillSlug);
      console.log(`[SelfEvolution] Rollback complete for ${skillSlug}`);
      return true;
    } catch (err) {
      console.error(`[SelfEvolution] Rollback failed for ${skillSlug}:`, err);
      return false;
    }
  }
  
  // ============================================================
  // Apply Best Candidate with Verification Tracking
  // ============================================================

  applyBestCandidate(result: EvolutionResult): boolean {
    if (!result.bestCandidate) {
      return false;
    }
    
    const skillSlug = result.target.replace('skill:', '');
    const skill = this.skillManager.getSkill(skillSlug);
    
    if (!skill) {
      return false;
    }
    
    // ============================================================
    // Closed-Loop: Create backup before applying
    // ============================================================
    (async () => {
      try {
        const currentContent = await this.skillManager.readSkillContent(skill);
        this.backups.set(skillSlug, {
          content: currentContent,
          timestamp: Date.now(),
        });
        console.log(`[SelfEvolution] Backup created for ${skillSlug}`);
      } catch (err) {
        console.error(`[SelfEvolution] Backup creation failed for ${skillSlug}:`, err);
      }
    })();
    
    // Set up verification tracking
    this.appliedCandidates.set(skillSlug, {
      content: result.bestCandidate.content,
      score: result.bestCandidate.score,
      tracesCount: 0,
      successCount: 0,
      appliedAt: Date.now(),
    });
    
    console.log(`[SelfEvolution] Verification tracking started for ${skillSlug} (need ${VERIFICATION_COUNT} traces)`);
    
    // This is handled by commitEvolution in two-phase mode
    return true;
  }

  async evolveAllSkills(
    options?: Partial<EvolutionOptions>
  ): Promise<Map<string, EvolutionResult>> {
    await this.initialize();
    
    const results = new Map<string, EvolutionResult>();
    const skills = this.skillManager.getSkills();

    // Parallel evolution (Multi-Agent - Pattern 11)
    const promises = skills.map(async (skill) => {
      try {
        const result = await this.evolveSkill(skill, options);
        return { skill: skill.slug, result };
      } catch {
        return null;
      }
    });

    const settled = await Promise.all(promises);
    
    for (const item of settled) {
      if (item) {
        results.set(item.skill, item.result);
      }
    }

    return results;
  }

  getHistory(): EvolutionResult[] {
    return [...this.evolutionHistory];
  }

  getLastEvolution(target: string): EvolutionResult | undefined {
    return this.evolutionHistory.filter(r => r.target === target).pop();
  }

  updateConfig(config: Partial<EvolutionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EvolutionConfig {
    return { ...this.config };
  }
}

// ============================================================
// Factory (Bootstrap Sequence - Pattern 10)
// ============================================================

export function createSelfEvolutionEngine(
  skillManager: SkillManager,
  config?: Partial<EvolutionConfig>,
  honcho?: HonchoClient
): SelfEvolutionEngine {
  return new SelfEvolutionEngine(skillManager, config, honcho);
}
