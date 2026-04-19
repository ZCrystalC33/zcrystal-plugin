/**
 * Honcho Trace Persistence
 * Stores traces in Honcho session for persistent storage
 */
import { HonchoClient } from './honcho-client.js';
export declare class HonchoTraceStore {
    private honcho;
    constructor(honcho: HonchoClient);
    recordTrace(skill: string, action: string, success: boolean, details?: string): Promise<void>;
    getTraces(skill?: string, limit?: number): Promise<unknown[]>;
}
//# sourceMappingURL=honcho-trace.d.ts.map