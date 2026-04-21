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
import { join, basename, extname } from 'node:path';
import { homedir } from 'node:os';
import type { Skill, SkillMetadata } from './types.js';

// ============================================================
// Skill Discovery
// ============================================================

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private searchPaths: string[] = [];
  private initialized = false;
  // Cache with TTL (5 minutes)
  private _cache: { skills: Skill[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(searchPaths: string[] = []) {
    this.searchPaths = searchPaths.map(p => p.replace('~', homedir()));
  }

  /**
   * Discover all skills in configured paths (cached)
   */
  async discover(): Promise<Skill[]> {
    // Return cached result if still valid
    if (this._cache && Date.now() - this._cache.timestamp < this.CACHE_TTL_MS) {
      return this._cache.skills;
    }

    this.skills.clear();
    
    for (const basePath of this.searchPaths) {
      try {
        await this.discoverInDirectory(basePath);
      } catch {
        // Directory might not exist, skip
      }
    }
    
    this.initialized = true;
    const result = Array.from(this.skills.values());
    
    // Update cache
    this._cache = { skills: result, timestamp: Date.now() };
    return result;
  }
  
  /**
   * Clear the cache to force rediscovery
   */
  clearCache(): void {
    this._cache = null;
  }

  /**
   * Discover skills in a directory (recursive)
   */
  private async discoverInDirectory(dirPath: string, depth = 0): Promise<void> {
    if (depth > 3) return; // Max depth to prevent infinite recursion
    
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        
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
          } catch {
            // Not a skill directory, recurse
            await this.discoverInDirectory(fullPath, depth + 1);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Check if this is a skill markdown file
          const skill = await this.parseStandaloneSkill(fullPath);
          if (skill) {
            this.skills.set(skill.slug, skill);
          }
        }
      }
    } catch {
      // Directory not accessible, skip
    }
  }

  /**
   * Parse SKILL.md and extract metadata
   */
  private async parseSkill(skillDir: string): Promise<Skill | null> {
    const skillMdPath = join(skillDir, 'SKILL.md');
    
    try {
      const content = await readFile(skillMdPath, 'utf-8');
      return this.parseSkillContent(skillDir, content);
    } catch {
      return null;
    }
  }

  /**
   * Parse standalone .md file as skill
   */
  private async parseStandaloneSkill(filePath: string): Promise<Skill | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return this.parseSkillContent(basename(filePath, '.md'), content);
    } catch {
      return null;
    }
  }

  /**
   * Parse skill content and extract metadata
   */
  private parseSkillContent(basePath: string, content: string): Skill | null {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    let name = basename(basePath);
    let slug = this.slugify(name);
    let description = '';
    let version = '1.0.0';
    let metadata: SkillMetadata = {};
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      // Parse YAML-like frontmatter
      const nameMatch = frontmatter.match(/name:\s*(.+)/i);
      if (nameMatch) name = nameMatch[1].trim();
      
      const slugMatch = frontmatter.match(/slug:\s*(.+)/i);
      if (slugMatch) slug = slugMatch[1].trim();
      
      const versionMatch = frontmatter.match(/version:\s*(.+)/i);
      if (versionMatch) version = versionMatch[1].trim();
      
      const descMatch = frontmatter.match(/description:\s*["'](.+)["']/i);
      if (descMatch) description = descMatch[1].trim();
      
      // Try to parse metadata JSON block
      const metaMatch = frontmatter.match(/metadata:\s*(\{[\s\S]*?\})/);
      if (metaMatch) {
        try {
          metadata = JSON.parse(metaMatch[1].replace(/'/g, '"'));
        } catch {
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
  private slugify(name: string): string {
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
  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skill by slug
   */
  getSkill(slug: string): Skill | undefined {
    return this.skills.get(slug);
  }

  /**
   * Search skills by name/description
   */
  searchSkills(query: string, limit = 10): Skill[] {
    const lowerQuery = query.toLowerCase();
    const results: Skill[] = [];
    
    for (const skill of this.skills.values()) {
      if (
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(skill);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Read skill content
   */
  async readSkillContent(skill: Skill): Promise<string> {
    try {
      return await readFile(skill.filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Update skill file
   */
  async writeSkillContent(skill: Skill, content: string): Promise<boolean> {
    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(skill.filePath, content, 'utf-8');
      
      // Re-parse to update metadata
      const updated = await this.parseSkill(basename(skill.filePath, '.md'));
      if (updated) {
        this.skills.set(updated.slug, updated);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if skills are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reload skills from disk
   */
  async reload(): Promise<Skill[]> {
    return this.discover();
  }
}

// ============================================================
// Factory
// ============================================================

export function createSkillManager(paths?: string[]): SkillManager {
  const defaultPaths = [
    '~/.openclaw/skills',
    '~/.hermes/skills',
  ];
  
  return new SkillManager(paths || defaultPaths);
}
