# 帳戶刪除功能說明

## 功能概述

在資產總覽中點擊帳戶後，帳戶詳情對話框現在提供「刪除帳戶」功能。

## 功能位置

**路徑**: 資產總覽 → 點擊任意帳戶 → 帳戶詳情對話框

**按鈕位置**: 對話框標題欄右側（編輯按鈕旁邊）

## 使用方式

1. 在資產總覽頁面點擊任意帳戶
2. 在彈出的帳戶詳情對話框中，點擊右上角的「🗑️ 刪除」按鈕
3. 確認刪除對話框會顯示警告訊息
4. 點擊「確認刪除」完成刪除

## UI 設計

### 刪除按鈕
- 圖示：🗑️ Trash2 icon
- 顏色：紅色（destructive）
- 位置：標題欄右側，編輯按鈕旁
- 懸停效果：紅色背景高亮

### 確認對話框

**標題**: 確認刪除帳戶

**內容**:
```
您確定要刪除「[帳戶名稱]」這個帳戶嗎？

⚠️ 警告：刪除後無法復原

刪除帳戶將會：
• 永久刪除此帳戶的所有資料
• 關聯的記帳記錄將失去帳戶關聯（但記錄本身不會被刪除）
• 如有投資持倉關聯，相關交易記錄也會受影響
```

**按鈕**:
- 取消：灰色按鈕
- 確認刪除：紅色按鈕（destructive style）

## 技術實作

### 新增功能
1. **導入 useDeleteAsset hook**
   ```typescript
   import { useAssets, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
   ```

2. **導入 Trash2 圖示**
   ```typescript
   import { Edit2, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
   ```

3. **新增狀態管理**
   ```typescript
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const deleteAsset = useDeleteAsset();
   ```

4. **刪除處理函數**
   ```typescript
   const handleDeleteAccount = async () => {
     if (!accountId) return;
     
     try {
       await deleteAsset.mutateAsync(accountId);
       toast({ title: "成功", description: "帳戶已刪除" });
       setShowDeleteDialog(false);
       onOpenChange(false); // 關閉詳情對話框
     } catch (error) {
       toast({
         title: "錯誤",
         description: "刪除帳戶失敗",
         variant: "destructive",
       });
     }
   };
   ```

### UI 更新

**標題欄按鈕組**:
```tsx
<div className="flex gap-2">
  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
    <Edit2 className="w-4 h-4 mr-1" />
    編輯
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowDeleteDialog(true)}
    className="text-destructive hover:text-destructive hover:bg-destructive/10"
  >
    <Trash2 className="w-4 h-4 mr-1" />
    刪除
  </Button>
</div>
```

**刪除確認對話框**:
```tsx
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>確認刪除帳戶</AlertDialogTitle>
      <AlertDialogDescription>
        {/* 警告訊息和影響說明 */}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDeleteAccount}
        disabled={deleteAsset.isPending}
        className="bg-destructive hover:bg-destructive/90"
      >
        {deleteAsset.isPending ? "刪除中..." : "確認刪除"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 資料影響範圍

### 會被刪除的資料
- ✅ 帳戶基本資料（asset_accounts 表）
- ✅ 帳戶相關的投資持倉（investment_holdings 表，CASCADE 刪除）
- ✅ 投資持倉相關的交易記錄（investment_transactions 表，CASCADE 刪除）

### 不會被刪除的資料
- ❌ 記帳記錄（ledger_entries 表）
  - 帳戶刪除後，accountId 會被設為 NULL（ON DELETE SET NULL）
  - 記錄本身保留，但失去帳戶關聯
  - 這些記錄仍會顯示在記帳簿中，帳戶名稱會顯示為「未知帳戶」

### 資料庫約束（已存在）
```sql
-- ledger_entries 表
accountId varchar("account_id")
  .references(() => assetAccounts.id, { onDelete: 'set null' })

-- investment_holdings 表
brokerAccountId varchar("broker_account_id")
  .notNull()
  .references(() => assetAccounts.id, { onDelete: 'cascade' })

-- investment_transactions 表
holdingId varchar("holding_id")
  .notNull()
  .references(() => investmentHoldings.id, { onDelete: 'cascade' })
```

## 使用場景

### 適合刪除的情況
1. ✅ 測試帳戶，不再需要
2. ✅ 已關閉的銀行帳戶
3. ✅ 錯誤創建的帳戶
4. ✅ 餘額為零且無交易記錄的帳戶

### 不建議刪除的情況
1. ❌ 有投資持倉的券商帳戶（會連帶刪除持倉和交易記錄）
2. ❌ 有大量歷史記帳記錄的帳戶（記錄會失去帳戶關聯）
3. ❌ 仍在使用中的帳戶

### 建議操作
如果只是想「隱藏」帳戶而非刪除：
1. 使用「編輯」功能
2. 關閉「計入總資產」選項
3. 在備註中標記「已停用」

## 安全性考量

### 警告機制
- ⚠️ 明確的警告訊息
- ⚠️ 列出刪除影響範圍
- ⚠️ 紅色視覺提示
- ⚠️ 兩步驟確認流程

### 無法復原
- 刪除是永久性操作
- 資料庫無軟刪除機制
- 建議在刪除前確認帳戶狀態

### 建議改進（未來）
1. 添加「確認帳戶名稱」輸入框
2. 顯示關聯記錄數量
3. 提供匯出資料選項
4. 實作軟刪除機制

## 測試建議

### 測試案例 1：刪除空帳戶
1. 創建新測試帳戶
2. 不添加任何交易記錄
3. 刪除帳戶
4. 驗證：帳戶從列表消失

### 測試案例 2：刪除有記帳記錄的帳戶
1. 創建測試帳戶
2. 添加幾筆記帳記錄
3. 刪除帳戶
4. 驗證：
   - 帳戶已刪除
   - 記帳記錄保留
   - 記錄中帳戶顯示為「未知帳戶」

### 測試案例 3：刪除有投資持倉的帳戶
1. 創建券商帳戶（台股/美股/加密貨幣）
2. 添加投資持倉
3. 嘗試刪除帳戶
4. 驗證：
   - 帳戶已刪除
   - 持倉記錄已刪除（CASCADE）
   - 投資交易記錄已刪除（CASCADE）

### 測試案例 4：取消刪除
1. 點擊刪除按鈕
2. 在確認對話框點擊「取消」
3. 驗證：
   - 對話框關閉
   - 帳戶未被刪除
   - 詳情對話框仍開啟

### 測試案例 5：刪除過程中的錯誤處理
1. 模擬網路錯誤
2. 嘗試刪除帳戶
3. 驗證：
   - 顯示錯誤提示
   - 帳戶未被刪除
   - 可以重試操作

## 相關檔案

### 修改的檔案
- `client/src/components/AccountDetailDialog.tsx`
  - 新增刪除按鈕和確認對話框
  - 新增 handleDeleteAccount 函數
  - 導入 useDeleteAsset hook 和 Trash2 圖示

### 使用的現有功能
- `client/src/hooks/useAssets.ts` - useDeleteAsset hook
- `server/routes.ts` - DELETE /api/assets/:id endpoint
- `server/storage.ts` - deleteAsset 資料庫操作

## 查詢 API

### 刪除帳戶 API
```typescript
DELETE /api/assets/:id

// Hook 使用
const deleteAsset = useDeleteAsset();
await deleteAsset.mutateAsync(accountId);

// 成功後自動刷新
queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
```

## 總結

此功能提供了一個安全、明確的帳戶刪除流程：
1. ✅ 明顯的刪除按鈕（紅色視覺提示）
2. ✅ 詳細的警告說明
3. ✅ 兩步驟確認機制
4. ✅ 清楚的影響範圍說明
5. ✅ 刪除狀態反饋（loading state）
6. ✅ 錯誤處理機制

建議用戶在刪除前：
- 確認帳戶不再需要
- 了解刪除影響範圍
- 考慮使用「關閉計入總資產」替代刪除
