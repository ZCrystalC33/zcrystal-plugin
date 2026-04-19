# ZCrystal Plugin Quick Start

## 快速安裝

```bash
cd ~/.openclaw/workspace/zcrystal-plugin
./setup.sh
```

或手動安裝：

```bash
npm install
npm run build
cp dist/index.js ~/.openclaw/extensions/zcrystal/dist/
```

## 首次配置

```bash
# 運行向導
npx tsx src/onboarding-wizard.ts

# 或使用環境變量
export ZCRYSTAL_DATA_PATH=~/.openclaw/extensions/zcrystal
export ZCRYSTAL_FTS5_PORT=18795
```

## 基本使用

### 查看狀態
```bash
# 健康檢查
zcrystal_evo_health

# 查看 profile
zcrystal_profile

# 查看進化狀態
zcrystal_evolution_status
```

### 主動功能
```bash
# 設定當前任務
zcrystal_session_set topic="開發" task="完成登錄功能" nextMove="測試登錄流程"

# 獲取 session
zcrystal_session_get

# 運行主動檢查
zcrystal_proactive_check

# 主動建議
zcrystal_proactive_suggest context="正在開發用戶認證"
```

### 技能管理
```bash
# 列出技能
zcrystal_skills

# 生成新技能
zcrystal_skill_generate taskType="authentication" taskInput="{}"

# 查看版本
zcrystal_version_list skillId="auth-skill"
```

### 自我改進
```bash
# 添加修正
zcrystal_correction_add context="用戶指出回應太長" reflection="需要更簡潔的回應"

# 列出修正
zcrystal_correction_list

# 添加模式
zcrystal_pattern_add pattern="短回應" description="用戶偏好簡潔的回复"

# 查看狀態
zcrystal_selfimproving_status
```

## 自動觸發

ZCrystal 自動運行以下功能：

| 功能 | 間隔 | 說明 |
|------|------|------|
| Heartbeat | 每 5 分鐘 | 健康檢查 |
| Proactive Check | 每 10 分鐘 | Session 追蹤 |
| Evolution | 每 60 分鐘 | 自動進化 |

## 停止/啟動自動進化

```bash
# 停止
zcrystal_scheduler_stop

# 啟動
zcrystal_scheduler_start
```

## 疑難排除

### 插件未載入
```bash
# 檢查 OpenClaw 狀態
openclaw status

# 重啟 OpenClaw
openclaw gateway restart
```

### FTS5 搜索不工作
```bash
# 檢查 FTS5 MCP 服務
curl http://localhost:18795/mcp
```

### 查看日誌
```bash
# OpenClaw 日誌
tail -f ~/.openclaw/logs/openclaw.log

# ZCrystal 結構化日誌
cat ~/.openclaw/zcrystal-self-improving/log.md
```

## 配置

環境變量：

| 變量 | 預設值 | 說明 |
|------|--------|------|
| `ZCRYSTAL_DATA_PATH` | `~/.openclaw/extensions/zcrystal` | 數據目錄 |
| `ZCRYSTAL_SKILLS_PATH` | `~/.openclaw/skills` | 技能目錄 |
| `ZCRYSTAL_FTS5_PORT` | `18795` | FTS5 MCP 端口 |
| `ZCRYSTAL_EVOLUTION_INTERVAL` | `3600000` | 進化間隔 (ms) |
| `ZCRYSTAL_HEARTBEAT_INTERVAL` | `300000` | 心跳間隔 (ms) |
| `ZCRYSTAL_PROACTIVE_INTERVAL` | `600000` | 主動檢查間隔 (ms) |

## 100 工具完整列表

見 [README.md](README.md)
