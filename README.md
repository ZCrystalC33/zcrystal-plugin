# ZCrystal Plugin for OpenClaw

> **v1.0.3** — 自我進化插件 / Self-Evolution Engine / FTS5 即時搜尋 / Why+How 結構化反饋

[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.0.0-brightgreen)](package.json)
[![OpenClaw](https://img.shields.io/badge/openclaw-2026.4.15-blueviolet)](openclaw.plugin.json)
[![Tests](https://img.shields.io/badge/tests-117%2F117-brightgreen)](package.json)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]

---

## 核心功能

### 95+ 工具

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

### 🧬 自我進化引擎（Self-Evolution Engine）

ZCrystal 的核心引擎，透過 DSPy + GEPA 驅動的技能自動優化：

- **封閉循環驗證**：候選版本經 LLM 評估後自動應用
- **自動觸發**：根據成功率和訊息量自動觸發進化
- **每小時自動進化**：Plugin 啟動時自動啟動 scheduler
- **備份與回滾**：每次進化前自動備份，支援一鍵回滾
- **並發防護**：evolvingSkills Set 防止同技能重複進化
- **Why+How 結構化反饋**：每一個修正都有 principle + applicationRule

### 🔍 FTS5 即時搜尋系統

全文搜尋整合，實現「零延遲記憶召回」：

- **即時索引**：每條訊息發送/接收時立即寫入 FTS5（~0ms）
- **自動召回**：before_prompt_build hook 偵測「之前/任務/進度」等關鍵字自動搜尋
- **Progressive Disclosure**：3 層检索（index → timeline → deep-dive），大幅降低 Context 負擔
- **噪音過濾**：NO_REPLY、HEARTBEAT_OK、系統訊息自動排除
- **隱私標籤**：`<private>...</private>` 內容寫入前自動移除

### 🧠 Proactive AI

主動式 AI 工作層，主動預測需求而非被動回應：

- **Session 追蹤**：自動追蹤活躍 Session，提供上下文感知
- **修正日誌**：記錄每次修正並學習模式
- **心跳監控**：每 5 分鐘自動健康檢查
- **主動建議**：根據上下文提供建議

### 💾 記憶系統（L1-L5）

| 層級 | 類型 | 持久性 | 用途 |
|------|------|--------|------|
| L1 | 工作記憶 | 進程內 | 當前上下文 |
| L2 | 會話記憶 | 進程內 | 對話（HOT 層）|
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

---

## 系統架構

```
User (Telegram)
    ↓ message:received / message:sent
OpenClaw Gateway
    ↓
┌─────────────────────────────────────────────┐
│   ZCrystal Plugin (v1.0.3)                   │
│                                             │
│  ├─ Hooks:                                  │
│  │  ├─ message:received → FTS5 即時索引     │
│  │  ├─ message:sent → FTS5 即時索引          │
│  │  └─ before_prompt_build → Auto-context  │
│  │                                          │
│  ├─ 95+ Tools:                              │
│  │  ├─ zcrystal_search → FTS5 搜尋          │
│  │  ├─ zcrystal_memory_index → Layer 1      │
│  │  ├─ zcrystal_memory_get → Layer 3        │
│  │  └─ zcrystal_evolution_control           │
│  │                                          │
│  └─ Self-Evolution Engine:                  │
│     ├─ evolveSkill() → applyBestCandidate() │
│     ├─ FeedbackStore (Why+How)              │
│     ├─ EvolutionScheduler (每小時自動)       │
│     └─ Reflexion (自我修正)                  │
└─────────────────────────────────────────────┘
```

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

// FTS5 搜尋對話歷史
await zcrystal.unified({ tool: 'zcrystal_search', params: { query: '關鍵字' } })

// Progressive Disclosure - Layer 1: 輕量索引
await zcrystal.unified({ tool: 'zcrystal_memory_index', params: { query: '關鍵字' } })

// Progressive Disclosure - Layer 3: 依 ID 取得完整內容
await zcrystal.unified({ tool: 'zcrystal_memory_get', params: { id: 1234 } })

// 控制自動進化
await zcrystal.unified({ tool: 'zcrystal_evolution_control', params: { action: 'status' } })

// 查看進化狀態
await zcrystal.unified({ tool: 'zcrystal_evolution_status' })
```

---

## 演進歷程

| 版本 | 日期 | 重大更新 |
|------|------|----------|
| v1.0.3 | 2026-04-25 | Why+How Feedback Pattern + FeedbackStore + Claude-Mem 功能整合 |
| v1.0.2 | 2026-04-25 | FTS5 即時索引、進化系統修復（auto-apply）、Auto-context recall |
| v1.0.1 | 2026-04-22 | 效能優化（I/O -50%、搜尋 -70%）|
| v1.0.0 | 2026-04-21 | 95 工具 + 自我進化引擎 + Proactive AI + 101 測試通過 |

---

## 贊助與連結

- **GitHub**: https://github.com/ZCrystalC33/zcrystal-plugin
- **FTS5 Skill**: https://github.com/ZCrystalC33/fts5-openclaw-skill
- **Plugin ID**: `zcrystal`