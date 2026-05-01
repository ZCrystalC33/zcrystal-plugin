/**
 * Signal Store - In-memory + disk persistence for signals
 *
 * Pattern: Dual-write (memory first, then disk)
 * Pattern 9: Typed IDs + disk output + two-phase eviction
 */
import type { Signal, SignalCreateInput } from './signal-schema.js';
interface Success<T> {
    readonly ok: true;
    readonly data: T;
}
interface Failure {
    readonly ok: false;
    readonly error: unknown;
}
type Result<T> = Success<T> | Failure;
export declare class SignalStoreError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class SignalStore {
    private signals;
    private diskPath;
    private writeTimer;
    private readonly DEBOUNCE_MS;
    constructor(dataPath: string);
    init(): Promise<void>;
    private loadFromDisk;
    private persistToDisk;
    /**
     * Add a new signal. Returns the created signal with generated id.
     */
    add(input: SignalCreateInput): Promise<Result<Signal>>;
    /**
     * Get a signal by id.
     */
    get(id: string): Signal | undefined;
    /**
     * Get all active (non-expired) signals.
     * A signal is considered expired if older than maxAgeMs (default: 24h).
     */
    getAll(maxAgeMs?: number): Signal[];
    /**
     * Get signals by symbol.
     */
    getBySymbol(symbol: string): Signal[];
    /**
     * Remove a signal by id.
     */
    remove(id: string): Promise<Result<void>>;
    /**
     * Clear all signals.
     */
    clear(): Promise<void>;
    /**
     * Get count of active signals.
     */
    size(): number;
    /**
     * Flush pending writes to disk. Call on shutdown.
     */
    flush(): Promise<void>;
    private generateId;
}
export {};
//# sourceMappingURL=signal-store.d.ts.map