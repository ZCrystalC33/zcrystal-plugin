/**
 * FeedbackStore - persistent storage for Why+How feedback entries.
 * Implements Memory Persistence Pattern 1 (dual storage: memory + disk).
 * Local memory always wins. FIFO eviction with max 200 entries.
 */
import type { FeedbackEntry } from './types.js';
export declare class FeedbackStore {
    private entries;
    private readonly MAX_ENTRIES;
    private readonly DATA_FILE;
    private dataDir;
    private loadPromise;
    constructor(dataDir: string);
    private ensureLoaded;
    add(entry: Omit<FeedbackEntry, 'timestamp'>): FeedbackEntry;
    search(trigger: string): FeedbackEntry[];
    getRelevantForSkill(skillSlug: string, limit?: number): FeedbackEntry[];
    getAll(): FeedbackEntry[];
    private ensureDataDir;
    private persist;
    private load;
}
//# sourceMappingURL=feedback-store.d.ts.map