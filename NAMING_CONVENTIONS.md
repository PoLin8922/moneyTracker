# 🚨 命名規範與一致性檢查清單

## ⚠️ 關鍵原則

**所有相關的名稱、配置必須保持一致！**  
不一致會導致：
- 資料庫找不到表 ❌
- Session 無法持久化 ❌
- Cookie 無法傳送 ❌
- 認證失敗 ❌

---

## 📋 統一配置來源

### ✅ 正確做法：使用 `server/config.ts`

所有配置都從 `server/config.ts` 匯入：

```typescript
import { SESSION_CONFIG, ENV, CORS_CONFIG } from "./config";
```

### ❌ 錯誤做法：硬編碼重複定義

```typescript
// ❌ 不要這樣做！
const tableName = 'user_sessions';  // 在 fileA.ts
const tableName = 'sessions';       // 在 fileB.ts  ← 不一致！
```

---

## 🔑 關鍵配置項目

### 1. Session 表名

| 項目 | 值 | 定義位置 |
|------|---|----------|
| **PostgreSQL 表名** | `user_sessions` | `server/config.ts` → `SESSION_CONFIG.TABLE_NAME` |
| **使用位置** | | |
| ├─ simpleAuth.ts | ✅ 使用 `SESSION_CONFIG.TABLE_NAME` | |
| ├─ replitAuth.ts | ✅ 使用 `SESSION_CONFIG.TABLE_NAME` | |
| └─ setup-session-table.sql | ⚠️ 手動維護，確保名稱匹配 | |

**檢查命令：**
```bash
grep -r "tableName" server/*.ts
# 應該都指向 SESSION_CONFIG.TABLE_NAME
```

---

### 2. Cookie 名稱

| 項目 | 值 | 定義位置 |
|------|---|----------|
| **Cookie 名稱** | `sessionId` | `server/config.ts` → `SESSION_CONFIG.COOKIE_NAME` |
| **使用位置** | | |
| ├─ simpleAuth.ts session() | ✅ `name: SESSION_CONFIG.COOKIE_NAME` | |
| ├─ simpleAuth.ts 手動 Cookie | ✅ 使用 `SESSION_CONFIG.COOKIE_NAME` | |
| └─ replitAuth.ts | ✅ `name: SESSION_CONFIG.COOKIE_NAME` | |

**檢查命令：**
```bash
grep -r "sessionId\|COOKIE_NAME" server/*.ts
# 應該都指向 SESSION_CONFIG.COOKIE_NAME
```

---

### 3. Session TTL（過期時間）

| 項目 | 值 | 定義位置 |
|------|---|----------|
| **TTL** | `30 * 24 * 60 * 60 * 1000` (30天) | `server/config.ts` → `SESSION_CONFIG.TTL` |
| **使用位置** | | |
| ├─ simpleAuth.ts | ✅ `maxAge: SESSION_CONFIG.TTL` | |
| ├─ replitAuth.ts | ✅ `ttl: SESSION_CONFIG.TTL` | |
| └─ 手動 Cookie | ✅ `Max-Age=${SESSION_CONFIG.TTL / 1000}` | |

---

### 4. Session Secret

| 項目 | 值 | 定義位置 |
|------|---|----------|
| **Secret** | `process.env.SESSION_SECRET` | `server/config.ts` → `SESSION_CONFIG.SECRET` |
| **使用位置** | | |
| ├─ simpleAuth.ts | ✅ `secret: SESSION_CONFIG.SECRET` | |
| └─ replitAuth.ts | ✅ `secret: SESSION_CONFIG.SECRET` | |

---

### 5. CORS 允許來源

| 項目 | 值 | 定義位置 |
|------|---|----------|
| **允許的來源** | `['http://localhost:5173', ...]` | `server/config.ts` → `CORS_CONFIG.ALLOWED_ORIGINS` |
| **使用位置** | | |
| └─ index.ts | ✅ `CORS_CONFIG.ALLOWED_ORIGINS.includes(origin)` | |

---

## 🔍 檢查清單

### 部署前必查項目

- [ ] 所有檔案都從 `server/config.ts` 匯入配置
- [ ] `setup-session-table.sql` 的表名是 `user_sessions`
- [ ] 資料庫只有一張 session 表（`user_sessions`）
- [ ] 沒有硬編碼的配置值（搜尋 `'sessions'`, `'sessionId'`, `30 * 24`）
- [ ] Render 環境變數：
  - [ ] `FRONTEND_URL` 設置正確
  - [ ] `SESSION_SECRET` 已設置
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` 已設置

### 檢查命令

```bash
# 1. 檢查是否還有硬編碼的 'sessions' (不含 user_sessions)
grep -r "\"sessions\"" server/*.ts
# 應該沒有結果

# 2. 檢查 tableName 都使用 SESSION_CONFIG
grep -r "tableName:" server/*.ts
# 應該都是 SESSION_CONFIG.TABLE_NAME

# 3. 檢查資料庫表
psql $DATABASE_URL -c "\dt *session*"
# 應該只有 user_sessions

# 4. 檢查 SQL 檔案
grep "CREATE TABLE" setup-session-table.sql
# 應該是 CREATE TABLE IF NOT EXISTS "user_sessions"
```

---

## 📝 修改流程

### 如果需要修改配置（例如改表名）

1. **只在一個地方修改**：`server/config.ts`
   ```typescript
   export const SESSION_CONFIG = {
     TABLE_NAME: 'new_table_name',  // ← 只改這裡
     // ...
   } as const;
   ```

2. **更新 SQL 檔案**：`setup-session-table.sql`
   ```sql
   CREATE TABLE IF NOT EXISTS "new_table_name" (
   ```

3. **檢查**：
   ```bash
   grep -r "new_table_name\|SESSION_CONFIG.TABLE_NAME" server/
   ```

4. **執行 SQL**：
   ```bash
   # 刪除舊表（如果需要）
   DROP TABLE IF EXISTS user_sessions;
   
   # 執行新的 SQL
   psql $DATABASE_URL -f setup-session-table.sql
   ```

5. **重新部署**

---

## 🚨 常見錯誤

### ❌ 錯誤 1：多個表名不一致
```typescript
// fileA.ts
tableName: 'user_sessions'

// fileB.ts  
tableName: 'sessions'  // ← 不一致！
```

**症狀：** Session 存到一張表，但查詢另一張表

**解決：** 全部改用 `SESSION_CONFIG.TABLE_NAME`

---

### ❌ 錯誤 2：Cookie 名稱不一致
```typescript
// 登入時
name: 'sessionId'

// 手動設置時
const cookie = `connect.sid=${...}`  // ← 名稱不同！
```

**症狀：** 設置了兩個不同的 Cookie

**解決：** 全部改用 `SESSION_CONFIG.COOKIE_NAME`

---

### ❌ 錯誤 3：資料庫有多張 Session 表
```sql
user_sessions  -- 3 筆資料 ✅
sessions       -- 0 筆資料（舊的）❌
```

**症狀：** 程式查詢 `user_sessions`，但舊的 `sessions` 表還存在造成混淆

**解決：**
```sql
DROP TABLE IF EXISTS sessions CASCADE;
```

---

## 📚 參考資料

- 配置檔案：`server/config.ts`
- Session 實作：`server/simpleAuth.ts`, `server/replitAuth.ts`
- SQL 腳本：`setup-session-table.sql`
- CORS 設定：`server/index.ts`

---

**⚠️ 記住：修改配置時，永遠只改 `server/config.ts` 這一個地方！**
