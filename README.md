# ZCrystal Plugin for OpenClaw

**Powered by ZCrystal_evo v0.3.0** — Self-Evolution + Honcho + Skills + TaskLifecycle + MemoryLayers + FTS5

A unified TypeScript OpenClaw plugin combining Honcho integration, skill management, self-evolution engine, multi-layer memory, and full-text search.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw Core                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZCrystal Plugin (TypeScript)                         │
│                                                                         │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐       │
│  │ HonchoClient │ SkillManager  │ SelfEvolution │  UnifiedApi   │       │
│  │  (Search)    │   (Skills)    │   Engine      │    Router     │       │
│  └───────────────┴───────────────┴───────────────┴───────────────┘       │
│                                                                         │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐       │
│  │ TaskLifecycle │ MemoryLayers  │  ModelRouter  │  FTS5Bridge    │       │
│  │  (Tasks)      │   (L1-L5)    │   (Pick)      │  (Search)     │       │
│  └───────────────┴───────────────┴───────────────┴───────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   Local Honcho Service    ~/.openclaw/fts5.db    Self-Evolution Stores
```

## Features

### 1. 🔍 Honcho Integration
- Semantic search across conversations
- User preference learning
- Session context injection

### 2. 🛠️ Skill System
- SKILL.md discovery and lifecycle management
- Skill versioning and rollback
- Auto-reload on changes

### 3. 🧬 Self-Evolution Engine
- **DSPy-style scoring**: Multi-factor candidate evaluation
- **GEPA mutations**: constraints, examples, formatting, clarity
- **Closed-loop verification**: 20-trace validation
- **Auto-rollback**: Degradation detection

### 4. 📝 Task Lifecycle
- Create, track, and manage tasks
- Multiple trigger types: telegram, signal, webhook, cron, manual

### 5. 🧠 Memory Layers (L1-L5)
- **L1**: Working memory (in-process cache)
- **L2**: Session memory (conversation-level)
- **L3**: Short-term memory (cross-session)
- **L4**: Long-term memory (persistent)
- **L5**: Archive memory (cold storage)

### 6. 🔎 FTS5 Full-Text Search
- Conversation history search via MCP HTTP
- Statistics and indexing

## Tools

### User-Facing Tools

| Tool | Description |
|------|-------------|
| `zcrystal_evo_health` | Health check for ZCrystal_evo core |
| `zcrystal_search` | Search conversation history (Honcho) |
| `zcrystal_ask_user` | Ask Honcho about user preferences |
| `zcrystal_skills` | List all available skills |
| `zcrystal_skill_read` | Read skill content |
| `zcrystal_evolution_status` | Get evolution history and status |
| `zcrystal_evolve` | Trigger self-evolution |
| `zcrystal_fts5_search` | Search conversation history (FTS5) |
| `zcrystal_fts5_stats` | Get FTS5 database statistics |

### Agent-Internal Tools

| Tool | Description |
|------|-------------|
| `zcrystal_record_trace` | Record execution trace (Agent-internal) |
| `zcrystal_task_create` | Create a new task (Agent-internal) |
| `zcrystal_task_get` | Get task by ID (Agent-internal) |
| `zcrystal_memory_store` | Store data in memory L1-L5 (Agent-internal) |
| `zcrystal_memory_load` | Load from memory layers (Agent-internal) |
| `zcrystal_model_pick` | Pick best model for task type (Agent-internal) |

## Commands

| Command | Description |
|---------|-------------|
| `/zcrystal_compact` | Compact conversation + trigger self-evolution |
| `/zcrystal_learn <preference>` | Teach ZCrystal your preferences |
| `/zcrystal_profile` | View ZCrystal profile |

## Hooks

| Hook | When | Action |
|------|------|--------|
| `zcrystal:msg_received` | Message received | Learn user input |
| `zcrystal:msg_sent` | Message sent | Record AI response |

## Installation

```bash
# Clone and build
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build

# Copy to extensions
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

## Configuration

```json
{
  "plugins": {
    "entries": {
      "zcrystal": {
        "enabled": true,
        "source": "path",
        "sourcePath": "~/.openclaw/workspace/zcrystal-plugin/dist",
        "installPath": "~/.openclaw/extensions/zcrystal/dist"
      }
    },
    "allow": ["zcrystal"]
  }
}
```

## Development

```bash
# Build
npm run build

# Type check
npx tsc --noEmit

# Watch mode
npx tsc --watch
```

## Dependencies

- `openclaw` >= 2026.3.24-beta.2
- `@sinclair/typebox` for TypeBox schemas
- ZCrystal_evo core engine (bundled)

## License

MIT

---

**Powered by ZCrystal_evo** — Self-Evolution AI System
