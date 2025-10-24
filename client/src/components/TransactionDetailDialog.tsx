import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Trash2, Edit, Save, X } from "lucide-react";
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
import { useState, useEffect } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  
  // 編輯表單狀態
  const [editForm, setEditForm] = useState({
    quantity: "",
    pricePerShare: "",
    fees: "",
    transactionDate: "",
  });

  // 當交易資料變化時，初始化表單
  useEffect(() => {
    if (transaction) {
      setEditForm({
        quantity: transaction.quantity,
        pricePerShare: transaction.pricePerShare,
        fees: transaction.fees || "0",
        transactionDate: transaction.transactionDate.split('T')[0], // 只取日期部分
      });
    }
    setIsEditing(false); // 重置編輯模式
  }, [transaction]);

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PATCH", `/api/investments/transactions/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-accounts"] });
      toast({
        title: "✅ 更新成功",
        description: "交易記錄已更新，持倉已重新計算",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ 更新失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // 恢復原始值
    if (transaction) {
      setEditForm({
        quantity: transaction.quantity,
        pricePerShare: transaction.pricePerShare,
        fees: transaction.fees || "0",
        transactionDate: transaction.transactionDate.split('T')[0],
      });
    }
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!transaction) return;

    // 驗證輸入
    const quantity = parseFloat(editForm.quantity);
    const pricePerShare = parseFloat(editForm.pricePerShare);
    const fees = parseFloat(editForm.fees);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "❌ 驗證失敗",
        description: "數量必須大於 0",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(pricePerShare) || pricePerShare <= 0) {
      toast({
        title: "❌ 驗證失敗",
        description: "成交價必須大於 0",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(fees) || fees < 0) {
      toast({
        title: "❌ 驗證失敗",
        description: "手續費不能為負數",
        variant: "destructive",
      });
      return;
    }

    updateTransactionMutation.mutate({
      id: transaction.id,
      updates: {
        quantity: editForm.quantity,
        pricePerShare: editForm.pricePerShare,
        fees: editForm.fees,
        transactionDate: editForm.transactionDate,
      },
    });
  };

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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">交易資訊</h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 px-2"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    編輯
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                // 編輯模式
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="transactionDate">交易日期</Label>
                    <Input
                      id="transactionDate"
                      type="date"
                      value={editForm.transactionDate}
                      onChange={(e) => setEditForm({ ...editForm, transactionDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">數量</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePerShare">成交價</Label>
                    <Input
                      id="pricePerShare"
                      type="number"
                      step="0.01"
                      value={editForm.pricePerShare}
                      onChange={(e) => setEditForm({ ...editForm, pricePerShare: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fees">手續費</Label>
                    <Input
                      id="fees"
                      type="number"
                      step="0.01"
                      value={editForm.fees}
                      onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1"
                      disabled={updateTransactionMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="flex-1"
                      disabled={updateTransactionMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {updateTransactionMutation.isPending ? "儲存中..." : "儲存"}
                    </Button>
                  </div>
                </div>
              ) : (
                // 顯示模式
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
              )}
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
            {!isEditing && (
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
            )}
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
