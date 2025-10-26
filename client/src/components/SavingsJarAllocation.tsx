import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCreateSavingsJarCategory, useUpdateSavingsJarCategory, useDeleteSavingsJarCategory } from "@/hooks/useSavingsJarCategories";
import { useLedgerCategories, useCreateLedgerCategory } from "@/hooks/useLedgerCategories";
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
  const createLedgerCategory = useCreateLedgerCategory();
  
  // 從統一類別庫獲取所有支出類別
  const { data: ledgerExpenseCategories } = useLedgerCategories("expense");

  // 合併所有可用類別（優先順序：資料庫類別 > 存錢罐類別 > 預設類別）
  const mergedCategories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; iconName: string; color: string }>();
    
    // 1. 先加入預設類別
    const defaultCategories = [
      { name: "餐飲", iconName: "UtensilsCrossed", color: "hsl(25, 95%, 53%)" },
      { name: "交通", iconName: "Car", color: "hsl(217, 91%, 60%)" },
      { name: "購物", iconName: "ShoppingBag", color: "hsl(280, 85%, 60%)" },
      { name: "娛樂", iconName: "Gamepad2", color: "hsl(340, 82%, 52%)" },
      { name: "醫療", iconName: "Heart", color: "hsl(0, 84%, 60%)" },
      { name: "教育", iconName: "GraduationCap", color: "hsl(262, 83%, 58%)" },
      { name: "居家", iconName: "Home", color: "hsl(173, 80%, 40%)" },
      { name: "保險", iconName: "Shield", color: "hsl(221, 83%, 53%)" },
      { name: "投資", iconName: "TrendingUp", color: "hsl(142, 76%, 36%)" },
      { name: "其他支出", iconName: "Minus", color: "hsl(0, 84%, 60%)" },
    ];
    
    defaultCategories.forEach(cat => {
      categoryMap.set(cat.name, cat);
    });
    
    // 2. 加入存錢罐類別
    categories?.forEach(cat => {
      categoryMap.set(cat.name, {
        name: cat.name,
        iconName: cat.iconName || "PiggyBank",
        color: cat.color
      });
    });
    
    // 3. 加入統一類別庫的支出類別（最高優先）
    ledgerExpenseCategories?.forEach(cat => {
      categoryMap.set(cat.name, {
        name: cat.name,
        iconName: cat.iconName,
        color: cat.color
      });
    });
    
    return Array.from(categoryMap.values());
  }, [categories, ledgerExpenseCategories]);

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

    // 使用統一的顏色管理系統分配顏色
    const color = assignCategoryColor(
      categoryName,
      [],
      categories
    );

    // 1. 先新增到統一類別庫（如果不存在）
    const categoryExists = ledgerExpenseCategories?.some(c => c.name === categoryName);
    if (!categoryExists) {
      try {
        await createLedgerCategory.mutateAsync({
          name: categoryName,
          type: "expense",
          iconName,
          color,
        });
      } catch (error) {
        console.error("新增到統一類別庫失敗:", error);
      }
    }

    // 2. 新增到存錢罐類別
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
        existingCategories={mergedCategories}
      />
    </Card>
  );
}
