/**
 * Review, Hook, Evolution Coordinator Tools
 */
import { Type } from '@sinclair/typebox';
import { okResult, errResult } from '../index.js';
export function registerSystemTools(api, state) {
    // ReviewEngine Tools
    api.registerTool({
        name: 'zcrystal_review_stats',
        label: 'ZCrystal Review Stats',
        description: 'Get review engine statistics',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            const stats = state.reviewEngine.getStats();
            return okResult(JSON.stringify(stats, null, 2));
        },
    });
    api.registerTool({
        name: 'zcrystal_review_suggestions',
        label: 'ZCrystal Review Suggestions',
        description: 'Get skill upgrade suggestions',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            const suggestions = state.reviewEngine.getUpgradeSuggestions();
            return okResult(JSON.stringify(suggestions, null, 2), { count: suggestions.length });
        },
    });
    api.registerTool({
        name: 'zcrystal_review_record',
        label: 'ZCrystal Review Record',
        description: 'Record a task completion for review',
        parameters: Type.Object({
            taskId: Type.String(), taskType: Type.String(), toolChain: Type.Array(Type.String()),
            success: Type.Boolean(), durationMs: Type.Number(), userId: Type.String(),
            error: Type.Optional(Type.String()),
        }),
        async execute(_id, params) {
            state.reviewEngine.onTaskCompleted(params.taskId, params.taskType, params.toolChain, params.success, params.durationMs, params.userId, params.error);
            return okResult('Recorded: ' + params.taskId);
        },
    });
    // Hooks Registry Tools
    api.registerTool({
        name: 'zcrystal_hook_register',
        label: 'ZCrystal Hook Register',
        description: 'Register a hook handler',
        parameters: Type.Object({
            name: Type.Union([Type.Literal('message:received'), Type.Literal('after_tool_call'), Type.Literal('before_prompt_build')]),
            handler: Type.String(),
        }),
        async execute(_id, _params) {
            return errResult('Hook registration requires handler function - use hook_dispatch for manual triggers');
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
            const hooks = { 'message:received': 0, 'after_tool_call': 0, 'before_prompt_build': 0 };
            return okResult(JSON.stringify(hooks, null, 2));
        },
    });
    // EvolutionCoordinator Tools
    api.registerTool({
        name: 'zcrystal_coordinator_status',
        label: 'ZCrystal Coordinator Status',
        description: 'Get evolution coordinator status',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            return okResult(JSON.stringify({ status: 'running', message: 'Use coordinator_evolve to trigger evolution' }, null, 2));
        },
    });
    api.registerTool({
        name: 'zcrystal_coordinator_register',
        label: 'ZCrystal Coordinator Register',
        description: 'Register a skill for evolution',
        parameters: Type.Object({ skillId: Type.String() }),
        async execute(_id, params) {
            await state.evolutionCoordinator.evolveOne(params.skillId, '');
            return okResult('Evolution triggered for: ' + params.skillId);
        },
    });
    api.registerTool({
        name: 'zcrystal_coordinator_evolve',
        label: 'ZCrystal Coordinator Evolve',
        description: 'Trigger evolution for registered skills',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            const results = await state.evolutionCoordinator.evolveAll([]);
            return okResult('Evolution complete: ' + results.size + ' processed');
        },
    });
    api.registerTool({
        name: 'zcrystal_coordinator_queue',
        label: 'ZCrystal Coordinator Queue',
        description: 'Get evolution queue status',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            return okResult(JSON.stringify({ status: 'Use coordinator_status to check progress' }, null, 2));
        },
    });
    // Scheduler Tools
    api.registerTool({
        name: 'zcrystal_scheduler_start',
        label: 'ZCrystal Scheduler Start',
        description: 'Start auto-evolution scheduler',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            if (state.evolutionScheduler) {
                state.evolutionScheduler.start();
                return okResult('Auto-evolution scheduler started');
            }
            return errResult('Scheduler not available');
        },
    });
    api.registerTool({
        name: 'zcrystal_scheduler_stop',
        label: 'ZCrystal Scheduler Stop',
        description: 'Stop auto-evolution scheduler',
        parameters: Type.Object({}),
        async execute(_id, _params) {
            if (state.evolutionScheduler) {
                state.evolutionScheduler.stop();
                return okResult('Auto-evolution scheduler stopped');
            }
            return errResult('Scheduler not available');
        },
    });
}
//# sourceMappingURL=system-tools.js.map