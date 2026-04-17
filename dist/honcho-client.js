export class HonchoClient {
    baseUrl;
    workspace;
    apiKey;
    constructor(baseUrl, workspace, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.workspace = workspace;
        this.apiKey = apiKey;
    }
    // ============================================================
    // Auth Helper
    // ============================================================
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
    // ============================================================
    // Workspace Management
    // ============================================================
    async ensureWorkspace() {
        try {
            // Try to get workspace first
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}`, {
                headers: this.getHeaders(),
            });
            if (resp.ok)
                return true;
            // Create workspace if doesn't exist
            const createResp = await fetch(`${this.baseUrl}/v3/workspaces`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    id: this.workspace,
                    metadata: { created_by: 'zcrystal-plugin' }
                }),
            });
            return createResp.ok || createResp.status === 201;
        }
        catch {
            return false;
        }
    }
    // ============================================================
    // Peer Management
    // ============================================================
    async peer(peerName) {
        try {
            await this.ensureWorkspace();
            // Try to get existing peer
            const getResp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}`, { headers: this.getHeaders() });
            if (getResp.ok) {
                const data = await getResp.json();
                return { id: data.id, name: data.name, metadata: data.metadata };
            }
            // Create new peer
            const createResp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ id: peerName, metadata: {} }),
            });
            if (createResp.ok || createResp.status === 201) {
                const data = await createResp.json();
                return { id: data.id, name: data.name, metadata: data.metadata };
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async listPeers() {
        try {
            // Correct: POST /v3/workspaces/{workspace_id}/peers/list
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers/list`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({}), // Empty body for list
            });
            if (resp.ok) {
                const data = await resp.json();
                return (data.items || []).map((p) => ({
                    id: p.id,
                    name: p.name,
                    metadata: p.metadata,
                }));
            }
            return [];
        }
        catch {
            return [];
        }
    }
    // ============================================================
    // Session Management
    // ============================================================
    async session(sessionName, _peerIds = []) {
        try {
            await this.ensureWorkspace();
            // Try to get existing session first
            const getResp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}`, { headers: this.getHeaders() });
            if (getResp.ok) {
                const data = await getResp.json();
                return { id: data.id, name: data.name };
            }
            // Create new session
            const createResp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ id: sessionName }),
            });
            if (createResp.ok || createResp.status === 201) {
                const data = await createResp.json();
                return { id: data.id, name: data.name };
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async listSessions() {
        try {
            // POST /v3/workspaces/{workspace_id}/sessions/list
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/list`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({}),
            });
            if (resp.ok) {
                const data = await resp.json();
                return (data.items || []).map((s) => ({
                    id: s.id,
                    name: s.name,
                }));
            }
            return [];
        }
        catch {
            return [];
        }
    }
    // ============================================================
    // Messages - Write via POST, Read via Session Context
    // ============================================================
    async addMessages(sessionName, messages) {
        try {
            await this.ensureWorkspace();
            // Convert to snake_case for API
            const apiMessages = messages.map(m => ({
                content: m.content,
                peer_id: m.peerId,
            }));
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ messages: apiMessages }),
            });
            return resp.ok || resp.status === 201;
        }
        catch {
            return false;
        }
    }
    /**
     * Get messages via Session Context endpoint
     * Note: Honcho doesn't have a direct GET /messages endpoint
     * Messages are retrieved as part of session context
     */
    async getMessages(sessionName, limit) {
        try {
            const params = new URLSearchParams();
            if (limit)
                params.set('limit', String(limit));
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/context?${params}`, { headers: this.getHeaders() });
            if (resp.ok) {
                const data = await resp.json();
                // Context returns content which may include message summaries
                if (data.content) {
                    return [{ id: 'context', content: data.content, peerId: 'system', timestamp: Date.now() }];
                }
            }
            return [];
        }
        catch {
            return [];
        }
    }
    // ============================================================
    // Semantic Search
    // ============================================================
    async search(peerName, query, limit = 10) {
        try {
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/search`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ query, limit }),
            });
            if (resp.ok) {
                const data = await resp.json();
                return data.results || [];
            }
            return [];
        }
        catch {
            return [];
        }
    }
    // ============================================================
    // User Modeling - Representation & Chat
    // ============================================================
    /**
     * Ask a peer (uses dialectic reasoning)
     * POST /v3/workspaces/{workspace_id}/peers/{peer_id}/chat
     */
    async ask(peerName, question, depth = 'quick') {
        try {
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/chat`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ query: question, depth }),
            });
            if (resp.ok) {
                const data = await resp.json();
                return data.content || '';
            }
            // Log error for debugging
            const errorText = await resp.text();
            console.error(`[HonchoClient] ask() failed: ${resp.status} - ${errorText}`);
            return '';
        }
        catch (err) {
            console.error(`[HonchoClient] ask() exception:`, err);
            return '';
        }
    }
    /**
     * Get peer representation (summary of what Honcho knows about the peer)
     * POST /v3/workspaces/{workspace_id}/peers/{peer_id}/representation
     */
    async getUserModel(peerName) {
        try {
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/representation`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({}), // Empty body gets full representation
            });
            if (resp.ok) {
                return await resp.json();
            }
            const errorText = await resp.text();
            console.error(`[HonchoClient] getUserModel() failed: ${resp.status} - ${errorText}`);
            return null;
        }
        catch (err) {
            console.error(`[HonchoClient] getUserModel() exception:`, err);
            return null;
        }
    }
    // ============================================================
    // Session Context
    // ============================================================
    async getSessionContext(sessionName, options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.summary !== undefined)
                params.set('summary', String(options.summary));
            if (options.tokens)
                params.set('tokens', String(options.tokens));
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/context?${params}`, { headers: this.getHeaders() });
            if (resp.ok) {
                return await resp.json();
            }
            return { content: '' };
        }
        catch {
            return { content: '' };
        }
    }
    // ============================================================
    // Health Check
    // ============================================================
    async healthCheck() {
        try {
            const resp = await fetch(`${this.baseUrl}/health`);
            return resp.ok;
        }
        catch {
            return false;
        }
    }
    // ============================================================
    // Queue Status (for checking if deriver is working)
    // ============================================================
    async getQueueStatus() {
        try {
            const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}/queue/status`, { headers: this.getHeaders() });
            if (resp.ok) {
                const data = await resp.json();
                return { pending: data.pending || 0, completed: data.completed || 0 };
            }
            return null;
        }
        catch {
            return null;
        }
    }
}
export function createHonchoClient(config = {}) {
    return new HonchoClient(config.baseUrl || 'http://localhost:8000', config.workspace || 'openclaw', config.apiKey);
}
//# sourceMappingURL=honcho-client.js.map