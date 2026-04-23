# ZCrystal Plugin 安裝指南

## 快速安裝

```bash
# 1. Clone
git clone https://github.com/ZCrystalC33/zcrystal-plugin.git
cd zcrystal-plugin

# 2. 安裝（自動處理 @zcrystal/evo）
npm install

# 3. 啟動 Plugin
openclaw plugins install .
```

## 自動處理流程

`npm install` 會自動執行：

1. **postinstall script** (`scripts/setup-evo.sh`)
   - 檢查 `node_modules/@zcrystal/evo` 是否存在
   - 如果是壞掉的符號鏈接，自動刪除
   - 從 GitHub Clone `ZCrystal_evo`
   - 複製檔案到正確位置

2. **npm run build**
   - TypeScript 編譯

## 手動處理（可選）

如果需要手動處理：

```bash
# 方式 1：手動 Clone
mkdir -p node_modules/@zcrystal/evo
git clone --depth 1 https://github.com/ZCrystalC33/ZCrystal_evo.git node_modules/@zcrystal/evo

# 方式 2：使用相對路徑
npm install
# 然後手動複製 ZCrystal_evo 的 dist/ 和 src/ 到 node_modules/@zcrystal/evo/
```

## 依賴結構

```
zcrystal-plugin/
├── package.json              # 主依賴
├── scripts/
│   └── setup-evo.sh         # @zcrystal/evo 自動設定
└── node_modules/
    └── @zcrystal/           # 自動下載
        └── evo/             # 從 GitHub Clone
```

## 必要條件

- Node.js >= 22.0.0
- Git
- npm

## 故障排除

### @zcrystal/evo 安裝失敗

```bash
# 清理並重試
rm -rf node_modules/@zcrystal/evo
npm install
```

### Build 失敗

```bash
npm run build
```

### 仍有问题

```bash
# 完整清理
rm -rf node_modules package-lock.json
npm install
```
