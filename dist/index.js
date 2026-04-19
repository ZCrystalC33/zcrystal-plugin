/**
 * ZCrystal Plugin for OpenClaw (Powered by ZCrystal_evo)
 *
 * Unified plugin combining:
 * - Original zcrystal features (Honcho integration, Skills, Self-Evolution)
 * - ZCrystal_evo advanced features (TaskLifecycle, MemoryLayers, ModelRouter)
 */
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { Type } from '@sinclair/typebox';
import { UnifiedApiRouter, createHonchoClient, createSkillManager, SelfEvolutionEngine, DiskStore, EvolutionStore, TraceStore, } from '@zcrystal/evo';
let state = null;
function okResult(text, details) {
    return { content: [{ type: 'text', text }], details: details ?? {} };
}
function errResult(text) {
    return { content: [{ type: 'text', text }], details: {}, isError: true };
}
// ============================================================================
// Schemas
// ============================================================================
const SearchParams = Type.Object({
    query: Type.String(),
    limit: Type.Optional(Type.Number()),
});
const AskUserParams = Type.Object({
    question: Type.String(),
    depth: Type.Optional(Type.Union([Type.Literal('quick'), Type.Literal('thorough')])),
});
const TaskGetParams = Type.Object({
    taskId: Type.String(),
});
// ============================================================================
// Plugin Entry
// ============================================================================
export default definePluginEntry({
    id: 'zcrystal',
    name: 'ZCrystal',
    description: 'Honcho + Skills + Self-Evolution + TaskLifecycle + MemoryLayers (Powered by ZCrystal_evo)',
    register(api) {
        console.log('[ZCrystal] Initializing with ZCrystal_evo...');
        const router = new UnifiedApiRouter();
        const honcho = createHonchoClient({ baseUrl: 'http://localhost:8000', workspace: 'openclaw' });
        const skillManager = createSkillManager('~/.openclaw/skills');
        const diskStore = new DiskStore('/tmp/zcrystal-stores');
        const evolutionStore = new EvolutionStore(diskStore);
        const traceStore = new TraceStore(diskStore);
        const selfEvolution = new SelfEvolutionEngine(evolutionStore, traceStore);
        state = { router, honcho, skillManager, selfEvolution };
        // =====================================================================
        // Core Tools (Original ZCrystal)
        // =====================================================================
        api.registerTool({
            name: 'zcrystal_search',
            label: 'ZCrystal Search',
            description: 'Search conversation history using Honcho',
            parameters: SearchParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.honcho.search(params.query, params.limit || 10);
                if (result.ok)
                    return okResult(JSON.stringify(result.data, null, 2), { results: result.data });
                return errResult('Search failed');
            },
        });
        api.registerTool({
            name: 'zcrystal_ask_user',
            label: 'ZCrystal Ask User',
            description: 'Ask Honcho about user preferences',
            parameters: AskUserParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.honcho.ask('user', params.question, params.depth || 'quick');
                if (result.ok)
                    return okResult(result.data, { question: params.question });
                return errResult('Ask failed');
            },
        });
        api.registerTool({
            name: 'zcrystal_skills',
            label: 'ZCrystal Skills',
            description: 'List all available skills',
            parameters: Type.Object({}),
            async execute(_id, _params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.skillManager.getSkills();
                const skills = result.ok ? result.data : [];
                const text = skills.length === 0 ? 'No skills discovered'
                    : skills.map((s) => `- ${s.name} (${s.slug}): ${s.description}`).join('\n');
                return okResult(text, { count: skills.length });
            },
        });
        api.registerTool({
            name: 'zcrystal_skill_read',
            label: 'ZCrystal Skill Read',
            description: 'Read content of a skill',
            parameters: Type.Object({ slug: Type.String() }),
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const skillResult = await state.skillManager.getSkill(params.slug);
                if (!skillResult.ok || !skillResult.data)
                    return errResult('Skill not found');
                const contentResult = await state.skillManager.readContent(skillResult.data);
                if (!contentResult.ok)
                    return errResult('Failed to read skill');
                return okResult(contentResult.data, { slug: params.slug });
            },
        });
        api.registerTool({
            name: 'zcrystal_evolution_status',
            label: 'ZCrystal Evolution Status',
            description: 'Get evolution history and status',
            parameters: Type.Object({}),
            async execute(_id, _params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.getEvolutionStatus();
                if (result.success)
                    return okResult(JSON.stringify(result.data, null, 2), result.data);
                return errResult('Evolution status unavailable');
            },
        });
        api.registerTool({
            name: 'zcrystal_evolve',
            label: 'ZCrystal Evolve',
            description: 'Trigger self-evolution for a skill or all skills',
            parameters: Type.Object({ slug: Type.Optional(Type.String()), iterations: Type.Optional(Type.Number()) }),
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.startEvolution(params.slug);
                if (result.success)
                    return okResult('Evolution started', result.data);
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
                if (!state)
                    return errResult('Plugin not initialized');
                console.log('[ZCrystal] Trace recorded:', params);
                return okResult('Trace recorded', { skillSlug: params.skillSlug });
            },
        }, { optional: true });
        // =====================================================================
        // ZCrystal_evo Advanced Tools
        // =====================================================================
        api.registerTool({
            name: 'zcrystal_evo_health',
            label: 'ZCrystal Evo Health',
            description: 'Health check for ZCrystal_evo core',
            parameters: Type.Object({}),
            async execute(_id, _params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.healthCheck();
                if (result.success)
                    return okResult('ZCrystal_evo is healthy', result.data);
                return errResult(result.error ?? 'Health check failed');
            },
        });
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
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.createTask({
                    task_type: params.task_type,
                    trigger: params.trigger,
                    user_id: params.user_id,
                    repr: params.repr,
                    input: params.input || {},
                    max_retries: params.max_retries,
                });
                if (result.success)
                    return okResult('Task created', result.data);
                return errResult(result.error ?? 'Task creation failed');
            },
        });
        api.registerTool({
            name: 'zcrystal_task_get',
            label: 'ZCrystal Task Get',
            description: 'Get task by ID',
            parameters: TaskGetParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.getTask(params.taskId);
                if (result.success)
                    return okResult('Task retrieved', result.data);
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
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.memoryStoreData(params.layer, params.key, params.value, params.ttl);
                if (result.success)
                    return okResult('Memory stored in ' + params.layer);
                return errResult(result.error ?? 'Memory store failed');
            },
        });
        api.registerTool({
            name: 'zcrystal_memory_load',
            label: 'ZCrystal Memory Load',
            description: 'Load from memory layers',
            parameters: Type.Object({ layer: Type.String(), key: Type.String() }),
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.memoryLoad(params.layer, params.key);
                if (result.success)
                    return okResult('Memory loaded', { value: result.data });
                return errResult(result.error ?? 'Memory not found');
            },
        });
        api.registerTool({
            name: 'zcrystal_model_pick',
            label: 'ZCrystal Model Pick',
            description: 'Pick best model for task type',
            parameters: Type.Object({ taskType: Type.String(), constraints: Type.Optional(Type.Record(Type.String(), Type.Any())) }),
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const result = await state.router.pickModel(params.taskType, params.constraints);
                if (result.success)
                    return okResult('Model selected', result.data);
                return errResult(result.error ?? 'Model pick failed');
            },
        });
        // =====================================================================
        // Commands
        // =====================================================================
        api.registerCommand({
            name: 'zcrystal_compact',
            description: 'Compact conversation and trigger self-evolution',
            async handler() {
                if (!state)
                    return { text: 'Plugin not initialized' };
                const result = await state.router.startEvolution();
                if (result.success)
                    return { text: `Self-evolution complete: ${JSON.stringify(result.data)}` };
                return { text: 'Self-evolution failed: ' + result.error };
            },
        });
        api.registerCommand({
            name: 'zcrystal_learn',
            description: 'Teach ZCrystal your preferences',
            async handler({ args }) {
                if (!state)
                    return { text: 'Plugin not initialized' };
                if (!args)
                    return { text: 'Usage: /learn <preference>' };
                await state.router.memoryStoreData('L3', 'user_preference', args);
                return { text: `✅ Learned: "${args}"` };
            },
        });
        api.registerCommand({
            name: 'zcrystal_profile',
            description: 'View ZCrystal profile',
            async handler() {
                if (!state)
                    return { text: 'Plugin not initialized' };
                const health = await state.router.healthCheck();
                const skills = await state.router.listSkills();
                const evo = await state.router.getEvolutionStatus();
                return { text: `ZCrystal Profile:
- Health: ${health.success ? '✅ Healthy' : '❌ Unhealthy'}
- Skills: ${skills.success ? skills.data?.skills?.length || 0 : 'N/A'}
- Evolution: ${evo.success ? (evo.data?.running ? '🔄 Running' : '⏸️ Idle') : 'N/A'}` };
            },
        });
        // =====================================================================
        // Hooks
        // =====================================================================
        api.registerHook('message:received', async (event) => {
            if (!state)
                return;
            const msg = event?.context?.content || '';
            if (msg) {
                await state.router.memoryStoreData('L3', 'last_message', msg);
                // Also send to Honcho for learning
                // learnFromUser not available in ZCrystal_evo HonchoClient
            }
        }, { name: 'zcrystal:msg_received' });
        api.registerHook('message:sent', async (event) => {
            if (!state)
                return;
            const content = event?.content;
            if (content)
                await state.router.memoryStoreData('L2', 'last_ai_response', content);
        }, { name: 'zcrystal:msg_sent' });
        console.log('[ZCrystal] ZCrystal_evo integration complete. Tools registered: 16');
    },
});
//# sourceMappingURL=index.js.map