import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LedgerEntry from "@/components/LedgerEntry";
import ThemeToggle from "@/components/ThemeToggle";
import LedgerEntryDialog from "@/components/LedgerEntryDialog";
import { useLedgerEntries } from "@/hooks/useLedger";
import { useAssets } from "@/hooks/useAssets";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Ledger() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);

  const { data: ledgerEntries, isLoading } = useLedgerEntries();
  const { data: accounts } = useAssets();

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
        return {
          type: entry.type as "income" | "expense",
          amount: parseFloat(entry.amount),
          category: entry.category,
          account: account?.accountName || "未知帳戶",
          date: new Date(entry.date).toLocaleDateString('zh-TW'),
          note: entry.note || undefined,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledgerEntries, accounts, selectedMonth]);

  const totalIncome = entries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

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
            <Button variant="outline" size="icon" data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024/10">2024/10</SelectItem>
                <SelectItem value="2024/09">2024/09</SelectItem>
                <SelectItem value="2024/08">2024/08</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" data-testid="button-next-month">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setEntryDialogOpen(true)} data-testid="button-add-entry">
            <Plus className="w-4 h-4 mr-1" />
            記一筆
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">總收入</p>
            <p className="text-2xl font-bold text-chart-3" data-testid="text-total-income">
              +NT$ {totalIncome.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">總支出</p>
            <p className="text-2xl font-bold" data-testid="text-total-expense">
              -NT$ {totalExpense.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">淨額</p>
            <p
              className={`text-2xl font-bold ${
                totalIncome - totalExpense >= 0 ? "text-chart-3" : "text-destructive"
              }`}
              data-testid="text-net-amount"
            >
              {totalIncome - totalExpense >= 0 ? "+" : ""}NT${" "}
              {(totalIncome - totalExpense).toLocaleString()}
            </p>
          </Card>
        </div>

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
                <LedgerEntry key={idx} {...entry} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <LedgerEntryDialog 
        open={entryDialogOpen} 
        onOpenChange={setEntryDialogOpen} 
      />
    </div>
  );
}
