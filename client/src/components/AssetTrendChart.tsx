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
    if (!historyData || historyData.length === 0) {
      // If no history, show current value only
      if (currentNetWorth > 0) {
        const today = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
        return [{ date: today, value: currentNetWorth }];
      }
      return [];
    }

    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case "MAX":
        startDate = new Date(0); // Beginning of time
        break;
    }

    const filtered = historyData
      .filter(item => new Date(item.recordedAt) >= startDate)
      .map(item => ({
        date: new Date(item.recordedAt).toLocaleDateString('zh-TW', { 
          month: 'numeric', 
          day: 'numeric' 
        }),
        value: parseFloat(item.totalNetWorth),
      }));

    // Add current value if it's different from the latest history
    if (currentNetWorth > 0) {
      const today = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
      const latest = filtered[filtered.length - 1];
      if (!latest || latest.value !== currentNetWorth) {
        filtered.push({ date: today, value: currentNetWorth });
      }
    }

    return filtered;
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
