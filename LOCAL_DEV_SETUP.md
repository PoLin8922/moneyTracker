# 🚀 本地開發環境設定指南

## 問題診斷

您遇到的錯誤：
```
Error: 伺服器回應格式錯誤
expenseCategories: undefined
incomeCategories: undefined
```

**可能的原因**:
1. ❌ DATABASE_URL 未設定
2. ❌ ledger_categories 表不存在
3. ❌ 資料庫連線失敗

---

## ✅ 解決方案

### 選項 A: 使用 Replit 開發（推薦）⭐

**優點**:
- ✅ 環境已配置完整
- ✅ 資料庫已連接
- ✅ 無需本地設定

**步驟**:
1. 推送代碼到 GitHub
2. 在 Replit 上拉取並測試

---

### 選項 B: 本地開發設定

#### Step 1: 設定環境變數

1. **複製環境變數範本**
   ```bash
   cp .env.example .env
   ```

2. **取得 Neon 資料庫連線字串**
   - 登入 [Neon Console](https://console.neon.tech)
   - 選擇您的專案
   - 點擊 "Connection Details"
   - 複製 "Connection string"

3. **編輯 .env 檔案**
   ```bash
   nano .env  # 或使用任何文字編輯器
   ```
   
   填入：
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.aws.neon.tech/neondb?sslmode=require
   SESSION_SECRET=your-random-secret-key-here
   NODE_ENV=development
   ```

#### Step 2: 確認資料庫表已建立

1. **登入 Neon Console**
   https://console.neon.tech

2. **開啟 SQL Editor**

3. **檢查 ledger_categories 表是否存在**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'ledger_categories'
   );
   ```

4. **如果表不存在，執行遷移**
   
   依序執行以下 SQL 檔案：
   
   **a) 建立表**
   ```sql
   -- 複製 migrations/0003_step1_create_table.sql 的內容
   CREATE TABLE IF NOT EXISTS ledger_categories (
     id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name VARCHAR NOT NULL,
     type VARCHAR NOT NULL,
     icon_name VARCHAR NOT NULL DEFAULT 'Wallet',
     color VARCHAR NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE INDEX IF NOT EXISTS idx_ledger_categories_user_id ON ledger_categories(user_id);
   CREATE INDEX IF NOT EXISTS idx_ledger_categories_type ON ledger_categories(type);
   CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_categories_user_name_type 
     ON ledger_categories(user_id, name, type);
   ```

   **b) 遷移現有資料**
   ```sql
   -- 複製 migrations/0003_step2_migrate_existing.sql 的內容
   -- （如果有現有的 budget_categories 和 savings_jar_categories 資料）
   ```

   **c) 插入預設類別**
   ```sql
   -- 複製 migrations/0003_step3_insert_defaults.sql 的內容
   -- （為每個用戶建立預設類別）
   ```

5. **驗證表已建立**
   ```sql
   -- 檢查表結構
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'ledger_categories';
   
   -- 檢查資料
   SELECT * FROM ledger_categories LIMIT 10;
   ```

#### Step 3: 啟動本地伺服器

```bash
npm run dev
```

應該看到：
```
> dev
> tsx watch server/index.ts

Server running on port 5000
✅ Database connected
```

如果看到錯誤：
```
Error: DATABASE_URL must be set
```

請回到 Step 1 檢查 .env 設定。

#### Step 4: 測試 API

**開啟新終端**，執行：

```bash
# 測試 health check
curl http://localhost:5000/api/health

# 應該看到：
# {"status":"ok","timestamp":"...","message":"Backend is running!"}
```

---

## 🔍 除錯步驟

### 1. 檢查伺服器日誌

啟動伺服器後，在終端應該看到：

**成功的情況** ✅:
```
Server running on port 5000
[Auth] Session middleware configured: { store: 'PostgreSQL', ... }
✅ Database connected
```

**失敗的情況** ❌:
```
Error: DATABASE_URL must be set
```
→ 請檢查 .env 檔案

```
Error: connect ECONNREFUSED
```
→ 資料庫連線失敗，請檢查 DATABASE_URL 是否正確

### 2. 檢查瀏覽器 Console

開啟開發者工具，應該看到：

**如果改善成功** ✅:
```
📥 GET ledger-categories 回應:
  status: 200
  statusText: "OK"
  contentType: "application/json"
  bodyLength: 234
  body: "[{\"id\":\"...\",\"name\":\"飲食\",...]"
```

**如果還是失敗** ❌:
```
📥 GET ledger-categories 回應:
  status: 200
  statusText: "OK"
  contentType: "text/html"
  bodyLength: 5432
  body: "<!DOCTYPE html>..."
```
→ 伺服器返回 HTML 而不是 JSON，可能是路由問題

### 3. 檢查 Network 請求

1. 開啟開發者工具 → Network 頁籤
2. 找到 `ledger-categories` 請求
3. 查看 Response 內容

**正常的回應** ✅:
```json
[
  {
    "id": "abc123",
    "user_id": "user1",
    "name": "飲食",
    "type": "expense",
    "icon_name": "Utensils",
    "color": "#EF4444"
  }
]
```

**異常的回應** ❌:
- 空字串
- HTML 頁面
- 錯誤訊息

---

## 🔧 常見問題

### Q1: 為什麼建議在 Replit 上開發？

**A**: Replit 已經配置好：
- ✅ 環境變數（DATABASE_URL）
- ✅ 資料庫連線
- ✅ 自動重啟
- ✅ 線上預覽

本地開發需要手動設定這些，容易出錯。

### Q2: 我一定要設定本地環境嗎？

**A**: 不一定。建議：
- **小改動/測試** → 直接在 Replit 上開發
- **大型功能開發** → 可以設定本地環境

### Q3: .env 檔案要不要推送到 Git？

**A**: ❌ **絕對不要！**

.env 包含敏感資訊（資料庫密碼）。
檢查 `.gitignore` 是否包含：
```
.env
.env.local
```

只推送 `.env.example`（範本）。

### Q4: 遷移檔案要不要執行？

**A**: 
- 如果在 **Replit** 上開發 → 可能已執行
- 如果是 **全新本地環境** → 必須執行
- 檢查方法：在 Neon Console 執行
  ```sql
  SELECT * FROM ledger_categories LIMIT 1;
  ```
  如果有資料 → 已執行
  如果表不存在 → 需要執行

### Q5: 改善後還是看到「伺服器回應格式錯誤」？

**A**: 查看新的 Console 日誌：

```
📥 GET ledger-categories 回應:
  status: ...
  body: ...
```

將完整日誌提供給我，我會幫您分析。

---

## 📝 快速檢查清單

完成以下項目才能本地開發：

- [ ] `.env` 檔案已建立
- [ ] `DATABASE_URL` 已設定
- [ ] Neon Console 可以連線
- [ ] `ledger_categories` 表已建立
- [ ] 遷移檔案已執行（如需要）
- [ ] `npm run dev` 可以啟動
- [ ] 瀏覽器可以開啟 `http://localhost:5000`
- [ ] API `/api/health` 返回 `{"status":"ok"}`

**如果任何一項失敗，請回到對應的步驟檢查。**

---

## 🎊 成功標準

當您看到：

1. **終端顯示**:
   ```
   Server running on port 5000
   ✅ Database connected
   ```

2. **瀏覽器 Console 顯示**:
   ```
   📥 GET ledger-categories 回應:
     status: 200
     body: "[{...}]"
   ```

3. **類別管理彈窗**:
   - ✅ 顯示類別列表
   - ✅ 或顯示「尚無XX類別」

表示本地環境設定成功！

---

**再次提醒**: 如果本地設定遇到困難，**強烈建議在 Replit 上開發**！
