/**
 * Progressive Memory Disclosure
 * Based on Claude-Mem's 3-layer pattern: index → timeline → deep-dive
 *
 * Reduces context bloat by fetching metadata first, full content on demand.
 */
/**
 * Layer 1: Memory Index - lightweight metadata only
 * Returns: id, title, type, timestamp, token_estimate per entry
 */
export interface MemoryIndexEntry {
    id: number;
    title: string;
    sender: string;
    timestamp: string;
    tokenEstimate: number;
    snippet: string;
}
/**
 * Layer 1: Get memory index (metadata only, ~50 tokens per entry)
 */
export declare function getMemoryIndex(query: string, limit?: number): Promise<MemoryIndexEntry[]>;
/**
 * Format memory index as markdown table (Token Cost Visibility)
 */
export declare function formatMemoryIndexTable(entries: MemoryIndexEntry[]): string;
/**
 * Layer 3: Get full observation by ID
 */
export declare function getMemoryEntryById(id: number): Promise<string | null>;
//# sourceMappingURL=progressive.d.ts.map