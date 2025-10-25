import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { useBudget } from "@/hooks/useBudget";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useLedgerEntries } from "@/hooks/useLedger";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getIconByName } from "@/lib/categoryIcons";
import DatePicker from "@/components/DatePicker";
import IconSelector from "@/components/IconSelector";
import { 
  Car, 
  Users, 
  Home, 
  ShoppingCart, 
  Utensils, 
  Heart, 
  Smartphone,
  BookOpen,
  Wallet,
  TrendingUp,
  Gift,
  Plane,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
}

const categories = [
  { name: "交通", icon: Car, color: "#3b82f6" },
  { name: "社交", icon: Users, color: "#a855f7" },
  { name: "房租", icon: Home, color: "#22c55e" },
  { name: "購物", icon: ShoppingCart, color: "#ec4899" },
  { name: "餐飲", icon: Utensils, color: "#f97316" },
  { name: "醫療", icon: Heart, color: "#ef4444" },
  { name: "通訊", icon: Smartphone, color: "#6366f1" },
  { name: "教育", icon: BookOpen, color: "#eab308" },
  { name: "薪資", icon: Wallet, color: "#10b981" },
  { name: "投資", icon: TrendingUp, color: "#06b6d4" },
  { name: "禮物", icon: Gift, color: "#f43f5e" },
  { name: "旅遊", icon: Plane, color: "#0ea5e9" },
];

export default function LedgerEntryDialog({ open, onOpenChange, entry }: LedgerEntryDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  
  // 獲取當前月份的預算和類別
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data: budget } = useBudget(currentMonth);
  const { data: budgetCategories } = useBudgetCategories(budget?.id);
  const { data: ledgerEntries } = useLedgerEntries();
  
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

  const isEditMode = !!entry;

  // 合併用戶自定義類別和預設類別
  const allCategories = useMemo(() => {
    // 1. 從預算分配類別取得（有圖標和顏色）
    const budgetCategoryMap = new Map(
      budgetCategories?.map(cat => [
        cat.name, 
        {
          name: cat.name,
          icon: getIconByName(cat.iconName || "Wallet"),
          color: cat.color,
          iconName: cat.iconName || "Wallet",
          isUserDefined: true
        }
      ]) || []
    );

    // 2. 從記帳簿記錄中提取已使用的類別（補充沒有在預算分配中的類別）
    const ledgerCategorySet = new Set<string>();
    ledgerEntries?.forEach(entry => {
      if (entry.category && !budgetCategoryMap.has(entry.category)) {
        ledgerCategorySet.add(entry.category);
      }
    });

    // 3. 將記帳簿類別轉換為顯示格式（使用預設圖標）
    const ledgerCategories = Array.from(ledgerCategorySet).map(name => ({
      name,
      icon: Wallet, // 使用預設圖標
      color: "#64748b", // 使用灰色
      iconName: "Wallet",
      isUserDefined: true
    }));

    // 4. 預設類別（過濾掉已存在的）
    const allExistingNames = new Set([
      ...Array.from(budgetCategoryMap.keys()),
      ...Array.from(ledgerCategorySet)
    ]);
    const defaultCategories = categories
      .filter(cat => !allExistingNames.has(cat.name))
      .map(cat => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        iconName: cat.name, // 使用類別名稱作為 iconName
        isUserDefined: false
      }));

    // 5. 合併：預算類別 + 記帳簿類別 + 預設類別
    return [
      ...Array.from(budgetCategoryMap.values()),
      ...ledgerCategories,
      ...defaultCategories
    ];
  }, [budgetCategories, ledgerEntries]);

  useEffect(() => {
    if (open) {
      if (entry) {
        // 編輯模式：預填數據
        setType(entry.type);
        setDate(entry.rawDate);
        setAmount(entry.originalAmount.toString());
        setAccountId(entry.accountId);
        setCategory(entry.category);
        setNote(entry.note || "");
      } else {
        // 新增模式：重置表單
        setType("expense");
        setDate(new Date().toISOString().split('T')[0]);
        setAmount("");
        setAccountId("");
        setCategory("");
        setNote("");
      }
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !accountId || !category) {
      toast({
        title: "錯誤",
        description: "請填寫所有必填欄位",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        // 編輯模式
        await apiRequest("PATCH", `/api/ledger/${entry.id}`, {
          type,
          amount,
          category,
          accountId,
          date,
          note,
        });

        // 計算餘額變化
        const oldAccount = accounts?.find(a => a.id === entry.accountId);
        const newAccount = accounts?.find(a => a.id === accountId);
        
        // 還原舊帳戶餘額
        if (oldAccount) {
          const oldBalance = parseFloat(oldAccount.balance);
          const oldAmount = parseFloat(entry.originalAmount.toString());
          const restoredBalance = entry.type === "income"
            ? oldBalance - oldAmount
            : oldBalance + oldAmount;

          await apiRequest("PATCH", `/api/assets/${oldAccount.id}`, {
            type: oldAccount.type,
            accountName: oldAccount.accountName,
            note: oldAccount.note,
            balance: restoredBalance.toString(),
            currency: oldAccount.currency,
            exchangeRate: oldAccount.exchangeRate,
            includeInTotal: oldAccount.includeInTotal,
          });
        }

        // 更新新帳戶餘額
        if (newAccount) {
          const currentBalance = parseFloat(newAccount.balance);
          const changeAmount = parseFloat(amount);
          const newBalance = type === "income"
            ? currentBalance + changeAmount
            : currentBalance - changeAmount;

          await apiRequest("PATCH", `/api/assets/${newAccount.id}`, {
            type: newAccount.type,
            accountName: newAccount.accountName,
            note: newAccount.note,
            balance: newBalance.toString(),
            currency: newAccount.currency,
            exchangeRate: newAccount.exchangeRate,
            includeInTotal: newAccount.includeInTotal,
          });
        }

        toast({
          title: "更新成功",
          description: "交易已更新並同步帳戶餘額",
        });
      } else {
        // 新增模式
        await apiRequest("POST", "/api/ledger", {
          type,
          amount,
          category,
          accountId,
          date,
          note,
        });

        // Update account balance
        const account = accounts?.find(a => a.id === accountId);
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const changeAmount = parseFloat(amount);
          const newBalance = type === "income" 
            ? currentBalance + changeAmount 
            : currentBalance - changeAmount;

          await apiRequest("PATCH", `/api/assets/${accountId}`, {
            type: account.type,
            accountName: account.accountName,
            note: account.note,
            balance: newBalance.toString(),
            currency: account.currency,
            exchangeRate: account.exchangeRate,
            includeInTotal: account.includeInTotal,
          });
        }

        toast({
          title: "記帳成功",
          description: "交易已記錄並更新帳戶餘額",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditMode ? "更新失敗" : "記帳失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    if (!confirm("確定要刪除這筆交易嗎？")) return;

    try {
      setIsDeleting(true);

      // 刪除記帳記錄
      await apiRequest("DELETE", `/api/ledger/${entry.id}`);

      // 還原帳戶餘額
      const account = accounts?.find(a => a.id === entry.accountId);
      if (account) {
        const currentBalance = parseFloat(account.balance);
        const entryAmount = parseFloat(entry.originalAmount.toString());
        const restoredBalance = entry.type === "income"
          ? currentBalance - entryAmount
          : currentBalance + entryAmount;

        await apiRequest("PATCH", `/api/assets/${account.id}`, {
          type: account.type,
          accountName: account.accountName,
          note: account.note,
          balance: restoredBalance.toString(),
          currency: account.currency,
          exchangeRate: account.exchangeRate,
          includeInTotal: account.includeInTotal,
        });
      }

      toast({
        title: "刪除成功",
        description: "交易已刪除並還原帳戶餘額",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCategory = async (categoryName: string, iconName: string) => {
    if (!categoryName.trim()) return;

    try {
      // 直接設定類別名稱（不創建預算類別）
      // 記帳簿類別和預算分配類別是分開的：
      // - 記帳簿類別：只是字串，用於分類交易記錄
      // - 預算分配類別：需要在現金流頁面明確新增，包含百分比分配
      setCategory(categoryName);

      toast({
        title: "類別已選擇",
        description: `已選擇「${categoryName}」作為交易類別`,
      });

      setIconSelectorOpen(false);
    } catch (error) {
      toast({
        title: "選擇失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "編輯交易" : "記一筆"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => setType("expense")}
              className="flex-1"
              data-testid="button-expense"
            >
              支出
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => setType("income")}
              className="flex-1"
              data-testid="button-income"
            >
              收入
            </Button>
          </div>

          <div className="space-y-2">
            <Label>類別 *</Label>
            <div className="grid grid-cols-4 gap-2">
              {allCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      category === cat.name
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted-foreground/20"
                    )}
                    data-testid={`category-${cat.name}`}
                  >
                    <div 
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: cat.color,
                        opacity: 0.9,
                        borderRadius: '0.75rem' // 12px, 更明顯的圓角
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs">{cat.name}</span>
                  </button>
                );
              })}
              
              {/* 新增類別按鈕 */}
              <button
                type="button"
                onClick={() => setIconSelectorOpen(true)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed transition-all",
                  "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                )}
                data-testid="button-add-category"
              >
                <div 
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-muted rounded-xl"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">新增</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>日期 *</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">金額 *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="輸入金額"
              data-testid="input-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">銀行帳戶 *</Label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              data-testid="select-account"
            >
              <option value="">選擇帳戶</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.type} - {account.accountName} 
                  ({account.currency} {parseFloat(account.balance).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備註</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="選填"
              data-testid="input-note"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-between pt-4">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                data-testid="button-delete"
              >
                {isDeleting ? "刪除中..." : "刪除"}
              </Button>
            )}
            <div className={`flex gap-2 ${!isEditMode ? 'ml-auto' : ''}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? "處理中..." : (isEditMode ? "更新" : "確認")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
      
      {/* Icon Selector Dialog */}
      <IconSelector
        open={iconSelectorOpen}
        onOpenChange={setIconSelectorOpen}
        onSelect={handleAddCategory}
        existingCategories={allCategories.filter(cat => cat.isUserDefined).map(cat => ({
          name: cat.name,
          iconName: cat.iconName || "Wallet",
          color: cat.color
        }))}
        directToCustom={true}
      />
    </Dialog>
  );
}
