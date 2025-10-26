-- ========================================
-- 快速驗證腳本 - 關鍵檢查
-- ========================================

-- 1️⃣ 資料表是否存在？
SELECT 'Step 1: 資料表檢查' as step, 
       CASE WHEN COUNT(*) > 0 THEN '✅ 通過' ELSE '❌ 失敗' END as status
FROM information_schema.tables 
WHERE table_name = 'ledger_categories';

-- 2️⃣ 是否有資料？
SELECT 'Step 2: 資料數量檢查' as step,
       COUNT(*) as total_records,
       CASE WHEN COUNT(*) > 0 THEN '✅ 通過' ELSE '❌ 失敗' END as status
FROM ledger_categories;

-- 3️⃣ 每種類型的數量
SELECT 'Step 3: 類型分布檢查' as step,
       type,
       COUNT(*) as count,
       COUNT(DISTINCT user_id) as user_count
FROM ledger_categories
GROUP BY type;

-- 4️⃣ 是否有重複？
SELECT 'Step 4: 重複檢查' as step,
       COUNT(*) as duplicate_count,
       CASE WHEN COUNT(*) = 0 THEN '✅ 無重複' ELSE '⚠️ 有重複' END as status
FROM (
  SELECT user_id, name, type, COUNT(*) as cnt
  FROM ledger_categories
  GROUP BY user_id, name, type
  HAVING COUNT(*) > 1
) duplicates;

-- 5️⃣ 預設類別是否齊全？（以第一個用戶為例）
WITH first_user AS (
  SELECT id FROM users ORDER BY created_at LIMIT 1
)
SELECT 'Step 5: 預設類別檢查' as step,
       type,
       COUNT(*) as category_count,
       CASE 
         WHEN type = 'expense' AND COUNT(*) >= 10 THEN '✅ 支出類別充足'
         WHEN type = 'income' AND COUNT(*) >= 4 THEN '✅ 收入類別充足'
         ELSE '⚠️ 類別數量不足'
       END as status
FROM ledger_categories
WHERE user_id = (SELECT id FROM first_user)
GROUP BY type;

-- 6️⃣ 檢查關鍵欄位
SELECT 'Step 6: 資料完整性' as step,
       COUNT(*) FILTER (WHERE name IS NULL OR name = '') as missing_name,
       COUNT(*) FILTER (WHERE type NOT IN ('income', 'expense')) as invalid_type,
       COUNT(*) FILTER (WHERE icon_name IS NULL OR icon_name = '') as missing_icon,
       COUNT(*) FILTER (WHERE color IS NULL OR color = '') as missing_color,
       CASE 
         WHEN COUNT(*) FILTER (WHERE name IS NULL OR name = '' OR icon_name IS NULL OR color IS NULL) = 0 
         THEN '✅ 通過'
         ELSE '❌ 有缺失'
       END as status
FROM ledger_categories;

-- 7️⃣ 最終總結
SELECT 
  '========== 🎯 遷移總結 ==========' as summary,
  '' as detail
UNION ALL
SELECT 
  '總記錄數' as summary,
  COUNT(*)::text as detail
FROM ledger_categories
UNION ALL
SELECT 
  '用戶數' as summary,
  COUNT(DISTINCT user_id)::text as detail
FROM ledger_categories
UNION ALL
SELECT 
  '支出類別' as summary,
  COUNT(*)::text as detail
FROM ledger_categories WHERE type = 'expense'
UNION ALL
SELECT 
  '收入類別' as summary,
  COUNT(*)::text as detail
FROM ledger_categories WHERE type = 'income'
UNION ALL
SELECT 
  '唯一類別名稱' as summary,
  COUNT(DISTINCT name)::text as detail
FROM ledger_categories;
