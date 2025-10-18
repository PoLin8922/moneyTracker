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
import { queryClient, apiRequest } from "@/lib/queryClient";
import DatePicker from "@/components/DatePicker";
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
  Coffee,
  Zap,
  Music,
  Film,
  Gamepad2,
  Dumbbell,
  ShoppingBag,
  Shirt,
  Flower2,
  Baby,
  PawPrint,
  Briefcase,
  GraduationCap,
  Building2,
  Bus,
  Train,
  Bike,
  Fuel,
  Wrench,
  Lightbulb,
  Tv,
  Wifi,
  Pizza,
  IceCream,
  Wine,
  DollarSign,
  PiggyBank,
  CreditCard,
  Receipt,
  Tag,
  CircleDollarSign,
  HandCoins,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
}

const categories = [
  { name: "交通", icon: Car, color: "bg-blue-500" },
  { name: "社交", icon: Users, color: "bg-purple-500" },
  { name: "房租", icon: Home, color: "bg-green-500" },
  { name: "購物", icon: ShoppingCart, color: "bg-pink-500" },
  { name: "餐飲", icon: Utensils, color: "bg-orange-500" },
  { name: "醫療", icon: Heart, color: "bg-red-500" },
  { name: "通訊", icon: Smartphone, color: "bg-indigo-500" },
  { name: "教育", icon: BookOpen, color: "bg-yellow-500" },
  { name: "薪資", icon: Wallet, color: "bg-emerald-500" },
  { name: "投資", icon: TrendingUp, color: "bg-cyan-500" },
  { name: "禮物", icon: Gift, color: "bg-rose-500" },
  { name: "旅遊", icon: Plane, color: "bg-sky-500" },
];

// 圖標匹配函數：根據類別名稱找到最適合的圖標
const getIconForCategory = (categoryName: string): any => {
  const name = categoryName.toLowerCase();
  
  // 交通相關
  if (name.includes('交通') || name.includes('車') || name.includes('uber') || name.includes('計程車')) return Car;
  if (name.includes('公車') || name.includes('巴士')) return Bus;
  if (name.includes('火車') || name.includes('高鐵') || name.includes('捷運') || name.includes('地鐵')) return Train;
  if (name.includes('腳踏車') || name.includes('單車') || name.includes('youbike')) return Bike;
  if (name.includes('油') || name.includes('加油') || name.includes('汽油')) return Fuel;
  if (name.includes('停車')) return Car;
  
  // 飲食相關
  if (name.includes('餐') || name.includes('吃') || name.includes('食')) return Utensils;
  if (name.includes('咖啡') || name.includes('飲料') || name.includes('茶')) return Coffee;
  if (name.includes('披薩') || name.includes('pizza')) return Pizza;
  if (name.includes('冰淇淋') || name.includes('甜點')) return IceCream;
  if (name.includes('酒') || name.includes('bar') || name.includes('聚餐')) return Wine;
  
  // 購物相關
  if (name.includes('購物') || name.includes('買')) return ShoppingCart;
  if (name.includes('服飾') || name.includes('衣服') || name.includes('鞋')) return Shirt;
  if (name.includes('美妝') || name.includes('化妝')) return Flower2;
  if (name.includes('包包') || name.includes('配件')) return ShoppingBag;
  
  // 居住相關
  if (name.includes('房') || name.includes('租')) return Home;
  if (name.includes('水電') || name.includes('電費') || name.includes('水費')) return Lightbulb;
  if (name.includes('維修') || name.includes('修繕')) return Wrench;
  if (name.includes('大樓') || name.includes('管理費')) return Building2;
  
  // 娛樂相關
  if (name.includes('娛樂')) return Gamepad2;
  if (name.includes('電影') || name.includes('影片')) return Film;
  if (name.includes('音樂') || name.includes('演唱會')) return Music;
  if (name.includes('遊戲')) return Gamepad2;
  if (name.includes('運動') || name.includes('健身') || name.includes('gym')) return Dumbbell;
  if (name.includes('電視') || name.includes('netflix') || name.includes('訂閱')) return Tv;
  
  // 通訊相關
  if (name.includes('通訊') || name.includes('電話') || name.includes('手機')) return Smartphone;
  if (name.includes('網路') || name.includes('wifi') || name.includes('寬頻')) return Wifi;
  
  // 教育相關
  if (name.includes('教育') || name.includes('學') || name.includes('課')) return BookOpen;
  if (name.includes('學費') || name.includes('補習')) return GraduationCap;
  if (name.includes('書')) return BookOpen;
  
  // 醫療相關
  if (name.includes('醫療') || name.includes('醫') || name.includes('健康') || name.includes('藥')) return Heart;
  
  // 家庭相關
  if (name.includes('家庭') || name.includes('家人') || name.includes('親子')) return Users;
  if (name.includes('小孩') || name.includes('嬰兒') || name.includes('寶寶')) return Baby;
  if (name.includes('寵物') || name.includes('貓') || name.includes('狗')) return PawPrint;
  
  // 工作相關
  if (name.includes('工作') || name.includes('辦公')) return Briefcase;
  if (name.includes('薪') || name.includes('獎金') || name.includes('收入')) return Wallet;
  
  // 金融相關
  if (name.includes('投資') || name.includes('股票') || name.includes('基金')) return TrendingUp;
  if (name.includes('儲蓄') || name.includes('存錢')) return PiggyBank;
  if (name.includes('信用卡') || name.includes('刷卡')) return CreditCard;
  if (name.includes('現金') || name.includes('提款')) return Banknote;
  if (name.includes('帳單') || name.includes('繳費')) return Receipt;
  if (name.includes('紅包') || name.includes('禮金')) return Gift;
  if (name.includes('稅') || name.includes('罰款')) return CircleDollarSign;
  
  // 其他
  if (name.includes('社交') || name.includes('聚會')) return Users;
  if (name.includes('旅遊') || name.includes('旅行') || name.includes('出國')) return Plane;
  if (name.includes('禮物') || name.includes('送禮')) return Gift;
  if (name.includes('雜費') || name.includes('其他')) return Tag;
  
  // 預設圖標
  return DollarSign;
};

export default function LedgerEntryDialog({ open, onOpenChange, entry }: LedgerEntryDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  
  // 獲取當前月份的預算和類別
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data: budget } = useBudget(currentMonth);
  const { data: budgetCategories } = useBudgetCategories(budget?.id);
  
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!entry;

  // 合併用戶自定義類別和預設類別
  const allCategories = useMemo(() => {
    const userCategories = budgetCategories?.map(cat => ({
      name: cat.name,
      icon: getIconForCategory(cat.name), // 智能匹配圖標
      color: cat.color.replace('hsl(var(--', 'bg-').replace('))', ''),
      isUserDefined: true
    })) || [];

    // 預設類別
    const defaultCategories = categories.map(cat => ({
      ...cat,
      isUserDefined: false
    }));

    // 用戶自定義類別排在前面，並過濾掉重複的
    const userCategoryNames = new Set(userCategories.map(c => c.name));
    const filteredDefaults = defaultCategories.filter(c => !userCategoryNames.has(c.name));
    
    return [...userCategories, ...filteredDefaults];
  }, [budgetCategories]);

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
              {allCategories.map((cat) => (
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
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", cat.color)}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs">{cat.name}</span>
                </button>
              ))}
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
    </Dialog>
  );
}
