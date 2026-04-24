/**
 * FTS5 Bridge - HTTP-based FTS5 search integration
 *
 * Architecture:
 * - Primary: HTTP MCP client (JSON-RPC 2.0 over HTTP)
 * - Fallback: Returns empty results with clear error when server unavailable
 *
 * Limitation: Direct Python import is not implemented.
 * The MCP HTTP transport is stable and used as the primary mechanism.
 *
 * Server requirement: FTS5 MCP HTTP server must be running on config.fts5.mcpUrl
 * (default: http://localhost:18795/mcp)
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