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

interface Holding {
  ticker: string;
  type: string;
  quantity: number;
  costPerShare: number;
  currentPrice: number;
}

interface InvestmentHoldingsTableProps {
  holdings?: Holding[];
}

export default function InvestmentHoldingsTable({
  holdings: initialHoldings,
}: InvestmentHoldingsTableProps) {
  //todo: remove mock functionality
  const defaultHoldings: Holding[] = [
    { ticker: "2330.TW", type: "台股", quantity: 10, costPerShare: 580, currentPrice: 620 },
    { ticker: "AAPL", type: "美股", quantity: 5, costPerShare: 180, currentPrice: 175 },
    { ticker: "TSLA", type: "美股", quantity: 3, costPerShare: 250, currentPrice: 265 },
    { ticker: "BTC", type: "加密貨幣", quantity: 0.05, costPerShare: 900000, currentPrice: 950000 },
  ];

  const holdings = initialHoldings || defaultHoldings;

  const calculatePL = (holding: Holding) => {
    const totalCost = holding.quantity * holding.costPerShare;
    const currentValue = holding.quantity * holding.currentPrice;
    const pl = currentValue - totalCost;
    const plPercent = (pl / totalCost) * 100;
    return { pl, plPercent };
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">持倉明細</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">標的</TableHead>
              <TableHead>類型</TableHead>
              <TableHead className="text-right">數量</TableHead>
              <TableHead className="text-right">成本</TableHead>
              <TableHead className="text-right">現值</TableHead>
              <TableHead className="text-right">損益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding, idx) => {
              const { pl, plPercent } = calculatePL(holding);
              const isProfit = pl >= 0;
              
              return (
                <TableRow key={idx} data-testid={`holding-${holding.ticker}`}>
                  <TableCell className="font-medium">{holding.ticker}</TableCell>
                  <TableCell>{holding.type}</TableCell>
                  <TableCell className="text-right">{holding.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${holding.costPerShare.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${holding.currentPrice.toLocaleString()}
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
                        {pl.toLocaleString()}
                      </span>
                      <span className="text-xs">({plPercent.toFixed(1)}%)</span>
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
