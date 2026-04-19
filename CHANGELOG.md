# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-04-19

### 🎉 Major Release: ZCrystal Plugin Unification

This release unifies ZCrystal_evo core engine with the OpenClaw plugin system.

#### Added

**Core Engine**
- `UnifiedApiRouter` - Central API router with 27+ endpoints
- `SelfEvolutionEngine` - DSPy + GEPA self-evolution
- `EvolutionCoordinator` - Multi-skill coordination
- `MemoryLayers` - L1-L5 memory system
- `TaskLifecycle` - Task management
- `ModelRouter` - Model selection

**Tools (18 total)**
- `zcrystal_evo_health` - Health check
- `zcrystal_search` - Honcho semantic search
- `zcrystal_ask_user` - Preference querying
- `zcrystal_skills` - Skill listing
- `zcrystal_skill_read` - Skill content reading
- `zcrystal_evolution_status` - Evolution status
- `zcrystal_evolve` - Trigger evolution
- `zcrystal_record_trace` - Trace recording *(Agent-internal)*
- `zcrystal_task_create` - Task creation *(Agent-internal)*
- `zcrystal_task_get` - Task retrieval *(Agent-internal)*
- `zcrystal_memory_store` - Memory storage L1-L5 *(Agent-internal)*
- `zcrystal_memory_load` - Memory loading *(Agent-internal)*
- `zcrystal_model_pick` - Model selection *(Agent-internal)*
- `zcrystal_fts5_search` - FTS5 full-text search
- `zcrystal_fts5_stats` - FTS5 statistics

**Commands**
- `/zcrystal_compact` - Compact + trigger evolution
- `/zcrystal_learn` - Teach preferences
- `/zcrystal_profile` - View profile

**Hooks**
- `zcrystal:msg_received` - Learn from user input
- `zcrystal:msg_sent` - Record AI responses

**FTS5 Integration**
- MCP HTTP bridge to OpenClaw FTS5 skill
- Port 18795 endpoint

#### Changed

- Renamed plugin to ZCrystal (was ZCrystal-evo-plugin)
- Unified architecture: single plugin, multiple capabilities
- Tool descriptions updated with *(Agent-internal)* markers

#### Fixed

- FTS5 search via MCP HTTP (avoiding sqlite3 CLI dependency)
- Honcho ask endpoint graceful degradation
- SkillManager path resolution

#### Technical Details

**Evolution Algorithm**
```
Phase 1: Generate (GEPA)
  - constraints: Add explicit constraints
  - examples: Add usage examples  
  - formatting: Improve markdown
  - clarity: Improve language

Phase 2: Score (DSPy)
  - Content quality heuristics
  - Structure quality
  - Historical success rate

Phase 3: Verify
  - 20-trace closed-loop validation
  - Degradation threshold: 0.5

Phase 4: Apply/Rollback
  - Score >= 0.5 → Apply
  - Score < 0.5 → Rollback
```

**Memory Layers**
| Layer | Type | Persistence | Use Case |
|-------|------|-------------|----------|
| L1 | Working | In-process | Current context |
| L2 | Session | In-process | Conversation |
| L3 | Short-term | Disk | Cross-session |
| L4 | Long-term | Disk | Persistent |
| L5 | Archive | Disk | Cold storage |

---

## [0.0.1] - 2026-04-14

### Initial Release

- Basic Honcho integration
- Skill discovery
- Self-evolution prototype
