/**
 * Skill Manager for ZCrystal Plugin
 *
 * OpenClaw-compatible skill system.
 * Aligns with Hermes Skills: https://github.com/nousresearch/hermes-agent/tree/main/skills
 *
 * Features:
 * - SKILL.md discovery
 * - Skill metadata parsing
 * - Skill lifecycle management
 */
import type { Skill } from './types.js';
export declare class SkillManager {
    private skills;
    private searchPaths;
    private initialized;
    private _cache;
    private readonly CACHE_TTL_MS;
    constructor(searchPaths?: string[]);
    /**
     * Discover all skills in configured paths (cached)
     */
    discover(): Promise<Skill[]>;
    /**
     * Clear the cache to force rediscovery
     */
    clearCache(): void;
    /**
     * Discover skills in a directory (recursive)
     */
    private discoverInDirectory;
    /**
     * Parse SKILL.md and extract metadata
     */
    private parseSkill;
    /**
     * Parse standalone .md file as skill
     */
    private parseStandaloneSkill;
    /**
     * Parse skill content and extract metadata
     */
    private parseSkillContent;
    /**
     * Convert name to slug
     */
    private slugify;
    /**
     * Get all discovered skills
     */
    getSkills(): Skill[];
    /**
     * Get skill by slug
     */
    getSkill(slug: string): Skill | undefined;
    /**
     * Search skills by name/description
     */
    searchSkills(query: string, limit?: number): Skill[];
    /**
     * Read skill content
     */
    readSkillContent(skill: Skill): Promise<string>;
    /**
     * Update skill file
     */
    writeSkillContent(skill: Skill, content: string): Promise<boolean>;
    /**
     * Check if skills are initialized
     */
    isInitialized(): boolean;
    /**
     * Reload skills from disk
     */
    reload(): Promise<Skill[]>;
}
export declare function createSkillManager(paths?: string[]): SkillManager;
//# sourceMappingURL=skill-manager.d.ts.map