import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useCreateBudgetCategory, useUpdateBudgetCategory, useDeleteBudgetCategory } from "@/hooks/useBudgetCategories";
import type { BudgetCategory } from "@shared/schema";

interface BudgetAllocationSliderProps {
  title?: string;
  totalAmount: number;
  budgetId?: string;
  categories: BudgetCategory[];
  allocationField: "percentage" | "extraPercentage";
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function BudgetAllocationSlider({
  title = "預算分配",
  totalAmount,
  budgetId,
  categories,
  allocationField,
}: BudgetAllocationSliderProps) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createCategory = useCreateBudgetCategory();
  const updateCategory = useUpdateBudgetCategory();
  const deleteCategory = useDeleteBudgetCategory();

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleSliderChange = async (id: string, value: number[]) => {
    const newValue = value[0];
    
    // Update local state immediately
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === id
          ? { ...cat, [allocationField]: newValue }
          : cat
      )
    );

    // Update server
    await updateCategory.mutateAsync({
      id,
      data: { [allocationField]: newValue },
    });
  };

  const handleAddCategory = async () => {
    if (!budgetId || !newCategoryName.trim()) return;

    const colorIndex = categories.length % chartColors.length;
    await createCategory.mutateAsync({
      budgetId,
      data: {
        name: newCategoryName,
        percentage: 0,
        extraPercentage: 0,
        color: chartColors[colorIndex],
      },
    });

    setNewCategoryName("");
    setDialogOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id);
  };

  const total = localCategories.reduce(
    (sum, cat) => sum + (cat[allocationField] || 0),
    0
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            可分配金額: NT$ {totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`text-lg font-bold ${
              total > 100 ? "text-destructive" : "text-primary"
            }`}
          >
            {total}%
          </div>
          {budgetId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-1" />
                  新增類別
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增分配類別</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">類別名稱</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="例如：投資、娛樂、儲蓄"
                      data-testid="input-category-name"
                    />
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    className="w-full"
                    disabled={!newCategoryName.trim()}
                    data-testid="button-submit-category"
                  >
                    新增
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {localCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">尚未建立分配類別</p>
          {budgetId && (
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              新增第一個類別
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {localCategories.map((category) => {
            const percentage = category[allocationField] || 0;
            return (
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
                      {percentage}%
                    </span>
                    <span className="text-sm text-muted-foreground w-24 text-right">
                      NT$ {((totalAmount * percentage) / 100).toLocaleString()}
                    </span>
                    {budgetId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        data-testid={`button-delete-${category.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <Slider
                  value={[percentage]}
                  onValueChange={(value) => handleSliderChange(category.id, value)}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid={`slider-${category.name}`}
                  disabled={!budgetId}
                />
              </div>
            );
          })}
        </div>
      )}

      {total !== 100 && localCategories.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {total < 100 ? `還有 ${100 - total}% 未分配` : `超出 ${total - 100}%`}
        </p>
      )}
    </Card>
  );
}
