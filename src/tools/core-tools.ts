/**
 * Core Tools - Original ZCrystal features
 */

import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { PluginState } from '../index.js';
import { okResult, errResult } from '../index.js';
import type { Skill } from '@zcrystal/evo';
import type { SearchResult } from '../types.js';

// ============================================================
// Type Helpers (FIX: Replace messy inline casting with helpers)
// ============================================================

interface Result<T> { ok: true; data: T }

function isResult<T>(val: T | { ok: true; data: T } | unknown): val is { ok: true; data: T } {
  return typeof val === 'object' && val !== null && 'ok' in val && (val as { ok: boolean }).ok === true;
}

function unwrapSkills(val: unknown): Skill[] {
  if (Array.isArray(val)) return val as Skill[];
  if (isResult(val)) return (val as Result<Skill[]>).data;
  return [];
}

function unwrapSkill(val: unknown): Skill | undefined {
  if (Array.isArray(val)) return val[0] as Skill;
  if (isResult(val)) return (val as Result<Skill>).data;
  return val as Skill | undefined;
}

function unwrapString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (isResult(val)) return (val as Result<string>).data || '';
  return '';
}

export function registerCoreTools(api: OpenClawPluginApi, state: PluginState) {
  // zcrystal_evo_health
  api.registerTool({
    name: 'zcrystal_evo_health',
    label: 'ZCrystal Evo Health',
    description: 'Health check for ZCrystal_evo core',
    parameters: Type.Object({}),
    async execute(_id, _params) {
      const result = await state.router.healthCheck();
      if (result.success) return okResult('ZCrystal_evo is healthy', result.data);
      return errResult(result.error ?? 'Health check failed');
    },
  });

  // zcrystal_search
  api.registerTool({
    name: 'zcrystal_search',
    label: 'ZCrystal Search',
    description: 'Search conversation history using Honcho',
    parameters: Type.Object({ query: Type.String(), limit: Type.Optional(Type.Number()) }),
    async execute(_id, params) {
      // @zcrystal/evo HonchoClient.search(query, limit) returns Promise<Result<unknown[]>>
      const result = await state.honcho.search(params.query, params.limit || 10);
      if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
        return okResult(JSON.stringify(result.data, null, 2), { count: result.data.length });
      }
      return errResult(result.ok ? 'Search returned no results' : String(result.error ?? 'Search failed'));
    },
  });

  // zcrystal_ask_user
  api.registerTool({
    name: 'zcrystal_ask_user',
    label: 'ZCrystal Ask User',
    description: 'Ask Honcho about user preferences',
    parameters: Type.Object({ question: Type.String(), depth: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      const result = await state.honcho.ask('user', params.question, params.depth || 'quick');
      if (result.ok && result.data) return okResult(result.data, { question: params.question });
      return errResult('Ask failed');
    },
  });

  // zcrystal_skills
  api.registerTool({
    name: 'zcrystal_skills',
    label: 'ZCrystal Skills',
    description: 'List all available skills',
    parameters: Type.Object({}),
    async execute(_id, _params) {
      // FIX: Use helper type guards instead of inline casting
      const result = await state.skillManager.getSkills();
      const skills = unwrapSkills(result);
      const text = skills.length === 0
        ? 'No skills discovered'
        : skills.map((s: Skill) => `- ${s.name} (${s.slug}): ${s.description}`).join('\n');
      return okResult(text, { count: skills.length });
    },
  });

  // zcrystal_skill_read
  api.registerTool({
    name: 'zcrystal_skill_read',
    label: 'ZCrystal Skill Read',
    description: 'Read content of a skill',
    parameters: Type.Object({ slug: Type.String() }),
    async execute(_id, params) {
      // FIX: Use helper type guards instead of inline casting
      const skillResult = await state.skillManager.getSkill(params.slug);
      const skill = unwrapSkill(skillResult);
      if (!skill) return errResult('Skill not found: ' + params.slug);
      const contentResult = await state.skillManager.readContent(skill);
      const content = unwrapString(contentResult);
      if (!content) return errResult('Failed to read skill content');
      return okResult(content, { slug: params.slug });
    },
  });

  // zcrystal_evolution_status
  api.registerTool({
    name: 'zcrystal_evolution_status',
    label: 'ZCrystal Evolution Status',
    description: 'Get evolution history and status',
    parameters: Type.Object({}),
    async execute(_id, _params) {
      const result = await state.router.getEvolutionStatus();
      if (result.success) return okResult(JSON.stringify(result.data, null, 2), result.data);
      return errResult('Evolution status unavailable');
    },
  });

  // zcrystal_evolve
  api.registerTool({
    name: 'zcrystal_evolve',
    label: 'ZCrystal Evolve',
    description: 'Trigger self-evolution for a skill or all skills',
    parameters: Type.Object({ slug: Type.Optional(Type.String()), iterations: Type.Optional(Type.Number()) }),
    async execute(_id, params) {
      const result = await state.router.startEvolution(params.slug);
      if (result.success) return okResult('Evolution started', result.data);
      return errResult(result.error ?? 'Evolution failed');
    },
  }, { optional: true });

  // zcrystal_record_trace
  api.registerTool({
    name: 'zcrystal_record_trace',
    label: 'ZCrystal Record Trace',
    description: 'Record execution trace (Agent-internal)',
    parameters: Type.Object({
      skillSlug: Type.String(), input: Type.String(), output: Type.String(),
      success: Type.Boolean(), duration: Type.Number(),
    }),
    async execute(_id, params) {
      state.logger.info('[ZCrystal] Trace recorded', { skillSlug: params.skillSlug, success: params.success });
      return okResult('Trace recorded', { skillSlug: params.skillSlug });
    },
  }, { optional: true });
}
