# ZCrystal Plugin for OpenClaw

> **v0.3.0** — 自我進化 + 技能系統 + 主動式 AI + 多層記憶 + 全文搜索

---

## 目錄 | Table of Contents

- [簡介 | Overview](#簡介--overview)
- [核心功能 | Core Features](#核心功能--core-features)
- [安裝方式 | Installation](#安裝方式--installation)
- [快速開始 | Quick Start](#快速開始--quick-start)
- [工具列表 | Tool Reference](#工具列表--tool-reference)
- [架構圖 | Architecture](#架構圖--architecture)
- [貢獻方式 | Contributing](#貢獻方式--contributing)
- [授權 | License](#授權--license)

---

## 簡介 | Overview

ZCrystal Plugin 是專為 OpenClaw 設計的進階插件，整合了自我進化引擎、技能系統、多層記憶架構與主動式 AI 引擎。目前共提供 **85 個工具**，涵蓋任務管理、技能生成與版本控制、回溯執行、熔斷保護等工作流所需的一切能力。

**核心特色：**

- 🧬 **自我進化引擎** — DSPy + GEPA 驅動的技能自動優化
- 🧠 **多層記憶系統** — L1 工作記憶 → L5 歸檔記憶
- ⚡ **主動式 AI** — Session 追蹤、預測建議、心跳監控
- 🔧 **技能系統** — 生成、版本管理、索引、驗證、合併
- 🛡️ **熔斷保護** — 電路熔斷器 + 速率限制
- 🔍 **全文搜索** — FTS5 整合，支援 Honcho 語義搜索
- ⚙️ **工作流引擎** — 建立、暫停、恢復、取消任務流程

---

## 核心功能 | Core Features

| 類別 | 工具數 | 說明 |
|------|--------|------|
| 核心系統 | 15 | UnifiedApiRouter、Memory、Task、Router |
| 技能系統 | 18 | Manager、Versioning、Indexer、Validator、Merger、Generator |
| 進化系統 | 11 | SelfEvolutionEngine、EvolutionScheduler、Coordinator |
| 安全保護 | 5 | CircuitBreaker、RateLimiter |
| 主動式 AI | 12 | Session Tracker、Self-Improving、Heartbeat |
| 適配器 | 13 | OpenClawAdapter、ReplayRunner、Hooks |
| 工作流 | 6 | WorkflowEngine |
| 工具生態 | 8 | ToolHub、FTS5、Webhooks |
| 其他 | 12 | Logger、Metrics、Commands |

**工具總數：85 個工具**

---

## 安裝方式 | Installation

### 📌 系統需求 | System Requirements

| 項目 | 最低版本 | 備註 |
|------|----------|------|
| Node.js | ≥ 22.0.0 | 當前環境：v24.14.1 |
| npm | - | 需與 Node.js 一起安裝 |
| OpenClaw | ≥ 2026.4.12 | 插件兼容性門檻 |
| 作業系統 | Linux / macOS / Windows (WSL) | Bash 腳本需要在 Unix-like 環境 |
| 磁碟空間 | ~100 MB | 含 node_modules + dist |

### 📦 依賴列表 | Dependencies

**生產依賴 | Production Dependencies**

| 套件 | 版本 | 用途 |
|------|------|------|
| `openclaw` | `^2026.4.8` | OpenClaw 核心框架 |
| `@sinclair/typebox` | `^0.34.49` | 類型定義（Schema 驗證） |
| `fuse.js` | `^7.0.0` | 模糊搜索（Fuzzy Search） |
| `@zcrystal/evo` | `file:/home/snow/ZCrystal_evo` | 本地自我進化引擎（路徑依賴） |

**開發依賴 | Dev Dependencies**

| 套件 | 版本 | 用途 |
|------|------|------|
| `typescript` | `^5.6.0` | TypeScript 編譯器 |
| `vitest` | `^4.1.4` | 單元測試框架 |
| `@types/node` | `^22.19.17` | Node.js 型別定義 |

### 🔧 安裝方式 | Installation Methods

#### 方式一：自動安裝（推薦）| Automatic Installation (Recommended)

```bash
# 進入插件目錄
cd ~/.openclaw/workspace/zcrystal-plugin

# 執行互動式安裝精靈
npm run setup

# 或直接執行
bash setup.sh
```

**setup.sh 會依序執行：**
1. 檢查 Node.js / npm 版本
2. 偵測 OpenClaw 安裝路徑
3. 建立必要目錄
4. 安裝 npm 依賴
5. 建構 TypeScript
6. 複製 `dist/index.js` → `~/.openclaw/extensions/zcrystal/dist/`
7. 更新 `.env` 環境變數
8. 最終驗證

#### 方式二：手動逐步安裝 | Manual Installation

```bash
# 1. 進入插件目錄
cd ~/.openclaw/workspace/zcrystal-plugin

# 2. 安裝依賴
npm install

# 3. 建構 TypeScript → JavaScript
npm run build

# 4. 建立擴展目錄
mkdir -p ~/.openclaw/extensions/zcrystal/dist

# 5. 複製編譯產物
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/

# 6. 驗證
npm test
```

### 🔨 建構指令 | Build Commands

```bash
# 建構 TypeScript → JavaScript（輸出到 dist/）
npm run build

# 等同於
npx tsc
```

**TypeScript 編譯設定（tsconfig.json）：**

| 設定 | 數值 |
|------|------|
| `target` | ES2022 |
| `module` | ESNext |
| `outDir` | `./dist` |
| `strict` | true |
| 輸出 | `.js` + `.d.ts` 宣告檔 + source map |

### ✅ 測試指令 | Test Commands

```bash
# 執行所有測試（Vitest）
npm test

# 等同於
npx vitest run

# 帶 UI 觀看模式（開發時）
npx vitest
```

**測試涵蓋範圍：**
- `src/tools/core-tools.test.ts`
- `src/tools/skill-tools.test.ts`
- `src/tools/task-tools.test.ts`
- `src/tools/system-tools.test.ts`
- `src/tools/workflow-tools.test.ts`
- `src/tools/proactive-tools.test.ts`

**測試結果：101 tests passed**

### 📤 發布指令 | Publish Commands

```bash
# 登入 npm（需有發布帳號權限）
npm login

# 發布為公開套件
npm publish --access public

# 發布測試（dry-run）
npm publish --dry-run

# 為當前版本打 Git tag
git tag v0.3.0
git push origin v0.3.0
```

**發布前檢查清單：**
```bash
# 確保所有檢查通過
npm run build && npm run test
npm publish --access public
```

### ⚙️ 插件配置 | Plugin Configuration

**openclaw.plugin.json：**

```json
{
  "id": "zcrystal",
  "name": "ZCrystal",
  "version": "0.3.0",
  "configSchema": {
    "honchoBaseUrl": {
      "type": "string",
      "default": "http://localhost:8000"
    },
    "workspace": {
      "type": "string",
      "default": "openclaw"
    },
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
```

### 🔑 環境變數（可選）| Environment Variables (Optional)

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `ZCRYSTAL_DATA_PATH` | `~/.openclaw/extensions/zcrystal` | 資料儲存路徑 |
| `ZCRYSTAL_SKILLS_PATH` | `~/.openclaw/skills` | 技能檔案路徑 |
| `ZCRYSTAL_FTS5_PORT` | `18795` | FTS5 MCP 服務埠 |
| `ZCRYSTAL_EVOLUTION_INTERVAL` | `3600000` (ms) | 自動進化間隔 |

### 📁 目錄結構 | Directory Structure

```
zcrystal-plugin/
├── dist/                          # 編譯輸出目錄（建構後產生）
│   ├── index.js                   # 主入口點
│   ├── index.d.ts                 # 型別宣告
│   ├── tools/                     # 工具子模組
│   ├── config.js
│   ├── self-evolution.js
│   ├── skill-manager.js
│   ├── honcho-client.js
│   └── fts5-bridge.js
├── src/                           # 源碼目錄
│   ├── index.ts                   # 主入口
│   ├── config.ts
│   ├── types.ts
│   ├── self-evolution.ts          # 自我進化引擎
│   ├── skill-manager.ts           # 技能管理器
│   ├── fts5-bridge.ts             # FTS5 全文搜索橋接
│   ├── honcho-client.ts           # Honcho 客戶端
│   └── tools/                     # 工具實現
│       ├── core-tools.ts
│       ├── skill-tools.ts
│       ├── task-tools.ts
│       ├── workflow-tools.ts
│       ├── proactive-tools.ts
│       ├── system-tools.ts
│       └── *.test.ts              # 測試檔案
├── node_modules/                  # npm 依賴
├── package.json                   # npm 設定
├── tsconfig.json                  # TypeScript 設定
├── vitest.config.ts               # Vitest 測試設定
├── openclaw.plugin.json           # OpenClaw 插件描述
├── setup.sh                       # 互動式安裝精靈
├── install.sh                     # 安裝腳本
└── README.md
```

---

## 快速開始 | Quick Start

### 基本使用

```typescript
// 透過 UnifiedApiRouter 呼叫工具
const result = await zcrystal.unified({
  tool: 'zcrystal_evo_health'
});

// 建立任務
const task = await zcrystal.unified({
  tool: 'zcrystal_task_create',
  params: { title: '我的任務', description: '任務描述' }
});
```

### 技能生成

```typescript
// 生成新技能
const skill = await zcrystal.unified({
  tool: 'zcrystal_skill_generate',
  params: {
    name: 'my-skill',
    pattern: '用戶詢問天氣時，回傳氣象資訊'
  }
});
```

### 主動式檢查

```typescript
// 獲取主動建議
const suggestions = await zcrystal.unified({
  tool: 'zcrystal_proactive_suggest'
});
```

---

## 工具列表 | Tool Reference

### 核心工具 (6)

| 工具 | 說明 | 英文說明 |
|------|------|----------|
| `zcrystal_evo_health` | 健康檢查 | Health check |
| `zcrystal_evo_ready` | 就緒檢查 | Readiness check |
| `zcrystal_search` | Honcho 語義搜索 | Semantic search via Honcho |
| `zcrystal_ask_user` | 詢問用戶偏好 | Query user preferences |
| `zcrystal_compact` | 壓縮記憶並觸發進化 | Compact memory and trigger evolution |
| `zcrystal_profile` | 查看個人檔案 | View user profile |

### 任務系統 (3)

| 工具 | 說明 | 英文說明 |
|------|------|----------|
| `zcrystal_task_create` | 創建任務 | Create a task |
| `zcrystal_task_get` | 獲取任務 | Get task details |
| `zcrystal_task_stats` | 任務統計 | Get task statistics |

### 記憶系統 (7)

| 工具 | 說明 | 英文說明 |
|------|------|----------|
| `zcrystal_memory_store` | 存入記憶（L1-L5） | Store to memory layer |
| `zcrystal_memory_load` | 讀取記憶 | Load from memory |
| `zcrystal_memory_search` | 搜索記憶 | Search memory |
| `zcrystal_memory_delete` | 刪除記憶 | Delete memory |
| `zcrystal_memory_stats` | 記憶統計 | Memory statistics |
| `zcrystal_memory_add` | 添加到 HOT 層（L2） | Add to HOT layer |
| `zcrystal_memory_get` | 獲取 HOT 層 | Get HOT layer |

### 技能系統 (18)

| 工具 | 說明 |
|------|------|
| `zcrystal_skills` | 技能列表 |
| `zcrystal_skill_read` | 讀取技能內容 |
| `zcrystal_skill_generate` | 生成新技能 |
| `zcrystal_skill_versions` | 版本歷史 |
| `zcrystal_skill_rollback` | 回滾版本 |
| `zcrystal_skill_generator_stats` | 技能生成統計 |
| `zcrystal_skill_version_create` | 建立版本快照 |
| `zcrystal_skill_version_get` | 獲取版本內容 |
| `zcrystal_skill_version_list` | 列出所有版本 |
| `zcrystal_skill_version_diff` | 版本差異比較 |
| `zcrystal_skill_version_stats` | 版本統計 |
| `zcrystal_skill_version_rollback` | 版本回滾 |
| `zcrystal_skill_indexer_search` | 索引搜索 |
| `zcrystal_skill_indexer_index` | 索引技能 |
| `zcrystal_skill_indexer_rebuild` | 重建索引 |
| `zcrystal_skill_indexer_stats` | 索引統計 |
| `zcrystal_skill_validator_validate` | 非同步驗證 |
| `zcrystal_skill_validator_validate_sync` | 同步驗證 |
| `zcrystal_skill_merger_suggest` | 合併建議 |

### 進化系統 (11)

| 工具 | 說明 |
|------|------|
| `zcrystal_evolution_status` | 進化狀態 |
| `zcrystal_evolve` | 觸發進化 |
| `zcrystal_coordinator_status` | 協調器狀態 |
| `zcrystal_coordinator_register` | 註冊技能 |
| `zcrystal_coordinator_evolve` | 協調進化 |
| `zcrystal_coordinator_queue` | 排程狀態 |
| `zcrystal_heartbeat_run` | 運行心跳 |
| `zcrystal_heartbeat_status` | 心跳狀態 |
| `zcrystal_layers_exchange` | 層級交換 |
| `zcrystal_predict` | 預測需求 |
| `zcrystal_selfimproving_status` | 自我改進狀態 |

### 安全保護 (5)

| 工具 | 說明 |
|------|------|
| `zcrystal_circuit_status` | 熔斷器狀態 |
| `zcrystal_circuit_reset` | 重置熔斷器 |
| `zcrystal_circuit_check` | 檢查熔斷狀態 |
| `zcrystal_rate_status` | 速率限制器狀態 |
| `zcrystal_rate_check` | 檢查速率限制 |

### 主動式 AI (12)

| 工具 | 說明 |
|------|------|
| `zcrystal_session_set` | 設定當前任務 |
| `zcrystal_session_get` | 獲取 session 狀態 |
| `zcrystal_session_clear` | 清除 session |
| `zcrystal_proactive_check` | 檢查待辦和阻礙 |
| `zcrystal_proactive_suggest` | 主動建議 |
| `zcrystal_proactive_log` | 記錄行動 |
| `zcrystal_proactive_recent` | 獲取最近行動 |
| `zcrystal_correction_add` | 添加修正 |
| `zcrystal_correction_list` | 列出修正 |
| `zcrystal_pattern_add` | 添加模式 |
| `zcrystal_pattern_list` | 列出模式 |
| `zcrystal_log_action` | 記錄動作 |
| `zcrystal_log_recent` | 獲取最近日誌 |

### 工作流 (6)

| 工具 | 說明 |
|------|------|
| `zcrystal_workflow_create` | 建立工作流 |
| `zcrystal_workflow_get` | 獲取工作流 |
| `zcrystal_workflow_stats` | 工作流統計 |
| `zcrystal_workflow_pause` | 暫停工作流 |
| `zcrystal_workflow_resume` | 恢復工作流 |
| `zcrystal_workflow_cancel` | 取消工作流 |

### 適配器 (13)

| 工具 | 說明 |
|------|------|
| `zcrystal_openclaw_scan` | 掃描 OpenClaw 技能 |
| `zcrystal_openclaw_import` | 匯入技能 |
| `zcrystal_openclaw_export` | 匯出技能 |
| `zcrystal_replay_save` | 保存執行狀態 |
| `zcrystal_replay_get` | 獲取執行狀態 |
| `zcrystal_replay_list` | 列出回放 |
| `zcrystal_replay_stats` | 回放統計 |
| `zcrystal_replay_rollback` | 回滾執行 |
| `zcrystal_hooks_register` | 註冊鉤子 |
| `zcrystal_hooks_dispatch` | 分發事件 |
| `zcrystal_hooks_list` | 列出鉤子 |

### 工具生態 (8)

| 工具 | 說明 |
|------|------|
| `zcrystal_toolhub_call` | 透過 ToolHub 執行工具 |
| `zcrystal_toolhub_schema` | 獲取工具 schema |
| `zcrystal_toolhub_logs` | 獲取工具日誌 |
| `zcrystal_fts5_search` | FTS5 全文搜索 |
| `zcrystal_fts5_stats` | FTS5 統計 |
| `zcrystal_webhook_register` | 註冊 Webhook |
| `zcrystal_webhook_dispatch` | 分發 Webhook |
| `zcrystal_webhook_list` | 列出 Webhook |

### 其他工具 (12)

| 工具 | 說明 |
|------|------|
| `zcrystal_log` | 寫入結構化日誌 |
| `zcrystal_metrics_get` | 獲取指標 |
| `zcrystal_metrics_record` | 記錄指標 |
| `zcrystal_model_pick` | 模型選擇 |
| `zcrystal_review_stats` | 評審統計 |
| `zcrystal_review_suggestions` | 評審建議 |
| `zcrystal_router_route` | 路由請求 |
| `zcrystal_router_stats` | 路由統計 |

### 命令

| 命令 | 說明 |
|------|------|
| `/zcrystal_compact` | 壓縮 + 觸發進化 |
| `/zcrystal_learn` | 學習用戶偏好 |
| `/zcrystal_profile` | 查看個人檔案 |

### 自動觸發機制

| 間隔 | 功能 |
|------|------|
| 每 5 分鐘 | Heartbeat（健康檢查） |
| 每 10 分鐘 | Proactive Check（Session + 建議） |
| 每 60 分鐘 | EvolutionScheduler（自動進化） |

---

## 架構圖 | Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw Core                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZCrystal Plugin (TypeScript)                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 UnifiedApiRouter (30+ endpoints)                │   │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬───────────┤   │
│  │  Health  │   Task   │  Memory  │  Skill   │  Router  │ Evolution │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴───────────┘   │
│                                                                         │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────────┐ │
│  │  Circuit   │    Rate    │   Logger   │  Metrics   │  FTS5 Bridge   │ │
│  │  Breaker   │  Limiter   │            │            │               │ │
│  └────────────┴────────────┴────────────┴────────────┴────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    Proactive AI Engine                        │      │
│  │  Session Tracker  │  Self-Improving  │  Auto Heartbeat         │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐          │
│  │ Workflow  │  Skill    │  Review   │  ToolHub  │  Webhook  │          │
│  │  Engine   │ Versioning│  Engine   │           │           │          │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 記憶層級 | Memory Layers

| 層級 | 類型 | 持久性 | 用途 |
|------|------|--------|------|
| L1 | 工作記憶 | 進程內 | 當前上下文 |
| L2 | 會話記憶 | 進程內 | 對話（HOT 層） |
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

### 進化流程 | Evolution Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Generation │───▶│   Scoring   │───▶│ Validation  │───▶│ Apply/Roll  │
│   (GEPA)    │    │   (DSPy)    │    │             │    │    Back     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                  │                  │                  │
  constraints       content_quality    20 traces         score >= 0.5
  examples          structure_quality  threshold: 0.5   → apply
  formatting        history_success                        ← rollback
  clarity
```

---

## 貢獻方式 | Contributing

### 開發環境設定

```bash
# 克隆 Repository
git clone https://github.com/ZCrystalC33/zcrystal-plugin.git
cd zcrystal-plugin

# 安裝依賴
npm install

# 建置
npm run build

# 執行測試
npm run test
```

### 貢獻流程

1. **Fork** 此 Repository
2. 建立功能分支：`git checkout -b feature/your-feature`
3. 提交變更：`git commit -m 'feat: add new feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

### 程式碼規範

- 使用 TypeScript，嚴格模式下禁止 `any`
- 所有工具必須有 JSDoc 註解
- 提交前執行：`npm run build && npm run test`

---

## 授權 | License

MIT License - 詳見 [LICENSE](LICENSE) 檔案。

---

## Repository

https://github.com/ZCrystalC33/zcrystal-plugin

---

# ZCrystal Plugin for OpenClaw

> **v0.3.0** — Self-Evolution + Skills System + Proactive AI + Multi-Layer Memory + Full-Text Search

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tool Reference](#tool-reference)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ZCrystal Plugin is an advanced plugin for OpenClaw that integrates a self-evolution engine, skills system, multi-layer memory architecture, and proactive AI engine. It provides **85 tools** covering everything needed for task management, skill generation and version control, replay execution, and circuit protection.

**Key Features:**

- 🧬 **Self-Evolution Engine** — DSPy + GEPA driven skill auto-optimization
- 🧠 **Multi-Layer Memory** — L1 working memory → L5 archive
- ⚡ **Proactive AI** — Session tracking, predictive suggestions, heartbeat monitoring
- 🔧 **Skills System** — Generation, version management, indexing, validation, merging
- 🛡️ **Circuit Protection** — Circuit breaker + rate limiter
- 🔍 **Full-Text Search** — FTS5 integration with Honcho semantic search
- ⚙️ **Workflow Engine** — Create, pause, resume, cancel task flows

---

## Core Features

| Category | Tools | Description |
|----------|-------|-------------|
| Core System | 15 | UnifiedApiRouter, Memory, Task, Router |
| Skills System | 18 | Manager, Versioning, Indexer, Validator, Merger, Generator |
| Evolution System | 11 | SelfEvolutionEngine, EvolutionScheduler, Coordinator |
| Safety Protection | 5 | CircuitBreaker, RateLimiter |
| Proactive AI | 12 | Session Tracker, Self-Improving, Heartbeat |
| Adapters | 13 | OpenClawAdapter, ReplayRunner, Hooks |
| Workflow | 6 | WorkflowEngine |
| Tool Ecosystem | 8 | ToolHub, FTS5, Webhooks |
| Others | 12 | Logger, Metrics, Commands |

**Total: 85 tools**

---

## Installation

### Prerequisites

- Node.js ≥ 22.0.0
- OpenClaw ≥ 2026.4.12

### Installation Steps

```bash
# 1. Navigate to plugin directory
cd ~/.openclaw/workspace/zcrystal-plugin

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Copy to OpenClaw extensions directory
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

### Verify Installation

```bash
# Check health status
npx zcrystal-tools health

# Run tests
npm run test
```

---

## Quick Start

### Basic Usage

```typescript
// Call tool via UnifiedApiRouter
const result = await zcrystal.unified({
  tool: 'zcrystal_evo_health'
});

// Create a task
const task = await zcrystal.unified({
  tool: 'zcrystal_task_create',
  params: { title: 'My Task', description: 'Task description' }
});
```

### Skill Generation

```typescript
// Generate a new skill
const skill = await zcrystal.unified({
  tool: 'zcrystal_skill_generate',
  params: {
    name: 'my-skill',
    pattern: 'When user asks about weather, return meteorological info'
  }
});
```

### Proactive Check

```typescript
// Get proactive suggestions
const suggestions = await zcrystal.unified({
  tool: 'zcrystal_proactive_suggest'
});
```

---

## Tool Reference

### Core Tools (6)

| Tool | Description |
|------|-------------|
| `zcrystal_evo_health` | Health check |
| `zcrystal_evo_ready` | Readiness check |
| `zcrystal_search` | Semantic search via Honcho |
| `zcrystal_ask_user` | Query user preferences |
| `zcrystal_compact` | Compact memory and trigger evolution |
| `zcrystal_profile` | View user profile |

### Task System (3)

| Tool | Description |
|------|-------------|
| `zcrystal_task_create` | Create a task |
| `zcrystal_task_get` | Get task details |
| `zcrystal_task_stats` | Get task statistics |

### Memory System (7)

| Tool | Description |
|------|-------------|
| `zcrystal_memory_store` | Store to memory layer (L1-L5) |
| `zcrystal_memory_load` | Load from memory |
| `zcrystal_memory_search` | Search memory |
| `zcrystal_memory_delete` | Delete memory |
| `zcrystal_memory_stats` | Memory statistics |
| `zcrystal_memory_add` | Add to HOT layer (L2) |
| `zcrystal_memory_get` | Get HOT layer |

### Skills System (18)

| Tool | Description |
|------|-------------|
| `zcrystal_skills` | List skills |
| `zcrystal_skill_read` | Read skill content |
| `zcrystal_skill_generate` | Generate new skill |
| `zcrystal_skill_versions` | Version history |
| `zcrystal_skill_rollback` | Rollback version |
| `zcrystal_skill_generator_stats` | Skill generation stats |
| `zcrystal_skill_version_create` | Create version snapshot |
| `zcrystal_skill_version_get` | Get version content |
| `zcrystal_skill_version_list` | List all versions |
| `zcrystal_skill_version_diff` | Compare version diff |
| `zcrystal_skill_version_stats` | Version statistics |
| `zcrystal_skill_version_rollback` | Rollback to version |
| `zcrystal_skill_indexer_search` | Index search |
| `zcrystal_skill_indexer_index` | Index skill |
| `zcrystal_skill_indexer_rebuild` | Rebuild index |
| `zcrystal_skill_indexer_stats` | Indexer statistics |
| `zcrystal_skill_validator_validate` | Async validation |
| `zcrystal_skill_validator_validate_sync` | Sync validation |
| `zcrystal_skill_merger_suggest` | Merge suggestion |

### Evolution System (11)

| Tool | Description |
|------|-------------|
| `zcrystal_evolution_status` | Evolution status |
| `zcrystal_evolve` | Trigger evolution |
| `zcrystal_coordinator_status` | Coordinator status |
| `zcrystal_coordinator_register` | Register skill |
| `zcrystal_coordinator_evolve` | Coordinate evolution |
| `zcrystal_coordinator_queue` | Queue status |
| `zcrystal_heartbeat_run` | Run heartbeat |
| `zcrystal_heartbeat_status` | Heartbeat status |
| `zcrystal_layers_exchange` | Layer exchange |
| `zcrystal_predict` | Predict needs |
| `zcrystal_selfimproving_status` | Self-improving status |

### Safety Protection (5)

| Tool | Description |
|------|-------------|
| `zcrystal_circuit_status` | Circuit breaker status |
| `zcrystal_circuit_reset` | Reset circuit breaker |
| `zcrystal_circuit_check` | Check circuit state |
| `zcrystal_rate_status` | Rate limiter status |
| `zcrystal_rate_check` | Check rate limit |

### Proactive AI (12)

| Tool | Description |
|------|-------------|
| `zcrystal_session_set` | Set current task |
| `zcrystal_session_get` | Get session state |
| `zcrystal_session_clear` | Clear session |
| `zcrystal_proactive_check` | Check todos and blockers |
| `zcrystal_proactive_suggest` | Proactive suggestions |
| `zcrystal_proactive_log` | Log action |
| `zcrystal_proactive_recent` | Get recent actions |
| `zcrystal_correction_add` | Add correction |
| `zcrystal_correction_list` | List corrections |
| `zcrystal_pattern_add` | Add pattern |
| `zcrystal_pattern_list` | List patterns |
| `zcrystal_log_action` | Log action |
| `zcrystal_log_recent` | Get recent logs |

### Workflow (6)

| Tool | Description |
|------|-------------|
| `zcrystal_workflow_create` | Create workflow |
| `zcrystal_workflow_get` | Get workflow |
| `zcrystal_workflow_stats` | Workflow statistics |
| `zcrystal_workflow_pause` | Pause workflow |
| `zcrystal_workflow_resume` | Resume workflow |
| `zcrystal_workflow_cancel` | Cancel workflow |

### Adapters (13)

| Tool | Description |
|------|-------------|
| `zcrystal_openclaw_scan` | Scan OpenClaw skills |
| `zcrystal_openclaw_import` | Import skill |
| `zcrystal_openclaw_export` | Export skill |
| `zcrystal_replay_save` | Save execution state |
| `zcrystal_replay_get` | Get execution state |
| `zcrystal_replay_list` | List replays |
| `zcrystal_replay_stats` | Replay statistics |
| `zcrystal_replay_rollback` | Rollback execution |
| `zcrystal_hooks_register` | Register hook |
| `zcrystal_hooks_dispatch` | Dispatch event |
| `zcrystal_hooks_list` | List hooks |

### Tool Ecosystem (8)

| Tool | Description |
|------|-------------|
| `zcrystal_toolhub_call` | Execute tool via ToolHub |
| `zcrystal_toolhub_schema` | Get tool schema |
| `zcrystal_toolhub_logs` | Get tool logs |
| `zcrystal_fts5_search` | FTS5 full-text search |
| `zcrystal_fts5_stats` | FTS5 statistics |
| `zcrystal_webhook_register` | Register webhook |
| `zcrystal_webhook_dispatch` | Dispatch webhook |
| `zcrystal_webhook_list` | List webhooks |

### Other Tools (12)

| Tool | Description |
|------|-------------|
| `zcrystal_log` | Write structured log |
| `zcrystal_metrics_get` | Get metrics |
| `zcrystal_metrics_record` | Record metric |
| `zcrystal_model_pick` | Pick model |
| `zcrystal_review_stats` | Review statistics |
| `zcrystal_review_suggestions` | Review suggestions |
| `zcrystal_router_route` | Route request |
| `zcrystal_router_stats` | Router statistics |

### Commands

| Command | Description |
|---------|-------------|
| `/zcrystal_compact` | Compact + trigger evolution |
| `/zcrystal_learn` | Learn user preferences |
| `/zcrystal_profile` | View user profile |

### Auto-Trigger Mechanisms

| Interval | Feature |
|----------|---------|
| Every 5 min | Heartbeat (health check) |
| Every 10 min | Proactive Check (Session + suggestions) |
| Every 60 min | EvolutionScheduler (auto-evolution) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw Core                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZCrystal Plugin (TypeScript)                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 UnifiedApiRouter (30+ endpoints)                │   │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬───────────┤   │
│  │  Health  │   Task   │  Memory  │  Skill   │  Router  │ Evolution │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴───────────┘   │
│                                                                         │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────────┐ │
│  │  Circuit   │    Rate    │   Logger   │  Metrics   │  FTS5 Bridge   │ │
│  │  Breaker   │  Limiter   │            │            │               │ │
│  └────────────┴────────────┴────────────┴────────────┴────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    Proactive AI Engine                        │      │
│  │  Session Tracker  │  Self-Improving  │  Auto Heartbeat         │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐          │
│  │ Workflow  │  Skill    │  Review   │  ToolHub  │  Webhook  │          │
│  │  Engine   │ Versioning│  Engine   │           │           │          │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Memory Layers

| Layer | Type | Persistence | Purpose |
|-------|------|-------------|---------|
| L1 | Working Memory | In-process | Current context |
| L2 | Session Memory | In-process | Conversation (HOT layer) |
| L3 | Short-Term Memory | Disk | Cross-session |
| L4 | Long-Term Memory | Disk | Persistent |
| L5 | Archive Memory | Disk | Cold storage |

### Evolution Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Generation │───▶│   Scoring   │───▶│ Validation  │───▶│ Apply/Roll  │
│   (GEPA)    │    │   (DSPy)    │    │             │    │    Back    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                  │                  │                  │
  constraints       content_quality    20 traces         score >= 0.5
  examples          structure_quality  threshold: 0.5   → apply
  formatting        history_success                        ← rollback
  clarity
```

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/ZCrystalC33/zcrystal-plugin.git
cd zcrystal-plugin

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test
```

### Contribution Flow

1. **Fork** this Repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add new feature'`
4. Push branch: `git push origin feature/your-feature`
5. Submit Pull Request

### Code Standards

- Use TypeScript in strict mode — no `any`
- All tools must have JSDoc comments
- Before committing: `npm run build && npm run test`

---

## License

MIT License — see [LICENSE](LICENSE) file.

---

## Repository

https://github.com/ZCrystalC33/zcrystal-plugin