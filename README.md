# ZCrystal 插件 for OpenClaw

**由 ZCrystal_evo v0.3.0 驅動** — 自我進化 + Honcho + 技能系統 + 任務生命週期 + 多層記憶 + 全文搜索

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
└─────────────────────────────────────────────────────────────────────────┘
```

## 完整工具列表 (39個)

### 核心工具 (4)
| 工具 | 說明 |
|------|------|
| `zcrystal_evo_health` | 健康檢查 |
| `zcrystal_evo_ready` | 就緒檢查 |
| `zcrystal_search` | 對話搜索 (Honcho) |
| `zcrystal_ask_user` | 詢問用戶偏好 |

### 任務系統 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_task_create` | 創建任務 |
| `zcrystal_task_get` | 獲取任務 |
| `zcrystal_task_stats` | 任務統計 |

### 記憶系統 (5)
| 工具 | 說明 |
|------|------|
| `zcrystal_memory_store` | 存入記憶 |
| `zcrystal_memory_load` | 讀取記憶 |
| `zcrystal_memory_search` | 搜索記憶 |
| `zcrystal_memory_delete` | 刪除記憶 |
| `zcrystal_memory_stats` | 記憶統計 |

### 技能系統 (6)
| 工具 | 說明 |
|------|------|
| `zcrystal_skills` | 技能列表 |
| `zcrystal_skill_read` | 讀取技能 |
| `zcrystal_skill_generate` | 生成技能 |
| `zcrystal_skill_versions` | 版本歷史 |
| `zcrystal_skill_rollback` | 回滾版本 |
| `zcrystal_skill_generator_stats` | 生成統計 |

### 進化系統 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_evolve` | 觸發進化 |
| `zcrystal_evolution_status` | 進化狀態 |
| `zcrystal_record_trace` | 記錄追蹤 |

### 路由器 (2)
| 工具 | 說明 |
|------|------|
| `zcrystal_model_pick` | 選擇模型 |
| `zcrystal_router_list` | 模型列表 |

### 評審系統 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_review_stats` | 評審統計 |
| `zcrystal_review_suggestions` | 評審建議 |
| `zcrystal_review_record` | 記錄評審 |

### 工具中心 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_toolhub_call` | 調用工具 |
| `zcrystal_toolhub_schema` | 工具 Schema |
| `zcrystal_toolhub_logs` | 工具日誌 |

### Webhook (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_webhook_telegram` | Telegram Webhook |
| `zcrystal_webhook_signal` | Signal Webhook |
| `zcrystal_webhook_generic` | 通用 Webhook |

### FTS5 搜索 (2)
| 工具 | 說明 |
|------|------|
| `zcrystal_fts5_search` | FTS5 搜索 |
| `zcrystal_fts5_stats` | FTS5 統計 |

### 熔斷保護 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_circuit_status` | 熔斷器狀態 |
| `zcrystal_circuit_reset` | 重置熔斷器 |
| `zcrystal_circuit_check` | 檢查熔斷 |

### 速率限制 (2)
| 工具 | 說明 |
|------|------|
| `zcrystal_rate_status` | 速率狀態 |
| `zcrystal_rate_check` | 速率檢查 |

### 日誌/指標 (3)
| 工具 | 說明 |
|------|------|
| `zcrystal_log` | 結構化日誌 |
| `zcrystal_metrics_get` | 指標獲取 |
| `zcrystal_metrics_record` | 指標記錄 |

## 命令 (3)
| 命令 | 說明 |
|------|------|
| `/zcrystal_compact` | 壓縮+進化 |
| `/zcrystal_learn` | 學習偏好 |
| `/zcrystal_profile` | 查看檔案 |

## 鉤子 (2)
| 鉤子 | 說明 |
|------|------|
| `msg_received` | 收到訊息 |
| `msg_sent` | 發送訊息 |

## 安裝

```bash
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

## 配置

```json
{
  "plugins": {
    "entries": {
      "zcrystal": {
        "enabled": true
      }
    },
    "allow": ["zcrystal"]
  }
}
```

## 授權

MIT
