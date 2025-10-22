# 資料庫遷移指南 - 添加 iconName 欄位

## 概述
此遷移為 `budget_categories` 和 `savings_jar_categories` 表添加 `icon_name` 欄位，以支持圖標管理功能。

## 遷移步驟

### 方法 1: 在 Neon Dashboard 執行（推薦）

1. 登入 [Neon Console](https://console.neon.tech/)
2. 選擇您的項目
3. 點擊 "SQL Editor"
4. 執行以下 SQL：

```sql
-- Add iconName column to budget_categories table
ALTER TABLE "budget_categories" ADD COLUMN "icon_name" varchar NOT NULL DEFAULT 'Wallet';

-- Add iconName column to savings_jar_categories table
ALTER TABLE "savings_jar_categories" ADD COLUMN "icon_name" varchar NOT NULL DEFAULT 'PiggyBank';
```

5. 點擊 "Run" 執行

### 方法 2: 使用 Render Shell（備用方案）

如果您的資料庫連線設定在 Render：

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 選擇您的 backend 服務
3. 點擊 "Shell" 標籤
4. 執行以下命令：

```bash
# 設定資料庫連線
export DATABASE_URL="your-neon-connection-string"

# 執行遷移
npm run migrate:icon-name
```

### 方法 3: 本地執行（需要資料庫連線）

```bash
# 在項目根目錄
npx ts-node scripts/migrate-add-icon-name.ts
```

## 驗證遷移

執行以下 SQL 查詢確認欄位已添加：

```sql
-- 檢查 budget_categories 表結構
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'budget_categories' AND column_name = 'icon_name';

-- 檢查 savings_jar_categories 表結構
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'savings_jar_categories' AND column_name = 'icon_name';
```

應該看到：
- `icon_name` | `varchar` | `'Wallet'` (for budget_categories)
- `icon_name` | `varchar` | `'PiggyBank'` (for savings_jar_categories)

## 回滾（如需要）

如果需要回滾此遷移：

```sql
-- Remove iconName column from budget_categories
ALTER TABLE "budget_categories" DROP COLUMN "icon_name";

-- Remove iconName column from savings_jar_categories
ALTER TABLE "savings_jar_categories" DROP COLUMN "icon_name";
```

## 預期結果

遷移完成後：
- 所有現有的預算類別將獲得預設圖標 "Wallet"
- 所有現有的存錢罐類別將獲得預設圖標 "PiggyBank"
- 新創建的類別可以選擇自訂圖標
- 前端將顯示圖標而不是色塊

## 故障排除

### 錯誤: column "icon_name" already exists
此錯誤表示欄位已存在，遷移可能已經執行過。您可以安全地忽略此錯誤。

### 錯誤: relation "budget_categories" does not exist
檢查您是否連接到正確的資料庫，並確認表名正確。

## 注意事項

⚠️ **重要**: 
- 此遷移是安全的，不會刪除或修改現有數據
- 添加的欄位有預設值，不會影響現有功能
- 建議在低流量時段執行遷移
- 執行前建議備份資料庫（Neon 有自動備份）

## 支援

如有問題，請檢查：
1. Neon 資料庫連線狀態
2. Render 服務日誌
3. 瀏覽器控制台錯誤訊息
