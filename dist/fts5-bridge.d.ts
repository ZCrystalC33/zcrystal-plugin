/**
 * FTS5 Bridge - Direct import to bypass MCP stdio issues
 *
 * NOTE: Direct Python import is not yet implemented.
 * The plugin uses MCP HTTP fallback via config.fts5.mcpUrl
 * This bridge is a placeholder for future direct import support.
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
}
export declare function fts5HttpSearch(query: string, limit?: number): Promise<FTS5SearchResult[]>;
export declare function fts5HttpStats(): Promise<{
    total: number;
    last_updated: string;
}>;
export declare const fts5Bridge: {
    search: typeof fts5HttpSearch;
    summarize: (query: string, limit?: number) => Promise<string>;
    get_stats: typeof fts5HttpStats;
};
//# sourceMappingURL=fts5-bridge.d.ts.map