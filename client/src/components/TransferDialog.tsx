import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ArrowRightLeft } from "lucide-react";
import type { AssetAccount } from "@shared/schema";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransferDialog({ open, onOpenChange }: TransferDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccountId || !toAccountId || !amount) {
      toast({
        title: "錯誤",
        description: "請填寫所有必填欄位",
        variant: "destructive",
      });
      return;
    }

    if (fromAccountId === toAccountId) {
      toast({
        title: "錯誤",
        description: "轉出和轉入帳戶不能相同",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "錯誤",
        description: "轉帳金額必須大於 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount,
          note,
        }),
      });

      if (!response.ok) {
        throw new Error("Transfer failed");
      }

      toast({
        title: "轉帳成功",
        description: "轉帳交易已完成並記錄到記帳本",
      });

      // Reset form
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setNote("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "轉帳失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromAccount = accounts?.find(a => a.id === fromAccountId);
  const toAccount = accounts?.find(a => a.id === toAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            轉帳
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">轉出帳戶 *</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger id="fromAccount" data-testid="select-from-account">
                <SelectValue placeholder="選擇轉出帳戶" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.type} - {account.accountName} 
                    ({account.currency} {parseFloat(account.balance).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">轉入帳戶 *</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger id="toAccount" data-testid="select-to-account">
                <SelectValue placeholder="選擇轉入帳戶" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.type} - {account.accountName}
                    ({account.currency} {parseFloat(account.balance).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">轉帳金額 *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="輸入金額"
              data-testid="input-amount"
            />
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                可用餘額: {fromAccount.currency} {parseFloat(fromAccount.balance).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備註</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="選填"
              data-testid="input-note"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? "處理中..." : "確認轉帳"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
