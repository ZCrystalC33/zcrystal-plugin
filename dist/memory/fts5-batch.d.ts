/**
 * FTS5 Batch Indexer
 *
 * Replaces per-message spawn with batch writing to reduce process overhead.
 *
 * Problem: Each message spawns a detached Python process (~50ms overhead)
 * Solution: Ring buffer with batch writes every 5 seconds
 *
 * Flow:
 * 1. add_message() → push to buffer
 * 2. If buffer >= batch size OR timer elapsed → write batch
 * 3. Python receives all messages at once (JSON array)
 */
export interface FTS5Message {
    sender: string;
    sender_label: string;
    content: string;
    channel: string;
    session_key: string;
    message_id: string;
    timestamp: string;
}
interface BatchWriteOptions {
    maxBatchSize: number;
    flushIntervalMs: number;
    indexerPath: string;
    tempDir: string;
}
export declare class FTS5BatchIndexer {
    private buffer;
    private flushTimer?;
    private writing;
    private options;
    private onError?;
    constructor(options?: Partial<BatchWriteOptions>, onError?: (err: Error) => void);
    /**
     * Add a message to the buffer
     * Triggers flush if buffer is full
     */
    addMessage(msg: FTS5Message): void;
    /**
     * Flush buffer to FTS5 via Python
     */
    flush(): Promise<void>;
    /**
     * Spawn Python process to index batch
     */
    private spawnBatchWriter;
    /**
     * Start periodic flush timer
     */
    private startFlushTimer;
    /**
     * Stop timer and flush remaining messages
     */
    shutdown(): Promise<void>;
    /**
     * Get current buffer size (for testing/monitoring)
     */
    getBufferSize(): number;
}
export declare function getFTS5BatchIndexer(): FTS5BatchIndexer;
export {};
//# sourceMappingURL=fts5-batch.d.ts.map