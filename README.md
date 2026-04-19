# ZCrystal Plugin for OpenClaw

**由 ZCrystal_evo v0.3.0 驅動** — 自我進化 + Honcho + 技能系統 + 任務生命週期 + 多層記憶 + 全文搜索 + Proactive AI

## 架構

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw 核心                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZCrystal Plugin (TypeScript)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    UnifiedApiRouter (30+ 端點)                    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Health      │ Task      │ Memory    │ Skill    │ Router         │   │
│  │ Evolution   │ Review    │ ToolHub   │ Webhook  │ Bridge         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐           │
│  │Circuit    │ Rate      │ Logger    │ Metrics  │ FTS5       │           │
│  │Breaker    │ Limiter   │           │          │ Bridge     │           │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐         │
│  │                    Proactive AI Engine                       │         │
│  │  Session Tracker │ Self-Improving │ Auto Heartbeat           │         │
│  └─────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 工具總數：100

### 功能分類

| 類別 | 工具數 | 說明 |
|------|--------|------|
| 核心系統 | 15 | UnifiedApiRouter, Memory, Task, Router |
| 技能系統 | 18 | Manager, Versioning, Indexer, Validator, Merger, Generator |
| 進化系統 | 11 | SelfEvolutionEngine, EvolutionScheduler, Coordinator |
| 安全保護 | 5 | CircuitBreaker, RateLimiter |
| Proactive | 12 | Session Tracker, Self-Improving, Heartbeat |
| 適配器 | 13 | OpenClawAdapter, ReplayRunner, Hooks |
| 工作流 | 6 | WorkflowEngine |
| 工具生態 | 8 | ToolHub, FTS5, Webhooks |
| 其他 | 12 | Logger, Metrics, Commands |

---

## 核心工具

### 核心 (6)
| 工具 | 說明 |
|------|------|
| `zcrystal_evo_health` | 健康檢查 |
| `zcrystal_evo_ready` | 就緒檢查 |
| `zcrystal_search` | 對話搜索 (Honcho) |
| `zcrystal_ask_user` | 詢問用戶偏好 |
| `zcrystal_compact` | 壓縮+進化 |
| `zcrystal_profile` | 查看檔案 |

### 任務系統 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_task_create` | 創建任務 |
| `zcrystal_task_get` | 獲取任務 |
| `zcrystal_task_stats` | 任務統計 |

### 記憶系統 (7)
| 工具 | 說明 |
|------|------|
| `zcrystal_memory_store` | 存入記憶 |
| `zcrystal_memory_load` | 讀取記憶 |
| `zcrystal_memory_search` | 搜索記憶 |
| `zcrystal_memory_delete` | 刪除記憶 |
| `zcrystal_memory_stats` | 記憶統計 |
| `zcrystal_memory_add` | 添加到 HOT 層 |
| `zcrystal_memory_get` | 獲取 HOT 層 |

### 技能系統 (6)
| 工具 | 說明 |
|------|------|
| `zcrystal_skills` | 技能列表 |
| `zcrystal_skill_read` | 讀取技能 |
| `zcrystal_skill_generate` | 生成技能 |
| `zcrystal_skill_versions` | 版本歷史 |
| `zcrystal_skill_rollback` | 回滾版本 |
| `zcrystal_skill_generator_stats` | 生成統計 |

---

## Proactive AI 功能

### Session Tracker (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_session_set` | 設定當前任務 |
| `zcrystal_session_get` | 獲取 session 狀態 |
| `zcrystal_session_clear` | 清除 session |

### Proactive Check (4)
| 工具 | 說明 |
|------|------|
| `zcrystal_proactive_check` | 檢查待辦和阻礙 |
| `zcrystal_proactive_suggest` | 主動建議 |
| `zcrystal_proactive_log` | 記錄行動 |
| `zcrystal_proactive_recent` | 獲取最近行動 |

### Self-Improving (11)
| 工具 | 說明 |
|------|------|
| `zcrystal_correction_add` | 添加修正 |
| `zcrystal_correction_list` | 列出修正 |
| `zcrystal_heartbeat_run` | 運行心跳 |
| `zcrystal_heartbeat_status` | 心跳狀態 |
| `zcrystal_layers_exchange` | 層交換 |
| `zcrystal_predict` | 預測需求 |
| `zcrystal_pattern_add` | 添加模式 |
| `zcrystal_pattern_list` | 列出模式 |
| `zcrystal_log_action` | 記錄動作 |
| `zcrystal_log_recent` | 獲取最近日誌 |
| `zcrystal_selfimproving_status` | 系統狀態 |

---

## 自動觸發機制

| 間隔 | 功能 |
|------|------|
| **每 5 分鐘** | Heartbeat (健康檢查) |
| **每 10 分鐘** | Proactive Check (Session + 建議) |
| **每 60 分鐘** | EvolutionScheduler (自動進化) |

---

## 安裝

```bash
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

## 授權

MIT
