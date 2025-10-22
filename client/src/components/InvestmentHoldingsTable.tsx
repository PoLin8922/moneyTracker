import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useDeleteHolding } from "@/hooks/useInvestments";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentHolding } from "@shared/schema";

interface InvestmentHoldingsTableProps {
  holdings?: InvestmentHolding[];
}

export default function InvestmentHoldingsTable({
  holdings = [],
}: InvestmentHoldingsTableProps) {
  const { toast } = useToast();
  const deleteHolding = useDeleteHolding();

  const handleDelete = async (holding: InvestmentHolding) => {
    if (!confirm(`確定要刪除 ${holding.name} (${holding.ticker}) 的持倉嗎？`)) {
      return;
    }

    try {
      await deleteHolding.mutateAsync(holding.id);
      toast({
        title: "刪除成功",
        description: `${holding.name} 的持倉已刪除`,
      });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const calculatePL = (holding: InvestmentHolding) => {
    const qty = parseFloat(holding.quantity);
    const avgCost = parseFloat(holding.averageCost);
    const currentPrice = parseFloat(holding.currentPrice);
    
    const totalCost = qty * avgCost;
    const currentValue = qty * currentPrice;
    const pl = currentValue - totalCost;
    const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
    
    return { pl, plPercent, totalCost, currentValue };
  };

  if (holdings.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">持倉明細</h3>
        <div className="text-center text-muted-foreground py-8">
          尚無持倉記錄
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">持倉明細</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">標的</TableHead>
              <TableHead>類型</TableHead>
              <TableHead className="text-right">數量</TableHead>
              <TableHead className="text-right">平均成本</TableHead>
              <TableHead className="text-right">現值</TableHead>
              <TableHead className="text-right">總成本</TableHead>
              <TableHead className="text-right">市值</TableHead>
              <TableHead className="text-right">損益</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const { pl, plPercent, totalCost, currentValue } = calculatePL(holding);
              const isProfit = pl >= 0;
              
              return (
                <TableRow key={holding.id} data-testid={`holding-${holding.ticker}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{holding.name}</div>
                      <div className="text-xs text-muted-foreground">{holding.ticker}</div>
                    </div>
                  </TableCell>
                  <TableCell>{holding.type}</TableCell>
                  <TableCell className="text-right">
                    {parseFloat(holding.quantity).toLocaleString(undefined, { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 8 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(holding.averageCost).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(holding.currentPrice).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${totalCost.toLocaleString(undefined, { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${currentValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        isProfit ? "text-chart-3" : "text-destructive"
                      }`}
                    >
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-semibold">
                        {isProfit ? "+" : ""}
                        {pl.toLocaleString(undefined, { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                      <span className="text-xs">
                        ({plPercent >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(holding)}
                      disabled={deleteHolding.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
