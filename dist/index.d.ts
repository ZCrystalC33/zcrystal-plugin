/**
 * ZCrystal Plugin for OpenClaw (Powered by ZCrystal_evo)
 *
 * Unified plugin combining:
 * - Original zcrystal features (Honcho integration, Skills, Self-Evolution)
 * - ZCrystal_evo advanced features (TaskLifecycle, MemoryLayers, ModelRouter)
 * - FTS5 search integration
 */
import { UnifiedApiRouter, createHonchoClient, createSkillManager, SelfEvolutionEngine, EvolutionCoordinator, EvolutionScheduler, ReviewEngine, ToolHub, SkillGenerator, SkillVersioning, SkillIndexer, SkillValidator, SkillMerger, CircuitBreaker, RateLimiter, StructuredLogger, Metrics, WorkflowEngine, OpenClawSkillAdapter, SkillSyncManager, ReplayRunner, HookRegistry } from '@zcrystal/evo';
export interface PluginState {
    router: UnifiedApiRouter;
    honcho: ReturnType<typeof createHonchoClient>;
    skillManager: ReturnType<typeof createSkillManager>;
    selfEvolution: SelfEvolutionEngine;
    evolutionCoordinator: EvolutionCoordinator;
    evolutionScheduler?: EvolutionScheduler;
    toolHub: ToolHub;
    skillGenerator: SkillGenerator;
    skillVersioning: SkillVersioning;
    skillIndexer: SkillIndexer;
    skillValidator: SkillValidator;
    skillMerger: SkillMerger;
    reviewEngine: ReviewEngine;
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
declare function okResult(text: string, details?: unknown): {
    content: {
        type: "text";
        text: string;
    }[];
    details: {};
};
declare function errResult(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
    details: {};
    isError: boolean;
};
export { okResult, errResult };
declare const _default: {
    id: string;
    name: string;
    description: string;
    configSchema: import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginConfigSchema;
    register: NonNullable<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition["register"]>;
} & Pick<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition, "kind" | "reload" | "nodeHostCommands" | "securityAuditCollectors">;
export default _default;
//# sourceMappingURL=index.d.ts.map