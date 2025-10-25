# 餘額調整功能資料庫遷移修復指南

## 問題說明

如果您已經執行了舊版的遷移檔案（使用 BOOLEAN 型別），可能會遇到以下問題：
- 不勾選「計入月收支」的餘額調整仍然被計入統計
- 過濾邏輯失效

### 原因
- 資料庫欄位型別：`BOOLEAN` (true/false)
- 應用程式期望：`VARCHAR` ("true"/"false")
- 比較失敗：`false !== "true"` 為真，導致記錄被包含在統計中

## 修復步驟

### 1. 檢查當前欄位型別

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ledger_entries' 
AND column_name = 'exclude_from_monthly_stats';
```

**預期結果：**
- `data_type`: `character varying` (VARCHAR)
- `column_default`: `'false'::character varying`

**如果是 BOOLEAN：**
- `data_type`: `boolean`
- `column_default`: `false`

### 2. 執行修復遷移

如果欄位是 BOOLEAN，執行以下 SQL：

```sql
-- 開始交易
BEGIN;

-- 1. 創建臨時欄位來保存數據
ALTER TABLE ledger_entries 
ADD COLUMN exclude_from_monthly_stats_temp VARCHAR;

-- 2. 複製並轉換現有數據（如果有的話）
UPDATE ledger_entries 
SET exclude_from_monthly_stats_temp = 
  CASE 
    WHEN exclude_from_monthly_stats = true THEN 'true'
    WHEN exclude_from_monthly_stats = false THEN 'false'
    ELSE 'false'
  END
WHERE exclude_from_monthly_stats IS NOT NULL;

-- 3. 刪除舊的 BOOLEAN 欄位
ALTER TABLE ledger_entries 
DROP COLUMN exclude_from_monthly_stats;

-- 4. 重新命名臨時欄位
ALTER TABLE ledger_entries 
RENAME COLUMN exclude_from_monthly_stats_temp TO exclude_from_monthly_stats;

-- 5. 設定預設值
ALTER TABLE ledger_entries 
ALTER COLUMN exclude_from_monthly_stats SET DEFAULT 'false';

-- 6. 更新所有 NULL 值為 'false'
UPDATE ledger_entries 
SET exclude_from_monthly_stats = 'false' 
WHERE exclude_from_monthly_stats IS NULL;

-- 7. 添加註釋
COMMENT ON COLUMN ledger_entries.exclude_from_monthly_stats IS '是否從月收支統計中排除（用於餘額調整等不應計入月收支的記錄）。值為 "true" 或 "false"';

-- 提交交易
COMMIT;
```

### 3. 驗證修復

```sql
-- 檢查欄位型別
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ledger_entries' 
AND column_name = 'exclude_from_monthly_stats';

-- 檢查現有數據
SELECT 
  exclude_from_monthly_stats,
  COUNT(*) as count
FROM ledger_entries
GROUP BY exclude_from_monthly_stats;

-- 檢查餘額調整記錄
SELECT 
  id,
  category,
  type,
  amount,
  exclude_from_monthly_stats,
  date
FROM ledger_entries
WHERE category = '餘額調整'
ORDER BY date DESC
LIMIT 10;
```

**預期結果：**
- `exclude_from_monthly_stats` 應該只有 `'true'` 和 `'false'` (字串)
- 不應該有 NULL 值
- 餘額調整記錄應該有正確的值

## 全新安裝步驟

如果您是第一次安裝，請執行更新後的遷移檔案：

```sql
-- Note: Using VARCHAR to store "true"/"false" for consistency with other boolean fields
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS exclude_from_monthly_stats VARCHAR DEFAULT 'false';

-- Add comment
COMMENT ON COLUMN ledger_entries.exclude_from_monthly_stats IS '是否從月收支統計中排除（用於餘額調整等不應計入月收支的記錄）。值為 "true" 或 "false"';
```

## 測試步驟

### 測試 1：創建不計入統計的調整
1. 調整帳戶餘額 +1000
2. **不勾選**「計入月收支統計」
3. 檢查資料庫：
   ```sql
   SELECT * FROM ledger_entries 
   WHERE category = '餘額調整' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
4. **預期**：`exclude_from_monthly_stats = 'true'` (字串)
5. **預期**：月收入統計不增加

### 測試 2：創建計入統計的調整
1. 調整帳戶餘額 +500
2. **勾選**「計入月收支統計」
3. 檢查資料庫：
   ```sql
   SELECT * FROM ledger_entries 
   WHERE category = '餘額調整' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
4. **預期**：`exclude_from_monthly_stats = 'false'` (字串)
5. **預期**：月收入統計增加 500

### 測試 3：驗證過濾邏輯
```sql
-- 應該排除的記錄（exclude_from_monthly_stats = 'true'）
SELECT 
  id,
  category,
  type,
  amount,
  exclude_from_monthly_stats,
  date
FROM ledger_entries
WHERE exclude_from_monthly_stats = 'true'
ORDER BY date DESC;

-- 應該計入的記錄（exclude_from_monthly_stats = 'false' 或 NULL）
SELECT 
  id,
  category,
  type,
  amount,
  exclude_from_monthly_stats,
  date
FROM ledger_entries
WHERE exclude_from_monthly_stats IS NULL 
   OR exclude_from_monthly_stats = 'false'
ORDER BY date DESC
LIMIT 20;
```

## 常見問題

### Q1: 為什麼使用 VARCHAR 而不是 BOOLEAN？
**A:** 為了與專案中其他 boolean 欄位保持一致（如 `includeInTotal`），所有 boolean 值都使用 VARCHAR 儲存 "true"/"false"。

### Q2: 舊的餘額調整記錄會怎樣？
**A:** 執行修復遷移後：
- 原本是 `true` (boolean) → 轉換為 `'true'` (varchar)
- 原本是 `false` (boolean) → 轉換為 `'false'` (varchar)
- 原本是 `NULL` → 設定為 `'false'` (預設計入統計)

### Q3: 如何批量更新現有記錄？
**A:** 如果您想將所有現有的餘額調整記錄設為不計入統計：
```sql
UPDATE ledger_entries
SET exclude_from_monthly_stats = 'true'
WHERE category = '餘額調整'
AND (exclude_from_monthly_stats IS NULL OR exclude_from_monthly_stats = 'false');
```

### Q4: 遷移失敗怎麼辦？
**A:** 
1. 使用 `ROLLBACK;` 回滾交易
2. 檢查錯誤訊息
3. 確保沒有其他進程正在使用表格
4. 如需要，可以手動逐步執行每個 ALTER TABLE 語句

## 型別一致性檢查表

確保以下所有位置使用字串比較：

### 前端 (TypeScript)
- ✅ `e.excludeFromMonthlyStats === "true"` (字串比較)
- ❌ `e.excludeFromMonthlyStats === true` (boolean 比較)

### 後端 (TypeScript/Node.js)
- ✅ `e.excludeFromMonthlyStats === "true"` (字串比較)
- ✅ `e.excludeFromMonthlyStats !== "true"` (字串比較)

### 資料庫 (PostgreSQL)
- ✅ `exclude_from_monthly_stats VARCHAR DEFAULT 'false'`
- ❌ `exclude_from_monthly_stats BOOLEAN DEFAULT FALSE`

### API 傳遞
- ✅ `excludeFromMonthlyStats: data.excludeFromStats ? "true" : "false"`
- ❌ `excludeFromMonthlyStats: data.excludeFromStats`

## 檔案檢查清單

修復完成後，確認以下檔案內容正確：

1. ✅ `migrations/0003_add_exclude_from_monthly_stats.sql` - VARCHAR 型別
2. ✅ `shared/schema.ts` - `varchar("exclude_from_monthly_stats").default("false")`
3. ✅ `client/src/components/AccountDetailDialog.tsx` - 傳遞 "true"/"false" 字串
4. ✅ `client/src/pages/Ledger.tsx` - 使用 `=== "true"` 字串比較
5. ✅ `server/routes.ts` - 使用 `=== "true"` 或 `!== "true"` 字串比較

## 支援

如果在遷移過程中遇到問題：
1. 保存錯誤訊息
2. 檢查資料庫日誌
3. 參考 BALANCE_ADJUSTMENT_BEHAVIOR.md 了解預期行為
4. 確保已備份資料庫
