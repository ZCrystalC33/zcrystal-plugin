/**
 * ZCrystal Self-Improving Engine
 *
 * Integrates OpenClaw's self-improving patterns with ZCrystal's evolution system:
 * - Corrections Log (like OpenClaw's corrections.md)
 * - Heartbeat Engine (periodic maintenance)
 * - Layer Exchange (HOT→WARM→COLD)
 * - Context Predictor (predict user needs)
 */
export interface Correction {
    timestamp: string;
    context: string;
    reflection: string;
}
export interface HeartbeatState {
    lastRun: number;
    correctionsProcessed: number;
    layersExchanged: number;
    patternsLearned: number;
}
export interface ProactivePattern {
    pattern: string;
    successCount: number;
    lastUsed: number;
    description: string;
}
export interface LayerEntry {
    key: string;
    content: string;
    layer: 'HOT' | 'WARM' | 'COLD';
    lastReferenced: number;
    createdAt: number;
}
export declare class SelfImprovingEngine {
    private initialized;
    initialize(): Promise<void>;
    addCorrection(context: string, reflection: string): Promise<void>;
    getCorrections(limit?: number): Promise<Correction[]>;
    getMemory(): Promise<string>;
    addMemoryLine(content: string): Promise<void>;
    runHeartbeat(): Promise<{
        actions: string[];
        stats: HeartbeatState;
    }>;
    getHeartbeatState(): Promise<HeartbeatState>;
    private saveHeartbeatState;
    exchangeLayers(): Promise<{
        promoted: number;
        demoted: number;
    }>;
    private extractKey;
    private promoteToWarm;
    private trimMemory;
    predictNeeds(currentContext: string): Promise<{
        suggestions: string[];
        confidence: number;
    }>;
    addPattern(pattern: string, description: string): Promise<void>;
    getPatterns(): Promise<ProactivePattern[]>;
    logAction(action: string, result: string): Promise<void>;
    getRecentActions(limit?: number): Promise<Array<{
        timestamp: string;
        action: string;
        result: string;
    }>>;
    getStatus(): Promise<{
        correctionsCount: number;
        memoryLines: number;
        patternsCount: number;
        heartbeat: HeartbeatState;
    }>;
}
export declare const selfImproving: SelfImprovingEngine;
//# sourceMappingURL=index.d.ts.map