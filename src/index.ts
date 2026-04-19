/**
 * ZCrystal Plugin for OpenClaw (Powered by ZCrystal_evo)
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

const SearchParams = Type.Object({
  query: Type.String(),
  limit: Type.Optional(Type.Number()),
});

const AskUserParams = Type.Object({
  question: Type.String(),
  depth: Type.Optional(Type.Union([Type.Literal('quick'), Type.Literal('thorough')])),
});

export default definePluginEntry({
  id: 'zcrystal',
  name: 'ZCrystal',
  description: 'Honcho + Skills + Self-Evolution for OpenClaw (Powered by ZCrystal_evo)',
  
  register(api: OpenClawPluginApi) {
    console.log('[ZCrystal] Initializing with ZCrystal_evo...');
    
    const router = new UnifiedApiRouter();
    const honcho = createHonchoClient({ baseUrl: 'http://localhost:8000', workspace: 'openclaw' });
    const skillManager = createSkillManager('~/.openclaw/skills');
    
    const diskStore = new DiskStore('/tmp/zcrystal-stores');
    const evolutionStore = new EvolutionStore(diskStore);
    const traceStore = new TraceStore(diskStore);
    const selfEvolution = new SelfEvolutionEngine(evolutionStore, traceStore);
    
    state = { router, honcho, skillManager, selfEvolution };
    
    // Core tools
    api.registerTool({
      name: 'zcrystal_search',
      label: 'ZCrystal Search',
      description: 'Search conversation history',
      parameters: SearchParams,
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
      parameters: AskUserParams,
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
      description: 'Get evolution history',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.getEvolutionStatus();
        if (result.success) return okResult(JSON.stringify(result.data, null, 2), result.data);
        return errResult('Evolution status unavailable');
      },
    });

    // Optional tools
    api.registerTool({
      name: 'zcrystal_evolve',
      label: 'ZCrystal Evolve',
      description: 'Trigger self-evolution',
      parameters: Type.Object({ slug: Type.Optional(Type.String()) }),
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
      description: 'Record execution trace',
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

    // ZCrystal_evo advanced tools
    api.registerTool({
      name: 'zcrystal_task_create',
      label: 'ZCrystal Task Create',
      description: 'Create a new task',
      parameters: Type.Object({
        task_type: Type.String(), trigger: Type.String(), user_id: Type.String(), repr: Type.String(),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.createTask(params);
        if (result.success) return okResult('Task created', result.data);
        return errResult(result.error ?? 'Task creation failed');
      },
    }, { optional: true });

    api.registerTool({
      name: 'zcrystal_memory_store',
      label: 'ZCrystal Memory Store',
      description: 'Store data in memory layers',
      parameters: Type.Object({
        layer: Type.String(), key: Type.String(), value: Type.Any(), ttl: Type.Optional(Type.Number()),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memoryStoreData(params.layer, params.key, params.value, params.ttl);
        if (result.success) return okResult('Memory stored');
        return errResult(result.error ?? 'Memory store failed');
      },
    }, { optional: true });

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
    }, { optional: true });

    api.registerTool({
      name: 'zcrystal_model_pick',
      label: 'ZCrystal Model Pick',
      description: 'Pick best model',
      parameters: Type.Object({ taskType: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.pickModel(params.taskType);
        if (result.success) return okResult('Model selected', result.data);
        return errResult(result.error ?? 'Model pick failed');
      },
    }, { optional: true });

    // Commands
    api.registerCommand({
      name: 'zcrystal_compact',
      description: 'Compact and trigger self-evolution',
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
        return { text: `ZCrystal: ${health.success ? 'Healthy' : 'Unhealthy'}, Skills: ${skills.success ? JSON.stringify(skills.data) : 'N/A'}` };
      },
    });

    // Hooks
    api.registerHook('message:received', async (event: unknown) => {
      if (!state) return;
      const msg = (event as { context?: { content?: string } })?.context?.content || '';
      if (msg) await state.router.memoryStoreData('L3', 'last_message', msg);
    }, { name: 'zcrystal:msg_received' });

    api.registerHook('message:sent', async (event: unknown) => {
      if (!state) return;
      const content = (event as { content?: string })?.content;
      if (content) await state.router.memoryStoreData('L2', 'last_ai_response', content);
    }, { name: 'zcrystal:msg_sent' });

    console.log('[ZCrystal] ZCrystal_evo integration complete');
  },
});
