# ZCrystal 插件 for OpenClaw

**由 ZCrystal_evo v0.3.0 驅動** — 自我進化 + Honcho + 技能系統 + 任務生命週期 + 多層記憶 + 全文搜索

統一的 TypeScript OpenClaw 插件，結合了 Honcho 整合、技能管理、自我進化引擎、多層記憶系統和全文搜索。

## 架構

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw 核心                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZCrystal 插件 (TypeScript)                           │
│                                                                         │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐       │
│  │ HonchoClient │ SkillManager  │ SelfEvolution │  UnifiedApi   │       │
│  │   (搜索)      │   (技能)      │   引擎        │    路由器     │       │
│  └───────────────┴───────────────┴───────────────┴───────────────┘       │
│                                                                         │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐       │
│  │ TaskLifecycle│ MemoryLayers  │  ModelRouter  │  FTS5Bridge   │       │
│  │   (任務)      │  (L1-L5記憶)  │   (模型選擇)   │   (搜索)      │       │
│  └───────────────┴───────────────┴───────────────┴───────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   本地 Honcho 服務         ~/.openclaw/fts5.db       自我進化存儲
```

## 功能

### 1. 🔍 Honcho 整合
- 對話歷史語義搜索
- 用戶偏好學習
- 會話上下文注入

### 2. 🛠️ 技能系統
- SKILL.md 發現與生命週期管理
- 技能版本控制與回滾
- 變更時自動重新載入

### 3. 🧬 自我進化引擎
- **DSPy 評分**：多因素候選評估
- **GEPA 突變**：約束條件、範例、格式化、清晰度
- **閉環驗證**：20 條痕跡驗證
- **自動回滾**：退化檢測

### 4. 📝 任務生命週期
- 創建、追蹤和管理任務
- 多種觸發類型：telegram、signal、webhook、cron、manual

### 5. 🧠 記憶層級 (L1-L5)
- **L1**：工作記憶（進程內緩存）
- **L2**：會話記憶（對話級別）
- **L3**：短期記憶（跨會話）
- **L4**：長期記憶（持久化）
- **L5**：歸檔記憶（冷存儲）

### 6. 🔎 FTS5 全文搜索
- 通過 MCP HTTP 搜索對話歷史
- 統計與索引

## 工具

### 用戶工具

| 工具 | 說明 |
|------|------|
| `zcrystal_evo_health` | ZCrystal_evo 核心健康檢查 |
| `zcrystal_search` | 搜索對話歷史 (Honcho) |
| `zcrystal_ask_user` | 詢問用戶偏好 |
| `zcrystal_skills` | 列出所有技能 |
| `zcrystal_skill_read` | 讀取技能內容 |
| `zcrystal_evolution_status` | 獲取進化狀態 |
| `zcrystal_evolve` | 觸發自我進化 |
| `zcrystal_fts5_search` | FTS5 全文搜索 |
| `zcrystal_fts5_stats` | FTS5 統計資訊 |

### Agent 內部工具

| 工具 | 說明 |
|------|------|
| `zcrystal_record_trace` | 記錄執行追蹤 (Agent內部) |
| `zcrystal_task_create` | 創建任務 (Agent內部) |
| `zcrystal_task_get` | 獲取任務 (Agent內部) |
| `zcrystal_memory_store` | 存入記憶 L1-L5 (Agent內部) |
| `zcrystal_memory_load` | 讀取記憶 (Agent內部) |
| `zcrystal_model_pick` | 選擇最佳模型 (Agent內部) |

## 命令

| 命令 | 說明 |
|------|------|
| `/zcrystal_compact` | 壓縮對話 + 觸發自我進化 |
| `/zcrystal_learn <偏好>` | 教導 ZCrystal 你的偏好 |
| `/zcrystal_profile` | 查看 ZCrystal 個人檔案 |

## 鉤子

| 鉤子 | 時機 | 動作 |
|------|------|------|
| `zcrystal:msg_received` | 收到訊息 | 學習用戶輸入 |
| `zcrystal:msg_sent` | 發送訊息 | 記錄 AI 回應 |

## 安裝

```bash
# 克隆並編譯
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build

# 複製到擴展目錄
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

## 配置

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

## 開發

```bash
# 編譯
npm run build

# 類型檢查
npx tsc --noEmit

# 監聽模式
npx tsc --watch
```

## 依賴

- `openclaw` >= 2026.3.24-beta.2
- `@sinclair/typebox` TypeBox 類型框架
- ZCrystal_evo 核心引擎（已捆綁）

## 授權

MIT

---

**由 ZCrystal_evo 驅動** — 自我進化 AI 系統
