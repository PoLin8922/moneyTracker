import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCreateBudgetCategory, useUpdateBudgetCategory, useDeleteBudgetCategory } from "@/hooks/useBudgetCategories";
import { useSavingsJarCategories } from "@/hooks/useSavingsJarCategories";
import { useLedgerEntries } from "@/hooks/useLedger";
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
  
  // 獲取所有記帳紀錄以提取已使用的類別
  const { data: ledgerEntries } = useLedgerEntries();
  
  // Debug: 檢查資料是否載入
  console.log("🔍 BudgetAllocationSlider 渲染");
  console.log("📊 ledgerEntries:", ledgerEntries);
  console.log("📊 categories:", categories);
  console.log("📊 savingsJarCategories:", savingsJarCategories);

  // 預設類別定義（與 LedgerEntryDialog 保持一致）
  const defaultCategories = useMemo(() => [
    { name: "餐飲", iconName: "UtensilsCrossed", color: "hsl(25, 95%, 53%)" },
    { name: "交通", iconName: "Car", color: "hsl(217, 91%, 60%)" },
    { name: "購物", iconName: "ShoppingBag", color: "hsl(280, 85%, 60%)" },
    { name: "娛樂", iconName: "Gamepad2", color: "hsl(340, 82%, 52%)" },
    { name: "醫療", iconName: "Heart", color: "hsl(0, 84%, 60%)" },
    { name: "教育", iconName: "GraduationCap", color: "hsl(262, 83%, 58%)" },
    { name: "居家", iconName: "Home", color: "hsl(173, 80%, 40%)" },
    { name: "保險", iconName: "Shield", color: "hsl(221, 83%, 53%)" },
    { name: "投資", iconName: "TrendingUp", color: "hsl(142, 76%, 36%)" },
    { name: "薪資", iconName: "Briefcase", color: "hsl(142, 76%, 36%)" },
    { name: "獎金", iconName: "Trophy", color: "hsl(45, 93%, 47%)" },
    { name: "利息", iconName: "Percent", color: "hsl(173, 80%, 40%)" },
    { name: "其他收入", iconName: "Plus", color: "hsl(262, 83%, 58%)" },
    { name: "其他支出", iconName: "Minus", color: "hsl(0, 84%, 60%)" },
  ], []);

  // 合併所有可用類別（預算類別 + 記帳類別 + 預設類別）
  const mergedCategories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; iconName: string; color: string }>();
    
    console.log("� 執行 mergedCategories useMemo");
    
    // 1. 先加入預設類別
    defaultCategories.forEach(cat => {
      categoryMap.set(cat.name, cat);
    });
    
    // 2. 加入預算類別（會覆蓋預設類別的顏色/圖示）
    categories?.forEach(cat => {
      categoryMap.set(cat.name, {
        name: cat.name,
        iconName: cat.iconName || "Wallet",
        color: cat.color
      });
    });
    
    // 3. 從記帳紀錄中提取類別
    if (ledgerEntries) {
      const ledgerCategoryNames = new Set(
        ledgerEntries.map(entry => entry.category).filter(Boolean)
      );
      
      console.log("📝 從記帳紀錄提取的類別:", Array.from(ledgerCategoryNames));
      
      ledgerCategoryNames.forEach(categoryName => {
        if (!categoryMap.has(categoryName)) {
          // 如果是新類別，分配顏色
          const color = assignCategoryColor(
            categoryName,
            categories,
            savingsJarCategories || []
          );
          console.log(`✨ 新增記帳類別: ${categoryName}, 顏色: ${color}`);
          categoryMap.set(categoryName, {
            name: categoryName,
            iconName: "Wallet",
            color
          });
        }
      });
    } else {
      console.log("⚠️ ledgerEntries 是 undefined");
    }
    
    const result = Array.from(categoryMap.values());
    console.log("✅ 最終合併結果 (共 " + result.length + " 個類別):", result);
    return result;
  }, [categories, ledgerEntries, savingsJarCategories, defaultCategories]);

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
        existingCategories={mergedCategories}
      />
    </Card>
  );
}
