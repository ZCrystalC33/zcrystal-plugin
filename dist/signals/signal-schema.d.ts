/**
 * Signal JSON Schema
 *
 * Unified signal model for trading signals from various sources
 */
export interface Signal {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    confidence: number;
    timestamp: number;
    source: string;
    metadata?: {
        wss_score?: number;
        volume_ratio?: number;
        rsi?: number;
        [key: string]: number | string | boolean | undefined;
    };
}
export interface SignalCreateInput {
    symbol: string;
    side: 'long' | 'short';
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    confidence: number;
    source: string;
    metadata?: Signal['metadata'];
}
export interface SignalStoreData {
    signals: Record<string, Signal>;
    updatedAt: number;
}
//# sourceMappingURL=signal-schema.d.ts.map