import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  budgeted: number;
  used: number;
  color: string;
}

interface BudgetUsageDonutChartProps {
  data: CategoryData[];
  totalDisposable: number;
}

export default function BudgetUsageDonutChart({ data, totalDisposable }: BudgetUsageDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">各類預算使用狀況</h3>
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">尚無預算分配</p>
        </div>
      </Card>
    );
  }

  // 準備外環數據（總預算）
  const outerData = data.map(item => ({
    name: item.name,
    value: item.budgeted,
    color: item.color,
  }));

  // 準備內環數據（已使用）
  const innerData = data.map(item => ({
    name: item.name,
    value: item.used,
    color: item.color,
  }));

  // 計算總預算和總使用
  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalUsed = data.reduce((sum, item) => sum + item.used, 0);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryData = payload[0].payload.categoryData;
      
      if (categoryData) {
        const percentage = categoryData.budgeted > 0 
          ? ((categoryData.used / categoryData.budgeted) * 100).toFixed(1)
          : 0;
        
        return (
          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
            <p className="font-semibold mb-2">{categoryData.name}</p>
            <p className="text-sm">
              預算：<span className="font-medium">NT$ {categoryData.budgeted.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              已用：<span className="font-medium">NT$ {categoryData.used.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              使用率：<span className="font-medium">{percentage}%</span>
            </p>
          </div>
        );
      }
      
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm">NT$ {data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // 自定義 Legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {data.map((item, index) => {
          const percentage = item.budgeted > 0 
            ? ((item.used / item.budgeted) * 100).toFixed(0)
            : 0;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs">
                {item.name} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">各類預算使用狀況</h3>
      
      <div className="mb-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">總預算</p>
          <p className="text-xl font-bold text-primary">
            NT$ {totalBudgeted.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">已使用</p>
          <p className="text-xl font-bold text-destructive">
            NT$ {totalUsed.toLocaleString()}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          {/* 外環：總預算（半透明） */}
          <Pie
            data={outerData.map((item, index) => ({
              ...item,
              categoryData: data[index],
            }))}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
          >
            {outerData.map((entry, index) => (
              <Cell 
                key={`outer-${index}`} 
                fill={entry.color}
                opacity={0.3}
              />
            ))}
          </Pie>

          {/* 內環：已使用（實心） */}
          <Pie
            data={innerData.map((item, index) => ({
              ...item,
              categoryData: data[index],
            }))}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
          >
            {innerData.map((entry, index) => (
              <Cell 
                key={`inner-${index}`} 
                fill={entry.color}
                opacity={1}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>外環（淺色）= 可用預算｜內環（深色）= 已使用</p>
      </div>
    </Card>
  );
}
