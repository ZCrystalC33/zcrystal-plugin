# ZCrystal Plugin - 專案追蹤

## 🎯 目標

構建一個純 TypeScript 的 OpenClaw Plugin，實現 Hermes 的三大核心能力：
1. **Self-Evolution** - 自動週期性優化（DSPy + GEPA）
2. **Honcho** - 用戶/AI 持久記憶與建模
3. **Skills System** - OpenClaw 相容的技能管理

---

## 📊 進度總覽

| 功能 | 狀態 | 說明 |
|------|------|------|
| 專案架構 | ✅ 完成 | TypeScript + ESM |
| Honcho Client | ✅ 完成 | HTTP API 客戶端 |
| Skill Manager | ✅ 完成 | SKILL.md 發現與管理 |
| Self-Evolution Engine | ✅ 完成 | DSPy + GEPA 實現 |
| Plugin 入口 | ✅ 完成 | definePluginEntry |
| Tool 註冊 | ✅ 完成 | 7 個 tools |
| Command 註冊 | ✅ 完成 | /compact |
| Hook 註冊 | ✅ 完成 | after_tool_call, before_prompt_build |
| SDK 相容優化 | 🔄 進行中 | 根據官方文檔更新 |
| 發布/安装 | ⏳ 待辦 | ClawHub 或 npm |

---

## 🔧 實現方式（根據 SDK 文檔）

### 1. Package.json 結構
```json
{
  "openclaw": {
    "extensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

### 2. 工具註冊（使用 Typebox）
```typescript
import { Type } from "@sinclair/typebox";

api.registerTool({
  name: "zcrystal_search",
  description: "...",
  parameters: Type.Object({
    query: Type.String(),
    limit: Type.Optional(Type.Number()),
  }),
  async execute(_id, params) {
    return { content: [{ type: "text", text: "..." }] };
  },
});
```

### 3. Hook 決策語義
- `before_tool_call`: `{ block: true }` 終止，阻止執行
- `message_sending`: `{ cancel: true }` 終止

### 4. 可選工具標記
```typescript
api.registerTool({
  name: "zcrystal_evolve",
  // ...
}, { optional: true });
```

---

## 📁 檔案結構

```
zcrystal-plugin/
├── package.json          # Plugin 元數據 + OpenClaw 欄位
├── openclaw.plugin.json  # Plugin 清單（manifest）
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── index.ts         # Plugin 入口（register）
│   ├── types.ts         # 類型定義
│   ├── honcho-client.ts # Honcho HTTP 客戶端
│   ├── skill-manager.ts # Skill 發現與管理
│   └── self-evolution.ts# DSPy + GEPA 引擎
└── dist/                # 編譯輸出
```

---

## 🚀 待辨事項

### 高優先
- [ ] 更新 package.json 加入 `openclaw` 欄位
- [ ] 更新 tools 使用 `Type.Object()` 格式
- [ ] 更新 openclaw.plugin.json schema

### 中優先
- [ ] 加入可選工具標記（optional tools）
- [ ] 改進錯誤處理
- [ ] 加入更多 hook（如 `before_tool_call` 攔截）

### 低優先
- [ ] 撰寫測試
- [ ] 發布到 ClawHub

---

## 🔗 SDK 文檔參考

- [Building Plugins](https://docs.openclaw.ai/plugins/building-plugins)
- [SDK Overview](https://docs.openclaw.ai/plugins/sdk-overview)
- [Entry Points](https://docs.openclaw.ai/plugins/sdk-entrypoints)
- [Plugin Manifest](https://docs.openclaw.ai/plugins/manifest)