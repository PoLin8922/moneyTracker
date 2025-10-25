# 餘額調整月收支統計控制功能

## 功能概述

此功能允許用戶在調整帳戶餘額時，選擇是否將差額計入當月的收入或支出統計。

### 使用場景

1. **補登遺漏交易** - 應計入月收支
2. **銀行對帳調整** - 可能不應計入月收支（如手續費、利息已在其他地方記錄）
3. **初始餘額設定** - 不應計入月收支
4. **修正錯誤記錄** - 視情況決定

## 資料庫變更

### 遷移檔案

`migrations/0003_add_exclude_from_monthly_stats.sql`

```sql
-- Add exclude_from_monthly_stats column to ledger_entries table
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS exclude_from_monthly_stats BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN ledger_entries.exclude_from_monthly_stats IS '是否從月收支統計中排除（用於餘額調整等不應計入月收支的記錄）';
```

### 執行步驟

1. 登入 Neon Console (https://console.neon.tech)
2. 選擇專案和資料庫
3. 點擊 "SQL Editor"
4. 複製並執行上述 SQL
5. 驗證欄位已新增：
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'ledger_entries' 
   AND column_name = 'exclude_from_monthly_stats';
   ```

## Schema 變更

### ledger_entries 表格

新增欄位：
```typescript
excludeFromMonthlyStats: varchar("exclude_from_monthly_stats").default("false")
```

- 資料型別: `varchar` (儲存 "true" 或 "false")
- 預設值: `"false"` (預設計入統計)
- 用途: 標記此筆記錄是否應排除在月收支統計之外

## 功能實作

### 1. UI 變更 (AccountDetailDialog.tsx)

#### 新增狀態
```typescript
const [excludeFromStats, setExcludeFromStats] = useState(true); // 預設不計入統計
```

#### 調整餘額對話框
新增開關控制：
```tsx
<div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
  <div className="space-y-0.5">
    <Label htmlFor="exclude-from-stats" className="text-base font-medium">
      計入月收支統計
    </Label>
    <p className="text-sm text-muted-foreground">
      開啟後，此調整會影響當月的收入或支出統計
    </p>
  </div>
  <Switch
    id="exclude-from-stats"
    checked={!excludeFromStats}
    onCheckedChange={(checked) => setExcludeFromStats(!checked)}
  />
</div>
```

### 2. API 變更

#### 創建記帳記錄時傳遞參數
```typescript
await apiRequest('POST', '/api/ledger', {
  userId: account.userId,
  type: difference >= 0 ? 'income' : 'expense',
  amount: Math.abs(difference).toString(),
  category: '餘額調整',
  accountId: accountId,
  date: format(new Date(), 'yyyy-MM-dd'),
  note: data.note || '手動調整帳戶餘額',
  excludeFromMonthlyStats: data.excludeFromStats ? "true" : "false", // 新增
});
```

### 3. 統計計算更新

#### 前端 (Ledger.tsx)
```typescript
const monthIncome = entries
  .filter((e) => {
    if (e.type !== "income") return false;
    if (e.excludeFromMonthlyStats === "true") return false; // 新增
    // ... 其他過濾條件
    return true;
  })
  .reduce((sum, e) => sum + e.amount, 0);

const monthExpense = entries
  .filter((e) => {
    if (e.type !== "expense") return false;
    if (e.excludeFromMonthlyStats === "true") return false; // 新增
    // ... 其他過濾條件
    return true;
  })
  .reduce((sum, e) => sum + e.amount, 0);
```

#### 後端 (routes.ts)

**可支配收入歷史計算：**
```typescript
const monthExpense = allEntries
  .filter(e => {
    const entryDate = new Date(e.date);
    if (e.excludeFromMonthlyStats === "true") return false; // 新增
    return e.type === 'expense' && 
           entryDate.getFullYear() === year && 
           entryDate.getMonth() + 1 === month;
  })
  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
```

**上月收入計算：**
```typescript
const totalIncome = entries
  .filter(e => e.type === 'income' && e.excludeFromMonthlyStats !== "true") // 新增
  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
```

## 預設行為

- **餘額調整**: 預設 `excludeFromStats = true` (不計入統計)
- **一般交易**: 預設 `excludeFromMonthlyStats = "false"` (計入統計)

這樣的設計考量：
1. 大多數餘額調整是為了修正或對帳，不應影響月收支
2. 如需計入統計，用戶可手動開啟開關
3. 一般交易記錄預設都會計入統計

## 測試建議

### 測試案例 1：不計入統計（預設）
1. 調整帳戶餘額 +1000 TWD
2. 不開啟「計入月收支統計」開關
3. 驗證：月收入統計不變
4. 驗證：可支配收入餘額不變

### 測試案例 2：計入統計
1. 調整帳戶餘額 +1000 TWD
2. 開啟「計入月收支統計」開關
3. 驗證：月收入統計 +1000
4. 驗證：可支配收入餘額相應調整

### 測試案例 3：負向調整
1. 調整帳戶餘額 -500 TWD
2. 開啟「計入月收支統計」開關
3. 驗證：月支出統計 +500
4. 驗證：可支配收入餘額相應調整

## 影響範圍

### 修改的檔案
1. `shared/schema.ts` - 新增 excludeFromMonthlyStats 欄位
2. `client/src/components/AccountDetailDialog.tsx` - 新增 UI 控制
3. `client/src/pages/Ledger.tsx` - 更新統計計算邏輯
4. `server/routes.ts` - 更新後端統計計算
5. `migrations/0003_add_exclude_from_monthly_stats.sql` - 資料庫遷移

### 不受影響的功能
- 帳戶餘額本身的調整（正常運作）
- 交易記錄的顯示（所有記錄仍會顯示）
- 資產總覽（總資產計算不受影響）
- 其他類型的交易記錄（行為不變）

## 未來改進建議

1. **批量更新** - 提供介面讓用戶批量修改現有記錄的統計包含狀態
2. **自動判斷** - 根據類別或備註自動建議是否計入統計
3. **報表標示** - 在報表中標示哪些記錄被排除在統計外
4. **歷史追蹤** - 記錄統計狀態的變更歷史

## 故障排除

### Q: 執行遷移後出現錯誤
**A:** 檢查欄位是否已存在：
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'ledger_entries' 
AND column_name = 'exclude_from_monthly_stats';
```

### Q: 統計數字不正確
**A:** 確認：
1. 資料庫遷移已執行
2. 前後端代碼已部署
3. 清除快取並重新載入頁面

### Q: 開關狀態不保存
**A:** 檢查：
1. API 請求是否包含 `excludeFromMonthlyStats` 參數
2. 資料庫欄位是否正確更新
3. 瀏覽器 Console 是否有錯誤訊息
