/**
 * ZCrystal User Analyzer
 * Analyzes user communication patterns from stored traces
 */
interface UserTrace {
    skill: string;
    action: string;
    success: boolean;
    details?: string;
    timestamp: number;
}
interface UserProfile {
    totalTraces: number;
    skillsUsed: Record<string, number>;
    successRate: number;
    lastActive: number;
    communicationStyle: 'concise' | 'detailed' | 'mixed';
    messageCount: number;
}
export declare class UserAnalyzer {
    private traces;
    constructor(traces: UserTrace[]);
    analyze(): UserProfile;
    generateSummary(): string;
}
export {};
//# sourceMappingURL=user-analyzer.d.ts.map