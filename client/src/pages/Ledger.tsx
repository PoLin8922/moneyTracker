import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LedgerEntry from "@/components/LedgerEntry";
import ThemeToggle from "@/components/ThemeToggle";
import LedgerEntryDialog from "@/components/LedgerEntryDialog";
import LedgerStatsCarousel from "@/components/LedgerStatsCarousel";
import IncomeExpenseDetailDialog from "@/components/IncomeExpenseDetailDialog";
import BudgetUsageChart from "@/components/BudgetUsageChart";
import CategoryPieChart from "@/components/CategoryPieChart";
import DisposableIncomeTrendDialog from "@/components/DisposableIncomeTrendDialog";
import { useLedgerEntries } from "@/hooks/useLedger";
import { useAssets } from "@/hooks/useAssets";
import { useBudget } from "@/hooks/useBudget";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Ledger() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState(now.getMonth() + 1);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [trendDialogOpen, setTrendDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const selectedMonth = `${selectedYear}/${String(selectedMonthNum).padStart(2, '0')}`;

  const { data: ledgerEntries, isLoading } = useLedgerEntries();
  const { data: accounts } = useAssets();
  const { data: budget } = useBudget(selectedMonth.replace('/', '-'));
  const { data: budgetCategories } = useBudgetCategories(budget?.id);

  // Generate year options (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const entries = useMemo(() => {
    if (!ledgerEntries || !accounts) return [];

    return ledgerEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const [year, month] = selectedMonth.split('/');
        return entryDate.getFullYear() === parseInt(year) && 
               entryDate.getMonth() + 1 === parseInt(month);
      })
      .map(entry => {
        const account = accounts.find(a => a.id === entry.accountId);
        // 換算成台幣：如果帳戶幣別不是 TWD，則用匯率換算
        const amountInTWD = account && account.currency !== "TWD"
          ? parseFloat(entry.amount) * parseFloat(account.exchangeRate || "1")
          : parseFloat(entry.amount);
        
        return {
          id: entry.id,
          type: entry.type as "income" | "expense",
          amount: amountInTWD,
          originalAmount: parseFloat(entry.amount),
          currency: account?.currency || "TWD",
          category: entry.category,
          accountId: entry.accountId || "",
          account: account?.accountName || "未知帳戶",
          date: new Date(entry.date).toLocaleDateString('zh-TW'),
          rawDate: entry.date,
          note: entry.note || undefined,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledgerEntries, accounts, selectedMonth]);

  const monthIncome = entries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const monthExpense = entries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  // 各類別收入數據（用於圓餅圖）
  const incomeCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    entries
      .filter(e => e.type === "income")
      .forEach(entry => {
        const current = categoryMap.get(entry.category) || 0;
        categoryMap.set(entry.category, current + entry.amount);
      });

    // 使用固定顏色方案
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // 各類別支出數據（用於圓餅圖）
  const expenseCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    entries
      .filter(e => e.type === "expense")
      .forEach(entry => {
        const current = categoryMap.get(entry.category) || 0;
        categoryMap.set(entry.category, current + entry.amount);
      });

    // 使用固定顏色方案
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);
  
  // 本月可支配金額 = (固定收入 - 固定支出) + 額外收入（來自現金流規劃）
  const disposableIncome = budget 
    ? (parseFloat(budget.fixedIncome) - parseFloat(budget.fixedExpense)) + parseFloat(budget.extraIncome)
    : 0;
  
  // 剩餘可支配金額 = 本月可支配金額 - 本月總支出
  const remainingDisposable = disposableIncome - monthExpense;

  // 計算各類別預算使用情況
  const categoryUsage = useMemo(() => {
    if (!budgetCategories || !budget) return [];

    const fixedDisposable = parseFloat(budget.fixedIncome) - parseFloat(budget.fixedExpense);
    const extraDisposable = parseFloat(budget.extraIncome);

    // 合併固定和額外分配的相同類別
    const categoryMap = new Map<string, { budgeted: number; used: number; color: string }>();

    budgetCategories.forEach(cat => {
      const budgetAmount = cat.type === "fixed"
        ? (fixedDisposable * (cat.percentage || 0)) / 100
        : (extraDisposable * (cat.percentage || 0)) / 100;

      if (categoryMap.has(cat.name)) {
        const existing = categoryMap.get(cat.name)!;
        existing.budgeted += budgetAmount;
      } else {
        categoryMap.set(cat.name, {
          budgeted: budgetAmount,
          used: 0,
          color: cat.color,
        });
      }
    });

    // 計算已使用金額
    entries
      .filter(e => e.type === "expense")
      .forEach(entry => {
        if (categoryMap.has(entry.category)) {
          categoryMap.get(entry.category)!.used += entry.amount;
        }
      });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.budgeted - a.budgeted);
  }, [budgetCategories, budget, entries]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">記帳本</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                if (selectedMonthNum === 1) {
                  setSelectedYear(selectedYear - 1);
                  setSelectedMonthNum(12);
                } else {
                  setSelectedMonthNum(selectedMonthNum - 1);
                }
              }}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-1">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-24" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMonthNum.toString()} onValueChange={(v) => setSelectedMonthNum(parseInt(v))}>
                <SelectTrigger className="w-20" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                if (selectedMonthNum === 12) {
                  setSelectedYear(selectedYear + 1);
                  setSelectedMonthNum(1);
                } else {
                  setSelectedMonthNum(selectedMonthNum + 1);
                }
              }}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setEntryDialogOpen(true)} data-testid="button-add-entry">
            <Plus className="w-4 h-4 mr-1" />
            記一筆
          </Button>
        </div>

        {/* 可滑動的統計卡片 */}
        <LedgerStatsCarousel>
          {/* 第一頁：月收入/月支出 + 圓餅圖 */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setIncomeDialogOpen(true)}
                className="text-left"
              >
                <Card className="p-4 hover-elevate active-elevate-2 transition-all">
                  <p className="text-sm text-muted-foreground mb-1">月收入</p>
                  <p className="text-2xl font-bold text-chart-3" data-testid="text-month-income">
                    NT$ {monthIncome.toLocaleString()}
                  </p>
                </Card>
              </button>
              <button
                onClick={() => setExpenseDialogOpen(true)}
                className="text-left"
              >
                <Card className="p-4 hover-elevate active-elevate-2 transition-all">
                  <p className="text-sm text-muted-foreground mb-1">月支出</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-month-expense">
                    NT$ {monthExpense.toLocaleString()}
                  </p>
                </Card>
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <CategoryPieChart 
                title="收入類別分布" 
                data={incomeCategoryData}
                totalAmount={monthIncome}
              />
              <CategoryPieChart 
                title="支出類別分布" 
                data={expenseCategoryData}
                totalAmount={monthExpense}
              />
            </div>
          </div>

          {/* 第二頁：可支配金額/剩餘可支配金額 + 預算使用圖 */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setTrendDialogOpen(true)}
                className="text-left"
                data-testid="button-disposable-trend"
              >
                <Card className="p-4 hover-elevate active-elevate-2 transition-all">
                  <p className="text-sm text-muted-foreground mb-1">本月可支配金額</p>
                  <p className="text-2xl font-bold" data-testid="text-disposable-income">
                    NT$ {disposableIncome.toLocaleString()}
                  </p>
                </Card>
              </button>
              <button
                onClick={() => setTrendDialogOpen(true)}
                className="text-left"
                data-testid="button-remaining-trend"
              >
                <Card className="p-4 hover-elevate active-elevate-2 transition-all">
                  <p className="text-sm text-muted-foreground mb-1">剩餘可支配金額</p>
                  <p
                    className={`text-2xl font-bold ${
                      remainingDisposable >= 0 ? "text-chart-3" : "text-destructive"
                    }`}
                    data-testid="text-remaining-disposable"
                  >
                    {remainingDisposable >= 0 ? "+" : ""}NT$ {remainingDisposable.toLocaleString()}
                  </p>
                </Card>
              </button>
            </div>
            <BudgetUsageChart categories={categoryUsage} />
          </div>
        </LedgerStatsCarousel>

        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">本月尚無記帳記錄</p>
              <p className="text-sm text-muted-foreground mt-2">點擊上方「記一筆」開始記帳</p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry, idx) => (
                <LedgerEntry 
                  key={idx} 
                  {...entry} 
                  onClick={() => {
                    setSelectedEntry(entry);
                    setEntryDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <LedgerEntryDialog 
        open={entryDialogOpen} 
        onOpenChange={(open) => {
          setEntryDialogOpen(open);
          if (!open) setSelectedEntry(null);
        }}
        entry={selectedEntry}
      />

      <IncomeExpenseDetailDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        type="income"
        currentMonth={selectedMonth.replace('/', '-')}
      />

      <IncomeExpenseDetailDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        type="expense"
        currentMonth={selectedMonth.replace('/', '-')}
      />

      <DisposableIncomeTrendDialog
        open={trendDialogOpen}
        onOpenChange={setTrendDialogOpen}
      />
    </div>
  );
}
