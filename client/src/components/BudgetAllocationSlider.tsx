import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

interface BudgetAllocationSliderProps {
  totalAmount?: number;
  categories?: Category[];
}

export default function BudgetAllocationSlider({
  totalAmount = 30000,
  categories: initialCategories,
}: BudgetAllocationSliderProps) {
  //todo: remove mock functionality
  const defaultCategories: Category[] = [
    { id: "1", name: "投資", percentage: 40, color: "hsl(var(--chart-1))" },
    { id: "2", name: "娛樂", percentage: 20, color: "hsl(var(--chart-2))" },
    { id: "3", name: "儲蓄", percentage: 25, color: "hsl(var(--chart-3))" },
    { id: "4", name: "社交", percentage: 15, color: "hsl(var(--chart-4))" },
  ];

  const [categories, setCategories] = useState<Category[]>(
    initialCategories || defaultCategories
  );

  const handleSliderChange = (id: string, value: number[]) => {
    const newValue = value[0];
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, percentage: newValue } : cat))
    );
  };

  const total = categories.reduce((sum, cat) => sum + cat.percentage, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">預算分配</h3>
          <p className="text-sm text-muted-foreground">
            可支配金額: NT$ {totalAmount.toLocaleString()}
          </p>
        </div>
        <div className={`text-lg font-bold ${total > 100 ? "text-destructive" : "text-primary"}`}>
          {total}%
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16 text-right">
                  {category.percentage}%
                </span>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  NT$ {((totalAmount * category.percentage) / 100).toLocaleString()}
                </span>
              </div>
            </div>
            <Slider
              value={[category.percentage]}
              onValueChange={(value) => handleSliderChange(category.id, value)}
              max={100}
              step={5}
              className="w-full"
              data-testid={`slider-${category.name}`}
            />
          </div>
        ))}
      </div>

      {total !== 100 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {total < 100 ? `還有 ${100 - total}% 未分配` : `超出 ${total - 100}%`}
        </p>
      )}
    </Card>
  );
}
