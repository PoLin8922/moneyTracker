import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCreateSavingsJarCategory, useUpdateSavingsJarCategory, useDeleteSavingsJarCategory } from "@/hooks/useSavingsJarCategories";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useBudget } from "@/hooks/useBudget";
import { assignCategoryColor } from "@/lib/categoryColors";
import { getIconByName } from "@/lib/categoryIcons";
import IconSelector from "@/components/IconSelector";
import type { SavingsJarCategory } from "@shared/schema";

interface SavingsJarAllocationProps {
  totalAmount: number;
  jarId: string;
  categories: SavingsJarCategory[];
}

export default function SavingsJarAllocation({
  totalAmount,
  jarId,
  categories,
}: SavingsJarAllocationProps) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

  const createCategory = useCreateSavingsJarCategory();
  const updateCategory = useUpdateSavingsJarCategory();
  const deleteCategory = useDeleteSavingsJarCategory();
  
  // 獲取所有預算類別以避免顏色重複
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data: budget } = useBudget(currentMonth);
  const { data: budgetCategories } = useBudgetCategories(budget?.id);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleSliderChange = (id: string, value: number[]) => {
    const newValue = value[0];
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, percentage: newValue } : cat
      )
    );
  };

  const handleSliderCommit = async (id: string, value: number[]) => {
    const newValue = value[0];
    await updateCategory.mutateAsync({
      id,
      data: { percentage: newValue },
    });
  };

  const handleAddCategory = async (categoryName: string, iconName: string) => {
    if (!jarId || !categoryName.trim()) return;

    // 獲取所有存錢罐類別（用於跨存錢罐檢查）
    const allSavingsJarCategories = categories;
    
    // 使用統一的顏色管理系統分配顏色
    const color = assignCategoryColor(
      categoryName,
      budgetCategories || [],
      allSavingsJarCategories
    );

    await createCategory.mutateAsync({
      jarId,
      data: {
        name: categoryName.trim(),
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

  const totalPercentage = localCategories.reduce((sum, cat) => sum + cat.percentage, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">類別分配</h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setIconSelectorOpen(true)}
          data-testid="button-add-jar-category"
        >
          <Plus className="w-4 h-4 mr-1" />
          新增類別
        </Button>
      </div>

      {localCategories.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">尚無分配類別</p>
      ) : (
        <div className="space-y-6">
          {localCategories
            .sort((a, b) => b.percentage - a.percentage)
            .map((category) => {
              const amount = (totalAmount * category.percentage) / 100;
              const Icon = getIconByName(category.iconName || "PiggyBank");
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color, opacity: 0.9 }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        NT$ {amount.toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        data-testid={`button-delete-jar-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[category.percentage]}
                      onValueChange={(value) => handleSliderChange(category.id, value)}
                      onValueCommit={(value) => handleSliderCommit(category.id, value)}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid={`slider-jar-${category.id}`}
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">總計</span>
              <span className={`font-semibold ${totalPercentage > 100 ? 'text-destructive' : ''}`}>
                {totalPercentage}%
              </span>
            </div>
          </div>
        </div>
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
