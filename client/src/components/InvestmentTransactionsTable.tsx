import { useMemo } from "react";
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
import type { InvestmentTransaction, InvestmentHolding } from "@shared/schema";

interface InvestmentTransactionsTableProps {
  transactions: InvestmentTransaction[];
  holdings: InvestmentHolding[];
  filterType?: string; // "all" | "台股" | "美股" | "加密貨幣"
}

export default function InvestmentTransactionsTable({ 
  transactions, 
  holdings,
  filterType = "all"
}: InvestmentTransactionsTableProps) {
  
  // 計算每筆交易的損益
  const enrichedTransactions = useMemo(() => {
    return transactions
      .map(transaction => {
        // 找到對應的持倉
        const holding = holdings.find(h => h.id === transaction.holdingId);
        
        // 如果持倉已刪除，嘗試從所有持倉中找到相同 ticker
        const relatedHolding = holding || holdings.find(h => {
          // 從交易記錄推測 ticker（如果有需要）
          return false; // 暫時不實現
        });
        
        const quantity = parseFloat(transaction.quantity);
        const pricePerShare = parseFloat(transaction.pricePerShare);
        const fees = parseFloat(transaction.fees || "0");
        const currentPrice = relatedHolding ? parseFloat(relatedHolding.currentPrice) : pricePerShare;
        
        // 計算成本和現值
        const costBasis = transaction.type === 'buy' 
          ? (quantity * pricePerShare + fees) 
          : (quantity * pricePerShare - fees);
        
        const currentValue = quantity * currentPrice;
        
        // 計算損益（只對買入交易計算）
        const profitLoss = transaction.type === 'buy' 
          ? currentValue - costBasis
          : 0; // 賣出交易不計算持有損益
        
        const profitLossPercent = transaction.type === 'buy' && costBasis > 0
          ? (profitLoss / costBasis) * 100
          : 0;
        
        return {
          ...transaction,
          holding: relatedHolding,
          costBasis,
          currentValue,
          profitLoss,
          profitLossPercent,
          currentPrice,
        };
      })
      // 按日期排序（最新在前）
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      // 過濾類型
      .filter(t => {
        if (filterType === "all") return true;
        return t.holding?.type === filterType;
      });
  }, [transactions, holdings, filterType]);

  if (enrichedTransactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          暫無交易記錄
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="font-semibold">交易明細</h3>
        <p className="text-sm text-muted-foreground mt-1">
          依時間顯示所有交易，包含損益計算
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>標的</TableHead>
              <TableHead className="text-right">數量</TableHead>
              <TableHead className="text-right">成交價</TableHead>
              <TableHead className="text-right">手續費</TableHead>
              <TableHead className="text-right">成本</TableHead>
              <TableHead className="text-right">現價</TableHead>
              <TableHead className="text-right">現值</TableHead>
              <TableHead className="text-right">損益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedTransactions.map((transaction) => {
              const isBuy = transaction.type === 'buy';
              const isProfitable = transaction.profitLoss >= 0;
              
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(transaction.transactionDate).toLocaleDateString('zh-TW')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      isBuy ? 'bg-chart-3/20 text-chart-3' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {isBuy ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          買入
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          賣出
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {transaction.holding?.ticker || "未知"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.holding?.name || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(transaction.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(transaction.pricePerShare).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${parseFloat(transaction.fees || "0").toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${transaction.costBasis.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isBuy ? `$${transaction.currentPrice.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {isBuy ? `$${transaction.currentValue.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {isBuy ? (
                      <div className={`font-medium ${isProfitable ? 'text-chart-3' : 'text-destructive'}`}>
                        {isProfitable ? '+' : ''}${transaction.profitLoss.toFixed(2)}
                        <div className="text-xs">
                          ({isProfitable ? '+' : ''}{transaction.profitLossPercent.toFixed(2)}%)
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">已結算</span>
                    )}
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
