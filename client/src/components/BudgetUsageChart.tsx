import { Card } from "@/components/ui/card";

interface CategoryUsage {
  name: string;
  budgeted: number;
  used: number;
  color: string;
}

interface BudgetUsageChartProps {
  categories: CategoryUsage[];
}

export default function BudgetUsageChart({ categories }: BudgetUsageChartProps) {
  if (categories.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground py-8">
          尚無預算分配資料
        </p>
      </Card>
    );
  }

  const maxBudget = Math.max(...categories.map(c => c.budgeted), 1);

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-4">各類別預算使用狀況</h3>
      <div className="space-y-4">
        {categories.map((category) => {
          const budgetPercentage = (category.budgeted / maxBudget) * 100;
          const usedPercentage = category.budgeted > 0 
            ? (category.used / category.budgeted) * 100 
            : 0;
          const isOverBudget = usedPercentage > 100;

          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-sm">
                  <span className={`font-bold ${isOverBudget ? 'text-destructive' : ''}`}>
                    NT$ {category.used.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground"> / {category.budgeted.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative h-8 bg-muted/30 rounded-md overflow-hidden border border-border/50">
                {/* 底層：預算總額（淡色背景） */}
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${budgetPercentage}%`,
                    backgroundColor: category.color,
                    opacity: 0.15,
                  }}
                />
                {/* 上層：已使用金額（強烈飽和色 + 漸變） */}
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min((budgetPercentage * usedPercentage) / 100, 100)}%`,
                    background: isOverBudget 
                      ? `linear-gradient(90deg, ${category.color} 0%, hsl(var(--destructive)) 100%)`
                      : `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                    boxShadow: `inset 0 1px 2px rgba(0, 0, 0, 0.1)`,
                  }}
                />
                {/* 超支警示條 */}
                {isOverBudget && (
                  <div
                    className="absolute top-0 h-full transition-all duration-300 border-r-2 border-destructive"
                    style={{
                      left: `${budgetPercentage}%`,
                      width: '2px',
                    }}
                  />
                )}
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-semibold text-foreground drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                    {usedPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
