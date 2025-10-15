import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBudgetItems, useCreateBudgetItem, useDeleteBudgetItem } from "@/hooks/useBudgetItems";
import { queryClient } from "@/lib/queryClient";
import { Plus, Trash2 } from "lucide-react";

interface ExtraIncomeDialogProps {
  budgetId: string;
  previousMonthIncome: number;
  fixedExpense: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExtraIncomeDialog({ budgetId, previousMonthIncome, fixedExpense, open, onOpenChange }: ExtraIncomeDialogProps) {
  const { toast } = useToast();
  const { data: items } = useBudgetItems(budgetId);
  const createItem = useCreateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  const extraIncomeItems = items?.filter(item => item.type === "extra_income") || [];
  
  // 計算上月額外收入
  const calculatedPrevExtra = Math.max(0, previousMonthIncome - fixedExpense);
  
  // 檢查是否已存在自動計算的上月額外收入項目
  const autoItem = extraIncomeItems.find(item => item.isAutoCalculated === "true");
  
  // 自動管理"上月額外收入"項目：創建或更新
  useEffect(() => {
    if (!budgetId) return;
    
    if (!autoItem) {
      // 如果不存在自動項目，創建一個
      createItem.mutateAsync({
        budgetId,
        data: {
          type: "extra_income",
          name: "上月額外收入",
          amount: calculatedPrevExtra.toString(),
          isAutoCalculated: "true",
        },
      });
    } else if (parseFloat(autoItem.amount) !== calculatedPrevExtra) {
      // 如果金額改變，更新項目
      fetch(`/api/budgets/items/${autoItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "extra_income",
          name: "上月額外收入",
          amount: calculatedPrevExtra.toString(),
          isAutoCalculated: "true",
        }),
      }).then(() => {
        // 刷新預算項目查詢
        queryClient.invalidateQueries({ queryKey: ['/api/budgets', budgetId, 'items'] });
      });
    }
  }, [budgetId, calculatedPrevExtra, autoItem?.amount]);

  const totalAmount = extraIncomeItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  const handleAddItem = async () => {
    if (!itemName || !itemAmount) {
      toast({
        title: "錯誤",
        description: "請填寫項目名稱和金額",
        variant: "destructive",
      });
      return;
    }

    try {
      await createItem.mutateAsync({
        budgetId,
        data: {
          type: "extra_income",
          name: itemName,
          amount: itemAmount,
          isAutoCalculated: "false",
        },
      });

      toast({
        title: "成功",
        description: "項目已新增",
      });

      setItemName("");
      setItemAmount("");
    } catch (error) {
      toast({
        title: "錯誤",
        description: "新增項目失敗",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string, isAuto: string) => {
    if (isAuto === "true") {
      toast({
        title: "錯誤",
        description: "無法刪除自動計算的項目",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteItem.mutateAsync(id);
      toast({
        title: "成功",
        description: "項目已刪除",
      });
    } catch (error) {
      toast({
        title: "錯誤",
        description: "刪除項目失敗",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>額外收入項目</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 總額顯示 */}
          <div className="p-4 bg-primary/10 border-primary/20 rounded-md border">
            <p className="text-sm text-muted-foreground mb-1">總金額</p>
            <p className="text-2xl font-bold text-primary">
              NT$ {totalAmount.toLocaleString()}
            </p>
          </div>

          {/* 項目列表 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {extraIncomeItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">尚無項目</p>
            ) : (
              extraIncomeItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    item.isAutoCalculated === "true" ? "bg-muted/30" : ""
                  }`}
                  data-testid={`extra-income-item-${item.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      {item.isAutoCalculated === "true" && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          自動計算
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      NT$ {parseFloat(item.amount).toLocaleString()}
                    </p>
                  </div>
                  {item.isAutoCalculated !== "true" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id, item.isAutoCalculated)}
                      data-testid={`button-delete-item-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 新增項目表單 */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label>項目名稱</Label>
              <Input
                placeholder="例如：獎金、兼職收入..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                data-testid="input-extra-item-name"
              />
            </div>
            <div>
              <Label>金額</Label>
              <Input
                type="number"
                placeholder="0"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                data-testid="input-extra-item-amount"
              />
            </div>
            <Button
              onClick={handleAddItem}
              className="w-full"
              disabled={createItem.isPending}
              data-testid="button-add-extra-item"
            >
              <Plus className="w-4 h-4 mr-1" />
              {createItem.isPending ? "新增中..." : "新增項目"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
