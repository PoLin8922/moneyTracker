import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TimeRange = "month" | "quarter" | "year";

interface AssetTrendChartProps {
  data?: Array<{ date: string; value: number }>;
}

export default function AssetTrendChart({ data }: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  //todo: remove mock functionality
  const mockData = {
    month: [
      { date: "10/01", value: 520000 },
      { date: "10/05", value: 535000 },
      { date: "10/10", value: 548000 },
      { date: "10/15", value: 555000 },
      { date: "10/20", value: 570000 },
      { date: "10/25", value: 575000 },
      { date: "10/30", value: 580000 },
    ],
    quarter: [
      { date: "8月", value: 480000 },
      { date: "9月", value: 520000 },
      { date: "10月", value: 580000 },
    ],
    year: [
      { date: "1月", value: 350000 },
      { date: "3月", value: 380000 },
      { date: "5月", value: 420000 },
      { date: "7月", value: 460000 },
      { date: "9月", value: 520000 },
      { date: "10月", value: 580000 },
    ],
  };

  const chartData = data || mockData[timeRange];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">資產走勢</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "outline"}
            onClick={() => setTimeRange("month")}
            data-testid="button-month"
          >
            月
          </Button>
          <Button
            size="sm"
            variant={timeRange === "quarter" ? "default" : "outline"}
            onClick={() => setTimeRange("quarter")}
            data-testid="button-quarter"
          >
            季
          </Button>
          <Button
            size="sm"
            variant={timeRange === "year" ? "default" : "outline"}
            onClick={() => setTimeRange("year")}
            data-testid="button-year"
          >
            年
          </Button>
        </div>
      </div>
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
    </Card>
  );
}
