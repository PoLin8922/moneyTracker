import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLedgerEntries } from "@/hooks/useLedger";
import { useAssets } from "@/hooks/useAssets";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface IncomeExpenseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  currentMonth: string;
}

export default function IncomeExpenseDetailDialog({
  open,
  onOpenChange,
  type,
  currentMonth,
}: IncomeExpenseDetailDialogProps) {
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "MAX">("3M");
  const { data: ledgerEntries } = useLedgerEntries();
  const { data: accounts } = useAssets();

  const trendData = useMemo(() => {
    if (!ledgerEntries || !accounts) return [];

    const now = new Date();
    const months: { month: string; amount: number }[] = [];
    
    const monthCount = 
      timeRange === "1M" ? 1 :
      timeRange === "3M" ? 3 :
      timeRange === "6M" ? 6 :
      timeRange === "1Y" ? 12 :
      24; // MAX

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTotal = ledgerEntries
        .filter(entry => {
          const entryDate = new Date(entry.date);
          // 基本篩選：類型和日期
          if (entry.type !== type) return false;
          if (entryDate.getFullYear() !== date.getFullYear()) return false;
          if (entryDate.getMonth() !== date.getMonth()) return false;
          
          // 排除轉帳
          if (entry.category === "轉帳") return false;
          
          // 排除股票買入/賣出的本金
          if (type === "income" && entry.category === "股票賣出") return false;
          if (type === "expense" && entry.category === "股票買入") return false;
          
          return true;
        })
        .reduce((sum, entry) => {
          const account = accounts.find(a => a.id === entry.accountId);
          // 換算成台幣
          let amountInTWD = account && account.currency !== "TWD"
            ? parseFloat(entry.amount) * parseFloat(account.exchangeRate || "1")
            : parseFloat(entry.amount);
          
          // 持倉增加/減少：只計算損益
          // 注意：這裡我們無法獲取 holdings 數據，所以暫時計入完整金額
          // TODO: 如果需要精確計算，需要傳入 holdings 數據
          
          return sum + amountInTWD;
        }, 0);

      months.push({
        month: `${date.getMonth() + 1}月`,
        amount: monthTotal,
      });
    }

    return months;
  }, [ledgerEntries, accounts, type, timeRange]);

  const currentMonthEntries = useMemo(() => {
    if (!ledgerEntries || !accounts) return [];

    const [year, month] = currentMonth.split('-');
    
    return ledgerEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        // 基本篩選：類型和日期
        if (entry.type !== type) return false;
        if (entryDate.getFullYear() !== parseInt(year)) return false;
        if (entryDate.getMonth() + 1 !== parseInt(month)) return false;
        
        // 排除轉帳
        if (entry.category === "轉帳") return false;
        
        // 排除股票買入/賣出的本金
        if (type === "income" && entry.category === "股票賣出") return false;
        if (type === "expense" && entry.category === "股票買入") return false;
        
        // 持倉增加/減少也排除（因為這裡無法計算損益，會造成混淆）
        if (entry.category === "持倉增加" || entry.category === "持倉減少") return false;
        
        return true;
      })
      .map(entry => {
        const account = accounts.find(a => a.id === entry.accountId);
        // 換算成台幣：如果帳戶幣別不是 TWD，則用匯率換算
        const amountInTWD = account && account.currency !== "TWD"
          ? parseFloat(entry.amount) * parseFloat(account.exchangeRate || "1")
          : parseFloat(entry.amount);
        
        return {
          date: new Date(entry.date).toLocaleDateString('zh-TW'),
          category: entry.category,
          amount: amountInTWD,
          originalAmount: parseFloat(entry.amount),
          currency: account?.currency || "TWD",
          account: account?.accountName || "未知帳戶",
          note: entry.note,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledgerEntries, accounts, currentMonth, type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type === "income" ? "收入" : "支出"}明細</DialogTitle>
        </DialogHeader>

        {/* 趨勢圖 */}
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            {(["1M", "3M", "6M", "1Y", "MAX"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                data-testid={`button-range-${range}`}
              >
                {range}
              </Button>
            ))}
          </div>

          <Card className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={type === "income" ? "hsl(var(--chart-3))" : "hsl(var(--destructive))"}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 本月明細 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">本月明細</h3>
            {currentMonthEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">本月無{type === "income" ? "收入" : "支出"}記錄</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {currentMonthEntries.map((entry, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{entry.category}</p>
                        <p className="text-sm text-muted-foreground">{entry.date} · {entry.account}</p>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {entry.currency !== "TWD" && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {type === "income" ? "+" : "-"}{entry.currency} {entry.originalAmount.toLocaleString()}
                          </p>
                        )}
                        <p className={`font-bold ${type === "income" ? "text-chart-3" : "text-destructive"}`}>
                          {type === "income" ? "+" : "-"}NT$ {entry.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
