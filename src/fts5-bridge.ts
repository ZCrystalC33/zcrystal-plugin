/**
 * FTS5 Bridge - Direct import to bypass MCP stdio issues
 * 
 * NOTE: Direct Python import is not yet implemented.
 * The plugin uses MCP HTTP fallback via config.fts5.mcpUrl
 * This bridge is a placeholder for future direct import support.
 */

import { config } from './config.js';

// FTS5 HTTP MCP URL - used by the plugin directly in index.ts
const FTS5_MCP_URL = config.fts5.mcpUrl;
const FTS5_PORT = config.fts5.port;

export interface FTS5SearchResult {
  content: string;
  score: number;
  sessionId?: string;
  timestamp?: number;
}

export interface FTS5Module {
  search: (query: string, limit?: number) => Promise<FTS5SearchResult[]>;
  summarize: (query: string, limit?: number) => Promise<string>;
  get_stats: () => Promise<{ total: number; last_updated: string }>;
}

// HTTP-based FTS5 client (used as fallback when direct import unavailable)
export async function fts5HttpSearch(query: string, limit = 20): Promise<FTS5SearchResult[]> {
  try {
    const response = await fetch(FTS5_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'fts5_search', arguments: { query, limit } },
        id: 2
      })
    });
    const data = await response.json() as { result?: { content?: Array<{ text: string }> } };
    if (data.result?.content?.[0]?.text) {
      // Parse the JSON text result
      try {
        return JSON.parse(data.result.content[0].text);
      } catch {
        return [{ content: data.result.content[0].text, score: 1.0 }];
      }
    }
    return [];
  } catch (e) {
    console.error('[FTS5-Bridge] HTTP search failed:', e);
    return [];
  }
}

export async function fts5HttpStats(): Promise<{ total: number; last_updated: string }> {
  try {
    const response = await fetch(FTS5_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'fts5_stats', arguments: {} },
        id: 3
      })
    });
    const data = await response.json() as { result?: { content?: Array<{ text: string }> } };
    if (data.result?.content?.[0]?.text) {
      try {
        return JSON.parse(data.result.content[0].text);
      } catch {
        return { total: 0, last_updated: new Date().toISOString() };
      }
    }
    return { total: 0, last_updated: new Date().toISOString() };
  } catch (e) {
    console.error('[FTS5-Bridge] HTTP stats failed:', e);
    return { total: 0, last_updated: new Date().toISOString() };
  }
}

// Re-export for compatibility
export const fts5Bridge = {
  search: fts5HttpSearch,
  summarize: async (query: string, limit = 5) => {
    const results = await fts5HttpSearch(query, limit);
    if (results.length === 0) return 'No results found';
    return results.map(r => r.content).join('\n---\n');
  },
  get_stats: fts5HttpStats
};
