/**
 * FTS5 Bridge - HTTP-based FTS5 search integration
 *
 * Architecture:
 * - Primary: Direct Python subprocess (bypasses MCP HTTP dependency)
 * - Features: Privacy filter, token cost visibility, progressive disclosure
 *
 * Integration: privacy-filter.ts strips <private> tags before indexing
 */
export interface FTS5SearchResult {
    content: string;
    score: number;
    sessionId?: string;
    timestamp?: number;
}
export interface FTS5Module {
    search: (query: string, limit?: number) => Promise<FTS5SearchResult[]>;
    summarize: (query: string, limit?: number) => Promise<string>;
    get_stats: () => Promise<{
        total: number;
        last_updated: string;
    }>;
    isAvailable: () => Promise<boolean>;
}
export declare function fts5IsAvailable(): Promise<boolean>;
export declare function fts5HttpSearch(query: string, limit?: number): Promise<FTS5SearchResult[]>;
export declare function fts5HttpStats(): Promise<{
    total: number;
    last_updated: string;
}>;
export declare const fts5Bridge: FTS5Module;
//# sourceMappingURL=fts5-bridge.d.ts.map