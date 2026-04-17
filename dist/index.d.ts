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
declare const _default: {
    id: string;
    name: string;
    description: string;
    configSchema: import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginConfigSchema;
    register: NonNullable<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition["register"]>;
} & Pick<import("openclaw/plugin-sdk/plugin-entry").OpenClawPluginDefinition, "kind" | "reload" | "nodeHostCommands" | "securityAuditCollectors">;
export default _default;
//# sourceMappingURL=index.d.ts.map