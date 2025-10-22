-- 診斷持倉明細問題的 SQL 查詢
-- 請在 Neon Console 中執行這些查詢

-- 1. 檢查 investment_holdings 表結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'investment_holdings'
ORDER BY ordinal_position;

-- 2. 查看所有持倉資料（包含所有欄位）
SELECT 
  id,
  user_id,
  broker_account_id,
  ticker,
  name,
  type,
  quantity,
  average_cost,
  current_price,
  created_at,
  updated_at
FROM investment_holdings
ORDER BY created_at DESC
LIMIT 20;

-- 2b. 檢查 type 欄位是否有 NULL 值
SELECT 
  COUNT(*) as total_holdings,
  COUNT(type) as holdings_with_type,
  COUNT(*) - COUNT(type) as holdings_without_type
FROM investment_holdings;

-- 3. 檢查是否有 broker_account_id 為 NULL 的持倉
SELECT COUNT(*) as holdings_with_null_broker
FROM investment_holdings
WHERE broker_account_id IS NULL;

-- 4. 查看最近的投資交易記錄
SELECT 
  id,
  holding_id,
  payment_account_id,
  broker_account_id,
  type,
  quantity,
  price_per_share,
  fees,
  transaction_date,
  created_at
FROM investment_transactions
ORDER BY created_at DESC
LIMIT 10;

-- 5. 查看帳本記錄中的投資交易
SELECT 
  id,
  type,
  amount,
  category,
  account_id,
  date,
  note,
  created_at
FROM ledger_entries
WHERE category IN ('股票買入', '股票賣出', '持倉增加', '持倉減少')
ORDER BY created_at DESC
LIMIT 10;

-- 6. 檢查帳戶資料
SELECT 
  id,
  account_name,
  type,
  balance,
  currency
FROM asset_accounts
WHERE type IN ('台股', '美股', '加密貨幣', '台幣', '外幣', '現金')
ORDER BY type, account_name;
