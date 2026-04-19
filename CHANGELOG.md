# 更新日誌

此專案的所有重要變更都會記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)。

## [0.3.0] - 2026-04-19

### 🎉 主要發布：ZCrystal 插件統一

此版本將 ZCrystal_evo 核心引擎與 OpenClaw 插件系統統一。

#### 新增

**核心引擎**
- `UnifiedApiRouter` - 27+ 端點的統一 API 路由器
- `SelfEvolutionEngine` - DSPy + GEPA 自我進化引擎
- `EvolutionCoordinator` - 多技能協調器
- `MemoryLayers` - L1-L5 多層記憶系統
- `TaskLifecycle` - 任務生命週期管理
- `ModelRouter` - 模型選擇路由器

**工具（18個）**
- `zcrystal_evo_health` - 健康檢查
- `zcrystal_search` - Honcho 語義搜索
- `zcrystal_ask_user` - 偏好查詢
- `zcrystal_skills` - 技能列表
- `zcrystal_skill_read` - 技能內容讀取
- `zcrystal_evolution_status` - 進化狀態
- `zcrystal_evolve` - 觸發進化
- `zcrystal_record_trace` - 追蹤記錄 *(Agent內部)*
- `zcrystal_task_create` - 任務創建 *(Agent內部)*
- `zcrystal_task_get` - 任務獲取 *(Agent內部)*
- `zcrystal_memory_store` - 記憶存入 L1-L5 *(Agent內部)*
- `zcrystal_memory_load` - 記憶讀取 *(Agent內部)*
- `zcrystal_model_pick` - 模型選擇 *(Agent內部)*
- `zcrystal_fts5_search` - FTS5 全文搜索
- `zcrystal_fts5_stats` - FTS5 統計

**命令**
- `/zcrystal_compact` - 壓縮 + 觸發進化
- `/zcrystal_learn` - 學習偏好
- `/zcrystal_profile` - 查看個人檔案

**鉤子**
- `zcrystal:msg_received` - 從用戶輸入學習
- `zcrystal:msg_sent` - 記錄 AI 回應

**FTS5 整合**
- MCP HTTP 橋接到 OpenClaw FTS5 技能
- Port 18795 端點

#### 變更

- 插件更名為 ZCrystal（原 ZCrystal-evo-plugin）
- 統一架構：單一插件，多種能力
- 工具說明更新，標記 *(Agent內部)* 的項目

#### 修正

- 通過 MCP HTTP 的 FTS5 搜索（避免 sqlite3 CLI 依賴）
- Honcho ask 端點優雅退化
- SkillManager 路徑解析

#### 技術詳情

**進化算法**
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
| L2 | 會話記憶 | 進程內 | 對話 |
| L3 | 短期記憶 | 磁盤 | 跨會話 |
| L4 | 長期記憶 | 磁盤 | 持久化 |
| L5 | 歸檔記憶 | 磁盤 | 冷存儲 |

---

## [0.0.1] - 2026-04-14

### 初始發布

- 基本 Honcho 整合
- 技能發現
- 自我進化原型

---

## [0.3.1] - 2026-04-19

### 新增核心功能整合

#### ReviewEngine 評審引擎
- `zcrystal_review_stats` - 獲取評審統計和失敗模式
- `zcrystal_review_suggestions` - 獲取技能升級建議
- `zcrystal_review_record` - 記錄任務執行 *(Agent內部)*

#### ToolHub 工具中心
- `zcrystal_toolhub_call` - 通過 ToolHub 安全執行工具
- `zcrystal_toolhub_schema` - 獲取工具 schema
- `zcrystal_toolhub_logs` - 獲取工具執行日誌

#### SkillGenerator 技能生成
- `zcrystal_skill_generate` - 從任務模式生成新技能
- `zcrystal_skill_generator_stats` - 獲取技能生成統計

#### CircuitBreaker 熔斷保護
- `zcrystal_circuit_status` - 熔斷器狀態和統計
- `zcrystal_circuit_reset` - 重置熔斷器
- `zcrystal_circuit_check` - 檢查是否可執行 *(Agent內部)*

### 工具總數：28
