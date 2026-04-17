# ZCrystal Plugin for OpenClaw

**Honcho + Skills + Self-Evolution**

A pure TypeScript OpenClaw plugin that brings Hermes Agent's core patterns to OpenClaw.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw Core                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ZCrystal Plugin (TypeScript)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ HonchoClient      │ SkillManager    │ SelfEvolution │   │
│  │ (HTTP API)        │ (SKILL.md)      │ (DSPy+GEPA)  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Local Honcho Service
```

## Features

### 1. Honcho Integration
- Connect to local Honcho service
- Semantic search across conversations
- User modeling and preference learning
- Session context for LLMs

### 2. Skill System (OpenClaw Compatible)
- SKILL.md discovery
- Skill lifecycle management
- Auto-reload on changes

### 3. Self-Evolution Engine
- DSPy + GEPA (Genetic-Pareto Prompt Evolution)
- Triggered on `/compact`
- Optimizes: Skills, Tool descriptions, System prompts

## Installation

```bash
# From local development
cd ~/.openclaw/workspace/zcrystal-plugin
npm install

# Link to OpenClaw
openclaw plugins install -l ~/.openclaw/workspace/zcrystal-plugin
```

## Configuration

```json
{
  "plugins": {
    "entries": {
      "zcrystal": {
        "enabled": true,
        "config": {
          "honchoBaseUrl": "http://localhost:8000",
          "workspace": "openclaw",
          "selfEvolution": {
            "enabled": true,
            "onCompactOnly": true
          },
          "skills": {
            "autoDiscover": true,
            "paths": ["~/.openclaw/skills"]
          }
        }
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `zcrystal_search` | Semantic search via Honcho |
| `zcrystal_ask_user` | Ask about user preferences |
| `zcrystal_skills` | List available skills |
| `zcrystal_skill_read` | Read skill content |
| `zcrystal_evolve` | Trigger self-evolution |
| `zcrystal_record_trace` | Record execution trace |
| `zcrystal_evolution_status` | Get evolution history |

## Hooks

| Hook | When | Action |
|------|------|--------|
| `after_tool_call` | After tool execution | Record trace |
| `before_prompt_build` | Before LLM call | Inject user model |
| `after_compact` | After /compact | Trigger evolution |

## Development

```bash
# Build
npm run build

# Type check
npx tsc --noEmit

# Watch mode
npx tsc --watch
```

## License

MIT
