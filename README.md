# ZCrystal Plugin for OpenClaw

> **v1.0.1** — 自我進化插件 / Self-Evolution Engine / Proactive AI

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.0.0-brightgreen)](package.json)
[![OpenClaw](https://img.shields.io/badge/openclaw-2026.4.15-blueviolet)](openclaw.plugin.json)
[![Tests](https://img.shields.io/badge/tests-101%2F101-brightgreen)](package.json)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]

---

## 核心功能

### 95 工具

| 類別 | 工具數 | 核心功能 |
|------|--------|----------|
| 核心系統 | 15 | 健康檢查、統一路由、記憶管理 |
| 技能系統 | 18 | 技能生成、版本管理、驗證、合併建議 |
| 進化系統 | 11 | 自我進化引擎、協調器、心跳、預測 |
| 安全保護 | 5 | 熔斷器、速率限制 |
| 主動式 AI | 12 | Session 追蹤、修正日誌、模式學習 |
| 適配器 | 13 | OpenClaw 技能適配、回放系統、Hook 管理 |
| 工作流 | 6 | 工作流引擎（建立/暫停/恢復/取消）|
| 工具生態 | 8 | ToolHub、FTS5 搜索、Webhook |
| 其他 | 12 | 日誌、指標、模型選擇、評審引擎 |

### 自我進化引擎（Self-Evolution Engine）

ZCrystal 的核心引擎，透過 DSPy + GEPA 驅動的技能自動優化：

- **封閉循環驗證**：候選版本經 LLM 評估後自動應用
- **自動觸發**：根據成功率和訊息量自動觸發進化
- **備份與回滾**：每次進化前自動備份，支援一鍵回滾
- **記憶邊界**：進化歷史、應用候選、備份均設有上限（50/100/50）

### Proactive AI

主動式 AI 工作層，主動預測需求而非被動回應：

- **Session 追蹤**：自動追蹤活躍 Session，提供上下文感知
- **修正日誌**：記錄每次修正並學習模式
- **心跳監控**：每 5 分鐘自動健康檢查
- **主動建議**：根據上下文提供建議

### 記憶系統（L1-L5）

| 層級 | 類型 | 持久性 | 用途 |
|------|------|--------|------|
| L1 | 工作記憶 | 進程內 | 當前上下文 |
| L2 | 會話記憶 | 進程內 | 對話（HOT 層）|
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

---

## 安裝

```bash
cd ~/.openclaw/workspace/zcrystal-plugin
npm install
npm run build
npm test
```

---

## 常用工具

```typescript
// 健康檢查
await zcrystal.unified({ tool: 'zcrystal_evo_health' })

// 觸發自我進化
await zcrystal.unified({ tool: 'zcrystal_evolve' })

// 主動式建議
await zcrystal.unified({ tool: 'zcrystal_proactive_suggest' })

// 創建任務
await zcrystal.unified({
  tool: 'zcrystal_task_create',
  params: { title: '我的任務' }
})

// 搜尋技能
await zcrystal.unified({
  tool: 'zcrystal_skill_indexer_search',
  params: { query: '搜尋關鍵字' }
})

// 查看進化狀態
await zcrystal.unified({ tool: 'zcrystal_evolution_status' })
```

---

## 架構

```
┌──────────────────────────────────────────┐
│             OpenClaw Core                │
└──────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│         ZCrystal Plugin (v1.0.1)          │
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

---

## 開發

```bash
npm run build   # TypeScript → JavaScript
npm test        # 執行全部測試（101 tests）
```

---

## 更新日誌

完整更新日誌請參考 [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT License
