import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BudgetAllocationSlider from "@/components/BudgetAllocationSlider";
import CategoryAllocationChart from "@/components/CategoryAllocationChart";
import ThemeToggle from "@/components/ThemeToggle";
import SavingsJarCard from "@/components/SavingsJarCard";
import SavingsJarDialog from "@/components/SavingsJarDialog";
import CreateSavingsJarDialog from "@/components/CreateSavingsJarDialog";
import BudgetItemsDialog from "@/components/BudgetItemsDialog";
import ExtraIncomeDialog from "@/components/ExtraIncomeDialog";
import { useBudget } from "@/hooks/useBudget";
import { useCreateBudget } from "@/hooks/useBudgetOperations";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useSavingsJars } from "@/hooks/useSavingsJars";
import { useAutoUpdateExtraIncome } from "@/hooks/useAutoUpdateExtraIncome";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Plus, ChevronRight } from "lucide-react";
import type { SavingsJar } from "@shared/schema";

export default function CashFlowPlanner() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: budget } = useBudget(currentMonth);
  const { data: categories } = useBudgetCategories(budget?.id);
  const { data: budgetItems } = useBudgetItems(budget?.id);
  const { data: prevIncomeData } = useQuery<{ totalIncome: number }>({
    queryKey: ['/api/budgets', currentMonth, 'previous-income'],
  });
  const { data: savingsJars } = useSavingsJars();
  
  const createBudget = useCreateBudget();

  const [selectedJar, setSelectedJar] = useState<SavingsJar | null>(null);
  const [createJarOpen, setCreateJarOpen] = useState(false);
  const [fixedIncomeDialogOpen, setFixedIncomeDialogOpen] = useState(false);
  const [fixedExpenseDialogOpen, setFixedExpenseDialogOpen] = useState(false);
  const [extraIncomeDialogOpen, setExtraIncomeDialogOpen] = useState(false);

  // 從項目列表計算總額
  const fixedIncome = useMemo(() => {
    if (!budgetItems) return 0;
    return budgetItems
      .filter(item => item.type === "fixed_income")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }, [budgetItems]);

  const fixedExpense = useMemo(() => {
    if (!budgetItems) return 0;
    return budgetItems
      .filter(item => item.type === "fixed_expense")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }, [budgetItems]);

  // 自動更新上月額外收入（每次頁面載入或固定收入變化時）
  // 公式：上月額外收入 = Max(0, 上月總收入 - 本月固定收入)
  useAutoUpdateExtraIncome(budget?.id, currentMonth, fixedIncome);

  const extraIncome = useMemo(() => {
    if (!budgetItems) return 0;
    return budgetItems
      .filter(item => item.type === "extra_income")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }, [budgetItems]);

  const previousMonthIncome = prevIncomeData?.totalIncome || 0;
  const fixedDisposableIncome = fixedIncome - fixedExpense;
  const extraDisposableIncome = extraIncome;

  const categoryTotals = useMemo(() => {
    const totalsMap = new Map<string, { name: string; amount: number; color: string }>();
    
    // 先處理預算類別
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const amount = cat.type === "fixed"
          ? (fixedDisposableIncome * (cat.percentage || 0)) / 100
          : (extraDisposableIncome * (cat.percentage || 0)) / 100;
        
        if (totalsMap.has(cat.name)) {
          const existing = totalsMap.get(cat.name)!;
          existing.amount += amount;
        } else {
          totalsMap.set(cat.name, {
            name: cat.name,
            amount,
            color: cat.color,
          });
        }
      });
    }
    
    // 加入啟用存錢罐的類別（使用已存金額計算分配）
    if (savingsJars) {
      savingsJars
        .filter(jar => jar.includeInDisposable === "true")
        .forEach(jar => {
          const jarCategories = (jar as any).categories || [];
          const jarCurrentAmount = parseFloat(jar.currentAmount);
          
          jarCategories.forEach((cat: any) => {
            const categoryAmount = (jarCurrentAmount * (parseFloat(cat.percentage) || 0)) / 100;
            
            if (categoryAmount > 0) {
              if (totalsMap.has(cat.name)) {
                const existing = totalsMap.get(cat.name)!;
                existing.amount += categoryAmount;
              } else {
                // 如果是新類別，檢查是否有同名的預算類別以匹配顏色
                const matchingBudgetCat = categories?.find(c => c.name === cat.name);
                totalsMap.set(cat.name, {
                  name: cat.name,
                  amount: categoryAmount,
                  color: matchingBudgetCat ? matchingBudgetCat.color : cat.color,
                });
              }
            }
          });
        });
    }
    
    return Array.from(totalsMap.values()).sort((a, b) => b.amount - a.amount);
  }, [categories, fixedDisposableIncome, extraDisposableIncome, savingsJars]);

  // 本月可支配金額 = (固定收入 - 固定支出) + 額外收入
  // 這個公式與 Ledger.tsx 完全一致
  const totalDisposableIncome = useMemo(() => {
    return (fixedIncome - fixedExpense) + extraIncome;
  }, [fixedIncome, fixedExpense, extraIncome]);

  // Debug: Log values when they change
  useEffect(() => {
    console.log('[CashFlowPlanner] Budget data updated:', {
      budgetId: budget?.id,
      fixedIncome,
      fixedExpense,
      extraIncome,
      totalDisposableIncome
    });
  }, [budget?.id, fixedIncome, fixedExpense, extraIncome, totalDisposableIncome]);

  // 自動創建預算（如果不存在）
  const ensureBudget = async (): Promise<boolean> => {
    if (!budget) {
      try {
        console.log('[CashFlow] Creating budget for month:', currentMonth);
        await createBudget.mutateAsync({
          month: currentMonth,
          fixedIncome: "0",
          fixedExpense: "0",
          extraIncome: "0",
        });
        console.log('[CashFlow] Budget created successfully');
        
        // Wait for the budget query to refetch and update
        console.log('[CashFlow] Refetching budget query...');
        await queryClient.refetchQueries({ queryKey: ['/api/budgets', currentMonth] });
        
        // Verify budget is now available in cache
        const updatedBudget = queryClient.getQueryData(['/api/budgets', currentMonth]);
        console.log('[CashFlow] Budget after refetch:', updatedBudget);
        
        if (!updatedBudget) {
          throw new Error('Budget not found after creation');
        }
        
        // Small delay to allow React to re-render
        await new Promise(resolve => setTimeout(resolve, 50));
        return true;
      } catch (error) {
        console.error('[CashFlow] Failed to ensure budget:', error);
        throw error;
      }
    } else {
      console.log('[CashFlow] Budget already exists:', budget.id);
      return true;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">現金流規劃</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* 1. 本月可支配金額 */}
        <Card className="p-6 bg-primary/10 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1 text-center">本月可支配金額</p>
          <p className="text-4xl font-bold text-primary text-center" data-testid="text-total-disposable">
            NT$ {totalDisposableIncome.toLocaleString()}
          </p>
        </Card>

        {/* 2. 本月各類別可支配金額清單（橫條圖） */}
        <CategoryAllocationChart categories={categoryTotals} />

        {/* 3. 本月固定收支 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">本月固定收支</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={async () => {
                try {
                  console.log('[CashFlow] Fixed income button clicked');
                  await ensureBudget();
                  console.log('[CashFlow] Opening fixed income dialog');
                  setFixedIncomeDialogOpen(true);
                } catch (error) {
                  console.error('[CashFlow] Error opening fixed income dialog:', error);
                }
              }}
              className="p-4 bg-primary/10 border-primary/20 rounded-md border hover-elevate active-elevate-2 text-left transition-all"
              data-testid="button-fixed-income"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">固定收入</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-fixed-income">
                    NT$ {fixedIncome.toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
            
            <button
              onClick={async () => {
                try {
                  console.log('[CashFlow] Fixed expense button clicked');
                  await ensureBudget();
                  console.log('[CashFlow] Opening fixed expense dialog');
                  setFixedExpenseDialogOpen(true);
                } catch (error) {
                  console.error('[CashFlow] Error opening fixed expense dialog:', error);
                }
              }}
              className="p-4 bg-destructive/10 border-destructive/20 rounded-md border hover-elevate active-elevate-2 text-left transition-all"
              data-testid="button-fixed-expense"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">固定支出</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-fixed-expense">
                    NT$ {fixedExpense.toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>

            <div className="p-4 bg-chart-3/10 border-chart-3/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">每月固定可支配金額</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-fixed-disposable">
                NT$ {fixedDisposableIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* 4. 本月固定可支配金額分配 */}
        <BudgetAllocationSlider
          title="本月固定可支配金額分配"
          totalAmount={fixedDisposableIncome}
          budgetId={budget?.id}
          categories={categories || []}
          type="fixed"
        />

        {/* 5. 本月額外可支配金額 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">本月額外可支配金額</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={async () => {
                try {
                  console.log('[CashFlow] Extra income button clicked');
                  console.log('[CashFlow] Current budget before ensure:', budget);
                  await ensureBudget();
                  console.log('[CashFlow] Current budget after ensure:', budget);
                  console.log('[CashFlow] Opening extra income dialog');
                  setExtraIncomeDialogOpen(true);
                  console.log('[CashFlow] extraIncomeDialogOpen set to:', true);
                } catch (error) {
                  console.error('[CashFlow] Error opening extra income dialog:', error);
                }
              }}
              className="p-4 bg-primary/10 border-primary/20 rounded-md border hover-elevate active-elevate-2 text-left transition-all"
              data-testid="button-extra-income"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">額外收入</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-extra-income">
                    NT$ {extraIncome.toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>

            <div className="p-4 bg-chart-3/10 border-chart-3/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">額外可支配金額</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-extra-disposable">
                NT$ {extraDisposableIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* 6. 本月額外可支配金額分配 */}
        <BudgetAllocationSlider
          title="本月額外可支配金額分配"
          totalAmount={extraDisposableIncome}
          budgetId={budget?.id}
          categories={categories || []}
          type="extra"
        />

        {/* 7. 存錢罐 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">存錢罐</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCreateJarOpen(true)}
              data-testid="button-create-jar"
            >
              <Plus className="w-4 h-4 mr-1" />
              新增存錢罐
            </Button>
          </div>

          {!savingsJars || savingsJars.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              尚無存錢罐，點擊上方按鈕創建您的第一個存錢罐
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsJars.map((jar) => (
                <SavingsJarCard
                  key={jar.id}
                  jar={jar}
                  onOpenSettings={() => setSelectedJar(jar)}
                />
              ))}
            </div>
          )}
        </Card>

        <CreateSavingsJarDialog
          open={createJarOpen}
          onOpenChange={setCreateJarOpen}
        />

        <SavingsJarDialog
          jar={selectedJar}
          open={!!selectedJar}
          onOpenChange={(open) => !open && setSelectedJar(null)}
        />

        {budget && (
          <>
            <BudgetItemsDialog
              budgetId={budget.id}
              type="fixed_income"
              title="固定收入項目"
              open={fixedIncomeDialogOpen}
              onOpenChange={setFixedIncomeDialogOpen}
            />

            <BudgetItemsDialog
              budgetId={budget.id}
              type="fixed_expense"
              title="固定支出項目"
              open={fixedExpenseDialogOpen}
              onOpenChange={setFixedExpenseDialogOpen}
            />

            <ExtraIncomeDialog
              budgetId={budget.id}
              previousMonthIncome={previousMonthIncome}
              fixedIncome={fixedIncome}
              open={extraIncomeDialogOpen}
              onOpenChange={setExtraIncomeDialogOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}
