import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

interface AssetTrendChartProps {
  data?: Array<{ date: string; value: number }>;
}

export default function AssetTrendChart({ data }: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  //todo: remove mock functionality
  const mockData = {
    "1M": [
      { date: "10/01", value: 520000 },
      { date: "10/05", value: 535000 },
      { date: "10/10", value: 548000 },
      { date: "10/15", value: 555000 },
      { date: "10/20", value: 570000 },
      { date: "10/25", value: 575000 },
      { date: "10/30", value: 580000 },
    ],
    "3M": [
      { date: "8月", value: 480000 },
      { date: "9月", value: 520000 },
      { date: "10月", value: 580000 },
    ],
    "6M": [
      { date: "5月", value: 420000 },
      { date: "6月", value: 445000 },
      { date: "7月", value: 460000 },
      { date: "8月", value: 480000 },
      { date: "9月", value: 520000 },
      { date: "10月", value: 580000 },
    ],
    "1Y": [
      { date: "1月", value: 350000 },
      { date: "3月", value: 380000 },
      { date: "5月", value: 420000 },
      { date: "7月", value: 460000 },
      { date: "9月", value: 520000 },
      { date: "10月", value: 580000 },
    ],
    "5Y": [
      { date: "2020", value: 200000 },
      { date: "2021", value: 280000 },
      { date: "2022", value: 350000 },
      { date: "2023", value: 450000 },
      { date: "2024", value: 580000 },
    ],
    "MAX": [
      { date: "2018", value: 100000 },
      { date: "2019", value: 150000 },
      { date: "2020", value: 200000 },
      { date: "2021", value: 280000 },
      { date: "2022", value: 350000 },
      { date: "2023", value: 450000 },
      { date: "2024", value: 580000 },
    ],
  };

  const chartData = data || mockData[timeRange];

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
