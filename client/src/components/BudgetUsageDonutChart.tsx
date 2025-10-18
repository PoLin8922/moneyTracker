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

  // 底層數據：顯示所有類別的預算（完整圓餅圖）
  const budgetData = data.map(item => ({
    name: item.name,
    value: item.budgeted,
    color: item.color,
    budgeted: item.budgeted,
    used: item.used,
  }));

  // 上層數據：顯示每個類別已使用的部分
  // 我們需要將每個類別拆分成「已使用」和「未使用」兩部分
  const usageData: any[] = [];
  data.forEach((item) => {
    const usagePercentage = item.budgeted > 0 ? (item.used / item.budgeted) : 0;
    const usedValue = Math.min(item.used, item.budgeted); // 已使用（不超過預算）
    const unusedValue = Math.max(0, item.budgeted - item.used); // 未使用
    
    // 添加已使用部分（實心）
    if (usedValue > 0) {
      usageData.push({
        name: `${item.name}-已用`,
        value: usedValue,
        color: item.color,
        opacity: 1,
        categoryName: item.name,
        budgeted: item.budgeted,
        used: item.used,
      });
    }
    
    // 添加未使用部分（透明）
    if (unusedValue > 0) {
      usageData.push({
        name: `${item.name}-未用`,
        value: unusedValue,
        color: item.color,
        opacity: 0,
        categoryName: item.name,
        budgeted: item.budgeted,
        used: item.used,
      });
    }
  });

  // 計算總預算和總使用
  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalUsed = data.reduce((sum, item) => sum + item.used, 0);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (data.budgeted !== undefined && data.used !== undefined) {
        const percentage = data.budgeted > 0 
          ? ((data.used / data.budgeted) * 100).toFixed(1)
          : 0;
        
        return (
          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
            <p className="font-semibold mb-2">{data.categoryName || data.name}</p>
            <p className="text-sm">
              預算：<span className="font-medium">NT$ {data.budgeted.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              已用：<span className="font-medium">NT$ {data.used.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              使用率：<span className="font-medium">{percentage}%</span>
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // 自定義 Legend
  const CustomLegend = () => {
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
          {/* 底層：顯示所有類別的預算總額（淺色） */}
          <Pie
            data={budgetData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            paddingAngle={1}
          >
            {budgetData.map((entry, index) => (
              <Cell 
                key={`budget-${index}`} 
                fill={entry.color}
                opacity={0.25}
              />
            ))}
          </Pie>

          {/* 上層：顯示每個類別已使用的部分（飽和色填滿） */}
          <Pie
            data={usageData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            paddingAngle={1}
          >
            {usageData.map((entry, index) => (
              <Cell 
                key={`usage-${index}`} 
                fill={entry.color}
                opacity={entry.opacity}
                stroke={entry.opacity > 0 ? entry.color : "transparent"}
                strokeWidth={entry.opacity > 0 ? 1 : 0}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
