-- Migration: Add investment accounts support
-- 為投資組合功能添加帳戶關聯

-- 1. 修改 investment_holdings 表，添加券商帳戶關聯和標的名稱
ALTER TABLE investment_holdings 
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name VARCHAR;

-- 2. 修改 investment_transactions 表，添加付款帳戶和券商帳戶關聯
ALTER TABLE investment_transactions
ADD COLUMN IF NOT EXISTS payment_account_id VARCHAR REFERENCES asset_accounts(id),
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id);

-- 3. 為已存在的 holdings 設置預設值（如果有資料的話）
-- 注意：這需要根據實際情況調整，因為需要有效的 account_id
-- UPDATE investment_holdings SET broker_account_id = (SELECT id FROM asset_accounts WHERE type = 'Taiwan Stocks' LIMIT 1) WHERE broker_account_id IS NULL;

-- 4. 如果沒有舊資料，可以將欄位設為 NOT NULL
-- 執行前請確認已經有資料或不需要舊資料
-- ALTER TABLE investment_holdings ALTER COLUMN broker_account_id SET NOT NULL;
-- ALTER TABLE investment_holdings ALTER COLUMN name SET NOT NULL;
-- ALTER TABLE investment_transactions ALTER COLUMN payment_account_id SET NOT NULL;
-- ALTER TABLE investment_transactions ALTER COLUMN broker_account_id SET NOT NULL;

-- 5. 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_investment_holdings_broker_account ON investment_holdings(broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_broker ON investment_holdings(user_id, broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_payment_account ON investment_transactions(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_broker_account ON investment_transactions(broker_account_id);
