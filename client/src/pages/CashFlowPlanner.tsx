import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetAllocationSlider from "@/components/BudgetAllocationSlider";
import ThemeToggle from "@/components/ThemeToggle";
import { Plus } from "lucide-react";

export default function CashFlowPlanner() {
  //todo: remove mock functionality
  const [fixedIncome] = useState(50000);
  const [fixedExpense] = useState(20000);
  const disposableIncome = fixedIncome - fixedExpense;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">現金流規劃</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">每月固定收支</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="income" className="text-sm font-medium">固定收入</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="income"
                    type="number"
                    value={fixedIncome}
                    readOnly
                    data-testid="input-fixed-income"
                  />
                  <Button size="icon" variant="outline" data-testid="button-edit-income">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="expense" className="text-sm font-medium">固定支出</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="expense"
                    type="number"
                    value={fixedExpense}
                    readOnly
                    data-testid="input-fixed-expense"
                  />
                  <Button size="icon" variant="outline" data-testid="button-edit-expense">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Card className="p-4 bg-primary/10 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">可支配收入</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-disposable-income">
                NT$ {disposableIncome.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                固定收入 - 固定支出
              </p>
            </Card>
          </div>
        </Card>

        <BudgetAllocationSlider totalAmount={disposableIncome} />

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">額外收入分配</h3>
          <p className="text-sm text-muted-foreground mb-4">
            上月總收入與固定收入的差額
          </p>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="font-medium">額外現金</span>
            <span className="text-xl font-bold text-chart-3" data-testid="text-extra-income">
              +NT$ 8,000
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
