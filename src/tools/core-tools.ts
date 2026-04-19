/**
 * Core Tools - Original ZCrystal features
 */

import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { PluginState } from '../index.js';
import { okResult, errResult } from '../index.js';
import type { Skill } from '@zcrystal/evo';

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
      const result = await state.honcho.search(params.query, params.limit || 10);
      if (result.ok) return okResult(JSON.stringify(result.data, null, 2), { results: result.data });
      return errResult('Search failed');
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
      if (result.ok) return okResult(result.data, { question: params.question });
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
      const result = await state.skillManager.getSkills();
      const skills = result.ok ? result.data : [];
      const text = skills.length === 0 ? 'No skills discovered' 
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
      const skillResult = await state.skillManager.getSkill(params.slug);
      if (!skillResult.ok || !skillResult.data) return errResult('Skill not found');
      const contentResult = await state.skillManager.readContent(skillResult.data);
      if (!contentResult.ok) return errResult('Failed to read skill');
      return okResult(contentResult.data, { slug: params.slug });
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
      console.log('[ZCrystal] Trace recorded:', params);
      return okResult('Trace recorded', { skillSlug: params.skillSlug });
    },
  }, { optional: true });
}
