# 投資功能問題排查指南

## 問題症狀
1. 持倉記錄沒有顯示
2. 帳戶交易記錄中沒有 record

## 排查步驟

### 1. 確認資料庫遷移已執行

**登入 Neon Console 並執行：**

```sql
-- 檢查 investment_holdings 表結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investment_holdings'
ORDER BY ordinal_position;

-- 檢查 investment_transactions 表結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investment_transactions'
ORDER BY ordinal_position;
```

**應該看到的欄位：**
- investment_holdings: `broker_account_id` (varchar, not null)
- investment_transactions: `payment_account_id`, `broker_account_id` (varchar)

**如果欄位不存在，請執行：**
```sql
-- 位於 migrations/0002_add_investment_accounts.sql
ALTER TABLE investment_holdings 
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name VARCHAR;

ALTER TABLE investment_transactions 
ADD COLUMN IF NOT EXISTS payment_account_id VARCHAR REFERENCES asset_accounts(id),
ADD COLUMN IF NOT EXISTS broker_account_id VARCHAR REFERENCES asset_accounts(id);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_investment_holdings_broker_account ON investment_holdings(broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_broker ON investment_holdings(user_id, broker_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_payment_account ON investment_transactions(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_broker_account ON investment_transactions(broker_account_id);
```

### 2. 檢查現有資料

```sql
-- 查看所有持倉記錄
SELECT id, ticker, name, broker_account_id, quantity, average_cost, current_price
FROM investment_holdings
ORDER BY created_at DESC;

-- 查看所有交易記錄
SELECT id, type, quantity, price_per_share, fees, payment_account_id, broker_account_id, transaction_date
FROM investment_transactions
ORDER BY transaction_date DESC;

-- 查看帳本記錄
SELECT id, type, amount, category, account_id, date, note
FROM ledger_entries
WHERE category IN ('股票買入', '股票賣出', '持倉增加', '持倉減少')
ORDER BY date DESC;

-- 查看所有帳戶
SELECT id, account_name, type, balance
FROM asset_accounts
ORDER BY type, account_name;
```

### 3. 檢查是否有舊資料需要更新

```sql
-- 檢查是否有 broker_account_id 為 NULL 的持倉
SELECT COUNT(*) as null_broker_count
FROM investment_holdings
WHERE broker_account_id IS NULL;

-- 如果有，需要手動設置（示例）
-- UPDATE investment_holdings 
-- SET broker_account_id = (SELECT id FROM asset_accounts WHERE type = '台股' LIMIT 1)
-- WHERE broker_account_id IS NULL AND type = 'Taiwan Stocks';
```

### 4. 測試 API 端點

**使用瀏覽器開發者工具或 curl：**

```bash
# 獲取持倉列表
curl -X GET http://localhost:5000/api/investments/holdings \
  -H "Cookie: your-session-cookie"

# 獲取交易記錄
curl -X GET http://localhost:5000/api/investments/transactions \
  -H "Cookie: your-session-cookie"

# 獲取帳本記錄
curl -X GET http://localhost:5000/api/ledger \
  -H "Cookie: your-session-cookie"
```

### 5. 前端檢查

**打開瀏覽器開發者工具 (F12)：**

1. **Network 標籤**
   - 查看 `/api/investments/holdings` 請求
   - 檢查回傳的資料結構
   - 確認有 `brokerAccountId` 欄位

2. **Console 標籤**
   - 查看是否有 JavaScript 錯誤
   - 檢查 React Query 的狀態

3. **React Query DevTools**（如果有安裝）
   - 查看 `/api/investments/holdings` 查詢狀態
   - 確認資料是否正確快取

### 6. 重新啟動伺服器

```bash
# 停止當前伺服器 (Ctrl+C)
# 清除 node_modules/.cache（如果存在）
rm -rf node_modules/.cache

# 重新啟動
npm run dev
```

### 7. 手動測試完整流程

**在應用程式中：**

1. **準備帳戶**
   - 確保有至少一個「現金」或「台幣」帳戶（用於付款）
   - 確保有至少一個「台股」、「美股」或「加密貨幣」帳戶（券商帳戶）

2. **創建交易**
   - 進入「投資」頁面
   - 點擊「新增交易」
   - 選擇「買入」
   - 填寫：
     * 股票代號：2330
     * 標的名稱：台積電
     * 數量：100
     * 每股價格：600
     * 手續費：30
     * 付款帳戶：選擇現金帳戶
     * 券商帳戶：選擇台股帳戶
   - 提交

3. **檢查結果**
   - 持倉明細應顯示：台積電 100股
   - 資產總覽 → 交易明細應顯示兩筆記錄
   - 記帳頁面應顯示交易

### 8. 常見問題

**Q: 持倉表格是空的**
- 檢查資料庫是否有資料
- 檢查 Network 請求是否成功
- 確認 `broker_account_id` 欄位存在且有值

**Q: 交易記錄沒有顯示**
- 檢查 `ledger_entries` 表是否有資料
- 確認類別是「股票買入」、「股票賣出」等
- 檢查日期篩選範圍

**Q: API 回傳 400/500 錯誤**
- 查看伺服器終端的錯誤訊息
- 檢查資料庫連線
- 確認所有必填欄位都有值

**Q: 前端顯示 "Failed to fetch"**
- 確認伺服器正在運行
- 檢查瀏覽器 Console 的網路錯誤
- 確認身份驗證狀態

### 9. 偵錯建議

**在 server/routes.ts 添加 console.log：**

```typescript
app.post('/api/investments/transactions', authMiddleware, async (req: any, res) => {
  try {
    console.log('📥 收到投資交易請求:', req.body);
    
    // ... 現有代碼 ...
    
    console.log('✅ 持倉創建/更新成功:', holding);
    console.log('✅ 帳本記錄已創建');
    
    res.json(transaction);
  } catch (error) {
    console.error("❌ 投資交易錯誤:", error);
    res.status(400).json({ message: "Failed to create investment transaction" });
  }
});
```

### 10. 聯絡支援

如果以上步驟都無法解決問題，請提供：
1. 瀏覽器 Console 的錯誤訊息
2. 伺服器終端的錯誤訊息
3. 資料庫 schema 查詢結果
4. Network 請求的詳細資訊（Request/Response）
