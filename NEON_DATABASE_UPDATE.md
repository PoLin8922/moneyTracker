# 投資組合功能 - Neon 資料庫更新指南

## ⚠️ 重要：需要在 Neon Console 執行 SQL

投資組合功能需要更新資料庫結構。請按照以下步驟操作：

### 📋 步驟 1: 登入 Neon Console

1. 前往 https://console.neon.tech
2. 選擇你的專案
3. 點擊 SQL Editor

### 📋 步驟 2: 執行 Schema 更新

複製並執行以下 SQL（也可以直接執行 `migrations/0002_add_investment_accounts.sql`）：

```sql
-- 1. 修改 investment_holdings 表，添加券商帳戶關聯和標的名稱
ALTER TABLE investment_holdings 
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name VARCHAR;

-- 2. 修改 investment_transactions 表，添加付款帳戶和券商帳戶關聯
ALTER TABLE investment_transactions
ADD COLUMN IF NOT EXISTS payment_account_id VARCHAR REFERENCES asset_accounts(id),
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id);

-- 3. 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_investment_holdings_broker_account ON investment_holdings(broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_broker ON investment_holdings(user_id, broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_payment_account ON investment_transactions(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_broker_account ON investment_transactions(broker_account_id);
```

### 📋 步驟 3: 驗證更新

執行以下查詢確認欄位已新增：

```sql
-- 檢查 investment_holdings 結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investment_holdings';

-- 檢查 investment_transactions 結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investment_transactions';
```

應該看到：
- `investment_holdings` 有 `broker_account_id` 和 `name` 欄位
- `investment_transactions` 有 `payment_account_id` 和 `broker_account_id` 欄位

### 📋 步驟 4: 重新部署前端

執行更新後，前端應用程式即可開始使用投資組合功能。

## 🎯 更新內容說明

### investment_holdings 新增欄位
- **broker_account_id**: 關聯到券商帳戶（台股/美股/加密貨幣帳戶）
- **name**: 標的名稱（如：台積電、Apple、Bitcoin）

### investment_transactions 新增欄位
- **payment_account_id**: 付款帳戶（從哪個帳戶扣款/入帳）
- **broker_account_id**: 券商帳戶（股票存入/賣出哪個帳戶）

### 索引優化
- 為常用查詢欄位建立索引，提升效能

## ✅ 完成後

資料庫更新完成後，投資組合功能即可正常使用：
- 新增投資交易
- 追蹤持倉
- 計算損益
- 整合到資產總覽

## 🔍 如果遇到問題

**問題 1: 欄位已存在**
- 使用 `IF NOT EXISTS` 可以安全重複執行

**問題 2: 外鍵約束錯誤**
- 確認 `asset_accounts` 表存在
- 確認沒有孤立的舊資料

**問題 3: 權限問題**
- 確認使用的是資料庫 owner 帳號
