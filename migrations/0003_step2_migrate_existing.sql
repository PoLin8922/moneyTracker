-- ========================================
-- 步驟 2: 遷移現有類別資料
-- ========================================
-- 用途: 將現有三個系統的類別統一遷移到 ledger_categories

-- 2.1 從記帳簿 (ledger_entries) 提取類別
-- 根據 type 分為收入和支出類別
INSERT INTO ledger_categories (user_id, name, type, icon_name, color)
SELECT DISTINCT 
  le.user_id,
  le.category,
  le.type,  -- 'income' 或 'expense'
  'Wallet' as icon_name,
  CASE 
    WHEN le.type = 'income' THEN 'hsl(142, 76%, 36%)'  -- 綠色
    WHEN le.type = 'expense' THEN 'hsl(0, 84%, 60%)'   -- 紅色
    ELSE 'hsl(0, 0%, 50%)'  -- 灰色（備用）
  END as color
FROM ledger_entries le
WHERE le.category IS NOT NULL 
  AND le.category != ''
  AND le.user_id IS NOT NULL
ON CONFLICT (user_id, name, type) DO NOTHING;

-- 2.2 從現金流規劃 (budget_categories) 提取類別
-- 預算類別都是支出類別
INSERT INTO ledger_categories (user_id, name, type, icon_name, color)
SELECT DISTINCT 
  b.user_id,
  bc.name,
  'expense' as type,  -- 預算類別都是支出
  COALESCE(bc.icon_name, 'Wallet') as icon_name,
  bc.color
FROM budget_categories bc
JOIN budgets b ON bc.budget_id = b.id
WHERE bc.name IS NOT NULL 
  AND bc.name != ''
  AND b.user_id IS NOT NULL
ON CONFLICT (user_id, name, type) DO NOTHING;

-- 2.3 從存錢罐 (savings_jar_categories) 提取類別
-- 存錢罐類別都是支出類別
INSERT INTO ledger_categories (user_id, name, type, icon_name, color)
SELECT DISTINCT 
  sj.user_id,
  sjc.name,
  'expense' as type,  -- 存錢罐類別都是支出
  COALESCE(sjc.icon_name, 'PiggyBank') as icon_name,
  sjc.color
FROM savings_jar_categories sjc
JOIN savings_jars sj ON sjc.jar_id = sj.id
WHERE sjc.name IS NOT NULL 
  AND sjc.name != ''
  AND sj.user_id IS NOT NULL
ON CONFLICT (user_id, name, type) DO NOTHING;
