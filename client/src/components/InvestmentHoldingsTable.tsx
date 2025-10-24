import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { InvestmentHolding } from "@shared/schema";

interface InvestmentHoldingsTableProps {
  holdings?: InvestmentHolding[];
}

export default function InvestmentHoldingsTable({
  holdings = [],
}: InvestmentHoldingsTableProps) {
  console.log('📊 InvestmentHoldingsTable 渲染');
  console.log('📊 接收到的 holdings:', holdings);
  console.log('📊 Holdings 數量:', holdings.length);
  console.log('📊 Holdings 內容:', holdings.map(h => ({
    id: h.id,
    ticker: h.ticker,
    name: h.name,
    quantity: h.quantity,
    type: h.type,
    hasAllFields: !!(h.id && h.ticker && h.name && h.quantity && h.type)
  })));

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
    console.log('⚠️ Holdings 陣列為空，顯示空狀態');
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">持倉明細</h3>
        <div className="text-center text-muted-foreground py-8">
          尚無持倉記錄
        </div>
      </Card>
    );
  }

  console.log('✅ 開始渲染持倉表格，共', holdings.length, '筆');

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              console.log('🔄 渲染持倉行:', holding.ticker, holding.name);
              
              const { pl, plPercent, totalCost, currentValue } = calculatePL(holding);
              const isProfit = pl >= 0;
              
              return (
                <TableRow key={holding.id} data-testid={`holding-${holding.ticker}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{holding.name || holding.ticker}</div>
                      <div className="text-xs text-muted-foreground">{holding.ticker}</div>
                    </div>
                  </TableCell>
                  <TableCell>{holding.type || '未分類'}</TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
