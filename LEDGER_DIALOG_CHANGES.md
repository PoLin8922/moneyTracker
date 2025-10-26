// LedgerEntryDialog.tsx - 關鍵修改指南
// 這個檔案記錄需要修改的地方

/**
 * ========================================
 * 修改 1: 更新 imports
 * ========================================
 * 位置: 檔案開頭
 * 
 * 移除：
 * - import { useBudget } from "@/hooks/useBudget";
 * - import { useBudgetCategories } from "@/hooks/useBudgetCategories";
 * - import { useSavingsJarCategories } from "@/hooks/useSavingsJarCategories";
 * - import { assignCategoryColor } from "@/lib/categoryColors";
 * - import IconSelector from "@/components/IconSelector";
 * - 所有未使用的 lucide-react icon imports (Car, Users, Home, etc.)
 * 
 * 新增：
 * - import { useLedgerCategories } from "@/hooks/useLedgerCategories";
 * - import CategoryManagementDialog from "@/components/CategoryManagementDialog";
 * - import { Settings } from "lucide-react";
 */

/**
 * ========================================
 * 修改 2: 移除硬編碼的 categories 陣列
 * ========================================
 * 位置: 第 40-53 行左右
 * 
 * 完全刪除：
 * const categories = [
 *   { name: "交通", icon: Car, ... },
 *   ...
 * ];
 */

/**
 * ========================================
 * 修改 3: 更新元件內的 hooks
 * ========================================
 * 位置: export default function LedgerEntryDialog 內部
 * 
 * 移除：
 * - const now = new Date();
 * - const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 * - const { data: budget } = useBudget(currentMonth);
 * - const { data: budgetCategories } = useBudgetCategories(budget?.id);
 * - const { data: savingsJarCategories } = useSavingsJarCategories();
 * - const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
 * - const [tempCustomCategories, setTempCustomCategories] = useState<Array<{name: string; iconName: string}>>([]);
 * 
 * 新增：
 * - const { data: expenseCategories } = useLedgerCategories("expense");
 * - const { data: incomeCategories } = useLedgerCategories("income");
 * - const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
 */

/**
 * ========================================
 * 修改 4: 移除複雜的 allCategories useMemo
 * ========================================
 * 位置: 約第 80-180 行
 * 
 * 完全移除整個 useMemo(() => { ... }, [budgetCategories, ledgerEntries, ...])
 * 
 * 替換為簡單的：
 * const allCategories = useMemo(() => {
 *   const categories = type === "expense" ? expenseCategories : incomeCategories;
 *   return categories || [];
 * }, [type, expenseCategories, incomeCategories]);
 */

/**
 * ========================================
 * 修改 5: 更新 useEffect 中的表單重置
 * ========================================
 * 位置: useEffect(() => { if (open) { ... }}, [open, entry])
 * 
 * 移除：
 * - setTempCustomCategories([]);
 * 
 * 保持其他邏輯不變
 */

/**
 * ========================================
 * 修改 6: 移除 handleAddCategory 函數
 * ========================================
 * 位置: 約第 250-280 行
 * 
 * 完全刪除 handleAddCategory 函數（不再需要，由 CategoryManagementDialog 處理）
 */

/**
 * ========================================
 * 修改 7: 更新類別選擇 UI
 * ========================================
 * 位置: 約第 464 行開始的類別網格
 * 
 * 保持 allCategories.map((cat) => { ... }) 的結構
 * 但更新內部：
 * 
 * const Icon = getIconByName(cat.iconName);  // 改用 getIconByName
 * 
 * <div 
 *   style={{ 
 *     backgroundColor: cat.color,
 *     borderRadius: '0.75rem'
 *   }}
 * >
 *   <Icon className="w-5 h-5 text-white" />
 * </div>
 */

/**
 * ========================================
 * 修改 8: 替換「新增類別」按鈕
 * ========================================
 * 位置: 類別網格後面的 button
 * 
 * 從：
 * <button
 *   onClick={() => setIconSelectorOpen(true)}
 *   ...
 * >
 *   <Plus className="w-4 h-4" />
 *   新增
 * </button>
 * 
 * 改為：
 * <button
 *   onClick={() => setCategoryManagementOpen(true)}
 *   ...
 * >
 *   <Settings className="w-4 h-4" />
 *   管理
 * </button>
 */

/**
 * ========================================
 * 修改 9: 替換對話框
 * ========================================
 * 位置: 元件最後面
 * 
 * 移除：
 * <IconSelector
 *   open={iconSelectorOpen}
 *   onOpenChange={setIconSelectorOpen}
 *   onSelect={handleAddCategory}
 *   existingCategories={...}
 *   directToCustom
 * />
 * 
 * 替換為：
 * <CategoryManagementDialog
 *   open={categoryManagementOpen}
 *   onOpenChange={setCategoryManagementOpen}
 * />
 */

// ========================================
// 完整的替換後的關鍵程式碼片段
// ========================================

// 1. Imports (完整版本)
/*
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { useLedgerEntries } from "@/hooks/useLedger";
import { useLedgerCategories } from "@/hooks/useLedgerCategories";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getIconByName } from "@/lib/categoryIcons";
import DatePicker from "@/components/DatePicker";
import CategoryManagementDialog from "@/components/CategoryManagementDialog";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
*/

// 2. Hooks (在元件內部)
/*
export default function LedgerEntryDialog({ open, onOpenChange, entry }: LedgerEntryDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  const { data: ledgerEntries } = useLedgerEntries();
  
  // 載入對應類型的類別
  const { data: expenseCategories } = useLedgerCategories("expense");
  const { data: incomeCategories } = useLedgerCategories("income");
  
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);

  const isEditMode = !!entry;

  // 根據目前類型選擇類別
  const allCategories = useMemo(() => {
    const categories = type === "expense" ? expenseCategories : incomeCategories;
    return categories || [];
  }, [type, expenseCategories, incomeCategories]);

  // ... 其他邏輯保持不變
}
*/

// 3. 類別選擇 UI (更新版本)
/*
<div className="grid grid-cols-4 gap-2">
  {allCategories.map((cat) => {
    const Icon = getIconByName(cat.iconName);
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => setCategory(cat.name)}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
          category === cat.name
            ? "border-primary bg-primary/10"
            : "border-transparent hover:border-muted-foreground/20"
        )}
      >
        <div 
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: cat.color,
            borderRadius: '0.75rem'
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs">{cat.name}</span>
      </button>
    );
  })}
  
  {/* 管理類別按鈕 *\/}
  <button
    type="button"
    onClick={() => setCategoryManagementOpen(true)}
    className={cn(
      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed transition-all",
      "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
    )}
  >
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      <Settings className="w-4 h-4" />
    </div>
    <span className="text-xs">管理</span>
  </button>
</div>
*/

// 4. 對話框 (在元件最後)
/*
<CategoryManagementDialog
  open={categoryManagementOpen}
  onOpenChange={setCategoryManagementOpen}
/>
*/

export {};
