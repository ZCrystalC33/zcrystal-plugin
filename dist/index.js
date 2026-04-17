/**
 * ZCrystal Plugin for OpenClaw
 *
 * Main entry point - registers all capabilities with OpenClaw.
 *
 * Features:
 * - Honcho integration (local service at http://localhost:8000)
 * - Skills system (auto-discover SKILL.md)
 * - Self-Evolution (triggered ONLY on /compact command)
 *
 * SDK: https://docs.openclaw.ai/plugins/sdk-overview
 */
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { Type } from '@sinclair/typebox';
import { createHonchoClient } from './honcho-client.js';
import { createSkillManager } from './skill-manager.js';
import { createSelfEvolutionEngine } from './self-evolution.js';
let state = null;
// ============================================================
// Helper: Create tool result
// ============================================================
function okResult(text, details) {
    return { content: [{ type: 'text', text }], details: details ?? {} };
}
function errResult(text) {
    return { content: [{ type: 'text', text }], details: {}, isError: true };
}
// ============================================================
// Parameter Schemas (Typebox)
// ============================================================
const SearchParams = Type.Object({
    query: Type.String(),
    limit: Type.Optional(Type.Number()),
    peer: Type.Optional(Type.String()),
});
const AskUserParams = Type.Object({
    question: Type.String(),
    depth: Type.Optional(Type.Union([Type.Literal('quick'), Type.Literal('thorough')])),
});
const SkillReadParams = Type.Object({
    slug: Type.String(),
});
const EvolveParams = Type.Object({
    slug: Type.Optional(Type.String()),
    iterations: Type.Optional(Type.Number()),
});
const RecordTraceParams = Type.Object({
    skillSlug: Type.String(),
    input: Type.String(),
    output: Type.String(),
    success: Type.Boolean(),
    duration: Type.Number(),
});
// ============================================================
// Plugin Definition
// ============================================================
export default definePluginEntry({
    id: 'zcrystal',
    name: 'ZCrystal',
    description: 'Honcho + Skills + Self-Evolution for OpenClaw',
    register(api) {
        const config = api.config;
        // Initialize Honcho client
        const honcho = createHonchoClient({
            baseUrl: config?.honchoBaseUrl || 'http://localhost:8000',
            workspace: config?.workspace || 'openclaw',
        });
        // Initialize Skill Manager
        const skillPaths = config?.skills?.paths || ['~/.openclaw/skills'];
        const skillManager = createSkillManager(skillPaths);
        // Discover skills on boot
        if (config?.skills?.autoDiscover !== false) {
            skillManager.discover().catch(() => { });
        }
        // Initialize Self-Evolution Engine
        const selfEvolution = createSelfEvolutionEngine(skillManager, {
            target: 'all',
            evalSource: 'sessiondb',
        });
        state = {
            honcho,
            skillManager,
            selfEvolution,
            config: config || {
                honchoBaseUrl: 'http://localhost:8000',
                workspace: 'openclaw',
                selfEvolution: { enabled: true, onCompactOnly: true },
                skills: { autoDiscover: true, paths: ['~/.openclaw/skills'] }
            },
        };
        // ============================================================
        // Register Required Tools
        // ============================================================
        api.registerTool({
            name: 'zcrystal_search',
            label: 'ZCrystal Search',
            description: 'Search conversation history using Honcho semantic search',
            parameters: SearchParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const results = await state.honcho.search(params.peer || 'user', params.query, params.limit || 10);
                return okResult(JSON.stringify(results, null, 2), { results });
            },
        });
        api.registerTool({
            name: 'zcrystal_ask_user',
            label: 'ZCrystal Ask User',
            description: 'Ask Honcho about user preferences or facts',
            parameters: AskUserParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const response = await state.honcho.ask('user', params.question, params.depth || 'quick');
                return okResult(response, { question: params.question });
            },
        });
        api.registerTool({
            name: 'zcrystal_skills',
            label: 'ZCrystal Skills',
            description: 'List all available ZCrystal skills',
            parameters: Type.Object({}),
            async execute(_id, _params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const skills = state.skillManager.getSkills();
                const text = skills.length === 0
                    ? 'No skills discovered'
                    : skills.map(s => `- ${s.name} (${s.slug}): ${s.description}`).join('\n');
                return okResult(text, { count: skills.length });
            },
        });
        api.registerTool({
            name: 'zcrystal_skill_read',
            label: 'ZCrystal Skill Read',
            description: 'Read content of a ZCrystal skill',
            parameters: SkillReadParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const skill = state.skillManager.getSkill(params.slug);
                if (!skill)
                    return errResult(`Skill not found: ${params.slug}`);
                const content = await state.skillManager.readSkillContent(skill);
                return okResult(content, { slug: params.slug });
            },
        });
        api.registerTool({
            name: 'zcrystal_evolution_status',
            label: 'ZCrystal Evolution Status',
            description: 'Get self-evolution history and status',
            parameters: Type.Object({}),
            async execute(_id, _params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const history = state.selfEvolution.getHistory();
                const text = history.length === 0
                    ? 'No evolution history yet'
                    : `Evolution history: ${history.length} runs\n` +
                        history.slice(-3).map(h => `- ${h.target}: ${h.candidates.length} candidates, best: ${h.bestCandidate?.score.toFixed(2) || 'N/A'}`).join('\n');
                return okResult(text, { historyLength: history.length });
            },
        });
        // ============================================================
        // Register Optional Tools
        // ============================================================
        api.registerTool({
            name: 'zcrystal_evolve',
            label: 'ZCrystal Evolve',
            description: 'Manually trigger self-evolution for a skill (or all skills)',
            parameters: EvolveParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                if (params.slug) {
                    const skill = state.skillManager.getSkill(params.slug);
                    if (!skill)
                        return errResult(`Skill not found: ${params.slug}`);
                    const result = await state.selfEvolution.evolveSkill(skill, {
                        iterations: params.iterations,
                    });
                    return okResult(`Evolved ${skill.name}: ${result.candidates.length} candidates, best: ${result.bestCandidate?.score.toFixed(2) || 'N/A'}`, { skill: params.slug, candidates: result.candidates.length });
                }
                else {
                    const results = await state.selfEvolution.evolveAllSkills({
                        iterations: params.iterations,
                    });
                    return okResult(`Evolved ${results.size} skills`, { count: results.size });
                }
            },
        }, { optional: true });
        api.registerTool({
            name: 'zcrystal_record_trace',
            label: 'ZCrystal Record Trace',
            description: 'Record an execution trace for self-evolution',
            parameters: RecordTraceParams,
            async execute(_id, params) {
                if (!state)
                    return errResult('Plugin not initialized');
                const trace = {
                    timestamp: Date.now(),
                    input: params.input,
                    output: params.output,
                    success: params.success,
                    duration: params.duration,
                };
                state.selfEvolution.recordTrace(params.skillSlug, trace);
                return okResult('Trace recorded', { skillSlug: params.skillSlug });
            },
        }, { optional: true });
        // ============================================================
        // Register Commands
        // ============================================================
        api.registerCommand({
            name: 'compact',
            description: 'Compact conversation and trigger self-evolution',
            async handler() {
                if (!state) {
                    return { text: 'Plugin not initialized' };
                }
                // Self-evolution ONLY triggers on /compact (if enabled)
                if (!state.config.selfEvolution?.enabled || !state.config.selfEvolution?.onCompactOnly) {
                    return {
                        text: 'Self-evolution disabled or not set to trigger on /compact'
                    };
                }
                // Run evolution on all skills
                const results = await state.selfEvolution.evolveAllSkills();
                // Apply best candidates where score > 0.6
                let applied = 0;
                for (const [_slug, result] of results) {
                    if (result.bestCandidate && result.bestCandidate.score > 0.6) {
                        await state.selfEvolution.applyBestCandidate(result);
                        applied++;
                    }
                }
                // Reload skills to pick up changes
                await state.skillManager.reload();
                return {
                    text: `Self-evolution complete: evolved ${results.size} skills, applied ${applied} improvements`,
                };
            },
        });
        // ============================================================
        // Register Hooks
        // ============================================================
        // Hook: After tool call - record trace for skill matching
        api.registerHook('after_tool_call', async (event) => {
            if (!state)
                return;
            const { toolName, input, output, success, duration } = event;
            if (!toolName)
                return;
            // Find matching skill by tool name pattern
            const skill = state.skillManager.searchSkills(toolName, 1)[0];
            if (skill) {
                state.selfEvolution.recordTrace(skill.slug, {
                    timestamp: Date.now(),
                    input: JSON.stringify(input),
                    output: typeof output === 'string' ? output : JSON.stringify(output),
                    success: success ?? false,
                    duration: duration ?? 0,
                });
            }
        });
        // Hook: Before prompt build - inject user model
        api.registerHook('before_prompt_build', async (event) => {
            if (!state)
                return;
            // @ts-ignore - Event structure from OpenClaw
            const ctx = event;
            const userModel = await state.honcho.getUserModel('user');
            // userModel.content contains the peer representation
            if (userModel?.content && ctx.systemPrompt !== undefined) {
                // Inject peer representation into system prompt for personalization
                const rep = userModel.content.substring(0, 500); // Truncate if too long
                ctx.systemPrompt += `\n\n[Honcho User Model]\n${rep}`;
            }
        });
    },
});
//# sourceMappingURL=index.js.map