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
  apiKey?: string;  // JWT token for auth
}

interface ApiMessage {
  role?: string;
  content: string;
  peer_id?: string;
  metadata?: Record<string, unknown>;
}

export interface RepresentationResponse {
  content: string | null;
  conclusions?: Array<{ content: string; weight: number }>;
}

export interface ChatResponse {
  content: string | null;
}

interface SearchResponse {
  results?: SearchResult[];
}

interface ContextResponse {
  content?: string;
  summary?: string;
}

interface PeerResponse {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

interface SessionResponse {
  id: string;
  name?: string;
}

export class HonchoClient {
  private baseUrl: string;
  private workspace: string;
  private apiKey?: string;

  constructor(baseUrl: string, workspace: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.workspace = workspace;
    this.apiKey = apiKey;
  }

  // ============================================================
  // Auth Helper
  // ============================================================
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
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
  async ensureWorkspace(): Promise<boolean> {
    try {
      // Try to get workspace first
      const resp = await fetch(`${this.baseUrl}/v3/workspaces/${this.workspace}`, {
        headers: this.getHeaders(),
      });
      if (resp.ok) return true;

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
    } catch {
      return false;
    }
  }

  // ============================================================
  // Peer Management
  // ============================================================
  async peer(peerName: string): Promise<Peer | null> {
    try {
      await this.ensureWorkspace();

      // Try to get existing peer
      const getResp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}`,
        { headers: this.getHeaders() }
      );

      if (getResp.ok) {
        const data = await getResp.json() as PeerResponse;
        return { id: data.id, name: data.name, metadata: data.metadata };
      }

      // Create new peer
      const createResp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ id: peerName, metadata: {} }),
        }
      );

      if (createResp.ok || createResp.status === 201) {
        const data = await createResp.json() as PeerResponse;
        return { id: data.id, name: data.name, metadata: data.metadata };
      }

      return null;
    } catch {
      return null;
    }
  }

  async listPeers(): Promise<Peer[]> {
    try {
      // Correct: POST /v3/workspaces/{workspace_id}/peers/list
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers/list`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({}),  // Empty body for list
        }
      );

      if (resp.ok) {
        const data = await resp.json() as { items?: PeerResponse[] };
        return (data.items || []).map((p) => ({
          id: p.id,
          name: p.name,
          metadata: p.metadata,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  // ============================================================
  // Session Management
  // ============================================================
  async session(sessionName: string, _peerIds: string[] = []): Promise<Session | null> {
    try {
      await this.ensureWorkspace();

      // Try to get existing session first
      const getResp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}`,
        { headers: this.getHeaders() }
      );

      if (getResp.ok) {
        const data = await getResp.json() as SessionResponse;
        return { id: data.id, name: data.name };
      }

      // Create new session
      const createResp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ id: sessionName }),
        }
      );

      if (createResp.ok || createResp.status === 201) {
        const data = await createResp.json() as SessionResponse;
        return { id: data.id, name: data.name };
      }

      return null;
    } catch {
      return null;
    }
  }

  async listSessions(): Promise<Session[]> {
    try {
      // POST /v3/workspaces/{workspace_id}/sessions/list
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/list`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({}),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as { items?: SessionResponse[] };
        return (data.items || []).map((s) => ({
          id: s.id,
          name: s.name,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  // ============================================================
  // Messages - Write via POST, Read via Session Context
  // ============================================================
  async addMessages(sessionName: string, messages: Array<{ content: string; peerId: string }>): Promise<boolean> {
    try {
      await this.ensureWorkspace();

      // Convert to snake_case for API
      const apiMessages: ApiMessage[] = messages.map(m => ({
        content: m.content,
        peer_id: m.peerId,
      }));

      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/messages`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ messages: apiMessages }),
        }
      );

      return resp.ok || resp.status === 201;
    } catch {
      return false;
    }
  }

  /**
   * Get messages via Session Context endpoint
   * Note: Honcho doesn't have a direct GET /messages endpoint
   * Messages are retrieved as part of session context
   */
  async getMessages(sessionName: string, limit?: number): Promise<Message[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));

      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/context?${params}`,
        { headers: this.getHeaders() }
      );

      if (resp.ok) {
        const data = await resp.json() as ContextResponse;
        // Context returns content which may include message summaries
        if (data.content) {
          return [{ id: 'context', content: data.content, peerId: 'system', timestamp: Date.now() }];
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  // ============================================================
  // Semantic Search
  // ============================================================
  async search(peerName: string, query: string, limit = 10): Promise<SearchResult[]> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/search`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ query, limit }),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as SearchResponse;
        return data.results || [];
      }
      return [];
    } catch {
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
  async ask(peerName: string, question: string, depth: 'quick' | 'medium' | 'deep' = 'quick'): Promise<string> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/chat`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ query: question, depth }),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as ChatResponse;
        return data.content || '';
      }

      // Log error for debugging
      const errorText = await resp.text();
      console.error(`[HonchoClient] ask() failed: ${resp.status} - ${errorText}`);
      return '';
    } catch (err) {
      console.error(`[HonchoClient] ask() exception:`, err);
      return '';
    }
  }

  /**
   * Get peer representation (summary of what Honcho knows about the peer)
   * POST /v3/workspaces/{workspace_id}/peers/{peer_id}/representation
   */
  async getUserModel(peerName: string): Promise<RepresentationResponse | null> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/peers/${peerName}/representation`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({}),  // Empty body gets full representation
        }
      );

      if (resp.ok) {
        return await resp.json() as RepresentationResponse;
      }

      const errorText = await resp.text();
      console.error(`[HonchoClient] getUserModel() failed: ${resp.status} - ${errorText}`);
      return null;
    } catch (err) {
      console.error(`[HonchoClient] getUserModel() exception:`, err);
      return null;
    }
  }

  // ============================================================
  // Session Context
  // ============================================================
  async getSessionContext(sessionName: string, options: { summary?: boolean; tokens?: number } = {}): Promise<ContextResponse> {
    try {
      const params = new URLSearchParams();
      if (options.summary !== undefined) params.set('summary', String(options.summary));
      if (options.tokens) params.set('tokens', String(options.tokens));

      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/sessions/${sessionName}/context?${params}`,
        { headers: this.getHeaders() }
      );

      if (resp.ok) {
        return await resp.json() as ContextResponse;
      }
      return { content: '' };
    } catch {
      return { content: '' };
    }
  }

  // ============================================================
  // Health Check
  // ============================================================
  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/health`);
      return resp.ok;
    } catch {
      return false;
    }
  }

  // ============================================================
  // Queue Status (for checking if deriver is working)
  // ============================================================
  async getQueueStatus(): Promise<{ pending: number; completed: number } | null> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/v3/workspaces/${this.workspace}/queue/status`,
        { headers: this.getHeaders() }
      );

      if (resp.ok) {
        const data = await resp.json() as { pending?: number; completed?: number };
        return { pending: data.pending || 0, completed: data.completed || 0 };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export function createHonchoClient(config: HonchoClientConfig = {}): HonchoClient {
  return new HonchoClient(
    config.baseUrl || 'http://localhost:8000',
    config.workspace || 'openclaw',
    config.apiKey
  );
}
