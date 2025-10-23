import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateHoldingPrice } from "@/hooks/useInvestments";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import type { InvestmentHolding } from "@shared/schema";

interface UpdatePriceDialogProps {
  holding: InvestmentHolding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdatePriceDialog({
  holding,
  open,
  onOpenChange,
}: UpdatePriceDialogProps) {
  const [newPrice, setNewPrice] = useState(holding.currentPrice);
  const updatePrice = useUpdateHoldingPrice();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast({
        title: "錯誤",
        description: "請輸入有效的價格",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePrice.mutateAsync({
        id: holding.id,
        currentPrice: newPrice,
      });

      toast({
        title: "更新成功",
        description: `${holding.name} 的價格已更新為 $${newPrice}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "更新失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>更新價格</DialogTitle>
          <DialogDescription>
            更新 {holding.name} ({holding.ticker}) 的當前價格
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>當前持倉</Label>
              <div className="text-sm text-muted-foreground">
                數量: {parseFloat(holding.quantity).toLocaleString()} 股
              </div>
              <div className="text-sm text-muted-foreground">
                平均成本: ${parseFloat(holding.averageCost).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                現值: ${parseFloat(holding.currentPrice).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPrice">新價格 *</Label>
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                placeholder="輸入最新價格"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>

            {newPrice && parseFloat(newPrice) > 0 && (
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">更新後預覽</div>
                <div className="text-sm">
                  市值: ${(parseFloat(holding.quantity) * parseFloat(newPrice)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm">
                  損益: ${((parseFloat(holding.quantity) * parseFloat(newPrice)) - (parseFloat(holding.quantity) * parseFloat(holding.averageCost))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  {' '}
                  ({(((parseFloat(newPrice) - parseFloat(holding.averageCost)) / parseFloat(holding.averageCost)) * 100).toFixed(2)}%)
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={updatePrice.isPending}>
              {updatePrice.isPending && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              確認更新
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
