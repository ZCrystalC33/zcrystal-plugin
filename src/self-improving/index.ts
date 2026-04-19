/**
 * ZCrystal Self-Improving Engine
 * 
 * Integrates OpenClaw's self-improving patterns with ZCrystal's evolution system:
 * - Corrections Log (like OpenClaw's corrections.md)
 * - Heartbeat Engine (periodic maintenance)
 * - Layer Exchange (HOT→WARM→COLD)
 * - Context Predictor (predict user needs)
 */

import { writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// ============================================================================
// Types
// ============================================================================

export interface Correction {
  timestamp: string;
  context: string;
  reflection: string;
}

export interface HeartbeatState {
  lastRun: number;
  correctionsProcessed: number;
  layersExchanged: number;
  patternsLearned: number;
}

export interface ProactivePattern {
  pattern: string;
  successCount: number;
  lastUsed: number;
  description: string;
}

export interface LayerEntry {
  key: string;
  content: string;
  layer: 'HOT' | 'WARM' | 'COLD';
  lastReferenced: number;
  createdAt: number;
}

// ============================================================================
// Paths
// ============================================================================

const SELF_IMPROVING_DIR = join(process.env.HOME || '/home/snow', '.openclaw', 'zcrystal-self-improving');

const PATHS = {
  corrections: join(SELF_IMPROVING_DIR, 'corrections.md'),
  memory: join(SELF_IMPROVING_DIR, 'memory.md'),
  heartbeat: join(SELF_IMPROVING_DIR, 'heartbeat-state.md'),
  patterns: join(SELF_IMPROVING_DIR, 'patterns.md'),
  log: join(SELF_IMPROVING_DIR, 'log.md'),
  hotDir: join(SELF_IMPROVING_DIR, 'hot'),
  warmDir: join(SELF_IMPROVING_DIR, 'warm'),
  coldDir: join(SELF_IMPROVING_DIR, 'cold'),
};

// ============================================================================
// SelfImprovingEngine
// ============================================================================

export class SelfImprovingEngine {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directory structure
    try {
      await mkdir(SELF_IMPROVING_DIR, { recursive: true });
      await mkdir(PATHS.hotDir, { recursive: true });
      await mkdir(PATHS.warmDir, { recursive: true });
      await mkdir(PATHS.coldDir, { recursive: true });

      // Initialize files if they don't exist
      if (!existsSync(PATHS.corrections)) {
        await writeFile(PATHS.corrections, '# Corrections Log\n\n> Last 50 corrections. Format: `- [date] CONTEXT: ... REFLECTION: ...`\n\n', 'utf-8');
      }
      if (!existsSync(PATHS.memory)) {
        await writeFile(PATHS.memory, '# Self-Improving Memory (HOT)\n\n> Confirmed preferences and patterns only. Keep ≤100 lines.\n\n', 'utf-8');
      }
      if (!existsSync(PATHS.heartbeat)) {
        await writeFile(PATHS.heartbeat, JSON.stringify({ lastRun: 0, correctionsProcessed: 0, layersExchanged: 0, patternsLearned: 0 }, null, 2), 'utf-8');
      }
      if (!existsSync(PATHS.patterns)) {
        await writeFile(PATHS.patterns, '# Proactive Patterns\n\n> Learned patterns that worked.\n\n', 'utf-8');
      }
      if (!existsSync(PATHS.log)) {
        await writeFile(PATHS.log, '# Proactive Action Log\n\n', 'utf-8');
      }

      this.initialized = true;
    } catch (error) {
      console.error('[ZCrystal] Self-Improving init failed:', error);
    }
  }

  // =========================================================================
  // Corrections Log
  // =========================================================================

  async addCorrection(context: string, reflection: string): Promise<void> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entry = `\n- [${timestamp}] CONTEXT: ${context} | REFLECTION: ${reflection}`;

    try {
      const content = await readFile(PATHS.corrections, 'utf-8');
      const lines = content.split('\n');

      // Keep last 50 entries (after the header)
      const entries = lines.filter(l => l.trim().startsWith('- ['));
      entries.push(entry.trim());

      const trimmed = entries.slice(-50);
      const header = lines.slice(0, 4).join('\n');

      await writeFile(PATHS.corrections, header + '\n' + trimmed.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('[ZCrystal] Failed to add correction:', error);
    }
  }

  async getCorrections(limit = 10): Promise<Correction[]> {
    await this.initialize();

    try {
      const content = await readFile(PATHS.corrections, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().startsWith('- ['));

      return lines.slice(-limit).map(line => {
        const match = line.match(/-\ \[([^\]]+)\] CONTEXT: (.+) \| REFLECTION: (.+)/);
        if (match) {
          return { timestamp: match[1], context: match[2], reflection: match[3] };
        }
        return { timestamp: '', context: line, reflection: '' };
      });
    } catch {
      return [];
    }
  }

  // =========================================================================
  // Memory (HOT Layer)
  // =========================================================================

  async getMemory(): Promise<string> {
    await this.initialize();
    try {
      return await readFile(PATHS.memory, 'utf-8');
    } catch {
      return '';
    }
  }

  async addMemoryLine(content: string): Promise<void> {
    await this.initialize();

    try {
      const current = await readFile(PATHS.memory, 'utf-8');
      const lines = current.split('\n').filter(l => l.trim() && !l.startsWith('#'));

      lines.push(`- ${content}`);

      // Keep ≤100 lines
      const trimmed = lines.slice(-100);
      const header = current.split('\n').slice(0, 3).join('\n');

      await writeFile(PATHS.memory, header + '\n\n' + trimmed.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('[ZCrystal] Failed to add memory line:', error);
    }
  }

  // =========================================================================
  // Heartbeat Engine
  // =========================================================================

  async runHeartbeat(): Promise<{ actions: string[]; stats: HeartbeatState }> {
    await this.initialize();

    const state = await this.getHeartbeatState();
    const actions: string[] = [];

    // Check for stale memory entries
    const memory = await this.getMemory();
    const lines = memory.split('\n').filter(l => l.startsWith('-'));

    // Clean old entries if needed
    if (lines.length > 80) {
      actions.push('memory_trimmed');
    }

    // Update heartbeat state
    state.lastRun = Date.now();
    await this.saveHeartbeatState(state);

    return { actions, stats: state };
  }

  async getHeartbeatState(): Promise<HeartbeatState> {
    try {
      const content = await readFile(PATHS.heartbeat, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { lastRun: 0, correctionsProcessed: 0, layersExchanged: 0, patternsLearned: 0 };
    }
  }

  private async saveHeartbeatState(state: HeartbeatState): Promise<void> {
    await writeFile(PATHS.heartbeat, JSON.stringify(state, null, 2), 'utf-8');
  }

  // =========================================================================
  // Layer Exchange (HOT→WARM→COLD)
  // =========================================================================

  async exchangeLayers(): Promise<{ promoted: number; demoted: number }> {
    await this.initialize();

    let promoted = 0;
    let demoted = 0;

    try {
      const memory = await this.getMemory();
      const lines = memory.split('\n').filter(l => l.startsWith('-'));

      // If memory is full (> 80 lines), promote some to warm
      if (lines.length > 50) {
        const toPromote = lines.slice(0, 10);
        for (const line of toPromote) {
          const key = this.extractKey(line);
          await this.promoteToWarm(key, line);
          promoted++;
        }
        // Remove from memory
        await this.trimMemory(10);
      }

      const state = await this.getHeartbeatState();
      state.layersExchanged = promoted + demoted;
      await this.saveHeartbeatState(state);
    } catch (error) {
      console.error('[ZCrystal] Layer exchange failed:', error);
    }

    return { promoted, demoted };
  }

  private extractKey(line: string): string {
    const match = line.match(/\- (.+?)(?:\||\-)/);
    return match ? match[1].trim().substring(0, 50) : line.substring(0, 50);
  }

  private async promoteToWarm(key: string, content: string): Promise<void> {
    const warmFile = join(PATHS.warmDir, `${key.replace(/[^a-z0-9]/gi, '_')}.md`);
    await writeFile(warmFile, `# ${key}\n\n${content}\n\nCreated: ${new Date().toISOString()}\n`, 'utf-8');
  }

  private async trimMemory(lines: number): Promise<void> {
    const memory = await this.getMemory();
    const allLines = memory.split('\n');
    const contentLines = allLines.filter(l => l.startsWith('-'));
    const trimmed = contentLines.slice(lines);
    const header = allLines.slice(0, 3).join('\n');
    await writeFile(PATHS.memory, header + '\n\n' + trimmed.join('\n') + '\n', 'utf-8');
  }

  // =========================================================================
  // Context Predictor
  // =========================================================================

  async predictNeeds(currentContext: string): Promise<{ suggestions: string[]; confidence: number }> {
    await this.initialize();

    const suggestions: string[] = [];

    // Analyze recent corrections for patterns
    const corrections = await this.getCorrections(10);
    const contexts = corrections.map(c => c.context.toLowerCase());

    // Simple pattern matching
    if (currentContext.toLowerCase().includes('code') || currentContext.toLowerCase().includes('debug')) {
      suggestions.push('Consider checking for syntax errors or using the linter');
    }

    if (currentContext.toLowerCase().includes('test') || currentContext.toLowerCase().includes('fail')) {
      suggestions.push('Run tests to verify the fix works');
    }

    if (currentContext.toLowerCase().includes('deploy') || currentContext.toLowerCase().includes('push')) {
      suggestions.push('Verify deployment completes successfully');
    }

    // Look for repeated contexts
    const recentContexts = contexts.slice(-5);
    if (recentContexts.length >= 3) {
      const unique = [...new Set(recentContexts)];
      if (unique.length <= 2) {
        suggestions.push(`Topic "${unique[0]?.substring(0, 30)}" appears frequently - consider creating a pattern`);
      }
    }

    return {
      suggestions,
      confidence: suggestions.length > 0 ? 0.7 : 0.3
    };
  }

  // =========================================================================
  // Proactive Patterns
  // =========================================================================

  async addPattern(pattern: string, description: string): Promise<void> {
    await this.initialize();

    try {
      const content = await readFile(PATHS.patterns, 'utf-8');
      const lines = content.split('\n');

      // Add new pattern
      const entry = `\n- [${new Date().toISOString().substring(0, 10)}] ${pattern}: ${description}`;
      lines.push(entry);

      await writeFile(PATHS.patterns, lines.join('\n'), 'utf-8');
    } catch (error) {
      console.error('[ZCrystal] Failed to add pattern:', error);
    }
  }

  async getPatterns(): Promise<ProactivePattern[]> {
    try {
      const content = await readFile(PATHS.patterns, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().startsWith('- ['));
      return lines.map(line => {
        const match = line.match(/-\ \[([^\]]+)\] (.+?): (.+)/);
        return {
          pattern: match ? match[2] : line,
          description: match ? match[3] : '',
          successCount: 1,
          lastUsed: Date.now(),
        };
      });
    } catch {
      return [];
    }
  }

  // =========================================================================
  // Action Log
  // =========================================================================

  async logAction(action: string, result: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const entry = `\n- [${timestamp}] ${action}: ${result}`;
      const content = await readFile(PATHS.log, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      lines.push(entry.trim());

      // Keep last 100 entries
      const trimmed = lines.slice(-100);
      const header = content.split('\n').slice(0, 2).join('\n');
      await writeFile(PATHS.log, header + '\n' + trimmed.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('[ZCrystal] Failed to log action:', error);
    }
  }

  async getRecentActions(limit = 10): Promise<Array<{ timestamp: string; action: string; result: string }>> {
    try {
      const content = await readFile(PATHS.log, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().startsWith('- ['));

      return lines.slice(-limit).map(line => {
        const match = line.match(/-\ \[([^\]]+)\] (.+?): (.+)/);
        return match ? { timestamp: match[1], action: match[2], result: match[3] } : { timestamp: '', action: line, result: '' };
      });
    } catch {
      return [];
    }
  }

  // =========================================================================
  // Get full status
  // =========================================================================

  async getStatus(): Promise<{
    correctionsCount: number;
    memoryLines: number;
    patternsCount: number;
    heartbeat: HeartbeatState;
  }> {
    await this.initialize();

    const corrections = await this.getCorrections();
    const memory = await this.getMemory();
    const patterns = await this.getPatterns();
    const heartbeat = await this.getHeartbeatState();

    return {
      correctionsCount: corrections.length,
      memoryLines: memory.split('\n').filter(l => l.startsWith('-')).length,
      patternsCount: patterns.length,
      heartbeat,
    };
  }
}

// Export singleton
export const selfImproving = new SelfImprovingEngine();
