import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { queryClient } from "@/lib/queryClient";
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
  Plane
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function LedgerEntryDialog({ open, onOpenChange }: LedgerEntryDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setType("expense");
      setDate(new Date().toISOString().split('T')[0]);
      setAmount("");
      setAccountId("");
      setCategory("");
      setNote("");
    }
  }, [open]);

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
      
      // Create ledger entry
      const ledgerResponse = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          category,
          accountId,
          date,
          note,
        }),
      });

      if (!ledgerResponse.ok) {
        throw new Error("Failed to create ledger entry");
      }

      // Update account balance
      const account = accounts?.find(a => a.id === accountId);
      if (account) {
        const currentBalance = parseFloat(account.balance);
        const changeAmount = parseFloat(amount);
        const newBalance = type === "income" 
          ? currentBalance + changeAmount 
          : currentBalance - changeAmount;

        const updateResponse = await fetch(`/api/assets/${accountId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: account.type,
            accountName: account.accountName,
            note: account.note,
            balance: newBalance.toString(),
            currency: account.currency,
            exchangeRate: account.exchangeRate,
            includeInTotal: account.includeInTotal,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update account balance");
        }
      }

      toast({
        title: "記帳成功",
        description: "交易已記錄並更新帳戶餘額",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "記帳失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>記一筆</DialogTitle>
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
              {categories.map((cat) => (
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

          <div className="flex gap-2 justify-end pt-4">
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
              {isSubmitting ? "處理中..." : "確認"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
