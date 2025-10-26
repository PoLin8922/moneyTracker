-- ========================================
-- 完整驗證遷移結果
-- ========================================

-- ========== 1. 檢查資料表是否存在 ==========
SELECT 
  '1. 資料表存在性檢查' as check_name,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ledger_categories';

-- ========== 2. 檢查資料表結構 ==========
SELECT 
  '2. 資料表結構檢查' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ledger_categories'
ORDER BY ordinal_position;

-- ========== 3. 檢查索引 ==========
SELECT 
  '3. 索引檢查' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ledger_categories';

-- ========== 4. 檢查每個用戶的類別數量 ==========
SELECT 
  '4. 用戶類別數量' as check_name,
  user_id,
  type,
  COUNT(*) as category_count
FROM ledger_categories
GROUP BY user_id, type
ORDER BY user_id, type;

-- ========== 5. 檢查是否有重複的類別 ==========
SELECT 
  '5. 重複類別檢查' as check_name,
  user_id, 
  name, 
  type, 
  COUNT(*) as duplicate_count
FROM ledger_categories
GROUP BY user_id, name, type
HAVING COUNT(*) > 1;

-- ========== 6. 統計總類別數 ==========
SELECT 
  '6. 總體統計' as check_name,
  type,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(DISTINCT name) as unique_category_names
FROM ledger_categories
GROUP BY type
ORDER BY type;

-- ========== 7. 查看每個用戶的類別列表（前20筆）==========
SELECT 
  '7. 類別詳情（前20筆）' as check_name,
  id,
  user_id,
  name,
  type,
  icon_name,
  LEFT(color, 20) as color,
  created_at
FROM ledger_categories
ORDER BY user_id, type, name
LIMIT 20;

-- ========== 8. 檢查預設類別是否都有插入 ==========
-- 支出類別應該有這些
SELECT 
  '8. 預設支出類別檢查' as check_name,
  name,
  COUNT(DISTINCT user_id) as user_count
FROM ledger_categories
WHERE type = 'expense' 
  AND name IN ('餐飲', '交通', '購物', '娛樂', '醫療', '教育', '居家', '保險', '投資', '其他支出')
GROUP BY name
ORDER BY name;

-- ========== 9. 檢查預設收入類別是否都有插入 ==========
SELECT 
  '9. 預設收入類別檢查' as check_name,
  name,
  COUNT(DISTINCT user_id) as user_count
FROM ledger_categories
WHERE type = 'income' 
  AND name IN ('薪資', '獎金', '利息', '其他收入')
GROUP BY name
ORDER BY name;

-- ========== 10. 檢查是否有遷移自其他表的類別 ==========
-- 從 ledger_entries 遷移的
SELECT 
  '10a. 從記帳簿遷移的類別' as check_name,
  COUNT(DISTINCT lc.name) as migrated_from_ledger
FROM ledger_categories lc
WHERE EXISTS (
  SELECT 1 FROM ledger_entries le 
  WHERE le.category = lc.name 
    AND le.user_id = lc.user_id
    AND le.type = lc.type
);

-- 從 budget_categories 遷移的
SELECT 
  '10b. 從預算類別遷移的' as check_name,
  COUNT(DISTINCT lc.name) as migrated_from_budget
FROM ledger_categories lc
WHERE lc.type = 'expense'
  AND EXISTS (
    SELECT 1 FROM budget_categories bc
    JOIN budgets b ON bc.budget_id = b.id
    WHERE bc.name = lc.name 
      AND b.user_id = lc.user_id
  );

-- 從 savings_jar_categories 遷移的
SELECT 
  '10c. 從存錢罐類別遷移的' as check_name,
  COUNT(DISTINCT lc.name) as migrated_from_savings
FROM ledger_categories lc
WHERE lc.type = 'expense'
  AND EXISTS (
    SELECT 1 FROM savings_jar_categories sjc
    JOIN savings_jars sj ON sjc.jar_id = sj.id
    WHERE sjc.name = lc.name 
      AND sj.user_id = lc.user_id
  );

-- ========== 11. 檢查資料完整性 ==========
SELECT 
  '11. 資料完整性檢查' as check_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT name) as total_unique_names,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM ledger_categories;

-- ========== 12. 檢查是否有 NULL 值 ==========
SELECT 
  '12. NULL 值檢查' as check_name,
  COUNT(*) FILTER (WHERE user_id IS NULL) as null_user_id,
  COUNT(*) FILTER (WHERE name IS NULL OR name = '') as null_or_empty_name,
  COUNT(*) FILTER (WHERE type IS NULL OR type = '') as null_or_empty_type,
  COUNT(*) FILTER (WHERE icon_name IS NULL OR icon_name = '') as null_or_empty_icon,
  COUNT(*) FILTER (WHERE color IS NULL OR color = '') as null_or_empty_color
FROM ledger_categories;
