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
          <DialogTitle>更新 {holding.name} 的市場價格</DialogTitle>
          <DialogDescription>
            從券商 App 或金融網站查詢最新報價，更新後系統會自動計算市值和損益
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>當前持倉資訊</Label>
              <div className="p-3 bg-muted rounded-md space-y-1">
                <div className="text-sm font-medium">{holding.ticker} - {holding.name}</div>
                <div className="text-sm text-muted-foreground">
                  持有數量: {parseFloat(holding.quantity).toLocaleString()} 股
                </div>
                <div className="text-sm text-muted-foreground">
                  平均成本: ${parseFloat(holding.averageCost).toFixed(2)}/股
                </div>
                <div className="text-sm text-muted-foreground">
                  現值（舊）: ${parseFloat(holding.currentPrice).toFixed(2)}/股
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPrice">最新市場價格（每股）*</Label>
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                placeholder="例如：台積電 1450、TSLA 350"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                💡 提示：查詢台股可用證券 App，美股可用 Yahoo Finance
              </p>
            </div>

            {newPrice && parseFloat(newPrice) > 0 && (
              <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-md">
                <div className="text-sm font-semibold text-primary">📊 更新後預覽</div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">現值（新）：</span>
                    <span className="font-medium ml-2">${parseFloat(newPrice).toFixed(2)}/股</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">市值：</span>
                    <span className="font-medium ml-2">
                      ${(parseFloat(holding.quantity) * parseFloat(newPrice)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({parseFloat(holding.quantity).toLocaleString()} 股 × ${parseFloat(newPrice).toFixed(2)})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">總成本：</span>
                    <span className="font-medium ml-2">
                      ${(parseFloat(holding.quantity) * parseFloat(holding.averageCost)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2"></div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">損益：</span>
                    <span className={`font-semibold ml-2 ${
                      parseFloat(newPrice) >= parseFloat(holding.averageCost) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(newPrice) >= parseFloat(holding.averageCost) ? '+' : ''}
                      ${((parseFloat(holding.quantity) * parseFloat(newPrice)) - (parseFloat(holding.quantity) * parseFloat(holding.averageCost))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      {' '}
                      ({(((parseFloat(newPrice) - parseFloat(holding.averageCost)) / parseFloat(holding.averageCost)) * 100).toFixed(2)}%)
                    </span>
                  </div>
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
