import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react";
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
import { useState } from "react";
import type { InvestmentTransaction, InvestmentHolding } from "@shared/schema";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: InvestmentTransaction | null;
  holding: InvestmentHolding | null;
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

export default function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  holding,
  currentPrice,
  profitLoss,
  profitLossPercent,
}: TransactionDetailDialogProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ 刪除失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transaction) {
      deleteTransactionMutation.mutate(transaction.id);
    }
  };

  if (!transaction || !holding) return null;

  const isBuy = transaction.type === 'buy';
  const isProfitable = profitLoss >= 0;
  const quantity = parseFloat(transaction.quantity);
  const pricePerShare = parseFloat(transaction.pricePerShare);
  const fees = parseFloat(transaction.fees || "0");
  const totalCost = (quantity * pricePerShare) + fees;
  const currentValue = quantity * currentPrice;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>交易詳情</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                isBuy ? 'bg-chart-3/20 text-chart-3' : 'bg-destructive/20 text-destructive'
              }`}>
                {isBuy ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    買入
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    賣出
                  </>
                )}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 標的資訊 */}
            <Card className="p-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">標的</p>
                  <p className="text-lg font-bold">{holding.name}</p>
                  <p className="text-sm text-muted-foreground">{holding.ticker} · {holding.type}</p>
                </div>
              </div>
            </Card>

            {/* 交易資訊 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">交易資訊</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">交易日期</span>
                  <span className="font-medium">
                    {new Date(transaction.transactionDate).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">數量</span>
                  <span className="font-medium">{quantity.toLocaleString()} 股</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成交價</span>
                  <span className="font-medium">${pricePerShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">手續費</span>
                  <span className="font-medium">${fees.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">總成本</span>
                  <span className="font-bold">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* 損益資訊（僅買入顯示） */}
            {isBuy && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">損益狀況</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">現價</span>
                    <span className="font-medium">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">現值</span>
                    <span className="font-medium">${currentValue.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">損益</span>
                    <div className={`text-right font-bold ${isProfitable ? 'text-chart-3' : 'text-destructive'}`}>
                      <div className="flex items-center gap-1">
                        {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isProfitable ? '+' : ''}${profitLoss.toFixed(2)}</span>
                      </div>
                      <div className="text-xs">
                        ({isProfitable ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {isBuy === false && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  📊 賣出交易已結算，損益已計入歷史記錄
                </p>
              </Card>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                關閉
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleteTransactionMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除交易
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
