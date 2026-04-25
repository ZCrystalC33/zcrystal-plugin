# 更新日誌 | CHANGELOG

Format based on [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)

---

# 2026-04-25 (下午 v2)

## [v1.0.4] - 2026-04-25

> **移除無用的 Auto-Context Recall Hook + 性能優化**

### 🔧 Bug Fixes（錯誤修復）

| Commit | 修復內容 |
|--------|----------|
| `ba005f2` | 移除 `before_prompt_build` 無用 Python spawn（結果被丟棄，純浪費）|
| `ba005f2` | Performance Review 完成（10 個瓶頸，移除 B4 無用 hook）|

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅

---

# 2026-04-25 (下午)

## [v1.0.3] - 2026-04-25

> **Why+How 進化模式 + Claude-Mem 功能整合**

### ✨ Features（新功能）

| Commit | 功能 | 說明 |
|--------|------|------|
| `2f5a546` | Why+How Feedback Pattern | Claude-Memory-Framework 結構化反饋模式 |
| `2f5a546` | FeedbackStore | 磁盤持久化 Why+How 條目（FIFO, 200 entries）|
| `2f5a546` | LLM Prompt 更新 | 評估請求 evaluationFeedback，診斷請求 principle/applicationRule |

### 🔧 Bug Fixes（錯誤修復）

| Commit | 修復內容 |
|--------|----------|
| `2f5a546` | FeedbackStore 整合進 SelfEvolutionEngine |
| `2f5a546` | Reflexion 修正後自動寫入 FeedbackStore |

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅

---

# 2026-04-25 (上午)

## [v1.0.2] - 2026-04-25

> **FTS5 即時索引 + 進化系統修復 + 自動召回**

### ✨ Features（新功能）

| Commit | 功能 | 說明 |
|--------|------|------|
| `c28fb8b` | Real-time FTS5 Indexing | Hook 觸發即時索引，延遲 ~0ms |
| `e3cda0e` | Direct FTS5 Search | Python subprocess 直搜，無 MCP HTTP 依賴 |
| `be791d5` | Auto-Context Recall | before_prompt_build 自動偵測記憶缺口 |

### 🔧 Bug Fixes（錯誤修復）

| Commit | 修復內容 |
|--------|----------|
| `a916230` | 全面修復 16 個程式碼缺陷 |
| `e692c12` | 進化系統：evolveSkill 完成後自動 applyBestCandidate |
| `e692c12` | 新增 evolvingSkills Set 防並發進化衝突 |
| `e692c12` | 新增 zcrystal_evolution_control tool（start/stop/status）|
| `81b194a` | Auto-start evolutionScheduler（Plugin 啟動時自動呼叫）|

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅

---

# 2026-04-22

## [v1.0.1] - 2026-04-22

> **效能優化 + ClawCode 審查修復**

### ⚡ Performance（效能優化）

| Commit | 優化內容 | 預期改善 |
|--------|----------|----------|
| `61a1f6d` | 消除 redundant stat syscall | -50% I/O |
| `2947998` | Memory bounds + Search indexing | ~5MB 上限，-70% 搜尋 |
| `3219275` | Skill discovery cache + Workspace memoization | -80-90% 重複調用 |

### 🔧 Bug Fixes（錯誤修復）

| Commit | 修復內容 |
|--------|----------|
| `61a1f6d` | 消除 redundant stat syscall in skill discovery |
| `45a28f3` | Hardcoded path `SCRIPT_DIR/../ZCrystal_evo` → `ZCRYSTAL_EVO_PATH` 環境變量 |
| `45a28f3` | 新增 `CREATED_DIRS` 追蹤，支援 rollback |
| `94d3789` | Version mismatch：新增 `minGatewayVersion: 2026.4.15` |
| `94d3789` | setInterval cleanup：heartbeat/proactive intervals 在 unload 時清除 |

### 🔍 Code Review（ClawCode 審查）

| Commit | 審查內容 |
|--------|----------|
| `45a28f3` | Critical Issues Fix（路徑 hardcode、錯誤處理、rollback）|
| `94d3789` | Warnings + Performance 修復 |

### 📊 Test Results

- `npm run build && npm test` → **101/101 tests passed** ✅

---

# 2026-04-21

## [v1.0.0] - 2026-04-21

> **95 工具 + 自我進化引擎 + Proactive AI + Skills System + 101 測試通過**

### 🛠️ Bug Fixes（沿路修復的問題）

| Commit | 修復內容 |
|--------|----------|
| `1b926e7` | 簡化安全門：移除 rate limit，保留每日上限 1000 + 去重 |
| `05ff59e` | 新增安全門，防止 feedback loop 和 runaway writes |
| `c992f55` | Honcho sync 安全防護 + UserAnalyzer fallback |
| `5708440` | 移除 honcho.search 呼叫的 `as any` cast |
| `a9cf223` | 更新工具計數日誌（100 → 95）|
| `6f0f5f3` | Code review 回饋修正（第三批）|
| `3d8308e` | Code review 回饋修正（第二批）|
| `1f5fba8` | Code review 回饋修正（第一批）|
| `0bbf0f5` | 補回缺失的 ReviewEngine 工具 |

### ✨ Features（新功能）

| Commit | 功能 |
|--------|------|
| `a364886` | 新增全部 6 個工具模組的測試 |
| `9bc2577` | 新增 vitest + 初始模組測試 |
| `1460d5f` | 重構：將 index.ts 拆分為 modular tools/ |
| `b72999d` | 建立全自動 install.sh（依賴解析）|
| `c094bbe` | 新增安裝精靈，移除 hardcoded paths |
| `2459b9b` | 新增 Proactive Session Tracker |
| `56486a5` | 重構：將 Self-Improving 整合進 ZCrystal 系統 |
| `ad4a2d1` | 完成 Self-Improving Engine 實作 |
| `803f0a9` | 新增自動進化排程器（start/stop controls）|
| `4f8269f` | 實作全部 5 個剩餘功能 |
| `cb00710` | 完成所有未實作功能 |
| `0e5efe5` | 完成架構 — 新增缺失的 component tools |
| `9e568b2` | 整合 RateLimiter、StructuredLogger、Metrics |
| `80ba5d2` | 整合 ReviewEngine、ToolHub、SkillGenerator、CircuitBreaker |
| `6d7093a` | 透過 MCP HTTP 整合 FTS5 搜索 |
| `1f6378f` | 統一插件 — 合併所有 ZCrystal_evo 功能 |
| `6184b6b` | 重構：將 ZCrystal_evo 作為核心引擎整合 |
| `ca900b2` | ZCrystal OpenClaw Plugin v0.1.0 初始版本 |

### 📚 文件更新

| Commit | 更新內容 |
|--------|----------|
| `e3a41fe` | 更新 README（含完整安裝指南）|
| `e55459b` | 雙語格式重寫 README 和 CHANGELOG |
| `47dc346` | 更新 CHANGELOG v0.7.0 — Proactive AI 完成 |
| `aefc252` | 更新 README v0.6.0 — 100 tools、Proactive AI |
| `40560ab` | 更新 CHANGELOG v0.6.0 — 所有功能完成 |
| `a573b0f` | 更新 CHANGELOG v0.5.0 |
| `ef39ec9` | 更新 CHANGELOG v0.4.0 — 完整架構 |
| `270c563` | 更新完整架構文件 |
| `28e78c6` | 更新 CHANGELOG v0.3.2 |
| `286a063` | 更新 CHANGELOG v0.3.1 |
| `10eb4b1` | 繁體中文重寫 README 和 CHANGELOG |
| `49abfef` | 重寫 README 並新增 CHANGELOG |

### 🔧 維護

| Commit | 內容 |
|--------|------|
| `ccfb70c` | 更新支援 OpenClaw 2026.4.15 |
| `9565d31` | 版本 bump 至 0.3.0（與 ZCrystal_evo 同步）|
| `ac7ee16` | 在描述中標記 agent-internal tools |

---

## [0.3.0] - 2026-04-19

### 🎉 主要發布：ZCrystal 統一插件

> **85 工具 + Proactive AI + Self-Evolution + Skills System**

---

## [0.2.0] - 2026-04-18

### 🔧 初始版本

初始 ZCrystal OpenClaw Plugin 框架。

---


---

## [v1.0.2] - 2026-04-22

> **部署驗證 + 穩定性更新**

### ✅ Deployment Verified

| 指標 | 數值 |
|------|------|
| Gateway Memory | 836 MB (4.0%) |
| Gateway Uptime | 7h 41m |
| Gateway Health | ✅ OK |
| Tests | 101/101 passed |

### ⚡ Performance（已含於 v1.0.1）

| 優化 | 說明 |
|------|------|
| Skill discovery cache | 5min TTL memoization |
| Workspace memoization | 避免重複 HTTP 呼叫 |
| Memory bounds | MAX_HISTORY/APPLIED/BACKUPS 上限 |
| Search indexing | O(n) → O(k) 搜尋 |
| TTL cleanup | pendingEvaluations 30s, backups 24h |

### 🔧 ClawCode Fixes（已含於 v1.0.1）

| 問題 | 修復 |
|------|------|
| Constructor 類型驗證 | ZCrystal_evo .d.ts 對照正確 |
| pendingEvaluations leak | TTL + size eviction |
| Scheduler cleanup | unload hook 呼叫 stop() |

*最後更新：2026-04-22 v1.0.2*

# 2026-04-25 (下午 v3)

## [v1.0.5] - 2026-04-25

> **Self-Doubt Recall System — Agent 自我懷疑與回憶**

### ✨ Features（新功能）

| Commit | 功能 | 說明 |
|--------|------|------|
| `b25e74e` | zcrystal_recall | Agent 自我觸發的記憶復原工具 |
| `b25e74e` | Self-Doubt Recall | Agent 感覺「不確定」時可先呼叫再回答 |
| `b25e74e` | UNCERTAINTY_MARKERS | 我不記得、不確定、需要確認等觸發關鍵字 |

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅


## [v1.0.6] - 2026-04-25

> **Self-Doubt Recall System 完成 - 方案 C 混合模式**

### ✨ Features（新功能）

| Commit | 功能 | 說明 |
|--------|------|------|
| `7bb60fc` | llm_output hook | 監控 Agent 回應中的 uncertainty markers |
| `7bb60fc` | Auto-search FTS5 | 偵測「我不記得」時自動觸發搜尋 |
| `7bb60fc` | 3-layer solution | 手動 zcrystal_recall + self-doubt hook + proactive search |

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅


## [v1.0.7] - 2026-04-25

> **Context Injection + Cross-Hook State Sharing**

### ✨ Features（新功能）

| Commit | 功能 | 說明 |
|--------|------|------|
| `5bbefc7` | Self-Doubt Recall Flow | llm_output → before_prompt_build → state → tool |
| `5bbefc7` | PendingRecallContext Store | Module-level store for cross-hook communication |
| `5bbefc7` | Enhanced zcrystal_recall | 先檢查 auto-detected recall，再 manual search |
| `5bbefc7` | `api.on()` hook registration | 修正 before_prompt_build 回傳問題 |

### 🔧 Optimizations（優化）

| 項目 | 說明 | 狀態 |
|------|------|------|
| Context Injection | 讓 recall 結果能注入 Agent | ✅ 已完成 |
| Evolution Learning Persistence | 進化結果累積到 memory | ⏳ 待實作 |
| FTS5 Batch Write | 減少多餘 process | ⏳ 待實作 |

### 🧪 Test Results

- `npm run build && npm test` → **117/117 tests passed** ✅

