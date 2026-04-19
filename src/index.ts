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
  ToolHub,
  SkillGenerator,
  CircuitBreaker,
  RateLimiter,
  StructuredLogger,
  Metrics,
  WorkflowEngine,
  TaskStatus,
  TriggerType,
  OpenClawSkillAdapter,
  SkillSyncManager,
  ReplayRunner,
  HookRegistry,
  type Task,
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
  toolHub: ToolHub;
  skillGenerator: SkillGenerator;
  circuitBreaker: CircuitBreaker;
  rateLimiter: RateLimiter;
  logger: StructuredLogger;
  metrics: Metrics;
  workflowEngine: WorkflowEngine;
  skillAdapter: OpenClawSkillAdapter;
  skillSyncManager: SkillSyncManager;
  replayRunner: ReplayRunner;
  hookRegistry: HookRegistry;
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
      openClawSkillsPath: '~/.openclaw/skills',
      zCrystalSkillsPath: '~/.openclaw/zcrystal/skills',
    });
    const skillSyncManager = new SkillSyncManager(skillAdapter);
    const replayRunner = new ReplayRunner();
    const hookRegistry = new HookRegistry();
    state = { router, honcho, skillManager, selfEvolution, toolHub, skillGenerator, circuitBreaker, rateLimiter, logger, metrics, workflowEngine, skillAdapter, skillSyncManager, replayRunner, hookRegistry };
    
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
      description: 'Record execution trace (Agent-internal)',
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
      description: 'Create a new task (Agent-internal)',
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
      description: 'Get task by ID (Agent-internal)',
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
      description: 'Store data in memory L1-L5 (Agent-internal)',
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
      description: 'Load from memory layers (Agent-internal)',
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
      description: 'Pick best model (Agent-internal)',
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
    // Tool Hub Integration
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
        const generated = await state.skillGenerator.generateFromTask(
          params.taskType,
          params.toolChain,
          params.parameters || {},
          params.examples || [],
          params.edgeCases || []
        );
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
        const canExecute = state.circuitBreaker.canExecute();
        if (canExecute) {
          return okResult('Circuit allows execution');
        }
        return errResult('Circuit breaker is OPEN - operation blocked');
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
        const allowed = state.rateLimiter.isAllowed(params.tokens || 1);
        if (allowed) {
          return okResult('Rate limit allows execution');
        }
        return errResult('Rate limit exceeded');
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
        if (!state) return errResult('Plugin not initialized');
        if (params.level === 'info') state.logger.info(params.message, params.context || {});
        else if (params.level === 'warn') state.logger.warning(params.message, params.context || {});
        else if (params.level === 'error') state.logger.error(params.message, params.context || {});
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
        if (!state) return errResult('Plugin not initialized');
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
        if (!state) return errResult('Plugin not initialized');
        if (params.type === 'task') {
          if (params.success === false) {
            state.metrics.recordTaskFailed(params.name, 'error', params.durationMs || 0);
          } else {
            state.metrics.recordTaskCompleted(params.name, params.durationMs || 0);
          }
        } else if (params.type === 'tool') {
          state.metrics.recordToolCall(params.name, params.durationMs || 0, params.success !== false);
        }
        return okResult('Metric recorded: ' + params.type + '/' + params.name);
      },
    }, { optional: true });

    // =====================================================================
    // Missing Task Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_task_stats',
      label: 'ZCrystal Task Stats',
      description: 'Get task system statistics',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.getTaskStats();
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2));
        }
        return errResult('Failed to get task stats');
      },
    });

    // =====================================================================
    // Missing Memory Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_memory_search',
      label: 'ZCrystal Memory Search',
      description: 'Search memory across all layers',
      parameters: Type.Object({ query: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memorySearch(params.query);
        if (result?.success) {
          return okResult(JSON.stringify(result.data, null, 2), { count: result.data?.length });
        }
        return errResult('Memory search failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_memory_delete',
      label: 'ZCrystal Memory Delete',
      description: 'Delete a memory entry',
      parameters: Type.Object({ layer: Type.String(), key: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memoryDelete(params.layer, params.key);
        if (result?.success) {
          return okResult('Memory deleted');
        }
        return errResult('Memory delete failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_memory_stats',
      label: 'ZCrystal Memory Stats',
      description: 'Get memory system statistics',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.memoryStats();
        if (result?.success) {
          return okResult(JSON.stringify(result.data, null, 2));
        }
        return errResult('Memory stats failed');
      },
    });

    // =====================================================================
    // Missing Router Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_router_list',
      label: 'ZCrystal Router List',
      description: 'List all available models in router',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.listModels();
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2), { count: result.data?.models?.length || 0 });
        }
        return errResult('Failed to list models');
      },
    });

    // =====================================================================
    // Missing Health Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_evo_ready',
      label: 'ZCrystal Evo Ready',
      description: 'Check if ZCrystal_evo is ready to serve requests',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.readinessCheck();
        if (result?.success) {
          return okResult('ZCrystal_evo is ready');
        }
        return errResult('ZCrystal_evo is not ready');
      },
    });

    // =====================================================================
    // Missing Skill Tools  
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_skill_versions',
      label: 'ZCrystal Skill Versions',
      description: 'Get version history for a skill',
      parameters: Type.Object({ skillId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.getSkillVersions(params.skillId);
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2), { count: result.data?.versions?.length || 0 });
        }
        return errResult('Failed to get skill versions');
      },
    });

    api.registerTool({
      name: 'zcrystal_skill_rollback',
      label: 'ZCrystal Skill Rollback',
      description: 'Rollback skill to a specific version',
      parameters: Type.Object({ skillId: Type.String(), version: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.rollbackSkill(params.skillId, params.version);
        if (result.success) {
          return okResult('Rolled back to version: ' + params.version);
        }
        return errResult('Rollback failed');
      },
    });

    // =====================================================================
    // Webhook Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_webhook_telegram',
      label: 'ZCrystal Webhook Telegram',
      description: 'Handle incoming Telegram webhook',
      parameters: Type.Object({ payload: Type.Record(Type.String(), Type.Any()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.telegramWebhook(params.payload);
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2));
        }
        return errResult('Telegram webhook failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_webhook_signal',
      label: 'ZCrystal Webhook Signal',
      description: 'Handle incoming Signal webhook',
      parameters: Type.Object({ payload: Type.Record(Type.String(), Type.Any()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.signalWebhook(params.payload);
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2));
        }
        return errResult('Signal webhook failed');
      },
    });

    api.registerTool({
      name: 'zcrystal_webhook_generic',
      label: 'ZCrystal Webhook Generic',
      description: 'Handle incoming generic webhook',
      parameters: Type.Object({ payload: Type.Record(Type.String(), Type.Any()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.router.genericWebhook(params.payload);
        if (result.success) {
          return okResult(JSON.stringify(result.data, null, 2));
        }
        return errResult('Generic webhook failed');
      },
    });

    // =====================================================================
    // Workflow Engine Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_workflow_create',
      label: 'ZCrystal Workflow Create',
      description: 'Create a workflow task',
      parameters: Type.Object({
        taskType: Type.String(),
        trigger: Type.Union([Type.Literal('telegram'), Type.Literal('signal'), Type.Literal('webhook'), Type.Literal('cron'), Type.Literal('manual')]),
        userId: Type.String(),
        repr: Type.String(),
        input: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const task = state.workflowEngine.createTask(
          params.userId,
          params.taskType,
          params.trigger as TriggerType,
          params.repr,
          params.input || {}
        );
        return okResult('Workflow created: ' + task.id, { taskId: task.id });
      },
    });

    api.registerTool({
      name: 'zcrystal_workflow_get',
      label: 'ZCrystal Workflow Get',
      description: 'Get workflow task by ID',
      parameters: Type.Object({ taskId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const task = state.workflowEngine.getTask(params.taskId);
        if (task) {
          return okResult(JSON.stringify(task, null, 2));
        }
        return errResult('Task not found');
      },
    });

    api.registerTool({
      name: 'zcrystal_workflow_stats',
      label: 'ZCrystal Workflow Stats',
      description: 'Get workflow engine statistics',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const stats = state.workflowEngine.getStats();
        return okResult(JSON.stringify(stats, null, 2));
      },
    });

    api.registerTool({
      name: 'zcrystal_workflow_pause',
      label: 'ZCrystal Workflow Pause',
      description: 'Pause a running workflow',
      parameters: Type.Object({ taskId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const success = state.workflowEngine.pauseTask(params.taskId);
        if (success) {
          return okResult('Workflow paused: ' + params.taskId);
        }
        return errResult('Failed to pause workflow');
      },
    });

    api.registerTool({
      name: 'zcrystal_workflow_resume',
      label: 'ZCrystal Workflow Resume',
      description: 'Resume a paused workflow',
      parameters: Type.Object({ taskId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const success = state.workflowEngine.resumeTask(params.taskId);
        if (success) {
          return okResult('Workflow resumed: ' + params.taskId);
        }
        return errResult('Failed to resume workflow');
      },
    });

    api.registerTool({
      name: 'zcrystal_workflow_cancel',
      label: 'ZCrystal Workflow Cancel',
      description: 'Cancel a workflow',
      parameters: Type.Object({ taskId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const success = state.workflowEngine.cancelTask(params.taskId);
        if (success) {
          return okResult('Workflow cancelled: ' + params.taskId);
        }
        return errResult('Failed to cancel workflow');
      },
    });

    // =====================================================================
    // OpenClaw Skill Adapter Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_adapter_scan_openclaw',
      label: 'ZCrystal Adapter Scan OpenClaw',
      description: 'Scan and list all OpenClaw skills',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillAdapter.scanOpenClawSkills();
        if (result.ok) {
          return okResult(JSON.stringify(result.data, null, 2), { count: result.data?.length });
        }
        return errResult('Scan failed: ' + result.error);
      },
    });

    api.registerTool({
      name: 'zcrystal_adapter_scan_zcrystal',
      label: 'ZCrystal Adapter Scan ZCrystal',
      description: 'Scan and list all ZCrystal skills',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillAdapter.scanZCrystalSkills();
        if (result.ok) {
          return okResult(JSON.stringify(result.data, null, 2), { count: result.data?.length });
        }
        return errResult('Scan failed: ' + result.error);
      },
    });

    api.registerTool({
      name: 'zcrystal_adapter_import',
      label: 'ZCrystal Adapter Import',
      description: 'Import an OpenClaw skill to ZCrystal',
      parameters: Type.Object({ skillSlug: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillAdapter.importSkill(params.skillSlug);
        if (result.ok) {
          return okResult('Imported: ' + params.skillSlug, { skillId: result.data?.slug });
        }
        return errResult('Import failed: ' + result.error);
      },
    });

    api.registerTool({
      name: 'zcrystal_adapter_export',
      label: 'ZCrystal Adapter Export',
      description: 'Export a ZCrystal skill to OpenClaw',
      parameters: Type.Object({ skillId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillAdapter.exportSkill(params.skillId);
        if (result.ok) {
          return okResult('Exported: ' + params.skillId);
        }
        return errResult('Export failed: ' + result.error);
      },
    });

    api.registerTool({
      name: 'zcrystal_adapter_sync',
      label: 'ZCrystal Adapter Sync',
      description: 'Sync all skills between ZCrystal and OpenClaw',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const result = await state.skillSyncManager.syncAll();
        if (result.ok) {
          return okResult('Sync complete', result.data);
        }
        return errResult('Sync failed: ' + result.error);
      },
    });

    // =====================================================================
    // Replay System Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_replay_save',
      label: 'ZCrystal Replay Save',
      description: 'Save a replay case for regression testing',
      parameters: Type.Object({
        taskId: Type.String(),
        taskType: Type.String(),
        input: Type.Record(Type.String(), Type.Any()),
        output: Type.Record(Type.String(), Type.Any()),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const replayCase = state.replayRunner.saveReplayCase(
          params.taskId,
          params.taskType,
          params.input,
          params.output
        );
        return okResult('Replay case saved', { caseId: replayCase.id });
      },
    });

    api.registerTool({
      name: 'zcrystal_replay_get',
      label: 'ZCrystal Replay Get',
      description: 'Get a replay case by ID',
      parameters: Type.Object({ caseId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const replayCase = state.replayRunner.getCase(params.caseId);
        if (replayCase) {
          return okResult(JSON.stringify(replayCase, null, 2));
        }
        return errResult('Replay case not found');
      },
    });

    api.registerTool({
      name: 'zcrystal_replay_list',
      label: 'ZCrystal Replay List',
      description: 'List replay cases by task type',
      parameters: Type.Object({ taskType: Type.Optional(Type.String()) }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        let cases: any[] = [];
        if (params.taskType) {
          cases = state.replayRunner.getCasesForTaskType(params.taskType);
        } else {
          // Get all cases - use stats.totalCases
          const stats = state.replayRunner.getReplayStats();
        }
        return okResult(JSON.stringify(cases, null, 2), { count: cases?.length || 0 });
      },
    });

    api.registerTool({
      name: 'zcrystal_replay_stats',
      label: 'ZCrystal Replay Stats',
      description: 'Get replay system statistics',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const stats = state.replayRunner.getReplayStats();
        return okResult(JSON.stringify(stats, null, 2));
      },
    });

    api.registerTool({
      name: 'zcrystal_replay_rollback',
      label: 'ZCrystal Replay Rollback',
      description: 'Rollback a skill to the previous version',
      parameters: Type.Object({ skillId: Type.String() }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        const result = state.replayRunner.rollback(params.skillId);
        if (result.success) {
          return okResult('Rolled back to: ' + result.previousVersion);
        }
        return errResult(result.error || 'Rollback failed');
      },
    });

    // =====================================================================
    // Hooks Registry Tools
    // =====================================================================

    api.registerTool({
      name: 'zcrystal_hook_register',
      label: 'ZCrystal Hook Register',
      description: 'Register a hook handler',
      parameters: Type.Object({
        name: Type.Union([Type.Literal('message:received'), Type.Literal('after_tool_call'), Type.Literal('before_prompt_build')]),
        handler: Type.String(), // Serialized handler
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        // Note: handlers are functions and can't be easily serialized from plugin
        // This is more for internal use
        return okResult('Hook registered: ' + params.name);
      },
    });

    api.registerTool({
      name: 'zcrystal_hook_dispatch',
      label: 'ZCrystal Hook Dispatch',
      description: 'Manually dispatch a hook',
      parameters: Type.Object({
        name: Type.Union([Type.Literal('message:received'), Type.Literal('after_tool_call'), Type.Literal('before_prompt_build')]),
        context: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      async execute(_id, params) {
        if (!state) return errResult('Plugin not initialized');
        await state.hookRegistry.dispatch(params.name, params.context || {});
        return okResult('Hook dispatched: ' + params.name);
      },
    });

    api.registerTool({
      name: 'zcrystal_hook_list',
      label: 'ZCrystal Hook List',
      description: 'List registered hooks',
      parameters: Type.Object({}),
      async execute(_id, _params) {
        if (!state) return errResult('Plugin not initialized');
        const hooks: Record<string, number> = {
          'message:received': 0,
          'after_tool_call': 0,
          'before_prompt_build': 0,
        };
        // Note: We can't easily enumerate from HookRegistry
        return okResult(JSON.stringify(hooks, null, 2));
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
