import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentTransaction, InvestmentHolding } from "@shared/schema";

interface InvestmentTransactionsTableProps {
  transactions: InvestmentTransaction[];
  holdings: InvestmentHolding[];
  filterType?: string; // "all" | "台股" | "美股" | "加密貨幣"
  onAddTransaction: () => void; // 新增交易的回調
}

export default function InvestmentTransactionsTable({
  transactions,
  holdings,
  filterType = "all",
  onAddTransaction,
}: InvestmentTransactionsTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // 刪除交易的 mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await apiRequest("DELETE", `/api/investments/transactions/${transactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-accounts"] });
      toast({
        title: "✅ 刪除成功",
        description: "交易記錄已刪除，持倉已更新",
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ 刪除失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete);
    }
  };
  
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">交易明細</h3>
            <p className="text-sm text-muted-foreground mt-1">
              依時間顯示所有交易，包含損益計算
            </p>
          </div>
          <Button onClick={onAddTransaction} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            新增交易
          </Button>
        </div>
        <div className="text-center text-muted-foreground pt-4">
          暫無交易記錄，點擊上方按鈕新增
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">交易明細</h3>
            <p className="text-sm text-muted-foreground mt-1">
              依時間顯示所有交易，包含損益計算
            </p>
          </div>
          <Button onClick={onAddTransaction} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            新增交易
          </Button>
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
                <TableHead className="text-center">操作</TableHead>
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
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(transaction.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除交易記錄？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作將刪除此筆交易記錄並重新計算持倉。如果這是最後一筆交易，相關持倉也將被刪除。此操作無法撤銷。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            確認刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
