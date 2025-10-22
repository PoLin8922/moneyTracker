import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getIconByName } from "@/lib/categoryIcons";

interface CategoryData {
  name: string;
  budgeted: number;
  used: number;
  color: string;
  iconName?: string;
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
        <div className="flex items-center justify-center h-[240px]">
          <p className="text-muted-foreground">尚無預算分配</p>
        </div>
      </Card>
    );
  }

  // 按預算金額排序（從大到小）
  const sortedData = [...data].sort((a, b) => b.budgeted - a.budgeted);

  // 計算總預算和總使用
  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalUsed = data.reduce((sum, item) => sum + item.used, 0);
  const totalPercentage = totalBudgeted > 0 ? (totalUsed / totalBudgeted) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 標題和總覽 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">各類預算使用狀況</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${totalUsed.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / ${totalBudgeted.toLocaleString()}
            </span>
            <span className="text-sm font-medium ml-2" style={{ 
              color: totalPercentage > 100 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))' 
            }}>
              ({totalPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* 各類別橫條圖 */}
        <div className="space-y-4">
          {sortedData.map((item, index) => {
            const percentage = item.budgeted > 0 ? (item.used / item.budgeted) * 100 : 0;
            const isOverBudget = percentage > 100;
            const Icon = getIconByName(item.iconName || "Wallet");
            
            return (
              <div key={index} className="space-y-2">
                {/* 類別名稱和金額 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: item.color, opacity: 0.9 }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      ${item.used.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      / ${item.budgeted.toLocaleString()}
                    </span>
                    <span 
                      className="font-medium w-12 text-right"
                      style={{ 
                        color: isOverBudget ? 'hsl(var(--destructive))' : item.color 
                      }}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* 堆疊橫條 */}
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  {/* 背景（總預算） */}
                  <div 
                    className="absolute inset-0 rounded-lg"
                    style={{ 
                      backgroundColor: item.color,
                      opacity: 0.15
                    }}
                  />
                  
                  {/* 已使用金額 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: item.color,
                      opacity: 0.9
                    }}
                  />
                  
                  {/* 超支部分（紅色警示） */}
                  {isOverBudget && (
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-lg"
                      style={{
                        width: `${Math.min(percentage - 100, 100)}%`,
                        backgroundColor: 'hsl(var(--destructive))',
                        opacity: 0.8,
                        marginLeft: '100%'
                      }}
                    />
                  )}

                  {/* 中間分隔線（預算線） */}
                  {percentage > 5 && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-background"
                      style={{ left: `${Math.min(percentage, 100)}%` }}
                    />
                  )}
                </div>

                {/* 剩餘金額提示 */}
                {!isOverBudget && item.budgeted - item.used > 0 && (
                  <div className="text-xs text-muted-foreground text-right">
                    剩餘 ${(item.budgeted - item.used).toLocaleString()}
                  </div>
                )}
                {isOverBudget && (
                  <div className="text-xs text-destructive text-right font-medium">
                    ⚠️ 超支 ${(item.used - item.budgeted).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部圖例說明 */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded" style={{ 
                background: 'linear-gradient(to right, hsl(var(--chart-1)) 0%, hsl(var(--chart-1)) 60%, hsl(var(--chart-1) / 0.15) 60%, hsl(var(--chart-1) / 0.15) 100%)'
              }} />
              <span>已使用 / 總預算</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 rounded bg-destructive/80" />
              <span>超支部分</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
