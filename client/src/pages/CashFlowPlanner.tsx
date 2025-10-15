import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import EditableAmount from "@/components/EditableAmount";
import BudgetAllocationSlider from "@/components/BudgetAllocationSlider";
import CategoryAllocationChart from "@/components/CategoryAllocationChart";
import ThemeToggle from "@/components/ThemeToggle";
import { useBudget } from "@/hooks/useBudget";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgetOperations";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";

export default function CashFlowPlanner() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: budget } = useBudget(currentMonth);
  const { data: categories } = useBudgetCategories(budget?.id);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const [fixedIncome, setFixedIncome] = useState("0");
  const [fixedExpense, setFixedExpense] = useState("0");
  const [extraIncome, setExtraIncome] = useState("0");

  useEffect(() => {
    if (budget) {
      setFixedIncome(budget.fixedIncome);
      setFixedExpense(budget.fixedExpense);
      setExtraIncome(budget.extraIncome);
    }
  }, [budget]);

  const fixedDisposableIncome = parseFloat(fixedIncome) - parseFloat(fixedExpense);
  const totalDisposableIncome = fixedDisposableIncome + parseFloat(extraIncome);

  // 計算各類別總金額並取固定和額外的聯集
  const categoryTotals = useMemo(() => {
    if (!categories) return [];
    
    const totalsMap = new Map<string, { name: string; amount: number; color: string }>();
    
    categories.forEach(cat => {
      const amount = cat.type === "fixed"
        ? (fixedDisposableIncome * (cat.percentage || 0)) / 100
        : (parseFloat(extraIncome) * (cat.percentage || 0)) / 100;
      
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
    
    // 按總金額降序排序
    return Array.from(totalsMap.values()).sort((a, b) => b.amount - a.amount);
  }, [categories, fixedDisposableIncome, extraIncome]);

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
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense: value,
        extraIncome,
      });
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
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground mb-1">每月固定可支配金額</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-fixed-disposable">
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
            <EditableAmount
              value={extraIncome}
              label="額外收入"
              onSave={handleSaveExtraIncome}
              dataTestId="extra-income"
            />
            <div className="p-4 bg-chart-3/10 border-chart-3/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">額外可支配金額</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-extra-disposable">
                NT$ {parseFloat(extraIncome).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* 6. 本月額外可支配金額分配 */}
        <BudgetAllocationSlider
          title="本月額外可支配金額分配"
          totalAmount={parseFloat(extraIncome)}
          budgetId={budget?.id}
          categories={categories || []}
          type="extra"
        />
      </div>
    </div>
  );
}
