import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvestmentHoldingsTable from "@/components/InvestmentHoldingsTable";
import InvestmentTransactionDialog from "@/components/InvestmentTransactionDialog";
import AssetBreakdownChart from "@/components/AssetBreakdownChart";
import ThemeToggle from "@/components/ThemeToggle";
import { useInvestments } from "@/hooks/useInvestments";
import { Plus } from "lucide-react";

export default function Investment() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: holdings = [], isLoading } = useInvestments();

  // 按資產類型分組計算總市值
  const portfolioData = holdings.reduce((acc, holding) => {
    const type = holding.type;
    const marketValue = parseFloat(holding.quantity) * parseFloat(holding.currentPrice);
    
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += marketValue;
    } else {
      acc.push({
        name: type,
        value: marketValue,
        color: type === "台股" ? "hsl(220, 65%, 70%)" : 
               type === "美股" ? "hsl(200, 60%, 72%)" : 
               "hsl(180, 55%, 68%)",
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  // 計算總覽數據
  const totalValue = holdings.reduce((sum, h) => {
    return sum + (parseFloat(h.quantity) * parseFloat(h.currentPrice));
  }, 0);

  const totalCost = holdings.reduce((sum, h) => {
    return sum + (parseFloat(h.quantity) * parseFloat(h.averageCost));
  }, 0);

  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

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
            <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              新增交易
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">載入中...</div>
          ) : holdings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              尚無投資持倉，點擊「新增交易」開始記錄
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">總市值</p>
                <p className="text-2xl font-bold" data-testid="text-total-value">
                  NT$ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">總成本</p>
                <p className="text-2xl font-bold" data-testid="text-total-cost">
                  NT$ {totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                  {totalPL >= 0 ? "+" : ""}NT$ {totalPL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-sm ml-2">
                    ({totalPLPercent >= 0 ? "+" : ""}{totalPLPercent.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          )}
        </Card>

        {portfolioData.length > 0 && (
          <AssetBreakdownChart data={portfolioData} />
        )}

        <InvestmentHoldingsTable holdings={holdings} />
      </div>

      <InvestmentTransactionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}
