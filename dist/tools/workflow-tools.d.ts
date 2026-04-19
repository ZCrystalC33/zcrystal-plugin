/**
 * Workflow, Adapter, Replay Tools
 */
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { PluginState } from '../index.js';
/** Minimal skill representation used for indexing */
export interface IndexedSkill {
    skillId: string;
    content: string;
    metadata?: Record<string, unknown>;
}
/** Replay case shape returned by ReplayRunner */
export interface ReplayCase {
    id: string;
}
export declare function registerWorkflowTools(api: OpenClawPluginApi, state: PluginState): void;
//# sourceMappingURL=workflow-tools.d.ts.map