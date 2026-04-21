# ZCrystal Plugin for OpenClaw

> **v1.0.0** — 自我進化插件 + Proactive AI + Skills System + 95 工具

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.0.0-brightgreen)](package.json)
[![OpenClaw](https://img.shields.io/badge/openclaw-2026.4.15-blueviolet)](openclaw.plugin.json)

---

## 目錄

- [簡介](#簡介)
- [核心功能](#核心功能)
- [快速開始](#快速開始)
- [工具列表](#工具列表)
- [架構](#架構)
- [開發](#開發)
- [更新日誌](#更新日誌)

---

## 簡介

ZCrystal Plugin 是專為 OpenClaw 設計的自我進化插件，整合了 DSPy + GEPA 驅動的技能自動優化引擎、Proactive AI 工作層、以及完整的 Skills 生命週期管理系統。

**當前版本：v1.0.0 — 95 工具，全部測試通過（101 tests）**

---

## 核心功能

| 類別 | 工具數 | 說明 |
|------|--------|------|
| 核心系統 | 15 | UnifiedApiRouter、Memory、Task、Router |
| 技能系統 | 18 | Manager、Versioning、Indexer、Validator、Merger |
| 進化系統 | 11 | SelfEvolutionEngine、EvolutionScheduler、Coordinator |
| 安全保護 | 5 | CircuitBreaker、RateLimiter |
| 主動式 AI | 12 | Session Tracker、Self-Improving、Heartbeat |
| 適配器 | 13 | OpenClawAdapter、ReplayRunner、HookRegistry |
| 工作流 | 6 | WorkflowEngine |
| 工具生態 | 8 | ToolHub、FTS5、Webhook |
| 其他 | 12 | Logger、Metrics、Commands |

**工具總數：95 個工具**

---

## 快速開始

### 安裝

```bash
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build
npm test
```

### 基本使用

```typescript
// 健康檢查
await zcrystal.unified({ tool: 'zcrystal_evo_health' })

// 創建任務
await zcrystal.unified({
  tool: 'zcrystal_task_create',
  params: { title: '我的任務' }
})

// 觸發自我進化
await zcrystal.unified({ tool: 'zcrystal_evolve' })

// 主動式建議
await zcrystal.unified({ tool: 'zcrystal_proactive_suggest' })
```

---

## 工具列表

### 核心工具 (6)
| 工具 | 說明 |
|------|------|
| `zcrystal_evo_health` | 健康檢查 |
| `zcrystal_evo_ready` | 就緒檢查 |
| `zcrystal_search` | Honcho 語義搜索 |
| `zcrystal_ask_user` | 詢問用戶偏好 |
| `zcrystal_compact` | 壓縮記憶並觸發進化 |
| `zcrystal_profile` | 查看個人檔案 |

### 任務系統 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_task_create` | 創建任務 |
| `zcrystal_task_get` | 獲取任務 |
| `zcrystal_task_stats` | 任務統計 |

### 記憶系統 (7)
| 工具 | 說明 |
|------|------|
| `zcrystal_memory_store` | 存入記憶（L1-L5）|
| `zcrystal_memory_load` | 讀取記憶 |
| `zcrystal_memory_search` | 搜索記憶 |
| `zcrystal_memory_delete` | 刪除記憶 |
| `zcrystal_memory_stats` | 記憶統計 |
| `zcrystal_memory_add` | 添加到 HOT 層（L2）|
| `zcrystal_memory_get` | 獲取 HOT 層 |

### 技能系統 (18)
| 工具 | 說明 |
|------|------|
| `zcrystal_skills` | 技能列表 |
| `zcrystal_skill_read` | 讀取技能內容 |
| `zcrystal_skill_generate` | 生成新技能 |
| `zcrystal_skill_versions` | 版本歷史 |
| `zcrystal_skill_rollback` | 回滾版本 |
| `zcrystal_skill_generator_stats` | 技能生成統計 |
| `zcrystal_skill_version_*` | 版本管理（create/get/list/diff/stats/rollback）|
| `zcrystal_skill_indexer_*` | 索引系統（search/index/rebuild/stats）|
| `zcrystal_skill_validator_*` | 驗證系統（validate/validate_sync）|
| `zcrystal_skill_merger_suggest` | 合併建議 |

### 進化系統 (11)
| 工具 | 說明 |
|------|------|
| `zcrystal_evolution_status` | 進化狀態 |
| `zcrystal_evolve` | 觸發進化 |
| `zcrystal_coordinator_*` | 協調器操作（status/register/evolve/queue）|
| `zcrystal_heartbeat_*` | 心跳引擎（run/status）|
| `zcrystal_layers_exchange` | 層級交換 |
| `zcrystal_predict` | 上下文預測 |
| `zcrystal_selfimproving_status` | 自我改進狀態 |

### 安全保護 (5)
| 工具 | 說明 |
|------|------|
| `zcrystal_circuit_*` | 熔斷器（status/reset/check）|
| `zcrystal_rate_*` | 速率限制（status/check）|

### 主動式 AI (12)
| 工具 | 說明 |
|------|------|
| `zcrystal_session_*` | Session 追蹤（set/get/clear）|
| `zcrystal_proactive_*` | 主動檢查（check/suggest/log/recent）|
| `zcrystal_correction_*` | 修正日誌（add/list）|
| `zcrystal_pattern_*` | 模式學習（add/list）|

### 工作流 (6)
| 工具 | 說明 |
|------|------|
| `zcrystal_workflow_*` | 工作流引擎（create/get/stats/pause/resume/cancel）|

### 適配器 (13)
| 工具 | 說明 |
|------|------|
| `zcrystal_openclaw_*` | OpenClaw 技能適配（scan/import/export）|
| `zcrystal_replay_*` | 回放系統（save/get/list/stats/rollback）|
| `zcrystal_hooks_*` | 鉤子系統（register/dispatch/list）|

### 工具生態 (8)
| 工具 | 說明 |
|------|------|
| `zcrystal_toolhub_*` | ToolHub（call/schema/logs）|
| `zcrystal_fts5_*` | FTS5 全文搜索（search/stats）|
| `zcrystal_webhook_*` | Webhook（register/dispatch/list）|

### 其他工具 (12)
| 工具 | 說明 |
|------|------|
| `zcrystal_log` | 結構化日誌 |
| `zcrystal_metrics_*` | 指標（get/record）|
| `zcrystal_model_pick` | 模型選擇 |
| `zcrystal_review_*` | 評審引擎（stats/suggestions）|
| `zcrystal_router_*` | 路由器（route/stats）|

---

## 架構

```
┌──────────────────────────────────────────┐
│             OpenClaw Core                │
└──────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│         ZCrystal Plugin (v1.0.0)          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    UnifiedApiRouter (30+ endpoints) │  │
│  ├────────┬────────┬────────┬─────────┤  │
│  │ Health │ Task   │ Skill  │Evolution│  │
│  └────────┴────────┴────────┴─────────┘  │
│                                          │
│  ┌──────────┬──────────┬───────────────┐  │
│  │ Circuit │  Rate   │  FTS5 Bridge  │  │
│  │ Breaker │ Limiter │               │  │
│  └──────────┴──────────┴───────────────┘  │
│                                          │
│  ┌──────────┬──────────┬─────────────┐   │
│  │Proactive│ Workflow │  Adapters   │   │
│  │   AI    │  Engine  │             │   │
│  └──────────┴──────────┴─────────────┘   │
└──────────────────────────────────────────┘
```

### 記憶層級

| 層級 | 類型 | 持久性 | 用途 |
|------|------|--------|------|
| L1 | 工作記憶 | 進程內 | 當前上下文 |
| L2 | 會話記憶 | 進程內 | 對話（HOT 層）|
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

---

## 開發

### 建構

```bash
npm run build   # TypeScript → JavaScript
npm test        # 執行全部測試（101 tests）
```

### 目錄結構

```
zcrystal-plugin/
├── src/
│   ├── index.ts           # Plugin entry
│   ├── config.ts          # Config schema
│   ├── self-evolution.ts  # 自我進化引擎
│   ├── skill-manager.ts   # 技能管理器
│   ├── fts5-bridge.ts     # FTS5 橋接
│   ├── honcho-client.ts   # Honcho MCP client
│   └── tools/             # 工具模組
│       ├── core-tools.ts
│       ├── skill-tools.ts
│       ├── task-tools.ts
│       ├── workflow-tools.ts
│       ├── proactive-tools.ts
│       └── system-tools.ts
├── dist/                  # 編譯輸出
├── openclaw.plugin.json   # Plugin 描述
└── package.json
```

---

## 更新日誌

完整更新日誌請參考 [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT License