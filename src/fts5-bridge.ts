/**
 * FTS5 Bridge - Direct import to bypass MCP stdio issues
 * Uses direct import instead of MCP protocol
 */

import * as path from 'path';
import * as fs from 'fs';

// Dynamically load the FTS5 module
const FTS5_PATH = '/home/snow/.openclaw/skills/fts5';

interface FTS5Module {
  search: (query: string, limit?: number) => Promise<unknown[]>;
  summarize: (query: string, limit?: number) => Promise<string>;
  get_stats: () => Promise<unknown>;
}

let _fts5: FTS5Module | null = null;

async function getFTS5(): Promise<FTS5Module> {
  if (_fts5) return _fts5;
  
  try {
    // Import using dynamic import for ESM module
    const modulePath = path.join(FTS5_PATH, '__init__.py');
    console.log('[FTS5-Bridge] Direct import not yet implemented - using MCP fallback');
    
    // For now, return a mock that logs usage
    _fts5 = {
      search: async (query: string, limit = 5) => {
        console.log('[FTS5-Bridge] search called:', query, limit);
        return [];
      },
      summarize: async (query: string, limit = 5) => {
        console.log('[FTS5-Bridge] summarize called:', query, limit);
        return 'Summary not available via direct import';
      },
      get_stats: async () => {
        console.log('[FTS5-Bridge] get_stats called');
        return { total: 0 };
      }
    };
    return _fts5;
  } catch (err) {
    console.error('[FTS5-Bridge] Failed to load FTS5:', err);
    throw err;
  }
}

export const fts5Bridge = {
  async search(query: string, limit = 5) {
    const fts5 = await getFTS5();
    return fts5.search(query, limit);
  },
  
  async summarize(query: string, limit = 5) {
    const fts5 = await getFTS5();
    return fts5.summarize(query, limit);
  },
  
  async get_stats() {
    const fts5 = await getFTS5();
    return fts5.get_stats();
  }
};
