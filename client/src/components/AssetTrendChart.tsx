import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

interface AssetTrendChartProps {
  currentNetWorth?: number;
}

export default function AssetTrendChart({ currentNetWorth = 0 }: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  const { data: historyData } = useQuery<Array<{ totalNetWorth: string; recordedAt: string }>>({
    queryKey: ["/api/asset-history"],
  });

  const chartData = useMemo(() => {
    const now = new Date();
    
    // 如果是 1M，按日呈現
    if (timeRange === "1M") {
      const days: { date: string; value: number }[] = [];
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 本月1日
      
      // 生成本月每一天
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        
        // 找出該日或之前最近的歷史記錄
        let value = 0;
        if (historyData) {
          const relevantHistory = historyData
            .filter(h => new Date(h.recordedAt) <= d)
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
          
          if (relevantHistory.length > 0) {
            value = parseFloat(relevantHistory[0].totalNetWorth);
          }
        }
        
        // 如果是今天，使用當前淨值
        if (d.toDateString() === now.toDateString()) {
          value = currentNetWorth;
        }
        
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
        // 找出最早的歷史記錄
        if (historyData && historyData.length > 0) {
          const earliest = new Date(historyData[0].recordedAt);
          const diffMonths = (now.getFullYear() - earliest.getFullYear()) * 12 + 
                           (now.getMonth() - earliest.getMonth());
          monthCount = Math.max(diffMonths + 1, 3);
        } else {
          monthCount = 3;
        }
        break;
    }
    
    // 生成每個月的數據點
    for (let i = monthCount - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // 月底
      const dateLabel = `${targetDate.getFullYear()}/${targetDate.getMonth() + 1}`;
      
      let value = 0;
      
      if (historyData) {
        // 找出該月底或之前最近的歷史記錄
        const relevantHistory = historyData
          .filter(h => {
            const recordDate = new Date(h.recordedAt);
            return recordDate <= monthEnd;
          })
          .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        
        if (relevantHistory.length > 0) {
          value = parseFloat(relevantHistory[0].totalNetWorth);
        }
      }
      
      // 如果是本月，使用當前淨值
      if (targetDate.getFullYear() === now.getFullYear() && 
          targetDate.getMonth() === now.getMonth()) {
        value = currentNetWorth;
      }
      
      months.push({ 
        date: timeRange === "1Y" || timeRange === "5Y" || timeRange === "MAX" 
          ? dateLabel 
          : `${targetDate.getMonth() + 1}月`, 
        value 
      });
    }
    
    return months;
  }, [historyData, timeRange, currentNetWorth]);

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
