/**
 * Self-Doubt Recall System
 * Enables Agent to automatically search FTS5 when it suspects memory gaps
 *
 * Agent can call zcrystal_recall when:
 * - "我不記得" (I don't remember)
 * - "不確定" (uncertain)
 * - "需要確認" (need to verify)
 * - "之前" (previously/earlier)
 * - "上次" (last time)
 *
 * This is triggered by Agent self-awareness, not by hooks.
 */
/**
 * Uncertainty markers that trigger Agent to call zcrystal_recall
 */
export declare const UNCERTAINTY_MARKERS: string[];
/**
 * Extract recall keywords from Agent's uncertain response
 */
export declare function extractRecallKeywords(agentResponse: string): string | null;
/**
 * Quick FTS5 search for recall
 * Returns relevant context for Agent to verify
 */
export declare function quickRecall(query: string, limit?: number): Promise<string>;
//# sourceMappingURL=recall.d.ts.map