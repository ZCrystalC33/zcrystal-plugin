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
import { config } from './config.js';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { stripPrivateTags } from './utils/privacy-filter.js';
const FTS5_REALTIME_INDEXER = join(config.paths.home, '.openclaw', 'skills', 'fts5', 'realtime_index.py');
import { UnifiedApiRouter, createHonchoClient, createSkillManager, SelfEvolutionEngine, EvolutionCoordinator, EvolutionScheduler, ReviewEngine, ToolHub, SkillGenerator, SkillVersioning, SkillIndexer, SkillValidator, SkillMerger, CircuitBreaker, RateLimiter, StructuredLogger, Metrics, WorkflowEngine, OpenClawSkillAdapter, SkillSyncManager, ReplayRunner, HookRegistry, DiskStore, EvolutionStore, TraceStore, } from '@zcrystal/evo';
import { registerCoreTools, registerTaskTools, registerSkillTools, registerWorkflowTools, registerSystemTools, registerProactiveTools, } from './tools/index.js';
import { registerSignalTools } from './routes/signals.js';
let state = null;
function okResult(text, details) {
    return { content: [{ type: 'text', text }], details: details ?? {} };
}
function errResult(text) {
    return { content: [{ type: 'text', text }], details: {}, isError: true };
}
// Re-export for tool modules
export { okResult, errResult };
// ============================================================================
// FTS5 MCP HTTP Client
// ============================================================================
const FTS5_MCP_URL = config.fts5.mcpUrl;
async function fts5Search(query, limit = 20) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(FTS5_MCP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: { name: 'fts5_search', arguments: { query, limit } },
                id: 2
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.result?.content?.[0]?.text) {
            return { success: true, data: data.result.content[0].text };
        }
        return { success: false, error: 'FTS5 search failed' };
    }
    catch (e) {
        return { success: false, error: String(e) };
    }
}
async function fts5Stats() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(FTS5_MCP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: { name: 'fts5_stats', arguments: {} },
                id: 3
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.result?.content?.[0]?.text) {
            return { success: true, data: data.result.content[0].text };
        }
        return { success: false, error: 'FTS5 stats failed' };
    }
    catch (e) {
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
    register(api) {
        console.log('[ZCrystal] Initializing with ZCrystal_evo...');
        // P0 Fix: Wrap entire register in try/catch to prevent plugin crash from blocking OpenClaw startup
        try {
            const router = new UnifiedApiRouter();
            const honcho = createHonchoClient({ baseUrl: 'http://localhost:8000', workspace: 'openclaw' });
            const skillManager = createSkillManager(config.paths.skills);
            const diskStore = new DiskStore(config.paths.temp);
            const evolutionStore = new EvolutionStore(diskStore);
            const traceStore = new TraceStore(diskStore);
            const selfEvolution = new SelfEvolutionEngine(evolutionStore, traceStore);
            const toolHub = new ToolHub();
            const skillGenerator = new SkillGenerator();
            const circuitBreaker = new CircuitBreaker({
                failureThreshold: 5,
                successThreshold: 2,
                timeout: 60000,
            });
            const rateLimiter = new RateLimiter({ maxTokens: 100, refillRate: 10, windowMs: 60000 });
            const logger = new StructuredLogger('ZCrystal');
            const metrics = new Metrics();
            const workflowEngine = new WorkflowEngine();
            const skillAdapter = new OpenClawSkillAdapter({
                openClawSkillsPath: config.paths.skills,
                zCrystalSkillsPath: config.paths.data + '/skills',
            });
            const skillSyncManager = new SkillSyncManager(skillAdapter);
            const replayRunner = new ReplayRunner();
            const hookRegistry = new HookRegistry();
            const skillVersioning = new SkillVersioning();
            const skillIndexer = new SkillIndexer();
            const skillValidator = new SkillValidator();
            const skillMerger = new SkillMerger();
            const reviewEngine = new ReviewEngine();
            const evolutionCoordinator = new EvolutionCoordinator(evolutionStore, traceStore);
            // Create evolution scheduler for auto-evolution
            const getSkills = async () => {
                try {
                    if (state?.skillManager) {
                        const result = await state.skillManager.discover();
                        if (result.ok && result.data) {
                            return result.data.map((s) => ({ slug: s.slug || s.id || '', content: s.content || '' }));
                        }
                    }
                }
                catch (e) {
                    // Ignore errors
                }
                return [];
            };
            const evolutionScheduler = new EvolutionScheduler(evolutionCoordinator, getSkills, 60 * 60 * 1000 // 1 hour interval
            );
            state = {
                router, honcho, skillManager, selfEvolution, evolutionCoordinator, evolutionScheduler, reviewEngine,
                toolHub, skillGenerator, skillVersioning, skillIndexer, skillValidator, skillMerger,
                circuitBreaker, rateLimiter, logger, metrics, workflowEngine,
                skillAdapter, skillSyncManager, replayRunner, hookRegistry
            };
            // FIX: Auto-start evolution scheduler (every 1 hour by default)
            try {
                evolutionScheduler.start();
                console.log('[ZCrystal] Auto-evolution scheduler started (1 hour interval)');
            }
            catch (err) {
                console.warn('[ZCrystal] Failed to start evolution scheduler:', err);
            }
            // =====================================================================
            // Auto-Trigger Setup (Heartbeat & Proactive Check)
            // =====================================================================
            // Auto-run heartbeat every 5 minutes (stored for cleanup)
            const heartbeatInterval = setInterval(async () => {
                try {
                    if (state) {
                        const status = await state.router.healthCheck();
                        const evo = await state.router.getEvolutionStatus();
                        if (status.success) {
                            console.log('[ZCrystal Heartbeat] OK - Evolution:', evo.data?.running ? 'running' : 'idle');
                        }
                    }
                }
                catch (e) {
                    console.error('[ZCrystal Heartbeat] Error:', e);
                }
            }, 5 * 60 * 1000); // 5 minutes
            // Auto-run proactive check every 10 minutes (stored for cleanup)
            const proactiveInterval = setInterval(async () => {
                try {
                    if (state) {
                        const sessionResult = await state.router.memoryLoad('L2', 'session:current');
                        const suggestions = state.reviewEngine.getUpgradeSuggestions();
                        if (sessionResult.success && sessionResult.data && suggestions.length > 0) {
                            console.log('[ZCrystal Proactive] Session active,', suggestions.length, 'suggestions available');
                        }
                    }
                }
                catch (e) {
                    console.error('[ZCrystal Proactive] Error:', e);
                }
            }, 10 * 60 * 1000); // 10 minutes
            // Cleanup on unload (if supported by OpenClaw)
            api.registerHook('unload', () => {
                clearInterval(heartbeatInterval);
                clearInterval(proactiveInterval);
                // Stop evolution scheduler to prevent background tasks from running
                state?.evolutionScheduler?.stop();
                console.log('[ZCrystal] Cleanup complete on unload');
            });
            // =====================================================================
            // Register Tools by Domain
            // =====================================================================
            registerCoreTools(api, state);
            registerTaskTools(api, state);
            registerSkillTools(api, state);
            registerWorkflowTools(api, state);
            registerSystemTools(api, state);
            registerProactiveTools(api, state);
            registerSignalTools(api, state);
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
                    if (result.success)
                        return okResult(result.data);
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
                    if (result.success)
                        return okResult(result.data);
                    return errResult(result.error ?? 'FTS5 stats failed');
                },
            });
            // =====================================================================
            // ToolHub Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_toolhub_call',
                label: 'ZCrystal ToolHub Call',
                description: 'Execute a tool via ToolHub with security checks',
                parameters: Type.Object({
                    toolName: Type.String(),
                    params: Type.Record(Type.String(), Type.Any()),
                    taskId: Type.Optional(Type.String()),
                }),
                async execute(_id, args) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const result = await state.toolHub.doToolCall(args.toolName, args.params, args.taskId);
                    if (result.success) {
                        return okResult(JSON.stringify(result.data, null, 2), { durationMs: result.durationMs });
                    }
                    return errResult(result.error || 'Tool call failed');
                },
            });
            api.registerTool({
                name: 'zcrystal_toolhub_schema',
                label: 'ZCrystal ToolHub Schema',
                description: 'Get tool schema by name from ToolHub',
                parameters: Type.Object({ name: Type.String() }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const schema = state.toolHub.getToolSchema(params.name);
                    if (schema) {
                        return okResult(JSON.stringify(schema, null, 2));
                    }
                    return errResult('Tool schema not found: ' + params.name);
                },
            });
            api.registerTool({
                name: 'zcrystal_toolhub_logs',
                label: 'ZCrystal ToolHub Logs',
                description: 'Get recent tool execution logs',
                parameters: Type.Object({ limit: Type.Optional(Type.Number()) }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const logs = state.toolHub.getLogs(undefined, params.limit || 100);
                    return okResult(JSON.stringify(logs, null, 2), { count: logs.length });
                },
            });
            // =====================================================================
            // Skill Generator Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_skill_generate',
                label: 'ZCrystal Skill Generate',
                description: 'Generate a new skill from task execution patterns',
                parameters: Type.Object({
                    taskType: Type.String(),
                    toolChain: Type.Array(Type.String()),
                    parameters: Type.Optional(Type.Record(Type.String(), Type.Any())),
                    examples: Type.Optional(Type.Array(Type.Any())),
                    edgeCases: Type.Optional(Type.Array(Type.Any())),
                }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const generated = await state.skillGenerator.generateFromTask(params.taskType, params.toolChain, params.parameters || {}, params.examples || [], params.edgeCases || []);
                    if (generated) {
                        return okResult(JSON.stringify(generated, null, 2), { skillId: generated.skillId });
                    }
                    return errResult('Skill generation failed');
                },
            });
            api.registerTool({
                name: 'zcrystal_skill_generator_stats',
                label: 'ZCrystal Skill Generator Stats',
                description: 'Get skill generator statistics',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const stats = state.skillGenerator.getGenerationStats();
                    return okResult(JSON.stringify(stats, null, 2));
                },
            });
            // =====================================================================
            // Circuit Breaker Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_circuit_status',
                label: 'ZCrystal Circuit Breaker Status',
                description: 'Get circuit breaker current state and stats',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const cbState = state.circuitBreaker.getState();
                    const stats = state.circuitBreaker.getStats();
                    const canExecute = state.circuitBreaker.canExecute();
                    return okResult(JSON.stringify({ state: cbState, stats, canExecute }, null, 2));
                },
            });
            api.registerTool({
                name: 'zcrystal_circuit_reset',
                label: 'ZCrystal Circuit Breaker Reset',
                description: 'Reset circuit breaker to closed state',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    state.circuitBreaker.reset();
                    return okResult('Circuit breaker reset to CLOSED state');
                },
            });
            api.registerTool({
                name: 'zcrystal_circuit_check',
                label: 'ZCrystal Circuit Check',
                description: 'Check if operation can be executed (Agent-internal)',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const canExecute = state.circuitBreaker.canExecute();
                    if (canExecute) {
                        return okResult('Circuit allows execution');
                    }
                    // Circuit breaker open is a normal flow control, not an error
                    return okResult('Circuit breaker is OPEN - operation blocked');
                },
            }, { optional: true });
            // =====================================================================
            // Rate Limiter Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_rate_status',
                label: 'ZCrystal Rate Limiter Status',
                description: 'Get rate limiter current status',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const status = state.rateLimiter.getStatus();
                    return okResult(JSON.stringify(status, null, 2));
                },
            });
            api.registerTool({
                name: 'zcrystal_rate_check',
                label: 'ZCrystal Rate Check',
                description: 'Check if operation is allowed (Agent-internal)',
                parameters: Type.Object({ tokens: Type.Optional(Type.Number()) }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const allowed = state.rateLimiter.isAllowed(params.tokens || 1);
                    if (allowed) {
                        return okResult('Rate limit allows execution');
                    }
                    // Rate limit exceeded is normal flow control, not an error
                    return okResult('Rate limit exceeded - operation blocked');
                },
            }, { optional: true });
            // =====================================================================
            // Structured Logger Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_log',
                label: 'ZCrystal Log',
                description: 'Write structured log entry (Agent-internal)',
                parameters: Type.Object({
                    level: Type.Union([Type.Literal('info'), Type.Literal('warn'), Type.Literal('error')]),
                    message: Type.String(),
                    context: Type.Optional(Type.Record(Type.String(), Type.Any())),
                }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    if (params.level === 'info')
                        state.logger.info(params.message, params.context || {});
                    else if (params.level === 'warn')
                        state.logger.warning(params.message, params.context || {});
                    else if (params.level === 'error')
                        state.logger.error(params.message, params.context || {});
                    return okResult('Logged: ' + params.message);
                },
            }, { optional: true });
            // =====================================================================
            // Metrics Integration
            // =====================================================================
            api.registerTool({
                name: 'zcrystal_metrics_get',
                label: 'ZCrystal Metrics Get',
                description: 'Get current metrics statistics',
                parameters: Type.Object({}),
                async execute(_id, _params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    const stats = state.metrics.getStats();
                    return okResult(JSON.stringify(stats, null, 2));
                },
            });
            api.registerTool({
                name: 'zcrystal_metrics_record',
                label: 'ZCrystal Metrics Record',
                description: 'Record a custom metric event (Agent-internal)',
                parameters: Type.Object({
                    type: Type.Union([Type.Literal('task'), Type.Literal('tool'), Type.Literal('model')]),
                    name: Type.String(),
                    durationMs: Type.Optional(Type.Number()),
                    success: Type.Optional(Type.Boolean()),
                }),
                async execute(_id, params) {
                    if (!state)
                        return errResult('Plugin not initialized');
                    if (params.type === 'task') {
                        if (params.success === false) {
                            state.metrics.recordTaskFailed(params.name, 'error', params.durationMs || 0);
                        }
                        else {
                            state.metrics.recordTaskCompleted(params.name, params.durationMs || 0);
                        }
                    }
                    else if (params.type === 'tool') {
                        state.metrics.recordToolCall(params.name, params.durationMs || 0, params.success !== false);
                    }
                    return okResult('Metric recorded: ' + params.type + '/' + params.name);
                },
            }, { optional: true });
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
            // FIX: Tool to enable/disable auto-evolution scheduler
            api.registerTool({
                name: 'zcrystal_evolution_control',
                label: 'ZCrystal Evolution Control',
                description: 'Enable or disable auto-evolution scheduler',
                parameters: Type.Object({ action: Type.Union([Type.Literal('start'), Type.Literal('stop'), Type.Literal('status')]) }),
                async execute(_id, params) {
                    if (!state || !state.evolutionScheduler)
                        return errResult('Plugin not initialized or scheduler unavailable');
                    if (params.action === 'start') {
                        state.evolutionScheduler.start();
                        return okResult('✅ Auto-evolution scheduler started (1 hour interval)');
                    }
                    else if (params.action === 'stop') {
                        state.evolutionScheduler.stop();
                        return okResult('⏸ Auto-evolution scheduler stopped');
                    }
                    else {
                        const running = state.evolutionScheduler.running;
                        return okResult(`Evolution scheduler: ${running ? '🟢 running' : '🔴 stopped'}`);
                    }
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
            api.registerHook('message:received', async (event) => {
                if (!state)
                    return;
                // FIX: Support both { context: { content } } and { content } structures
                const msg = event?.context?.content
                    || event?.content
                    || '';
                if (msg) {
                    await state.router.memoryStoreData('L3', 'last_message', msg);
                    // Real-time FTS5 indexing
                    const rawEvent = event;
                    try {
                        const msgData = JSON.stringify({
                            sender: 'user',
                            sender_label: rawEvent.sender_label || 'user',
                            // FIX: Strip <private> tags before indexing (Privacy Tags feature)
                            content: stripPrivateTags(msg),
                            channel: rawEvent.channel || 'telegram',
                            session_key: rawEvent.session_key || '',
                            message_id: rawEvent.message_id || '',
                            timestamp: rawEvent.timestamp || new Date().toISOString(),
                        });
                        // Fire-and-forget: don't block on FTS5 indexing
                        spawn('python3', [FTS5_REALTIME_INDEXER, msgData], { detached: true, stdio: 'ignore' });
                    }
                    catch (err) {
                        console.warn('[ZCrystal] FTS5 realtime index failed:', err);
                    }
                }
            }, { name: 'zcrystal:msg_received' });
            api.registerHook('message:sent', async (event) => {
                if (!state)
                    return;
                // FIX: message:sent event structure mirrors message:received
                const content = event?.context?.content
                    || event?.content
                    || '';
                if (content) {
                    await state.router.memoryStoreData('L2', 'last_ai_response', content);
                    // Real-time FTS5 indexing
                    const rawEvent = event;
                    try {
                        const msgData = JSON.stringify({
                            sender: 'assistant',
                            sender_label: rawEvent.sender_label || 'assistant',
                            // FIX: Strip <private> tags before indexing (Privacy Tags feature)
                            content: stripPrivateTags(content),
                            channel: rawEvent.channel || 'telegram',
                            session_key: rawEvent.session_key || '',
                            message_id: rawEvent.message_id || '',
                            timestamp: rawEvent.timestamp || new Date().toISOString(),
                        });
                        // Fire-and-forget: don't block on FTS5 indexing
                        spawn('python3', [FTS5_REALTIME_INDEXER, msgData], { detached: true, stdio: 'ignore' });
                    }
                    catch (err) {
                        // Best-effort: don't fail the hook if FTS5 indexing fails
                        console.warn('[ZCrystal] FTS5 realtime index failed:', err);
                    }
                }
            }, { name: 'zcrystal:msg_sent' });
            // =====================================================================
            // Auto-Context Recall (before_prompt_build hook)
            // =====================================================================
            // Automatically inject FTS5 search results into context when relevant
            // Pattern: Before each prompt build, search FTS5 for recent task context
            // This makes "失憶復原" automatic - no manual zcrystal_search needed
            api.registerHook('before_prompt_build', async (event) => {
                if (!state)
                    return;
                // Extract current user message for context search
                const userMsg = event?.context?.content
                    || event?.content
                    || '';
                if (!userMsg || userMsg.length < 10)
                    return; // Skip very short messages
                // Check if message suggests memory gap (keywords indicating need for recall)
                const MEMORY_GAP_TRIGGERS = [
                    '之前', '上次', '延續', '繼續', '之前的工作',
                    '任務', '進度', '做得如何', '狀態', '確認',
                    '忘記', '不記得', '記得', '延續之前',
                    '之前做', '之前說', '上次說', '繼續上次的'
                ];
                const triggersLower = MEMORY_GAP_TRIGGERS.map(t => t.toLowerCase());
                const msgLower = userMsg.toLowerCase();
                const triggersFound = triggersLower.filter(t => msgLower.includes(t));
                if (triggersFound.length === 0)
                    return; // No memory gap signals
                // Extract key search terms from message
                const words = userMsg.split(/[\s,.，。!?]+/).filter(w => w.length > 2);
                const searchTerms = words.slice(-6).join(' ') || userMsg.slice(-50);
                // Fire-and-forget FTS5 search for context injection
                const { spawn } = await import('node:child_process');
                const searchScript = `
import sys
sys.path.insert(0, '/home/snow/.openclaw')
from skills.fts5 import search
results = search(${JSON.stringify(searchTerms)}, limit=3)
if results:
    context = '\\n[YOROZUMI MEMORY RECALL] Previous relevant context:\\n'
    for r in results[:3]:
        context += f"- [{r['sender']}] {r['content'][:200]}...\\n"
    print(context)
else:
    print('')
`;
                try {
                    spawn('python3', ['-c', searchScript], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    // Note: Results go to stdout, hook doesn't wait
                    // For full integration, would need to pipe results back to prompt
                    // Current: Just logs to console for debugging
                    console.log(`[ZCrystal:memory-recall] triggered by "${triggersFound.join(', ')}" search="${searchTerms.slice(0, 30)}"`);
                }
                catch (err) {
                    // Best-effort: don't fail the prompt build
                }
            }, { name: 'zcrystal:auto_context_recall' });
            console.log('[ZCrystal] ZCrystal_evo integration complete. Tools registered: 95');
        }
        catch (err) {
            // P0 Fix: If any constructor throws, log and allow OpenClaw to start without ZCrystal
            console.error('[ZCrystal] ⚠️ Plugin initialization failed:', err);
            console.error('[ZCrystal] ZCrystal tools will not be available. OpenClaw will continue starting.');
            // Clear state to prevent partial initialization
            state = null;
        }
    },
});
//# sourceMappingURL=index.js.map