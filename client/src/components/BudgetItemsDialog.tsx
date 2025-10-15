import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBudgetItems, useCreateBudgetItem, useDeleteBudgetItem } from "@/hooks/useBudgetItems";
import { Plus, Trash2 } from "lucide-react";

interface BudgetItemsDialogProps {
  budgetId: string;
  type: "fixed_income" | "fixed_expense";
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BudgetItemsDialog({ budgetId, type, title, open, onOpenChange }: BudgetItemsDialogProps) {
  const { toast } = useToast();
  const { data: items } = useBudgetItems(budgetId);
  const createItem = useCreateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  const filteredItems = items?.filter(item => item.type === type) || [];
  const totalAmount = filteredItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);

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
          type,
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

  const handleDeleteItem = async (id: string) => {
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
          <DialogTitle>{title}</DialogTitle>
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
            {filteredItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">尚無項目</p>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`budget-item-${item.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      NT$ {parseFloat(item.amount).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                    data-testid={`button-delete-item-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* 新增項目表單 */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label>項目名稱</Label>
              <Input
                placeholder="例如：房租、伙食..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                data-testid="input-item-name"
              />
            </div>
            <div>
              <Label>金額</Label>
              <Input
                type="number"
                placeholder="0"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                data-testid="input-item-amount"
              />
            </div>
            <Button
              onClick={handleAddItem}
              className="w-full"
              disabled={createItem.isPending}
              data-testid="button-add-item"
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
