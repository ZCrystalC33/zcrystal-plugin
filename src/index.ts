/**
 * ZCrystal Plugin for OpenClaw (Powered by ZCrystal_evo)
 * 
 * Unified plugin combining:
 * - Original zcrystal features (Honcho integration, Skills, Self-Evolution)
 * - ZCrystal_evo advanced features (TaskLifecycle, MemoryLayers, ModelRouter)
 * - FTS5 search integration
 */

import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';

import {
  UnifiedApiRouter,
  createHonchoClient,
  createSkillManager,
  SelfEvolutionEngine,
  DiskStore,
  EvolutionStore,
  TraceStore,
  type Skill,
} from '@zcrystal/evo';

// ============================================================================
// Plugin State
// ============================================================================

interface PluginState {
  router: UnifiedApiRouter;
  honcho: ReturnType<typeof createHonchoClient>;
  skillManager: ReturnType<typeof createSkillManager>;
  selfEvolution: SelfEvolutionEngine;
}

let state: PluginState | null = null;

function okResult(text: string, details?: unknown) {
  return { content: [{ type: 'text' as const, text }], details: details ?? {} };
}

function errResult(text: string) {
  return { content: [{ type: 'text' as const, text }], details: {}, isError: true };
}

// ============================================================================
// FTS5 MCP HTTP Client
// ============================================================================

const FTS5_MCP_URL = 'http://localhost:18795/mcp';

async function fts5Search(query: string, limit = 20) {
  try {
    const response = await fetch(FTS5_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'fts5_search', arguments: { query, limit } },
        id: 2
      })
    });
    const data = await response.json() as { result?: { content?: Array<{ text: string }> } };
    if (data.result?.content?.[0]?.text) {
      return { success: true, data: data.result.content[0].text };
    }
    return { success: false, error: 'FTS5 search failed' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function fts5Stats() {
  try {
    const response = await fetch(FTS5_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'fts5_stats', arguments: {} },
        id: 3
      })
    });
    const data = await response.json() as { result?: { content?: Array<{ text: string }> } };
    if (data.result?.content?.[0]?.text) {
      return { success: true, data: data.result.content[0].text };
    }
    return { success: false, error: 'FTS5 stats failed' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ============================================================================
// Plugin Entry
// ============================================================================

export default definePluginEntry({
  id: 'zcrystal',
  name: 'ZCrystal',
  description: 'Honcho + Skills + Self-Evolution + TaskLifecycle + MemoryLayers + FTS5 (Powered by ZCrystal_evo)',
  
  register(api: OpenClawPluginApi) {
    console.log('[ZCrystal] Initializing with ZCrystal_evo...');
    
    const router = new UnifiedApiRouter();
    const honcho = createHonchoClient({ baseUrl: 'http://localhost:8000', workspace: 'openclaw' });
    const skillManager = createSkillManager('/home/snow/.openclaw/skills');
    
    const diskStore = new DiskStore('/tmp/zcrystal-stores');
    const evolutionStore = new EvolutionStore(diskStore);
    const traceStore = new TraceStore(diskStore);
    const selfEvolution = new SelfEvolutionEngine(evolutionStore, traceStore);
    
    state = { router, honcho, skillManager, selfEvolution };
    
    // =====================================================================
    // Core Tools (Original ZCrystal + ZCrystal_evo)
    // =====================================================================
    
    api.registerTool({
      name: 'zcrystal_evo_health',
      label: 'ZCrystal Evo Health',
      description: 'Health check for ZCrystal_evo core',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.healthCheck();
        if (result.success) return okResult('ZCrystal_evo is healthy', result.data);
        return errResult(result.error ?? 'Health check failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_search',
      label: 'ZCrystal Search',
      description: 'Search conversation history using Honcho',
      parameters: Type.Object({ query: Type.String(), limit: Type.Optional(Type.Number()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.honcho.search(params.query, params.limit || 10);
        if (result.ok) return okResult(JSON.stringify(result.data, null, 2), { results: result.data });
        return errResult('Search failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_ask_user',
      label: 'ZCrystal Ask User',
      description: 'Ask Honcho about user preferences',
      parameters: Type.Object({ question: Type.String(), depth: Type.Optional(Type.String()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.honcho.ask('user', params.question, params.depth || 'quick');
        if (result.ok) return okResult(result.data, { question: params.question });
        return errResult('Ask failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_skills',
      label: 'ZCrystal Skills',
      description: 'List all available skills',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillManager.getSkills();
        const skills = result.ok ? result.data : [];
        const text = skills.length === 0 ? 'No skills discovered' 
          : skills.map((s: Skill) => `- ${s.name} (${s.slug}): ${s.description}`).join('\n');
        return okResult(text, { count: skills.length });
      },
    });

    api.registerTool({
      name: 'zcrystal_skill_read',
      label: 'ZCrystal Skill Read',
      description: 'Read content of a skill',
      parameters: Type.Object({ slug: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const skillResult = await state.skillManager.getSkill(params.slug);
        if (!skillResult.ok || !skillResult.data) return errResult('Skill not found');
        const contentResult = await state.skillManager.readContent(skillResult.data);
        if (!contentResult.ok) return errResult('Failed to read skill');
        return okResult(contentResult.data, { slug: params.slug });
      },
    });

    api.registerTool({
      name: 'zcrystal_evolution_status',
      label: 'ZCrystal Evolution Status',
      description: 'Get evolution history and status',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.getEvolutionStatus();
        if (result.success) return okResult(JSON.stringify(result.data, null, 2), result.data);
        return errResult('Evolution status unavailable');
      },
    });

    api.registerTool({
      name: 'zcrystal_evolve',
      label: 'ZCrystal Evolve',
      description: 'Trigger self-evolution for a skill or all skills',
      parameters: Type.Object({ slug: Type.Optional(Type.String()), iterations: Type.Optional(Type.Number()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.startEvolution(params.slug);
        if (result.success) return okResult('Evolution started', result.data);
        return errResult(result.error ?? 'Evolution failed');
      },
    }, { optional: true });

    api.registerTool({
      name: 'zcrystal_record_trace',
      label: 'ZCrystal Record Trace',
      description: 'Record execution trace for self-evolution',
      parameters: Type.Object({
        skillSlug: Type.String(), input: Type.String(), output: Type.String(),
        success: Type.Boolean(), duration: Type.Number(),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        console.log('[ZCrystal] Trace recorded:', params);
        return okResult('Trace recorded', { skillSlug: params.skillSlug });
      },
    }, { optional: true });

    // =====================================================================
    // ZCrystal_evo Advanced Tools
    // =====================================================================
    
    api.registerTool({
      name: 'zcrystal_task_create',
      label: 'ZCrystal Task Create',
      description: 'Create a new task using TaskLifecycle',
      parameters: Type.Object({
        task_type: Type.String(), 
        trigger: Type.Union([Type.Literal('telegram'), Type.Literal('signal'), Type.Literal('webhook'), Type.Literal('cron'), Type.Literal('manual')]),
        user_id: Type.String(), 
        repr: Type.String(),
        input: Type.Optional(Type.Record(Type.String(), Type.Any())),
        max_retries: Type.Optional(Type.Number()),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.createTask({
          task_type: params.task_type,
          trigger: params.trigger,
          user_id: params.user_id,
          repr: params.repr,
          input: params.input || {},
          max_retries: params.max_retries,
        });
        if (result.success) return okResult('Task created', result.data);
        return errResult(result.error ?? 'Task creation failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_task_get',
      label: 'ZCrystal Task Get',
      description: 'Get task by ID',
      parameters: Type.Object({ taskId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.getTask(params.taskId);
        if (result.success) return okResult('Task retrieved', result.data);
        return errResult(result.error ?? 'Task not found');
      },
    });

    api.registerTool({
      name: 'zcrystal_memory_store',
      label: 'ZCrystal Memory Store',
      description: 'Store data in memory layers (L1-L5)',
      parameters: Type.Object({
        layer: Type.String(), key: Type.String(), value: Type.Any(), ttl: Type.Optional(Type.Number()),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memoryStoreData(params.layer, params.key, params.value, params.ttl);
        if (result.success) return okResult('Memory stored in ' + params.layer);
        return errResult(result.error ?? 'Memory store failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_memory_load',
      label: 'ZCrystal Memory Load',
      description: 'Load from memory layers',
      parameters: Type.Object({ layer: Type.String(), key: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memoryLoad(params.layer, params.key);
        if (result.success) return okResult('Memory loaded', { value: result.data });
        return errResult(result.error ?? 'Memory not found');
      },
    });

    api.registerTool({
      name: 'zcrystal_model_pick',
      label: 'ZCrystal Model Pick',
      description: 'Pick best model for task type',
      parameters: Type.Object({ taskType: Type.String(), constraints: Type.Optional(Type.Record(Type.String(), Type.Any())) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.pickModel(params.taskType, params.constraints);
        if (result.success) return okResult('Model selected', result.data);
        return errResult(result.error ?? 'Model pick failed');
      },
    });

    // =====================================================================
    // FTS5 Tools
    // =====================================================================
    
    api.registerTool({
      name: 'zcrystal_fts5_search',
      label: 'ZCrystal FTS5 Search',
      description: 'Search conversation history using FTS5 full-text search',
      parameters: Type.Object({ query: Type.String(), limit: Type.Optional(Type.Number()) }),
      async execute(_id, params) {
        const result = await fts5Search(params.query, params.limit || 20);
        if (result.success) return okResult(result.data as string);
        return errResult(result.error ?? 'FTS5 search failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_fts5_stats',
      label: 'ZCrystal FTS5 Stats',
      description: 'Get FTS5 database statistics',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        const result = await fts5Stats();
        if (result.success) return okResult(result.data as string);
        return errResult(result.error ?? 'FTS5 stats failed');
      },
    });

    // =====================================================================
    // Commands
    // =====================================================================
    
    api.registerCommand({
      name: 'zcrystal_compact',
      description: 'Compact conversation and trigger self-evolution',
      async handler() {
        if (!state) return { text: 'Plugin not initialized' };
        const result = await state.router.startEvolution();
        if (result.success) return { text: `Self-evolution complete: ${JSON.stringify(result.data)}` };
        return { text: 'Self-evolution failed: ' + result.error };
      },
    });

    api.registerCommand({
      name: 'zcrystal_learn',
      description: 'Teach ZCrystal your preferences',
      async handler({ args }) {
        if (!state) return { text: 'Plugin not initialized' };
        if (!args) return { text: 'Usage: /learn <preference>' };
        await state.router.memoryStoreData('L3', 'user_preference', args);
        return { text: `✅ Learned: "${args}"` };
      },
    });

    api.registerCommand({
      name: 'zcrystal_profile',
      description: 'View ZCrystal profile',
      async handler() {
        if (!state) return { text: 'Plugin not initialized' };
        const health = await state.router.healthCheck();
        const skills = await state.router.listSkills();
        const evo = await state.router.getEvolutionStatus();
        const fts5 = await fts5Stats();
        return { text: `ZCrystal Profile:
- Health: ${health.success ? '✅ Healthy' : '❌ Unhealthy'}
- Skills: ${skills.success ? skills.data?.skills?.length || 0 : 'N/A'}
- Evolution: ${evo.success ? (evo.data?.running ? '🔄 Running' : '⏸️ Idle') : 'N/A'}
- FTS5: ${fts5.success ? '✅ Available' : '❌ Unavailable'}` };
      },
    });

    // =====================================================================
    // Hooks
    // =====================================================================
    
    api.registerHook('message:received', async (event: unknown) => {
      if (!state) return;
      const msg = (event as { context?: { content?: string } })?.context?.content || '';
      if (msg) {
        await state.router.memoryStoreData('L3', 'last_message', msg);
      }
    }, { name: 'zcrystal:msg_received' });

    api.registerHook('message:sent', async (event: unknown) => {
      if (!state) return;
      const content = (event as { content?: string })?.content;
      if (content) await state.router.memoryStoreData('L2', 'last_ai_response', content);
    }, { name: 'zcrystal:msg_sent' });

    console.log('[ZCrystal] ZCrystal_evo integration complete. Tools registered: 18');
  },
});
