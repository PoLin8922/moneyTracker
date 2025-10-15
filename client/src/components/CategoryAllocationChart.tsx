import { Card } from "@/components/ui/card";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface CategoryAllocationChartProps {
  categories: CategoryData[];
}

export default function CategoryAllocationChart({ categories }: CategoryAllocationChartProps) {
  // 按金額大到小排序
  const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount);
  
  const maxAmount = Math.max(...categories.map(c => c.amount), 1);

  if (categories.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">本月各類別可支配金額</h3>
        <p className="text-center text-muted-foreground py-8">
          尚未設定分配類別
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">本月各類別可支配金額</h3>
      <div className="space-y-4">
        {sortedCategories.map((category) => {
          const percentage = (category.amount / maxAmount) * 100;
          
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
                <span className="text-sm font-bold">
                  NT$ {category.amount.toLocaleString()}
                </span>
              </div>
              <div className="relative h-8 bg-muted/50 rounded-md overflow-hidden border border-border">
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-foreground">
                    {category.amount > 0 ? `${((category.amount / sortedCategories.reduce((sum, c) => sum + c.amount, 0)) * 100).toFixed(1)}%` : '0%'}
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
