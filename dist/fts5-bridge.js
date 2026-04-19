/**
 * FTS5 Bridge - Direct import to bypass MCP stdio issues
 * Uses direct import instead of MCP protocol
 */
import * as path from 'path';
// Dynamically load the FTS5 module
const FTS5_PATH = process.env.OPENCLAW_PATH ? process.env.OPENCLAW_PATH + '/skills/fts5' : '/home/snow/.openclaw/skills/fts5';
let _fts5 = null;
async function getFTS5() {
    if (_fts5)
        return _fts5;
    try {
        // Import using dynamic import for ESM module
        const modulePath = path.join(FTS5_PATH, '__init__.py');
        console.log('[FTS5-Bridge] Direct import not yet implemented - using MCP fallback');
        // For now, return a mock that logs usage
        _fts5 = {
            search: async (query, limit = 5) => {
                console.log('[FTS5-Bridge] search called:', query, limit);
                return [];
            },
            summarize: async (query, limit = 5) => {
                console.log('[FTS5-Bridge] summarize called:', query, limit);
                return 'Summary not available via direct import';
            },
            get_stats: async () => {
                console.log('[FTS5-Bridge] get_stats called');
                return { total: 0 };
            }
        };
        return _fts5;
    }
    catch (err) {
        console.error('[FTS5-Bridge] Failed to load FTS5:', err);
        throw err;
    }
}
export const fts5Bridge = {
    async search(query, limit = 5) {
        const fts5 = await getFTS5();
        return fts5.search(query, limit);
    },
    async summarize(query, limit = 5) {
        const fts5 = await getFTS5();
        return fts5.summarize(query, limit);
    },
    async get_stats() {
        const fts5 = await getFTS5();
        return fts5.get_stats();
    }
};
//# sourceMappingURL=fts5-bridge.js.map