/**
 * Evolution Learning Persistence
 *
 * Implements Memory Persistence Pattern 1 for Self-Evolution Engine.
 *
 * Problem: Evolution results are in-memory only. After OpenClaw restart,
 * the engine "forgets" what worked and what didn't.
 *
 * Solution: Persist learning to disk after each evolution cycle.
 * Load and apply learning on startup to guide future mutations.
 *
 * Flow:
 * 1. After applyBestCandidate() → persist learning
 * 2. On engine initialize() → load learning
 * 3. During generateCandidates() → use learning hints
 */
export interface LearnedPattern {
    skillSlug: string;
    pattern: string;
    occurrences: number;
    avgScore: number;
    lastSeen: number;
    exampleContent?: string;
}
export interface EvolutionLearning {
    version: number;
    lastUpdated: number;
    patterns: LearnedPattern[];
    successfulCandidates: SuccessfulCandidate[];
    corrections: CorrectionEntry[];
}
interface SuccessfulCandidate {
    skillSlug: string;
    contentHash: string;
    content: string;
    score: number;
    appliedAt: number;
    verificationPassed: boolean;
}
interface CorrectionEntry {
    skillSlug: string;
    issue: string;
    resolution: string;
    timestamp: number;
}
export declare class EvolutionLearningPersistence {
    private dataDir;
    private learning;
    private dirty;
    constructor(dataDir: string);
    /**
     * Load learning from disk (called on engine initialize)
     */
    load(): Promise<void>;
    /**
     * Save learning to disk
     */
    save(): Promise<void>;
    /**
     * Record a successful candidate application
     * Called after applyBestCandidate() succeeds
     */
    recordSuccess(skillSlug: string, content: string, score: number, verificationPassed: boolean): Promise<void>;
    /**
     * Record a failed candidate (for corrections)
     */
    recordFailure(skillSlug: string, content: string, issue: string): Promise<void>;
    /**
     * Get learning hints for a skill (used during mutation generation)
     */
    getHints(skillSlug: string): {
        successfulPatterns: string[];
        avoidPatterns: string[];
        avgSuccessfulScore: number;
    };
    /**
     * Extract patterns from content (simple keyword extraction)
     */
    private extractPatterns;
    /**
     * Append a correction entry for Self-Improving system
     */
    private appendCorrection;
    /**
     * Simple hash for content deduplication
     */
    private hashContent;
    /**
     * Get all learning summary (for debugging/dashboard)
     */
    getSummary(): {
        totalPatterns: number;
        totalCandidates: number;
        totalCorrections: number;
        topPatterns: LearnedPattern[];
    };
}
export {};
//# sourceMappingURL=evolution-learning.d.ts.map