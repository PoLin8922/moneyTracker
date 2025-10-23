# 🔍 投資帳戶餘額同步問題排查指南

## 問題現象
- 帳戶資產和股市未同步
- 投資帳戶餘額沒有隨持倉市值更新

## 可能原因與排查步驟

### 1️⃣ 檢查後端是否已部署最新代碼

**操作步驟:**
1. 開啟 Render Dashboard: https://dashboard.render.com
2. 找到您的後端服務
3. 查看 "Events" 或 "Logs" 頁面
4. 確認是否有最新的部署記錄（commit 121e357 或 741a974）

**預期結果:**
```
✅ Deploy succeeded
✅ Service is live
最新 commit: "feat: 投資帳戶餘額隨持倉市值自動更新"
```

**如果沒有自動部署:**
- 點擊 "Manual Deploy" → "Deploy latest commit"

---

### 2️⃣ 檢查前端是否已部署最新代碼

**操作步驟:**
1. 開啟 Vercel Dashboard: https://vercel.com/dashboard
2. 找到您的專案
3. 查看 "Deployments" 頁面
4. 確認最新部署是否包含 Ledger.tsx 的修改

**預期結果:**
```
✅ Production deployment succeeded
✅ Latest commit: "fix: 資產總覽頁面自動同步投資帳戶餘額"
```

---

### 3️⃣ 檢查瀏覽器 Console 日誌

**操作步驟:**
1. 開啟網站
2. 按 F12 打開開發者工具
3. 切換到 "Console" 頁籤
4. 開啟 "資產總覽" 頁面

**預期看到的日誌:**
```javascript
🔄 前端: 開始同步價格...
✅ 前端: 價格同步完成 - 8/8 筆成功
📊 [資產總覽] 價格和帳戶餘額同步完成
```

**如果沒有看到日誌:**
- 可能是前端代碼未更新
- 強制重新整理頁面: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)

---

### 4️⃣ 檢查後端 API 響應

**操作步驟:**
1. 在瀏覽器 Console 中執行以下代碼:
```javascript
fetch('/api/investments/sync-prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('同步結果:', data))
```

**預期響應:**
```json
{
  "message": "Prices and account balances synced successfully",
  "total": 8,
  "updated": 8,
  "failed": 0,
  "accountsUpdated": 3  // ← 關鍵：帳戶已更新數量
}
```

**如果 `accountsUpdated` 為 0:**
- 後端代碼可能未更新
- 需要手動重新部署 Render 服務

---

### 5️⃣ 檢查持倉資料是否存在

**操作步驟:**
1. 開啟 "投資組合" 頁面
2. 確認是否有持倉記錄

**預期結果:**
```
✅ 顯示持倉列表
✅ 每筆持倉都有 "現在價格"
✅ 市值會隨時間更新
```

**如果沒有持倉:**
- 同步功能不會執行（邏輯：`if (holdings.length > 0)`）
- 需要先新增投資交易

---

### 6️⃣ 檢查資料庫中的帳戶餘額

**操作步驟:**
1. 登入 Neon Console: https://console.neon.tech
2. 選擇您的專案
3. 開啟 SQL Editor
4. 執行以下查詢:

```sql
-- 查看投資帳戶餘額
SELECT 
  id,
  account_name,
  type,
  balance,
  updated_at
FROM asset_accounts
WHERE type IN ('台股', '美股', '加密貨幣')
ORDER BY updated_at DESC;

-- 查看持倉總市值
SELECT 
  broker_account_id,
  SUM(CAST(quantity AS NUMERIC) * CAST(current_price AS NUMERIC)) as total_market_value
FROM investment_holdings
GROUP BY broker_account_id;
```

**預期結果:**
- `asset_accounts.balance` 應該等於對應帳戶的持倉總市值
- `updated_at` 應該是最近的時間（10 秒內）

**如果餘額不正確:**
- 手動觸發同步: 重新整理 "資產總覽" 頁面
- 檢查後端日誌是否有錯誤

---

### 7️⃣ 檢查後端日誌

**操作步驟:**
1. 開啟 Render Dashboard
2. 點擊您的服務
3. 切換到 "Logs" 頁籤
4. 搜尋關鍵字: "價格同步" 或 "帳戶餘額"

**預期日誌:**
```
🔄 開始同步用戶 xxx 的持倉價格...
📊 找到 8 筆持倉
✅ 2330 價格已更新: $620
✅ TSLA 價格已更新: $240
...
✅ 價格同步完成: 8/8 筆成功
💰 帳戶 xxx 餘額已更新: $23300.00
💰 帳戶 yyy 餘額已更新: $4700.00
✅ 帳戶餘額同步完成: 2 個帳戶已更新
```

**如果沒有日誌:**
- 同步請求沒有到達後端
- 檢查網路請求是否成功（F12 → Network）

---

## 🔧 快速修復步驟

### 如果是部署問題：

1. **手動重新部署 Render:**
   - Render Dashboard → 選擇服務 → Manual Deploy → Deploy latest commit

2. **清除瀏覽器快取:**
   - Chrome/Edge: Ctrl+Shift+Delete → 清除快取
   - 或強制重新整理: Ctrl+Shift+R

3. **等待 2-3 分鐘:**
   - Render 重新部署需要時間
   - Vercel 部署通常較快

### 如果是邏輯問題：

**測試 1: 手動觸發同步**
```javascript
// 在瀏覽器 Console 執行
fetch('/api/investments/sync-prices', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**測試 2: 檢查帳戶 ID 是否匹配**
```javascript
// 在投資組合頁面 Console 執行
fetch('/api/investments/holdings')
  .then(r => r.json())
  .then(holdings => {
    console.log('持倉的券商帳戶 ID:', 
      [...new Set(holdings.map(h => h.brokerAccountId))]);
  });

fetch('/api/assets')
  .then(r => r.json())
  .then(accounts => {
    console.log('投資帳戶 ID:', 
      accounts.filter(a => ['台股','美股','加密貨幣'].includes(a.type))
        .map(a => ({ id: a.id, name: a.accountName, type: a.type })));
  });
```

**如果 ID 不匹配:**
- 持倉記錄的 `brokerAccountId` 和帳戶的 `id` 不一致
- 需要更新持倉記錄或重新新增交易

---

## ✅ 驗證成功的標準

**資產總覽頁面:**
1. 台股/美股帳戶餘額每 10 秒更新一次
2. 餘額 = 該帳戶所有持倉的市值總和
3. Console 顯示: `📊 [資產總覽] 價格和帳戶餘額同步完成`

**投資組合頁面:**
1. 持倉價格每 10 秒更新一次
2. 市值自動計算 = 數量 × 現在價格
3. 總市值 = 所有持倉市值總和

**資料庫:**
1. `investment_holdings.current_price` 每 10 秒更新
2. `asset_accounts.balance` 每 10 秒更新
3. `asset_accounts.updated_at` 是最近的時間

---

## 📞 需要協助？

如果以上步驟都無法解決問題，請提供以下資訊：

1. **瀏覽器 Console 日誌截圖**
2. **Render 後端日誌截圖**
3. **資料庫查詢結果**
4. **持倉列表和帳戶列表**

這樣我才能更精準地診斷問題！
