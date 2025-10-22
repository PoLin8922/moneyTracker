import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DatePicker from "@/components/DatePicker";
import { TrendingUp, TrendingDown } from "lucide-react";

interface InvestmentTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvestmentTransactionDialog({ 
  open, 
  onOpenChange 
}: InvestmentTransactionDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();

  const [type, setType] = useState<"buy" | "sell">("buy");
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [fees, setFees] = useState("0");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [brokerAccountId, setBrokerAccountId] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 付款帳戶：排除投資類帳戶（台股、美股、加密貨幣），其他都可用於付款
  const paymentAccounts = accounts?.filter(acc => 
    acc.type !== "台股" && acc.type !== "美股" && acc.type !== "加密貨幣"
  ) || [];

  // 券商帳戶：只包含投資類帳戶
  const brokerAccounts = accounts?.filter(acc => 
    acc.type === "台股" || acc.type === "美股" || acc.type === "加密貨幣"
  ) || [];

  // 計算總金額
  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(pricePerShare) || 0;
    const fee = parseFloat(fees) || 0;
    const subtotal = qty * price;
    return type === "buy" ? subtotal + fee : subtotal - fee;
  };

  const total = calculateTotal();

  useEffect(() => {
    if (open) {
      // 重置表單
      setType("buy");
      setTicker("");
      setName("");
      setQuantity("");
      setPricePerShare("");
      setFees("0");
      setPaymentAccountId("");
      setBrokerAccountId("");
      setTransactionDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker || !name || !quantity || !pricePerShare || !paymentAccountId || !brokerAccountId) {
      toast({
        title: "請填寫所有必填欄位",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 創建投資交易
      await apiRequest("POST", "/api/investments/transactions", {
        type,
        ticker,
        name,
        quantity,
        pricePerShare,
        fees,
        paymentAccountId,
        brokerAccountId,
        transactionDate,
      });

      toast({
        title: type === "buy" ? "買入成功" : "賣出成功",
        description: `${name} (${ticker}) ${quantity} 股已記錄`,
      });

      console.log('🔄 開始刷新查詢...');
      
      // 先關閉對話框
      onOpenChange(false);
      
      // 等待 100ms 讓對話框關閉動畫完成，確保投資頁面已顯示
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 強制重新獲取持倉（不只是標記為無效）
      console.log('🔄 強制重新獲取持倉...');
      await queryClient.refetchQueries({ 
        queryKey: ["/api/investments/holdings"],
        type: 'active' // 只刷新活動的查詢
      });
      console.log('✅ 持倉查詢已重新獲取');
      
      // 刷新其他相關查詢
      await queryClient.invalidateQueries({ queryKey: ["/api/investments/transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/ledger/entries"] });
      console.log('✅ 所有相關查詢已刷新');
    } catch (error) {
      toast({
        title: "交易失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增投資交易</DialogTitle>
          <DialogDescription>
            記錄股票、ETF 或加密貨幣的買入或賣出交易
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 交易類型 */}
          <div className="space-y-2">
            <Label>交易類型 *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "buy" ? "default" : "outline"}
                onClick={() => setType("buy")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                買入
              </Button>
              <Button
                type="button"
                variant={type === "sell" ? "default" : "outline"}
                onClick={() => setType("sell")}
                className="flex items-center gap-2"
              >
                <TrendingDown className="w-4 h-4" />
                賣出
              </Button>
            </div>
          </div>

          {/* 標的資訊 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">股票代號 *</Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="例如: 2330, AAPL, BTC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">標的名稱 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 台積電, Apple, Bitcoin"
              />
            </div>
          </div>

          {/* 數量和價格 */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">數量 *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">每股價格 *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fees">手續費</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* 帳戶選擇 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-account">付款帳戶 *</Label>
              <select
                id="payment-account"
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">選擇付款帳戶</option>
                {paymentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} - {account.accountName} 
                    ({account.currency} {parseFloat(account.balance).toLocaleString()})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {type === "buy" ? "從此帳戶扣款" : "入帳到此帳戶"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker-account">券商帳戶 *</Label>
              <select
                id="broker-account"
                value={brokerAccountId}
                onChange={(e) => setBrokerAccountId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">選擇券商帳戶</option>
                {brokerAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} - {account.accountName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {type === "buy" ? "股票存入此帳戶" : "從此帳戶賣出"}
              </p>
            </div>
          </div>

          {/* 交易日期 */}
          <div className="space-y-2">
            <Label>交易日期 *</Label>
            <DatePicker value={transactionDate} onChange={setTransactionDate} />
          </div>

          {/* 總金額顯示 */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {type === "buy" ? "總支出" : "總收入"}
              </span>
              <span className="text-2xl font-bold">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {parseFloat(fees) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {type === "buy" 
                  ? `含手續費 $${parseFloat(fees).toLocaleString()}`
                  : `扣除手續費 $${parseFloat(fees).toLocaleString()}`
                }
              </p>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "處理中..." : type === "buy" ? "確認買入" : "確認賣出"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
