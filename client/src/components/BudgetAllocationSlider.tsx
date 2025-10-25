import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCreateBudgetCategory, useUpdateBudgetCategory, useDeleteBudgetCategory } from "@/hooks/useBudgetCategories";
import { useSavingsJarCategories } from "@/hooks/useSavingsJarCategories";
import { assignCategoryColor } from "@/lib/categoryColors";
import { getIconByName } from "@/lib/categoryIcons";
import IconSelector from "@/components/IconSelector";
import type { BudgetCategory } from "@shared/schema";

interface BudgetAllocationSliderProps {
  title?: string;
  totalAmount: number;
  budgetId?: string;
  categories: BudgetCategory[];
  type: "fixed" | "extra";
}

export default function BudgetAllocationSlider({
  title = "預算分配",
  totalAmount,
  budgetId,
  categories,
  type,
}: BudgetAllocationSliderProps) {
  const [localCategories, setLocalCategories] = useState(
    categories.filter(c => c.type === type)
  );
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

  const createCategory = useCreateBudgetCategory();
  const updateCategory = useUpdateBudgetCategory();
  const deleteCategory = useDeleteBudgetCategory();
  
  // 獲取所有存錢罐類別以避免顏色重複
  const { data: savingsJarCategories } = useSavingsJarCategories();

  useEffect(() => {
    setLocalCategories(categories.filter(c => c.type === type));
  }, [categories, type]);

  const handleSliderChange = (id: string, value: number[]) => {
    const newValue = value[0];
    
    // Update local state immediately (不排序)
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, percentage: newValue } : cat
      )
    );
  };

  const handleSliderCommit = async (id: string, value: number[]) => {
    const newValue = value[0];
    
    // Update server when user finishes dragging
    await updateCategory.mutateAsync({
      id,
      data: { percentage: newValue },
    });
  };

  const handleAddCategory = async (categoryName: string, iconName: string) => {
    if (!budgetId || !categoryName.trim()) return;

    // 使用統一的顏色管理系統分配顏色
    const color = assignCategoryColor(
      categoryName,
      categories,
      savingsJarCategories || []
    );

    await createCategory.mutateAsync({
      budgetId,
      data: {
        name: categoryName,
        type,
        percentage: 0,
        color,
        iconName,
      },
    });

    setIconSelectorOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id);
  };

  const total = localCategories.reduce(
    (sum, cat) => sum + (cat.percentage || 0),
    0
  );

  // 按百分比大到小排序（只在顯示時排序，不改變 localCategories）
  const sortedCategories = [...localCategories].sort((a, b) => {
    return (b.percentage || 0) - (a.percentage || 0);
  });

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
          <div className="text-right">
            <div
              className={`text-lg font-bold ${
                total > 100 ? "text-destructive" : "text-primary"
              }`}
            >
              {total}%
            </div>
            {/* 只要有可分配金額，就顯示未分配提醒 */}
            {totalAmount > 0 && total < 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                還有 {(100 - total).toFixed(0)}% 未分配
              </p>
            )}
          </div>
          {budgetId && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIconSelectorOpen(true)}
              data-testid={`button-add-category-${type}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增類別
            </Button>
          )}
        </div>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">尚未建立分配類別</p>
          {budgetId && (
            <Button variant="outline" onClick={() => setIconSelectorOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              新增第一個類別
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category) => {
            const percentage = category.percentage || 0;
            const Icon = getIconByName(category.iconName || "Wallet");
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ 
                        backgroundColor: category.color, 
                        opacity: 0.9,
                        borderRadius: '0.75rem' // 12px, 更明顯的圓角
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
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
                  onValueCommit={(value) => handleSliderCommit(category.id, value)}
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

      {total !== 100 && sortedCategories.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {total < 100 ? `還有 ${100 - total}% 未分配` : `超出 ${total - 100}%`}
        </p>
      )}

      {/* Icon Selector Dialog */}
      <IconSelector
        open={iconSelectorOpen}
        onOpenChange={setIconSelectorOpen}
        onSelect={handleAddCategory}
      />
    </Card>
  );
}
