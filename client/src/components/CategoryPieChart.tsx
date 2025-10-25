import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  title: string;
  data: CategoryData[];
  totalAmount: number;
}

export default function CategoryPieChart({ title, data, totalAmount }: CategoryPieChartProps) {
  if (data.length === 0 || totalAmount === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold mb-2">{title}</p>
        <div className="h-[360px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">無資料</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.value / totalAmount) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
            wrapperStyle={{ 
              fontSize: "12px",
              color: "hsl(var(--foreground))" // 使用主題前景色（深色模式為白色，淺色模式為黑色）
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
