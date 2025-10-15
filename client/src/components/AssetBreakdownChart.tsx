import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface AssetBreakdownChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
}

export default function AssetBreakdownChart({ data }: AssetBreakdownChartProps) {
  const chartData = data || [];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">資產類別佔比</h3>
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">尚未新增任何資產</p>
          <p className="text-sm text-muted-foreground mt-2">請前往帳戶管理新增帳戶</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => [
                  `NT$ ${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                  "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4" data-testid={`asset-${item.name}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
