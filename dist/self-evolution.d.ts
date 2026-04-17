/**
 * Self-Evolution Engine for ZCrystal Plugin
 *
 * Aligns with: https://github.com/nousresearch/hermes-agent-self-evolution
 *
 * Features:
 * - DSPy + GEPA (Genetic-Pareto Prompt Evolution)
 * - Skill optimization
 * - Tool description optimization
 * - System prompt optimization
 * - Execution trace analysis
 */
import type { EvolutionConfig, EvolutionResult, Skill, ExecutionTrace } from './types.js';
import { SkillManager } from './skill-manager.js';
export type EvolutionTarget = 'skill' | 'tool' | 'system-prompt' | 'all';
export interface EvolutionOptions {
    target: EvolutionTarget;
    iterations?: number;
    evalSource?: 'synthetic' | 'sessiondb';
    provider?: string;
    model?: string;
    outputDir?: string;
}
export declare class SelfEvolutionEngine {
    private skillManager;
    private traces;
    private evolutionHistory;
    private config;
    constructor(skillManager: SkillManager, config?: Partial<EvolutionConfig>);
    /**
     * Record an execution trace for a skill
     */
    recordTrace(skillSlug: string, trace: ExecutionTrace): void;
    /**
     * Get traces for a skill
     */
    getTraces(skillSlug: string): ExecutionTrace[];
    /**
     * Clear traces for a skill
     */
    clearTraces(skillSlug?: string): void;
    /**
     * Run evolution on a skill
     * Returns candidates sorted by score
     */
    evolveSkill(skill: Skill, options?: Partial<EvolutionOptions>): Promise<EvolutionResult>;
    /**
     * Score a candidate variant
     */
    private scoreCandidate;
    /**
     * Identify what changed between original and candidate
     */
    private identifyMutations;
    /**
     * Apply the best candidate to a skill
     */
    applyBestCandidate(result: EvolutionResult): Promise<boolean>;
    /**
     * Evolve all skills
     */
    evolveAllSkills(options?: Partial<EvolutionOptions>): Promise<Map<string, EvolutionResult>>;
    /**
     * Evolve tool descriptions
     */
    evolveToolDescription(toolName: string, currentDescription: string, options?: Partial<EvolutionOptions>): Promise<EvolutionResult>;
    /**
     * Score tool description
     */
    private scoreToolDescription;
    /**
     * Get evolution history
     */
    getHistory(): EvolutionResult[];
    /**
     * Get last evolution result for a target
     */
    getLastEvolution(target: string): EvolutionResult | undefined;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<EvolutionConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): EvolutionConfig;
}
export declare function createSelfEvolutionEngine(skillManager: SkillManager, config?: Partial<EvolutionConfig>): SelfEvolutionEngine;
//# sourceMappingURL=self-evolution.d.ts.map