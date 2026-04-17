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
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
// ============================================================
// Skill Discovery
// ============================================================
export class SkillManager {
    skills = new Map();
    searchPaths = [];
    initialized = false;
    constructor(searchPaths = []) {
        this.searchPaths = searchPaths.map(p => p.replace('~', homedir()));
    }
    /**
     * Discover all skills in configured paths
     */
    async discover() {
        this.skills.clear();
        for (const basePath of this.searchPaths) {
            try {
                await this.discoverInDirectory(basePath);
            }
            catch {
                // Directory might not exist, skip
            }
        }
        this.initialized = true;
        return Array.from(this.skills.values());
    }
    /**
     * Discover skills in a directory (recursive)
     */
    async discoverInDirectory(dirPath, depth = 0) {
        if (depth > 3)
            return; // Max depth to prevent infinite recursion
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.'))
                    continue;
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Check for SKILL.md in subdirectory
                    const skillMdPath = join(fullPath, 'SKILL.md');
                    try {
                        await stat(skillMdPath);
                        const skill = await this.parseSkill(fullPath);
                        if (skill) {
                            this.skills.set(skill.slug, skill);
                        }
                    }
                    catch {
                        // Not a skill directory, recurse
                        await this.discoverInDirectory(fullPath, depth + 1);
                    }
                }
                else if (entry.isFile() && entry.name.endsWith('.md')) {
                    // Check if this is a skill markdown file
                    const skill = await this.parseStandaloneSkill(fullPath);
                    if (skill) {
                        this.skills.set(skill.slug, skill);
                    }
                }
            }
        }
        catch {
            // Directory not accessible, skip
        }
    }
    /**
     * Parse SKILL.md and extract metadata
     */
    async parseSkill(skillDir) {
        const skillMdPath = join(skillDir, 'SKILL.md');
        try {
            const content = await readFile(skillMdPath, 'utf-8');
            return this.parseSkillContent(skillDir, content);
        }
        catch {
            return null;
        }
    }
    /**
     * Parse standalone .md file as skill
     */
    async parseStandaloneSkill(filePath) {
        try {
            const content = await readFile(filePath, 'utf-8');
            return this.parseSkillContent(basename(filePath, '.md'), content);
        }
        catch {
            return null;
        }
    }
    /**
     * Parse skill content and extract metadata
     */
    parseSkillContent(basePath, content) {
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let name = basename(basePath);
        let slug = this.slugify(name);
        let description = '';
        let version = '1.0.0';
        let metadata = {};
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            // Parse YAML-like frontmatter
            const nameMatch = frontmatter.match(/name:\s*(.+)/i);
            if (nameMatch)
                name = nameMatch[1].trim();
            const slugMatch = frontmatter.match(/slug:\s*(.+)/i);
            if (slugMatch)
                slug = slugMatch[1].trim();
            const versionMatch = frontmatter.match(/version:\s*(.+)/i);
            if (versionMatch)
                version = versionMatch[1].trim();
            const descMatch = frontmatter.match(/description:\s*["'](.+)["']/i);
            if (descMatch)
                description = descMatch[1].trim();
            // Try to parse metadata JSON block
            const metaMatch = frontmatter.match(/metadata:\s*(\{[\s\S]*?\})/);
            if (metaMatch) {
                try {
                    metadata = JSON.parse(metaMatch[1].replace(/'/g, '"'));
                }
                catch {
                    // Ignore parse errors
                }
            }
        }
        // Fallback: extract description from first paragraph
        if (!description) {
            const firstParaMatch = content.match(/^#\s+.+\n\n([^\n#]+)/);
            if (firstParaMatch) {
                description = firstParaMatch[1].trim().slice(0, 200);
            }
        }
        return {
            name,
            slug,
            version,
            description,
            filePath: join(basePath, 'SKILL.md'),
            metadata,
        };
    }
    /**
     * Convert name to slug
     */
    slugify(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    // ============================================================
    // Skill Access
    // ============================================================
    /**
     * Get all discovered skills
     */
    getSkills() {
        return Array.from(this.skills.values());
    }
    /**
     * Get skill by slug
     */
    getSkill(slug) {
        return this.skills.get(slug);
    }
    /**
     * Search skills by name/description
     */
    searchSkills(query, limit = 10) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const skill of this.skills.values()) {
            if (skill.name.toLowerCase().includes(lowerQuery) ||
                skill.description.toLowerCase().includes(lowerQuery)) {
                results.push(skill);
                if (results.length >= limit)
                    break;
            }
        }
        return results;
    }
    /**
     * Read skill content
     */
    async readSkillContent(skill) {
        try {
            return await readFile(skill.filePath, 'utf-8');
        }
        catch {
            return '';
        }
    }
    /**
     * Update skill file
     */
    async writeSkillContent(skill, content) {
        try {
            const { writeFile } = await import('node:fs/promises');
            await writeFile(skill.filePath, content, 'utf-8');
            // Re-parse to update metadata
            const updated = await this.parseSkill(basename(skill.filePath, '.md'));
            if (updated) {
                this.skills.set(updated.slug, updated);
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if skills are initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Reload skills from disk
     */
    async reload() {
        return this.discover();
    }
}
// ============================================================
// Factory
// ============================================================
export function createSkillManager(paths) {
    const defaultPaths = [
        '~/.openclaw/skills',
        '~/.hermes/skills',
    ];
    return new SkillManager(paths || defaultPaths);
}
//# sourceMappingURL=skill-manager.js.map