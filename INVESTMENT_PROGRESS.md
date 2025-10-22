# 投資組合功能完善進度

## 已完成

### 1. Schema 更新 ✅
- **investment_holdings** 添加:
  - `brokerAccountId`: 關聯券商帳戶（台股/美股/加密貨幣）
  - `name`: 標的名稱
  
- **investment_transactions** 添加:
  - `paymentAccountId`: 付款帳戶（台幣/外幣）
  - `brokerAccountId`: 券商帳戶

### 2. 數據庫遷移 ✅
- 創建 `migrations/0002_add_investment_accounts.sql`
- 包含索引優化

### 3. 組件創建 ✅
- **InvestmentTransactionDialog.tsx**: 完整的交易對話框
  - 支持買入/賣出
  - 標的資訊輸入
  - 數量、價格、手續費
  - 付款帳戶和券商帳戶選擇
  - 交易日期
  - 總金額計算

### 4. 後端 API ✅
- **POST /api/investments/transactions** 重寫
  - 更新付款帳戶餘額
  - 創建/更新持倉記錄
  - 更新券商帳戶總市值
  - 記錄交易歷史
  - 處理買入和賣出邏輯

### 5. Storage 層 ✅
- 添加 `getAssetAccount(id)` 方法

## 待完成

### 1. Hooks 創建 ⏳
- `hooks/useInvestments.ts`
- `hooks/useInvestmentTransactions.ts`

### 2. Investment 頁面更新 ⏳
- 移除 mock data
- 整合真實 API
- 顯示實際持倉
- 計算總損益
- 按資產類型分組

### 3. InvestmentHoldingsTable 更新 ⏳
- 顯示真實持倉數據
- 添加編輯/刪除功能
- 整合即時價格（可選）

### 4. AssetOverview 整合 ⏳
- 將投資帳戶市值納入總資產
- 顯示投資資產占比

## 使用流程

### 新增投資交易
1. 用戶點擊「新增交易」
2. 選擇買入/賣出
3. 輸入股票代號和名稱（如 2330 台積電）
4. 輸入數量、價格、手續費
5. 選擇付款帳戶（從哪個銀行帳戶扣款）
6. 選擇券商帳戶（股票存到哪個券商）
7. 選擇交易日期
8. 確認交易

### 後端處理流程
#### 買入
1. 從付款帳戶扣除 `數量 × 價格 + 手續費`
2. 查找該券商帳戶是否已有該標的持倉
   - 有：更新數量和平均成本
   - 無：創建新持倉
3. 重新計算券商帳戶總市值（所有持倉的市值總和）
4. 記錄交易歷史

#### 賣出
1. 檢查券商帳戶是否有足夠數量可賣
2. 賣出收入存入付款帳戶 `數量 × 價格 - 手續費`
3. 減少持倉數量
   - 全部賣出：刪除持倉記錄
   - 部分賣出：更新數量
4. 重新計算券商帳戶總市值
5. 記錄交易歷史

## 數據關聯

```
assetAccounts (type="台幣")  ----付款----> investmentTransactions
                                                |
assetAccounts (type="台股")  ----券商----> investmentHoldings
                                                |
                                          更新市值
```

## 下一步計劃

1. 創建 useInvestments hook
2. 更新 Investment 頁面整合真實數據
3. 更新 InvestmentHoldingsTable 顯示真實持倉
4. 測試完整交易流程
5. 整合到資產總覽頁面
