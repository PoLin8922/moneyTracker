import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BudgetAllocationSlider from "@/components/BudgetAllocationSlider";
import ThemeToggle from "@/components/ThemeToggle";
import { useBudget } from "@/hooks/useBudget";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgetOperations";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { Edit2 } from "lucide-react";

export default function CashFlowPlanner() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: budget } = useBudget(currentMonth);
  const { data: categories } = useBudgetCategories(budget?.id);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const [editingFixedIncome, setEditingFixedIncome] = useState(false);
  const [editingFixedExpense, setEditingFixedExpense] = useState(false);
  const [editingExtraIncome, setEditingExtraIncome] = useState(false);
  
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

  const categoryTotals = useMemo(() => {
    if (!categories) return [];
    
    return categories.map(cat => {
      const fixedAmount = (fixedDisposableIncome * cat.percentage) / 100;
      const extraAmount = (parseFloat(extraIncome) * cat.extraPercentage) / 100;
      return {
        ...cat,
        totalAmount: fixedAmount + extraAmount,
        fixedAmount,
        extraAmount,
      };
    });
  }, [categories, fixedDisposableIncome, extraIncome]);

  const handleSaveFixedIncome = async () => {
    if (!budget) {
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense,
        extraIncome,
      });
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { fixedIncome },
      });
    }
    setEditingFixedIncome(false);
  };

  const handleSaveFixedExpense = async () => {
    if (!budget) {
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense,
        extraIncome,
      });
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { fixedExpense },
      });
    }
    setEditingFixedExpense(false);
  };

  const handleSaveExtraIncome = async () => {
    if (!budget) {
      await createBudget.mutateAsync({
        month: currentMonth,
        fixedIncome,
        fixedExpense,
        extraIncome,
      });
    } else {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: { extraIncome },
      });
    }
    setEditingExtraIncome(false);
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
        {/* 總可支配金額 */}
        <Card className="p-6 bg-primary/10 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1 text-center">本月可支配金額</p>
          <p className="text-4xl font-bold text-primary text-center" data-testid="text-total-disposable">
            NT$ {totalDisposableIncome.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            固定可支配金額 + 額外可支配金額
          </p>
        </Card>

        {/* 固定收支 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">每月固定收支</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="income" className="text-sm font-medium">固定收入</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="income"
                  type="number"
                  value={fixedIncome}
                  onChange={(e) => setFixedIncome(e.target.value)}
                  readOnly={!editingFixedIncome}
                  data-testid="input-fixed-income"
                />
                {editingFixedIncome ? (
                  <Button size="icon" variant="default" onClick={handleSaveFixedIncome} data-testid="button-save-income">
                    ✓
                  </Button>
                ) : (
                  <Button size="icon" variant="outline" onClick={() => setEditingFixedIncome(true)} data-testid="button-edit-income">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="expense" className="text-sm font-medium">固定支出</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="expense"
                  type="number"
                  value={fixedExpense}
                  onChange={(e) => setFixedExpense(e.target.value)}
                  readOnly={!editingFixedExpense}
                  data-testid="input-fixed-expense"
                />
                {editingFixedExpense ? (
                  <Button size="icon" variant="default" onClick={handleSaveFixedExpense} data-testid="button-save-expense">
                    ✓
                  </Button>
                ) : (
                  <Button size="icon" variant="outline" onClick={() => setEditingFixedExpense(true)} data-testid="button-edit-expense">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">每月固定可支配金額</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-fixed-disposable">
                NT$ {fixedDisposableIncome.toLocaleString()}
              </p>
            </Card>
          </div>
        </Card>

        {/* 額外收入 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">每月額外收入</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="extra" className="text-sm font-medium">額外收入</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="extra"
                  type="number"
                  value={extraIncome}
                  onChange={(e) => setExtraIncome(e.target.value)}
                  readOnly={!editingExtraIncome}
                  data-testid="input-extra-income"
                />
                {editingExtraIncome ? (
                  <Button size="icon" variant="default" onClick={handleSaveExtraIncome} data-testid="button-save-extra">
                    ✓
                  </Button>
                ) : (
                  <Button size="icon" variant="outline" onClick={() => setEditingExtraIncome(true)} data-testid="button-edit-extra">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <Card className="p-4 bg-chart-3/10 border-chart-3/20">
              <p className="text-sm text-muted-foreground mb-1">額外可支配金額</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-extra-disposable">
                NT$ {parseFloat(extraIncome).toLocaleString()}
              </p>
            </Card>
          </div>
        </Card>

        {/* 各類別可支配金額總覽 */}
        {categoryTotals.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">各類別可支配金額</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTotals.map((cat) => (
                <Card key={cat.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: cat.color }}>
                    NT$ {cat.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    固定: NT$ {cat.fixedAmount.toLocaleString()} + 額外: NT$ {cat.extraAmount.toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* 固定收入分配 */}
        <BudgetAllocationSlider
          title="固定收入分配"
          totalAmount={fixedDisposableIncome}
          budgetId={budget?.id}
          categories={categories || []}
          allocationField="percentage"
        />

        {/* 額外收入分配 */}
        <BudgetAllocationSlider
          title="額外收入分配"
          totalAmount={parseFloat(extraIncome)}
          budgetId={budget?.id}
          categories={categories || []}
          allocationField="extraPercentage"
        />
      </div>
    </div>
  );
}
