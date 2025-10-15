import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditableAmount from "@/components/EditableAmount";
import BudgetAllocationSlider from "@/components/BudgetAllocationSlider";
import CategoryAllocationChart from "@/components/CategoryAllocationChart";
import ThemeToggle from "@/components/ThemeToggle";
import SavingsJarCard from "@/components/SavingsJarCard";
import SavingsJarDialog from "@/components/SavingsJarDialog";
import CreateSavingsJarDialog from "@/components/CreateSavingsJarDialog";
import { useBudget } from "@/hooks/useBudget";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgetOperations";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useSavingsJars } from "@/hooks/useSavingsJars";
import { useQuery } from "@tanstack/react-query";
import { Info, Plus } from "lucide-react";
import type { SavingsJar } from "@shared/schema";

export default function CashFlowPlanner() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: budget } = useBudget(currentMonth);
  const { data: categories } = useBudgetCategories(budget?.id);
  const { data: prevIncomeData } = useQuery<{ totalIncome: number }>({
    queryKey: ['/api/budgets', currentMonth, 'previous-income'],
  });
  const { data: savingsJars } = useSavingsJars();
  
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const [fixedIncome, setFixedIncome] = useState("0");
  const [fixedExpense, setFixedExpense] = useState("0");
  const [extraIncome, setExtraIncome] = useState("0");
  const [selectedJar, setSelectedJar] = useState<SavingsJar | null>(null);
  const [createJarOpen, setCreateJarOpen] = useState(false);

  useEffect(() => {
    if (budget) {
      setFixedIncome(budget.fixedIncome);
      setFixedExpense(budget.fixedExpense);
      setExtraIncome(budget.extraIncome);
    } else if (prevIncomeData && !budget) {
      // 自動設置額外收入為：上個月收入 - 本月固定支出
      const calculatedExtra = Math.max(0, prevIncomeData.totalIncome - parseFloat(fixedExpense));
      setExtraIncome(calculatedExtra.toString());
    }
  }, [budget, prevIncomeData, fixedExpense]);

  // Calculate savings jar allocations that should be deducted from disposable income
  const savingsJarAllocations = useMemo(() => {
    if (!savingsJars) return 0;
    return savingsJars
      .filter(jar => jar.includeInDisposable === "true")
      .reduce((total, jar) => {
        const remaining = parseFloat(jar.targetAmount) - parseFloat(jar.currentAmount);
        return total + Math.max(0, remaining);
      }, 0);
  }, [savingsJars]);

  const fixedDisposableIncome = parseFloat(fixedIncome) - parseFloat(fixedExpense);
  const extraDisposableIncome = parseFloat(extraIncome) - savingsJarAllocations;
  const totalDisposableIncome = fixedDisposableIncome + extraDisposableIncome;

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
    
    // 加入啟用存錢罐的類別
    if (savingsJars) {
      savingsJars
        .filter(jar => jar.includeInDisposable === "true")
        .forEach(jar => {
          const jarCategories = (jar as any).categories || [];
          const jarRemaining = parseFloat(jar.targetAmount) - parseFloat(jar.currentAmount);
          
          jarCategories.forEach((cat: any) => {
            const categoryAmount = (jarRemaining * (parseFloat(cat.percentage) || 0)) / 100;
            
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

  const handleSaveFixedIncome = async (value: string) => {
    if (!budget) {
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome: value,
        fixedExpense,
        extraIncome,
      });
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { fixedIncome: value },
      });
    }
    setFixedIncome(value);
  };

  const handleSaveFixedExpense = async (value: string) => {
    if (!budget) {
      const calculatedExtra = prevIncomeData 
        ? Math.max(0, prevIncomeData.totalIncome - parseFloat(value)).toString()
        : extraIncome;
      
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense: value,
        extraIncome: calculatedExtra,
      });
      setExtraIncome(calculatedExtra);
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { fixedExpense: value },
      });
    }
    setFixedExpense(value);
  };

  const handleSaveExtraIncome = async (value: string) => {
    if (!budget) {
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense,
        extraIncome: value,
      });
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { extraIncome: value },
      });
    }
    setExtraIncome(value);
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
            <EditableAmount
              value={fixedIncome}
              label="固定收入"
              onSave={handleSaveFixedIncome}
              dataTestId="fixed-income"
            />
            <EditableAmount
              value={fixedExpense}
              label="固定支出"
              onSave={handleSaveFixedExpense}
              dataTestId="fixed-expense"
            />
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
          {!budget && prevIncomeData && prevIncomeData.totalIncome > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                系統已自動設定額外收入為：上個月收入（NT$ {prevIncomeData.totalIncome.toLocaleString()}）
                - 本月固定支出（NT$ {parseFloat(fixedExpense).toLocaleString()}）
                = NT$ {Math.max(0, prevIncomeData.totalIncome - parseFloat(fixedExpense)).toLocaleString()}
              </p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            <EditableAmount
              value={extraIncome}
              label="額外收入"
              onSave={handleSaveExtraIncome}
              dataTestId="extra-income"
            />
            <div className="p-4 bg-chart-3/10 border-chart-3/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">額外可支配金額</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-extra-disposable">
                NT$ {extraDisposableIncome.toLocaleString()}
              </p>
              {savingsJarAllocations > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  已扣除存錢罐分配 NT$ {savingsJarAllocations.toLocaleString()}
                </p>
              )}
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
      </div>
    </div>
  );
}
