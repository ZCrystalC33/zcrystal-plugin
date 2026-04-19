/**
 * FTS5 Bridge - Direct import to bypass MCP stdio issues
 * Uses direct import instead of MCP protocol
 */
export declare const fts5Bridge: {
    search(query: string, limit?: number): Promise<unknown[]>;
    summarize(query: string, limit?: number): Promise<string>;
    get_stats(): Promise<unknown>;
};
//# sourceMappingURL=fts5-bridge.d.ts.map