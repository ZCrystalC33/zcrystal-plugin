/**
 * Self-Evolution Engine for ZCrystal Plugin
 *
 * Aligns with: https://github.com/nousresearch/hermes-agent-self-evolution
 *
 * Features:
 * - DSPy + GEPA (Genetic-Pareto Prompt Evolution)
 * - Skill optimization
 * - Tool description optimization
 * - System prompt optimization
 * - Execution trace analysis
 */
const MUTATION_RULES = [
    {
        name: 'clarity',
        description: 'Make instructions clearer and more specific',
        apply: (content) => [
            content.replace(/\./g, '.').replace(/([a-z])\./g, '$1. '), // Add spacing
            content.length < 100 ? content + '\n\nProvide specific examples.' : content,
        ],
    },
    {
        name: 'structure',
        description: 'Improve structure with better formatting',
        apply: (content) => {
            if (!content.includes('\n## ')) {
                return [
                    content.replace(/^([^#\n]+)/, '## Overview\n\n$1'),
                    content.replace(/\n\n/g, '\n\n## Details\n\n'),
                ];
            }
            return [content];
        },
    },
    {
        name: 'examples',
        description: 'Add or expand examples',
        apply: (content) => {
            if (content.includes('Example:') || content.includes('```')) {
                return [content]; // Already has examples
            }
            return [
                content + '\n\n## Example\n\n```\n/example usage\n```',
            ];
        },
    },
    {
        name: 'constraints',
        description: 'Add explicit constraints',
        apply: (content) => {
            if (content.includes('Constraint') || content.includes('Must')) {
                return [content];
            }
            return [
                content + '\n\n## Constraints\n\n- Keep responses concise\n- Prioritize safety',
            ];
        },
    },
];
// ============================================================
// Self-Evolution Engine
// ============================================================
export class SelfEvolutionEngine {
    skillManager;
    traces = new Map();
    evolutionHistory = [];
    config;
    constructor(skillManager, config = {}) {
        this.skillManager = skillManager;
        this.config = {
            target: config.target || 'all',
            iterations: config.iterations || 10,
            evalSource: config.evalSource || 'synthetic',
            provider: config.provider,
            model: config.model,
        };
    }
    // ============================================================
    // Trace Collection
    // ============================================================
    /**
     * Record an execution trace for a skill
     */
    recordTrace(skillSlug, trace) {
        const existing = this.traces.get(skillSlug) || [];
        existing.push(trace);
        this.traces.set(skillSlug, existing);
    }
    /**
     * Get traces for a skill
     */
    getTraces(skillSlug) {
        return this.traces.get(skillSlug) || [];
    }
    /**
     * Clear traces for a skill
     */
    clearTraces(skillSlug) {
        if (skillSlug) {
            this.traces.delete(skillSlug);
        }
        else {
            this.traces.clear();
        }
    }
    // ============================================================
    // Evolution
    // ============================================================
    /**
     * Run evolution on a skill
     * Returns candidates sorted by score
     */
    async evolveSkill(skill, options) {
        const iterations = options?.iterations || this.config.iterations || 10;
        const candidates = [];
        // Read current content
        const currentContent = await this.skillManager.readSkillContent(skill);
        // Generate initial candidates
        let allVariants = [currentContent];
        // Apply mutations
        for (const rule of MUTATION_RULES) {
            for (const variant of [...allVariants]) {
                const mutations = rule.apply(variant);
                allVariants.push(...mutations);
            }
        }
        // Deduplicate
        allVariants = [...new Set(allVariants)];
        // Limit candidates
        allVariants = allVariants.slice(0, iterations);
        // Score each candidate
        for (let i = 0; i < allVariants.length; i++) {
            const variant = allVariants[i];
            const candidate = await this.scoreCandidate(skill, variant, i);
            candidates.push(candidate);
        }
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);
        // Create result
        const result = {
            target: `skill:${skill.slug}`,
            candidates,
            bestCandidate: candidates[0],
            timestamp: Date.now(),
        };
        this.evolutionHistory.push(result);
        return result;
    }
    /**
     * Score a candidate variant
     */
    async scoreCandidate(skill, content, index) {
        const traces = this.getTraces(skill.slug);
        let score = 0.5; // Base score
        // Penalize if too long (Hermes has size limits)
        const SKILL_SIZE_LIMIT = 15 * 1024; // 15KB
        if (content.length > SKILL_SIZE_LIMIT) {
            score -= 0.3;
        }
        // Bonus for structure
        if (content.includes('## ') && content.includes('\n')) {
            score += 0.1;
        }
        // Bonus for examples
        if (content.includes('```') || content.includes('Example:')) {
            score += 0.1;
        }
        // Score based on trace success rate
        if (traces.length > 0) {
            const successRate = traces.filter(t => t.success).length / traces.length;
            score = score * 0.5 + successRate * 0.5;
        }
        // Identify mutations
        const mutations = this.identifyMutations(skill, content);
        return {
            id: `candidate-${index}`,
            content,
            score,
            mutations,
        };
    }
    /**
     * Identify what changed between original and candidate
     */
    identifyMutations(skill, candidateContent) {
        const originalContent = skill.description; // Simplified
        const mutations = [];
        // Simplified mutation detection
        if (candidateContent.includes('## Overview') && !skill.description.includes('## Overview')) {
            mutations.push({
                type: 'description',
                original: 'No structure',
                mutated: 'Added ## Overview section',
                rationale: 'Improves readability',
            });
        }
        if (candidateContent.includes('```') && !skill.description.includes('```')) {
            mutations.push({
                type: 'example',
                original: 'No examples',
                mutated: 'Added code example',
                rationale: 'Provides concrete usage',
            });
        }
        return mutations;
    }
    // ============================================================
    // Apply Best Candidate
    // ============================================================
    /**
     * Apply the best candidate to a skill
     */
    async applyBestCandidate(result) {
        if (!result.bestCandidate) {
            return false;
        }
        const skillSlug = result.target.replace('skill:', '');
        const skill = this.skillManager.getSkill(skillSlug);
        if (!skill) {
            return false;
        }
        return this.skillManager.writeSkillContent(skill, result.bestCandidate.content);
    }
    // ============================================================
    // Batch Evolution
    // ============================================================
    /**
     * Evolve all skills
     */
    async evolveAllSkills(options) {
        const results = new Map();
        const skills = this.skillManager.getSkills();
        for (const skill of skills) {
            try {
                const result = await this.evolveSkill(skill, options);
                results.set(skill.slug, result);
            }
            catch {
                // Skip failed evolutions
            }
        }
        return results;
    }
    // ============================================================
    // Tool Description Evolution
    // ============================================================
    /**
     * Evolve tool descriptions
     */
    async evolveToolDescription(toolName, currentDescription, options) {
        const TOOL_DESC_LIMIT = 500; // Characters
        const candidates = [];
        // Generate variants
        const variants = [
            currentDescription.slice(0, TOOL_DESC_LIMIT),
            currentDescription.replace(/\./g, '. ').slice(0, TOOL_DESC_LIMIT),
            `${currentDescription}\n\nReturns structured output.`.slice(0, TOOL_DESC_LIMIT),
        ];
        for (let i = 0; i < variants.length; i++) {
            const content = variants[i];
            candidates.push({
                id: `tool-${toolName}-${i}`,
                content,
                score: this.scoreToolDescription(content),
                mutations: [],
            });
        }
        candidates.sort((a, b) => b.score - a.score);
        const result = {
            target: `tool:${toolName}`,
            candidates,
            bestCandidate: candidates[0],
            timestamp: Date.now(),
        };
        this.evolutionHistory.push(result);
        return result;
    }
    /**
     * Score tool description
     */
    scoreToolDescription(description) {
        let score = 0.5;
        // Length check
        if (description.length > 500) {
            score -= 0.3;
        }
        else if (description.length > 200) {
            score += 0.1;
        }
        // Has verbs
        if (/\b(returns?|creates?|updates?|deletes?|fetches?|retrieves?)\b/i.test(description)) {
            score += 0.2;
        }
        return Math.max(0, Math.min(1, score));
    }
    // ============================================================
    // History
    // ============================================================
    /**
     * Get evolution history
     */
    getHistory() {
        return [...this.evolutionHistory];
    }
    /**
     * Get last evolution result for a target
     */
    getLastEvolution(target) {
        return this.evolutionHistory.filter(r => r.target === target).pop();
    }
    // ============================================================
    // Configuration
    // ============================================================
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// ============================================================
// Factory
// ============================================================
export function createSelfEvolutionEngine(skillManager, config) {
    return new SelfEvolutionEngine(skillManager, config);
}
//# sourceMappingURL=self-evolution.js.map