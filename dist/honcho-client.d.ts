/**
 * Honcho Client for ZCrystal Plugin
 *
 * Aligns with official Honcho Python SDK API:
 * https://github.com/plastic-labs/honcho
 *
 * Local deployment at http://localhost:8000
 *
 * Based on OpenAPI spec analysis (2026-04-17)
 */
import type { Message, Peer, Session, SearchResult } from './types.js';
export interface HonchoClientConfig {
    baseUrl?: string;
    workspace?: string;
    apiKey?: string;
}
export interface RepresentationResponse {
    content: string | null;
    conclusions?: Array<{
        content: string;
        weight: number;
    }>;
}
export interface ChatResponse {
    content: string | null;
}
interface ContextResponse {
    content?: string;
    summary?: string;
}
export declare class HonchoClient {
    private baseUrl;
    private workspace;
    private apiKey?;
    constructor(baseUrl: string, workspace: string, apiKey?: string);
    private getHeaders;
    ensureWorkspace(): Promise<boolean>;
    peer(peerName: string): Promise<Peer | null>;
    listPeers(): Promise<Peer[]>;
    session(sessionName: string, _peerIds?: string[]): Promise<Session | null>;
    listSessions(): Promise<Session[]>;
    addMessages(sessionName: string, messages: Array<{
        content: string;
        peerId: string;
    }>): Promise<boolean>;
    /**
     * Get messages via Session Context endpoint
     * Note: Honcho doesn't have a direct GET /messages endpoint
     * Messages are retrieved as part of session context
     */
    getMessages(sessionName: string, limit?: number): Promise<Message[]>;
    search(peerName: string, query: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Ask a peer (uses dialectic reasoning)
     * POST /v3/workspaces/{workspace_id}/peers/{peer_id}/chat
     */
    ask(peerName: string, question: string, depth?: 'quick' | 'medium' | 'deep'): Promise<string>;
    /**
     * Get peer representation (summary of what Honcho knows about the peer)
     * POST /v3/workspaces/{workspace_id}/peers/{peer_id}/representation
     */
    getUserModel(peerName: string): Promise<RepresentationResponse | null>;
    getSessionContext(sessionName: string, options?: {
        summary?: boolean;
        tokens?: number;
    }): Promise<ContextResponse>;
    healthCheck(): Promise<boolean>;
    learnFromUser(userId: string, message: string): Promise<boolean>;
    getQueueStatus(): Promise<{
        pending: number;
        completed: number;
    } | null>;
    getTraces(skillSlug?: string): Promise<unknown[]>;
}
export declare function createHonchoClient(config?: HonchoClientConfig): HonchoClient;
export {};
//# sourceMappingURL=honcho-client.d.ts.map