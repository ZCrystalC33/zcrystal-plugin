# 更新日誌 | CHANGELOG

此文件記錄 ZCrystal Plugin 所有重要變更。
Format based on [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/).

---

# 2026-04-19

## [0.3.0] - 2026-04-19 | 2026-04-19

### 🎉 主要發布：ZCrystal 統一插件

> **v0.3.0** — 85 工具 + Proactive AI + Self-Evolution + Skills System

此版本將 ZCrystal_evo 核心引擎與 OpenClaw 插件系統完全統一，達到功能完整性。

#### 新增 | Added

**核心引擎 (15 工具)**
- `UnifiedApiRouter` — 30+ 端點的統一 API 路由器
- `MemoryLayers` — L1-L5 多層記憶系統
- `TaskLifecycle` — 任務生命週期管理
- `ModelRouter` — 模型選擇路由器
- `RouterBridge` — 路由器橋接

**技能系統 (18 工具)**
- `zcrystal_skills` — 技能列表
- `zcrystal_skill_read` — 讀取技能內容
- `zcrystal_skill_generate` — 生成新技能
- `zcrystal_skill_versions` — 版本歷史
- `zcrystal_skill_rollback` — 回滾版本
- `zcrystal_skill_generator_stats` — 生成統計
- `zcrystal_skill_version_create/get/list/diff/stats/rollback` — 版本管理
- `zcrystal_skill_indexer_search/index/rebuild/stats` — 索引系統
- `zcrystal_skill_validator_validate/validate_sync` — 驗證系統
- `zcrystal_skill_merger_suggest` — 合併建議

**進化系統 (11 工具)**
- `zcrystal_evolution_status` — 進化狀態
- `zcrystal_evolve` — 觸發進化
- `SelfEvolutionEngine` — DSPy + GEPA 自我進化引擎
- `EvolutionScheduler` — 自動進化排程器
- `EvolutionCoordinator` — 多技能協調器
- `zcrystal_coordinator_status/register/evolve/queue` — 協調器操作
- `zcrystal_heartbeat_run/status` — 心跳引擎

**安全保護 (5 工具)**
- `zcrystal_circuit_status/reset/check` — 熔斷器
- `zcrystal_rate_status/check` — 速率限制器

**主動式 AI (12 工具)**
- `zcrystal_session_set/get/clear` — Session 追蹤
- `zcrystal_proactive_check/suggest/log/recent` — 主動檢查
- `zcrystal_correction_add/list` — 修正日誌
- `zcrystal_pattern_add/list` — 模式學習
- `zcrystal_layers_exchange` — 層級交換
- `zcrystal_predict` — 上下文預測
- `zcrystal_selfimproving_status` — 系統狀態

**工作流 (6 工具)**
- `zcrystal_workflow_create/get/stats/pause/resume/cancel` — WorkflowEngine

**適配器 (13 工具)**
- `zcrystal_openclaw_scan/import/export` — OpenClawSkillAdapter
- `zcrystal_replay_save/get/list/stats/rollback` — ReplayRunner
- `zcrystal_hooks_register/dispatch/list` — HookRegistry

**工具生態 (8 工具)**
- `zcrystal_toolhub_call/schema/logs` — ToolHub
- `zcrystal_fts5_search/stats` — FTS5 全文搜索
- `zcrystal_webhook_register/dispatch/list` — Webhook 系統

**其他 (12 工具)**
- `zcrystal_log` — 結構化日誌
- `zcrystal_metrics_get/record` — 指標收集
- `zcrystal_model_pick` — 模型選擇
- `zcrystal_review_stats/suggestions` — 評審引擎
- `zcrystal_router_route/stats` — 路由器

**命令**
- `/zcrystal_compact` — 壓縮 + 觸發進化
- `/zcrystal_learn` — 學習用戶偏好
- `/zcrystal_profile` — 查看個人檔案

#### 變更 | Changed

- 插件更名為 `ZCrystal`（原 ZCrystal-evo-plugin）
- 統一架構：單一插件，多種能力
- 工具說明完整更新

#### 修正 | Fixed

- FTS5 搜索透過 MCP HTTP 橋接（避免 sqlite3 CLI 依賴）
- Honcho ask 端點優雅退化
- SkillManager 路徑解析
- MCP HTTP 連接穩定性

#### 技術改進 | Technical Improvements

**進化演算法**
```
階段 1：生成 (GEPA)
  - constraints：添加明確約束
  - examples：添加使用範例
  - formatting：改進 Markdown
  - clarity：提升語言清晰度

階段 2：評分 (DSPy)
  - 內容品質啟發式
  - 結構品質
  - 歷史成功率

階段 3：驗證
  - 20 條追蹤的閉環驗證
  - 退化閾值：0.5

階段 4：應用/回滾
  - 分數 >= 0.5 → 應用
  - 分數 < 0.5 → 回滾
```

**記憶層級**
| 層級 | 類型 | 持久性 | 用途 |
|------|------|--------|------|
| L1 | 工作記憶 | 進程內 | 當前上下文 |
| L2 | 會話記憶 | 進程內 | 對話（HOT 層） |
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

#### 自動觸發機制

| 間隔 | 功能 |
|------|------|
| 每 5 分鐘 | Heartbeat（健康檢查 + 進化狀態） |
| 每 10 分鐘 | Proactive Check（Session + 建議） |
| 每 60 分鐘 | EvolutionScheduler（自動進化） |

---

## [0.2.0] - 2026-04-18 | 2026-04-18

### 🚀 功能擴展：Proactive AI + 自我改進引擎

#### 新增 | Added

**Proactive Session Tracker (7 工具)**
- `zcrystal_session_set` — 設定當前任務
- `zcrystal_session_get` — 獲取 session 狀態
- `zcrystal_session_clear` — 清除 session
- `zcrystal_proactive_check` — 檢查待辦事項和阻礙
- `zcrystal_proactive_suggest` — 主動建議
- `zcrystal_proactive_log` — 記錄行動
- `zcrystal_proactive_recent` — 獲取最近行動

**Self-Improving Engine (11 工具)**
- `zcrystal_correction_add` — 添加修正
- `zcrystal_correction_list` — 列出修正
- `zcrystal_heartbeat_run` — 運行心跳
- `zcrystal_heartbeat_status` — 心跳狀態
- `zcrystal_layers_exchange` — 層交換
- `zcrystal_predict` — 預測需求
- `zcrystal_pattern_add` — 添加模式
- `zcrystal_pattern_list` — 列出模式
- `zcrystal_log_action` — 記錄動作
- `zcrystal_log_recent` — 獲取最近日誌
- `zcrystal_selfimproving_status` — 系統狀態

**自動觸發機制**
- Heartbeat：每 5 分鐘自動執行
- Proactive Check：每 10 分鐘自動執行
- EvolutionScheduler：每 60 分鐘自動進化

#### 變更 | Changed

- 從被動式回應升級為主動式預測
- 系統狀態監控常駐化

#### 工具總數：58

---

## [0.1.0] - 2026-04-14 | 2026-04-14

### 🌱 初始發布：統一 API + 核心引擎

#### 新增 | Added

**核心引擎**
- `UnifiedApiRouter` — 27+ 端點的統一 API 路由器
- `SelfEvolutionEngine` — DSPy + GEPA 自我進化引擎
- `EvolutionCoordinator` — 多技能協調器
- `MemoryLayers` — L1-L5 多層記憶系統
- `TaskLifecycle` — 任務生命週期管理
- `ModelRouter` — 模型選擇路由器

**基礎工具 (18 工具)**
- `zcrystal_evo_health` — 健康檢查
- `zcrystal_search` — Honcho 語義搜索
- `zcrystal_ask_user` — 偏好查詢
- `zcrystal_skills` — 技能列表
- `zcrystal_skill_read` — 技能內容讀取
- `zcrystal_evolution_status` — 進化狀態
- `zcrystal_evolve` — 觸發進化
- `zcrystal_task_create/get` — 任務管理
- `zcrystal_memory_store/load` — 記憶存取
- `zcrystal_model_pick` — 模型選擇
- `zcrystal_fts5_search/stats` — FTS5 全文搜索

**命令**
- `/zcrystal_compact` — 壓縮 + 觸發進化
- `/zcrystal_profile` — 查看個人檔案

**鉤子**
- `zcrystal:msg_received` — 從用戶輸入學習
- `zcrystal:msg_sent` — 記錄 AI 回應

#### 功能

- 基本 Honcho 整合
- 技能發現與管理
- 自我進化原型
- FTS5 整合（MCP HTTP 橋接）

#### 工具總數：18

---

## 版本歷史 | Version History

| 版本 | 日期 | 工具數 | 主要功能 |
|------|------|--------|----------|
| 0.3.0 | 2026-04-19 | 85 | 完整統一插件 + Proactive AI + Self-Evolution |
| 0.2.0 | 2026-04-18 | 58 | Proactive AI + Self-Improving Engine |
| 0.1.0 | 2026-04-14 | 18 | 統一 API + 核心引擎 |

---

## Repository

https://github.com/ZCrystalC33/zcrystal-plugin

---

# CHANGELOG

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.3.0] - 2026-04-19

### 🎉 Major Release: ZCrystal Unified Plugin

> **v0.3.0** — 85 tools + Proactive AI + Self-Evolution + Skills System

This release unifies the ZCrystal_evo core engine with the OpenClaw plugin system for full feature completeness.

#### Added

**Core Engine (15 tools)**
- `UnifiedApiRouter` — Unified API router with 30+ endpoints
- `MemoryLayers` — L1-L5 multi-layer memory system
- `TaskLifecycle` — Task lifecycle management
- `ModelRouter` — Model selection router
- `RouterBridge` — Router bridge

**Skills System (18 tools)**
- `zcrystal_skills` — List skills
- `zcrystal_skill_read` — Read skill content
- `zcrystal_skill_generate` — Generate new skill
- `zcrystal_skill_versions` — Version history
- `zcrystal_skill_rollback` — Rollback version
- `zcrystal_skill_generator_stats` — Generation statistics
- `zcrystal_skill_version_create/get/list/diff/stats/rollback` — Version management
- `zcrystal_skill_indexer_search/index/rebuild/stats` — Indexer system
- `zcrystal_skill_validator_validate/validate_sync` — Validation system
- `zcrystal_skill_merger_suggest` — Merge suggestion

**Evolution System (11 tools)**
- `zcrystal_evolution_status` — Evolution status
- `zcrystal_evolve` — Trigger evolution
- `SelfEvolutionEngine` — DSPy + GEPA self-evolution engine
- `EvolutionScheduler` — Auto-evolution scheduler
- `EvolutionCoordinator` — Multi-skill coordinator
- `zcrystal_coordinator_status/register/evolve/queue` — Coordinator operations
- `zcrystal_heartbeat_run/status` — Heartbeat engine

**Safety Protection (5 tools)**
- `zcrystal_circuit_status/reset/check` — Circuit breaker
- `zcrystal_rate_status/check` — Rate limiter

**Proactive AI (12 tools)**
- `zcrystal_session_set/get/clear` — Session tracking
- `zcrystal_proactive_check/suggest/log/recent` — Proactive check
- `zcrystal_correction_add/list` — Correction log
- `zcrystal_pattern_add/list` — Pattern learning
- `zcrystal_layers_exchange` — Layer exchange
- `zcrystal_predict` — Context prediction
- `zcrystal_selfimproving_status` — System status

**Workflow (6 tools)**
- `zcrystal_workflow_create/get/stats/pause/resume/cancel` — WorkflowEngine

**Adapters (13 tools)**
- `zcrystal_openclaw_scan/import/export` — OpenClawSkillAdapter
- `zcrystal_replay_save/get/list/stats/rollback` — ReplayRunner
- `zcrystal_hooks_register/dispatch/list` — HookRegistry

**Tool Ecosystem (8 tools)**
- `zcrystal_toolhub_call/schema/logs` — ToolHub
- `zcrystal_fts5_search/stats` — FTS5 full-text search
- `zcrystal_webhook_register/dispatch/list` — Webhook system

**Other (12 tools)**
- `zcrystal_log` — Structured logging
- `zcrystal_metrics_get/record` — Metrics collection
- `zcrystal_model_pick` — Model selection
- `zcrystal_review_stats/suggestions` — Review engine
- `zcrystal_router_route/stats` — Router

**Commands**
- `/zcrystal_compact` — Compact + trigger evolution
- `/zcrystal_learn` — Learn user preferences
- `/zcrystal_profile` — View user profile

#### Changed

- Plugin renamed to `ZCrystal` (formerly ZCrystal-evo-plugin)
- Unified architecture: single plugin, multiple capabilities
- Tool descriptions fully updated

#### Fixed

- FTS5 search via MCP HTTP bridge (avoids sqlite3 CLI dependency)
- Honcho ask endpoint graceful degradation
- SkillManager path resolution
- MCP HTTP connection stability

#### Technical Improvements

**Evolution Algorithm**
```
Stage 1: Generation (GEPA)
  - constraints: Add explicit constraints
  - examples: Add usage examples
  - formatting: Improve Markdown
  - clarity: Enhance language clarity

Stage 2: Scoring (DSPy)
  - content quality heuristics
  - structure quality
  - historical success rate

Stage 3: Validation
  - 20-trace closed-loop validation
  - degradation threshold: 0.5

Stage 4: Apply/Rollback
  - score >= 0.5 → apply
  - score < 0.5 → rollback
```

**Memory Layers**
| Layer | Type | Persistence | Purpose |
|-------|------|-------------|---------|
| L1 | Working Memory | In-process | Current context |
| L2 | Session Memory | In-process | Conversation (HOT layer) |
| L3 | Short-Term Memory | Disk | Cross-session |
| L4 | Long-Term Memory | Disk | Persistent |
| L5 | Archive Memory | Disk | Cold storage |

#### Auto-Trigger Mechanisms

| Interval | Feature |
|----------|---------|
| Every 5 min | Heartbeat (health check + evolution status) |
| Every 10 min | Proactive Check (Session + suggestions) |
| Every 60 min | EvolutionScheduler (auto-evolution) |

---

## [0.2.0] - 2026-04-18

### 🚀 Feature Expansion: Proactive AI + Self-Improving Engine

#### Added

**Proactive Session Tracker (7 tools)**
- `zcrystal_session_set` — Set current task
- `zcrystal_session_get` — Get session state
- `zcrystal_session_clear` — Clear session
- `zcrystal_proactive_check` — Check todos and blockers
- `zcrystal_proactive_suggest` — Proactive suggestions
- `zcrystal_proactive_log` — Log action
- `zcrystal_proactive_recent` — Get recent actions

**Self-Improving Engine (11 tools)**
- `zcrystal_correction_add` — Add correction
- `zcrystal_correction_list` — List corrections
- `zcrystal_heartbeat_run` — Run heartbeat
- `zcrystal_heartbeat_status` — Heartbeat status
- `zcrystal_layers_exchange` — Layer exchange
- `zcrystal_predict` — Predict needs
- `zcrystal_pattern_add` — Add pattern
- `zcrystal_pattern_list` — List patterns
- `zcrystal_log_action` — Log action
- `zcrystal_log_recent` — Get recent logs
- `zcrystal_selfimproving_status` — System status

**Auto-Trigger Mechanisms**
- Heartbeat: runs every 5 minutes
- Proactive Check: runs every 10 minutes
- EvolutionScheduler: auto-evolution every 60 minutes

#### Changed

- Upgraded from reactive to proactive prediction
- System status monitoring now persistent

#### Total Tools: 58

---

## [0.1.0] - 2026-04-14

### 🌱 Initial Release: Unified API + Core Engine

#### Added

**Core Engine**
- `UnifiedApiRouter` — Unified API router with 27+ endpoints
- `SelfEvolutionEngine` — DSPy + GEPA self-evolution engine
- `EvolutionCoordinator` — Multi-skill coordinator
- `MemoryLayers` — L1-L5 multi-layer memory system
- `TaskLifecycle` — Task lifecycle management
- `ModelRouter` — Model selection router

**Base Tools (18 tools)**
- `zcrystal_evo_health` — Health check
- `zcrystal_search` — Honcho semantic search
- `zcrystal_ask_user` — Preference query
- `zcrystal_skills` — List skills
- `zcrystal_skill_read` — Read skill content
- `zcrystal_evolution_status` — Evolution status
- `zcrystal_evolve` — Trigger evolution
- `zcrystal_task_create/get` — Task management
- `zcrystal_memory_store/load` — Memory access
- `zcrystal_model_pick` — Model selection
- `zcrystal_fts5_search/stats` — FTS5 full-text search

**Commands**
- `/zcrystal_compact` — Compact + trigger evolution
- `/zcrystal_profile` — View user profile

**Hooks**
- `zcrystal:msg_received` — Learn from user input
- `zcrystal:msg_sent` — Record AI response

#### Features

- Basic Honcho integration
- Skill discovery and management
- Self-evolution prototype
- FTS5 integration (MCP HTTP bridge)

#### Total Tools: 18

---

## Version History

| Version | Date | Tools | Major Features |
|---------|------|-------|----------------|
| 0.3.0 | 2026-04-19 | 85 | Full unified plugin + Proactive AI + Self-Evolution |
| 0.2.0 | 2026-04-18 | 58 | Proactive AI + Self-Improving Engine |
| 0.1.0 | 2026-04-14 | 18 | Unified API + Core Engine |

---

## Repository

https://github.com/ZCrystalC33/zcrystal-plugin