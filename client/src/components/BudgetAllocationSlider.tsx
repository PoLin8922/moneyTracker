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
  type: "fixed" | "extra";
}

const categoryColors = [
  "#F7F9F9", // Mist White
  "#E4F1F6", // Cloud Blue
  "#D9F2E6", // Mint Cream
  "#BEE3F8", // Sky Blue
  "#A8E6CF", // Pale Aqua
  "#C7CEEA", // Lavender Gray
  "#FDE2E4", // Blush Pink
  "#F6E7CB", // Sand Beige
];

// 生成同類型但不同的顏色（超過8種時使用）
const generateSimilarColor = (index: number) => {
  const baseIndex = index % 8;
  const baseColor = categoryColors[baseIndex];
  const variation = Math.floor(index / 8) * 15;
  
  // 將hex轉rgb並微調
  const hex = baseColor.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) - variation));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) - variation));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) - variation));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createCategory = useCreateBudgetCategory();
  const updateCategory = useUpdateBudgetCategory();
  const deleteCategory = useDeleteBudgetCategory();

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

  const handleAddCategory = async () => {
    if (!budgetId || !newCategoryName.trim()) return;

    // 檢查類別名稱是否在固定或額外分配中已存在
    const existingCategory = categories.find(c => c.name === newCategoryName);
    
    let color: string;
    
    if (existingCategory) {
      // 如果類別已存在，使用相同顏色
      color = existingCategory.color;
    } else {
      // 如果類別不存在，選擇新顏色（不與已有顏色重複）
      const usedColors = new Set(categories.map(c => c.color));
      
      // 先從8種基礎顏色中找未使用的
      let foundColor = categoryColors.find(c => !usedColors.has(c));
      
      if (!foundColor) {
        // 如果8種基礎顏色都用完了，生成新顏色直到找到未使用的
        let colorIndex = categories.length;
        do {
          foundColor = generateSimilarColor(colorIndex);
          colorIndex++;
        } while (usedColors.has(foundColor) && colorIndex < 100);
      }
      
      color = foundColor || categoryColors[0]; // 最後的保底顏色
    }

    await createCategory.mutateAsync({
      budgetId,
      data: {
        name: newCategoryName,
        type,
        percentage: 0,
        color,
      },
    });

    setNewCategoryName("");
    setDialogOpen(false);
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid={`button-add-category-${type}`}>
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
                      data-testid={`input-category-name-${type}`}
                    />
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    className="w-full"
                    disabled={!newCategoryName.trim()}
                    data-testid={`button-submit-category-${type}`}
                  >
                    新增
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {sortedCategories.length === 0 ? (
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
          {sortedCategories.map((category) => {
            const percentage = category.percentage || 0;
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm border border-border"
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
    </Card>
  );
}
