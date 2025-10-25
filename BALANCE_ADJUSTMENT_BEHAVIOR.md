# 餘額調整功能行為確認

## 功能行為說明

### 無論選擇是否計入統計，餘額調整都會：

#### 1. ✅ **創建記帳記錄**
所有餘額調整都會在 `ledger_entries` 表格中創建一筆記錄：
- 類別：`餘額調整`
- 類型：`income`（差額為正）或 `expense`（差額為負）
- 金額：差額的絕對值
- 帳戶：關聯到被調整的帳戶
- 日期：調整當日

```typescript
// AccountDetailDialog.tsx Line 193-201
await apiRequest('POST', '/api/ledger', {
  userId: account.userId,
  type: difference >= 0 ? 'income' : 'expense',
  amount: Math.abs(difference).toString(),
  category: '餘額調整',
  accountId: accountId,
  date: format(new Date(), 'yyyy-MM-dd'),
  note: data.note || '手動調整帳戶餘額',
  excludeFromMonthlyStats: data.excludeFromStats ? "true" : "false",
});
```

#### 2. ✅ **顯示在記帳簿中**
所有記錄（包括餘額調整）都會顯示在記帳簿頁面：
- 記帳簿的 `entries` 列表包含所有該月的 `ledgerEntries`
- **沒有過濾 `excludeFromMonthlyStats`**
- 所有記錄都會在列表中顯示

```typescript
// Ledger.tsx Line 125-131
const entries = useMemo(() => {
  if (!ledgerEntries || !accounts) return [];

  return ledgerEntries
    .filter(entry => {
      // 只根據日期篩選，不過濾 excludeFromMonthlyStats
      const entryDate = new Date(entry.date);
      const [year, month] = selectedMonth.split('/');
      return entryDate.getFullYear() === parseInt(year) && 
             entryDate.getMonth() + 1 === parseInt(month);
    })
    // ... mapping logic
```

```typescript
// Ledger.tsx Line 647-655
<div className="divide-y">
  {entries.map((entry, idx) => (
    <LedgerEntry 
      key={idx} 
      {...entry} 
      onClick={() => {
        setSelectedEntry(entry);
        setEntryDialogOpen(true);
      }}
    />
  ))}
</div>
```

#### 3. ✅ **更新帳戶餘額**
餘額會直接更新到目標值：
```typescript
// AccountDetailDialog.tsx Line 204-214
return await updateAsset.mutateAsync({
  id: accountId,
  data: {
    // ... other fields
    balance: data.newBalance, // 直接更新到新餘額
    // ...
  },
});
```

### 「計入月收支統計」開關的作用

#### 🔴 關閉（預設）- excludeFromStats = true
```
excludeFromMonthlyStats = "true"
```

**效果：**
- ✅ 記錄會出現在記帳簿列表
- ✅ 帳戶餘額正常調整
- ❌ **不計入**月收入統計（Ledger.tsx Line 224）
- ❌ **不計入**月支出統計（Ledger.tsx Line 244）
- ❌ **不影響**可支配收入餘額計算
- ❌ **不影響**上月收入計算

```typescript
// Ledger.tsx Line 221-227
const monthIncome = entries
  .filter((e) => {
    if (e.type !== "income") return false;
    if (e.excludeFromMonthlyStats === "true") return false; // 🔴 被過濾掉
    // ... other filters
  })
```

#### 🟢 開啟 - excludeFromStats = false
```
excludeFromMonthlyStats = "false"
```

**效果：**
- ✅ 記錄會出現在記帳簿列表
- ✅ 帳戶餘額正常調整
- ✅ **計入**月收入統計（如果差額為正）
- ✅ **計入**月支出統計（如果差額為負）
- ✅ **影響**可支配收入餘額計算
- ✅ **影響**上月收入計算

## 測試場景驗證

### 場景 1：不計入統計（預設）
**操作：**
1. 帳戶餘額：10,000 TWD
2. 調整至：11,000 TWD（差額 +1,000）
3. 「計入月收支統計」開關：❌ 關閉

**預期結果：**
| 項目 | 結果 | 原因 |
|------|------|------|
| 記帳簿是否顯示 | ✅ 顯示 | 所有記錄都會顯示 |
| 記錄內容 | 收入 +1,000 TWD<br>類別：餘額調整 | 根據差額決定類型 |
| 月收入統計 | ❌ 不變 | excludeFromMonthlyStats = "true" |
| 帳戶餘額 | ✅ 11,000 TWD | 直接更新 |
| 可支配收入餘額 | ❌ 不變 | 不計入支出 |

**資料庫記錄：**
```sql
INSERT INTO ledger_entries (
  type, 
  amount, 
  category, 
  exclude_from_monthly_stats
) VALUES (
  'income',
  '1000',
  '餘額調整',
  'true'  -- 🔴 標記為不計入統計
);
```

### 場景 2：計入統計
**操作：**
1. 帳戶餘額：10,000 TWD
2. 調整至：9,500 TWD（差額 -500）
3. 「計入月收支統計」開關：✅ 開啟

**預期結果：**
| 項目 | 結果 | 原因 |
|------|------|------|
| 記帳簿是否顯示 | ✅ 顯示 | 所有記錄都會顯示 |
| 記錄內容 | 支出 -500 TWD<br>類別：餘額調整 | 根據差額決定類型 |
| 月支出統計 | ✅ +500 | excludeFromMonthlyStats = "false" |
| 帳戶餘額 | ✅ 9,500 TWD | 直接更新 |
| 可支配收入餘額 | ✅ -500 | 計入支出 |

**資料庫記錄：**
```sql
INSERT INTO ledger_entries (
  type, 
  amount, 
  category, 
  exclude_from_monthly_stats
) VALUES (
  'expense',
  '500',
  '餘額調整',
  'false'  -- 🟢 計入統計
);
```

## 統計過濾位置

### 前端過濾（Ledger.tsx）

**月收入計算：**
```typescript
// Line 221-236
const monthIncome = entries
  .filter((e) => {
    if (e.type !== "income") return false;
    if (e.excludeFromMonthlyStats === "true") return false; // 🎯 過濾點
    if (e.category === "轉帳") return false;
    if (e.category === "股票賣出") return false;
    return true;
  })
  .reduce((sum, e) => sum + e.amount, 0);
```

**月支出計算：**
```typescript
// Line 238-251
const monthExpense = entries
  .filter((e) => {
    if (e.type !== "expense") return false;
    if (e.excludeFromMonthlyStats === "true") return false; // 🎯 過濾點
    if (e.category === "轉帳") return false;
    if (e.category === "股票買入") return false;
    return true;
  })
  .reduce((sum, e) => sum + e.amount, 0);
```

### 後端過濾（routes.ts）

**可支配收入歷史：**
```typescript
// Line 307-316
const monthExpense = allEntries
  .filter(e => {
    const entryDate = new Date(e.date);
    if (e.excludeFromMonthlyStats === "true") return false; // 🎯 過濾點
    return e.type === 'expense' && 
           entryDate.getFullYear() === year && 
           entryDate.getMonth() + 1 === month;
  })
  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
```

**上月收入計算：**
```typescript
// Line 278
const totalIncome = entries
  .filter(e => e.type === 'income' && e.excludeFromMonthlyStats !== "true") // 🎯 過濾點
  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
```

## 總結

### ✅ 確認事項

1. **所有餘額調整都會記錄到記帳簿** ✅
   - 創建 ledger_entries 記錄
   - 顯示在記帳簿列表中
   - 可點擊查看詳情

2. **「計入月收支統計」開關的行為** ✅
   - ❌ 關閉：記錄顯示，但不計入統計（適合對帳、修正）
   - ✅ 開啟：記錄顯示，且計入統計（適合補登交易）

3. **統計計算正確性** ✅
   - 前端：Ledger.tsx 月收入/月支出計算
   - 後端：routes.ts 可支配收入歷史、上月收入計算
   - 所有位置都正確檢查 `excludeFromMonthlyStats`

4. **資料一致性** ✅
   - 記帳簿顯示：不過濾（顯示所有記錄）
   - 統計計算：過濾 excludeFromMonthlyStats = "true"
   - 帳戶餘額：無論如何都會更新

### 🎯 設計邏輯

```
調整餘額
    ↓
創建記帳記錄 (ledger_entries)
    ├─ 類別：餘額調整
    ├─ 類型：income/expense
    ├─ 金額：|差額|
    └─ excludeFromMonthlyStats：根據開關設定
    ↓
更新帳戶餘額 (asset_accounts)
    └─ balance = newBalance
    ↓
顯示在記帳簿
    └─ 所有記錄都顯示（不過濾）
    ↓
統計計算
    ├─ excludeFromMonthlyStats = "true"  → ❌ 不計入
    └─ excludeFromMonthlyStats = "false" → ✅ 計入
```
