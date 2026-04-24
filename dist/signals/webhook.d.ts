/**
 * Signal Webhook Pusher
 *
 * Pushes signals to external endpoints (e.g., Freqtrade webhook)
 * Supports Freqtrade webhook format with retry mechanism (max 3 attempts)
 */
import type { Signal } from './signal-schema.js';
export interface WebhookConfig {
    url: string;
    secret?: string;
    maxRetries?: number;
    timeoutMs?: number;
}
export interface WebhookPayload {
    action?: string;
    pair?: string;
    limit?: number;
    order_type?: string;
    signal?: Signal;
}
export interface WebhookResult {
    success: boolean;
    attempts: number;
    responseCode?: number;
    error?: string;
}
export declare class SignalWebhook {
    private config;
    constructor(config: WebhookConfig);
    /**
     * Push a signal to the configured webhook URL.
     * Converts signal to Freqtrade webhook format.
     */
    push(signal: Signal): Promise<WebhookResult>;
    /**
     * Push a custom payload to the webhook.
     */
    pushCustom(payload: WebhookPayload): Promise<WebhookResult>;
    /**
     * Build a Freqtrade-compatible webhook payload.
     * Freqtrade webhook expects:
     *   { action: "buy"|"sell", pair: "BTCUSDT", limit: price }
     */
    private buildFreqtradePayload;
    private postWithRetry;
    private post;
    private sleep;
    /**
     * Update the webhook URL.
     */
    setUrl(url: string): void;
    /**
     * Get current config (without secret).
     */
    getConfig(): WebhookConfig & {
        secret?: string;
    };
}
//# sourceMappingURL=webhook.d.ts.map