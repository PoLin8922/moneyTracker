import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LedgerEntry, AssetAccount } from "@shared/schema";

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

interface AssetTrendChartProps {
  currentNetWorth?: number;
}

export default function AssetTrendChart({ currentNetWorth = 0 }: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  const { data: historyData } = useQuery<Array<{ totalNetWorth: string; recordedAt: string }>>({
    queryKey: ["/api/asset-history"],
  });

  // 獲取帳本記錄用於計算歷史資產
  const { data: ledgerEntries } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/ledger"],
  });

  // 獲取帳戶資料
  const { data: accounts } = useQuery<AssetAccount[]>({
    queryKey: ["/api/assets"],
  });

  const chartData = useMemo(() => {
    const now = new Date();
    
    // 計算每日資產淨值（基於帳本記錄的累積變化）
    const calculateDailyNetWorth = (targetDate: Date): number => {
      if (!ledgerEntries || !accounts) return 0;
      
      // 如果是今天，直接返回當前淨值
      if (targetDate.toDateString() === now.toDateString()) {
        return currentNetWorth;
      }
      
      // 從帳本記錄計算該日期的資產變化
      // 邏輯：當前淨值 - 未來的交易影響
      let netWorth = currentNetWorth;
      
      ledgerEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        
        // 如果交易發生在目標日期之後，需要"反向"計算
        if (entryDate > targetDate) {
          const account = accounts.find(a => a.id === entry.accountId);
          let amount = parseFloat(entry.amount);
          
          // 換算成台幣
          if (account && account.currency !== "TWD") {
            amount = amount * parseFloat(account.exchangeRate || "1");
          }
          
          // 反向計算：減去未來的收入，加回未來的支出
          if (entry.type === "income") {
            netWorth -= amount;
          } else {
            netWorth += amount;
          }
        }
      });
      
      return Math.max(0, netWorth); // 避免負數
    };
    
    // 如果是 1M，按日呈現
    if (timeRange === "1M") {
      const days: { date: string; value: number }[] = [];
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 本月1日
      
      // 生成本月每一天
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const value = calculateDailyNetWorth(new Date(d));
        days.push({ date: dateStr, value });
      }
      
      return days;
    }
    
    // 3M 以上按月呈現
    const months: { date: string; value: number }[] = [];
    let monthCount = 0;
    
    switch (timeRange) {
      case "3M":
        monthCount = 3;
        break;
      case "6M":
        monthCount = 6;
        break;
      case "1Y":
        monthCount = 12;
        break;
      case "5Y":
        monthCount = 60;
        break;
      case "MAX":
        // 找出最早的交易記錄
        if (ledgerEntries && ledgerEntries.length > 0) {
          const earliest = new Date(ledgerEntries[ledgerEntries.length - 1].date);
          const diffMonths = (now.getFullYear() - earliest.getFullYear()) * 12 + 
                           (now.getMonth() - earliest.getMonth());
          monthCount = Math.max(diffMonths + 1, 3);
        } else {
          monthCount = 3;
        }
        break;
    }
    
    // 生成每個月的數據點（使用月底）
    for (let i = monthCount - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // 月底
      const useDate = monthEnd > now ? now : monthEnd; // 如果是本月，用今天
      const dateLabel = `${targetDate.getFullYear()}/${targetDate.getMonth() + 1}`;
      
      const value = calculateDailyNetWorth(useDate);
      
      months.push({ 
        date: timeRange === "1Y" || timeRange === "5Y" || timeRange === "MAX" 
          ? dateLabel 
          : `${targetDate.getMonth() + 1}月`, 
        value 
      });
    }
    
    return months;
  }, [ledgerEntries, accounts, timeRange, currentNetWorth]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">資產走勢</h3>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {(["1M", "3M", "6M", "1Y", "5Y", "MAX"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              data-testid={`button-${range}`}
              className="flex-shrink-0"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暫無資產歷史數據</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 10000).toFixed(0)}萬`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, "資產總額"]}
            />
            <Area type="monotone" dataKey="value" stroke="none" fill="url(#colorValue)" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
