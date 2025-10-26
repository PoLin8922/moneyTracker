-- ========================================
-- 驗證遷移結果
-- ========================================
-- 用途: 檢查遷移是否成功

-- 1. 檢查資料表是否存在
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ledger_categories';

-- 2. 檢查每個用戶的類別數量
SELECT 
  user_id,
  type,
  COUNT(*) as category_count
FROM ledger_categories
GROUP BY user_id, type
ORDER BY user_id, type;

-- 3. 檢查是否有重複的類別
SELECT 
  user_id, 
  name, 
  type, 
  COUNT(*) as duplicate_count
FROM ledger_categories
GROUP BY user_id, name, type
HAVING COUNT(*) > 1;

-- 4. 查看所有類別（限制 20 筆）
SELECT 
  id,
  user_id,
  name,
  type,
  icon_name,
  color,
  created_at
FROM ledger_categories
ORDER BY user_id, type, name
LIMIT 20;

-- 5. 統計總類別數
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as user_count
FROM ledger_categories
GROUP BY type;
