import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvestmentHoldingsTable from "@/components/InvestmentHoldingsTable";
import AssetBreakdownChart from "@/components/AssetBreakdownChart";
import ThemeToggle from "@/components/ThemeToggle";
import { Plus } from "lucide-react";

export default function Investment() {
  //todo: remove mock functionality
  const portfolioData = [
    { name: "台股", value: 150000, color: "hsl(var(--chart-1))" },
    { name: "美股", value: 80000, color: "hsl(var(--chart-2))" },
    { name: "加密貨幣", value: 50000, color: "hsl(var(--chart-3))" },
  ];

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
  const totalCost = 260000;
  const totalPL = totalValue - totalCost;
  const totalPLPercent = (totalPL / totalCost) * 100;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">投資組合</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">總覽</h3>
            <Button size="sm" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              新增交易
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">總市值</p>
              <p className="text-2xl font-bold" data-testid="text-total-value">
                NT$ {totalValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">總成本</p>
              <p className="text-2xl font-bold" data-testid="text-total-cost">
                NT$ {totalCost.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">總損益</p>
              <p
                className={`text-2xl font-bold ${
                  totalPL >= 0 ? "text-chart-3" : "text-destructive"
                }`}
                data-testid="text-total-pl"
              >
                {totalPL >= 0 ? "+" : ""}NT$ {totalPL.toLocaleString()}
                <span className="text-sm ml-2">
                  ({totalPLPercent.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </Card>

        <AssetBreakdownChart data={portfolioData} />

        <InvestmentHoldingsTable />
      </div>
    </div>
  );
}
