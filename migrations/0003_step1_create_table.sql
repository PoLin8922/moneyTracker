-- ========================================
-- 步驟 1: 建立統一類別表
-- ========================================
-- 用途: 建立中央類別庫，供記帳簿、現金流規劃、存錢罐共用

CREATE TABLE IF NOT EXISTS ledger_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,  -- 'income' or 'expense'
  icon_name VARCHAR NOT NULL DEFAULT 'Wallet',
  color VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_ledger_categories_user_id ON ledger_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_categories_type ON ledger_categories(type);

-- 建立唯一約束，防止同一用戶有重複的類別名稱和類型組合
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_categories_user_name_type 
  ON ledger_categories(user_id, name, type);
