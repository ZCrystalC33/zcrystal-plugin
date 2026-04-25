/**
 * Uncertainty Detection Hook
 * Monitors Agent responses for uncertainty markers and auto-triggers recall
 *
 * Implements "方案 C: 混合模式" - system prompt + post-response hook
 *
 * Flow:
 * 1. Agent responds with uncertainty ("我不記得", "不確定")
 * 2. This hook detects the uncertainty marker
 * 3. Auto-search FTS5 for relevant context
 * 4. Inject results back (via memory system or next prompt hint)
 */
/**
 * Extract the uncertainty context from an Agent response
 */
export declare function extractUncertaintyContext(response: string): {
    marker: string;
    context: string;
} | null;
/**
 * Perform auto-search for uncertain context
 * Returns search results or empty string
 */
export declare function autoSearchContext(context: string, limit?: number): Promise<string>;
/**
 * Format uncertainty detection result for logging/injection
 */
export declare function formatUncertaintyNotice(results: string, marker: string): string;
//# sourceMappingURL=uncertainty-hook.d.ts.map