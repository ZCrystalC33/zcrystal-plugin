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
import type { EvolutionConfig, EvolutionResult, EvolutionCandidate, Skill, ExecutionTrace } from './types.js';
import { SkillManager } from './skill-manager.js';
import { HonchoClient } from './honcho-client.js';
type EvolutionId = `${string}:${string}`;
export type EvolutionTarget = 'skill' | 'tool' | 'system-prompt' | 'all';
export interface EvolutionOptions {
    target: EvolutionTarget;
    iterations?: number;
    evalSource?: 'synthetic' | 'sessiondb';
    provider?: string;
    model?: string;
    outputDir?: string;
}
export interface LLMEvaluationResult {
    score: number;
    clarity: number;
    completeness: number;
    actionability: number;
    reasoning: string;
    evaluationFeedback?: {
        whyScore: string;
        howToImprove: string;
    };
}
export declare class SelfEvolutionEngine {
    private skillManager;
    private honcho?;
    private feedbackStore?;
    private traces;
    private dataDir;
    private evolutionHistory;
    private recoveryPoints;
    private config;
    private pendingEvaluations;
    private initialized;
    private initPromise?;
    private appliedCandidates;
    private evolvingSkills;
    private backups;
    private readonly BACKUP_TTL_MS;
    private _backupDir?;
    private schedulerInterval?;
    constructor(skillManager: SkillManager, config?: Partial<EvolutionConfig>, honcho?: HonchoClient);
    /**
     * Initialize engine with dependency ordering
     */
    initialize(): Promise<void>;
    private doInitialize;
    private startScheduler;
    stopScheduler(): void;
    private runScheduledEvolution;
    /**
     * Record trace with dual storage
     * Local memory always wins
     */
    recordTrace(skillSlug: string, trace: ExecutionTrace): void;
    private checkAutoTrigger;
    private verifyAppliedCandidate;
    getTraces(skillSlug: string): ExecutionTrace[];
    clearTraces(skillSlug?: string): void;
    /**
     * Canonical score bounds check
     */
    private clampScore;
    /**
     * Canonical dimension bounds check
     */
    private clampDimension;
    /**
     * Phase 1: Prepare evolution (create recovery point)
     */
    prepareEvolution(skill: Skill): Promise<EvolutionId>;
    /**
     * Phase 2: Commit evolution (apply best candidate)
     * Only if Phase 1 was called
     */
    commitEvolution(id: EvolutionId, result: EvolutionResult): Promise<boolean>;
    /**
     * Rollback to recovery point
     */
    rollbackEvolution(id: EvolutionId): Promise<boolean>;
    evolveSkill(skill: Skill, options?: Partial<EvolutionOptions>): Promise<EvolutionResult>;
    /**
     * Generate mutation candidates
     */
    private generateCandidates;
    /**
     * Clean up stale backups (TTL-based eviction)
     */
    private cleanupBackups;
    /**
     * Clean up stale pending evaluations (TTL-based eviction)
     */
    private cleanupPendingEvaluations;
    /**
     * Async evaluation with promise memoization (Select - Pattern 4)
     */
    private scoreCandidateAsync;
    private createCandidate;
    /**
     * LLM-as-Judge evaluation (with fallback)
     */
    evaluateWithLLM(candidate: string): Promise<LLMEvaluationResult>;
    private buildEvaluationPrompt;
    private parseEvaluation;
    private parseJSONResponse;
    private parseDiagnosisResponse;
    /**
     * Fallback rule-based evaluation
     */
    private ruleBasedEvaluate;
    /**
     * Reflexion-style correction for low-quality candidates
     */
    reflexionCorrection(candidate: EvolutionCandidate, evaluation: LLMEvaluationResult): Promise<EvolutionCandidate | null>;
    private diagnoseProblem;
    private generateRemedy;
    /**
     * Route evolution based on score threshold
     */
    routeEvolution(candidates: EvolutionCandidate[], skill: Skill): Promise<EvolutionResult>;
    private identifyMutations;
    private ensureDataDir;
    private persistTrace;
    private loadRecoveryPoints;
    private saveRecoveryPoints;
    private performRollback;
    /**
     * Apply the best evolution candidate to the skill.
     * FIX: Actually writes the candidate content to the skill file.
     */
    applyBestCandidate(result: EvolutionResult): Promise<boolean>;
    evolveAllSkills(options?: Partial<EvolutionOptions>): Promise<Map<string, EvolutionResult>>;
    getHistory(): EvolutionResult[];
    getLastEvolution(target: string): EvolutionResult | undefined;
    updateConfig(config: Partial<EvolutionConfig>): void;
    getConfig(): EvolutionConfig;
}
export declare function createSelfEvolutionEngine(skillManager: SkillManager, config?: Partial<EvolutionConfig>, honcho?: HonchoClient): SelfEvolutionEngine;
export {};
//# sourceMappingURL=self-evolution.d.ts.map