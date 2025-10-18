import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssets, useCreateAsset } from "@/hooks/useAssets";
import { useToast } from "@/hooks/use-toast";
import type { InsertAssetAccount } from "@shared/schema";

const defaultAccountTypes = ["台幣", "美元", "日幣", "台股", "美股", "加密貨幣", "房地產"];
const currencies = [
  { value: "TWD", label: "台幣 (TWD)" },
  { value: "USD", label: "美元 (USD)" },
  { value: "JPY", label: "日幣 (JPY)" },
  { value: "EUR", label: "歐元 (EUR)" },
  { value: "GBP", label: "英鎊 (GBP)" },
  { value: "CNY", label: "人民幣 (CNY)" },
  { value: "HKD", label: "港幣 (HKD)" },
];

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  const createAsset = useCreateAsset();
  
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [accountType, setAccountType] = useState("");
  const [customType, setCustomType] = useState("");
  const [showCustomType, setShowCustomType] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("TWD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [includeInTotal, setIncludeInTotal] = useState(true);

  const existingTypes = accounts 
    ? Array.from(new Set(accounts.map(a => a.type)))
    : [];
  const allTypes = Array.from(new Set([...defaultAccountTypes, ...existingTypes]));

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setAccountType("");
      setCustomType("");
      setShowCustomType(false);
      setAccountName("");
      setNote("");
      setBalance("");
      setCurrency("TWD");
      setExchangeRate("1");
      setIncludeInTotal(true);
    }
  }, [open]);

  useEffect(() => {
    // Fetch exchange rates on mount
    import('@/lib/api').then(({ getApiUrl }) => {
      fetch(getApiUrl('/api/exchange-rates'))
        .then(res => res.json())
        .then(rates => {
          setExchangeRates(rates);
        })
        .catch(err => console.error('Failed to fetch exchange rates:', err));
    });
  }, []);

  useEffect(() => {
    if (exchangeRates[currency]) {
      setExchangeRate(exchangeRates[currency].toString());
    }
  }, [currency, exchangeRates]);

  useEffect(() => {
    if (accountType === "__custom__" && !showCustomType) {
      setShowCustomType(true);
    }
  }, [accountType, showCustomType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalType = showCustomType ? customType : accountType;
    
    if (!finalType || !accountName || !balance) {
      toast({
        title: "錯誤",
        description: "請填寫所有必填欄位",
        variant: "destructive",
      });
      return;
    }

    const data: InsertAssetAccount = {
      type: finalType,
      accountName,
      note,
      balance,
      currency,
      exchangeRate,
      includeInTotal: includeInTotal ? "true" : "false",
      userId: "", // Will be set by backend
    };

    try {
      await createAsset.mutateAsync(data);
      toast({
        title: "成功",
        description: "帳戶已新增",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "錯誤",
        description: "新增帳戶失敗",
        variant: "destructive",
      });
    }
  };

  const twdValue = currency === "TWD"
    ? parseFloat(balance || "0")
    : parseFloat(balance || "0") * parseFloat(exchangeRate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加帳戶</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountType">帳戶類型 *</Label>
            {!showCustomType ? (
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger id="accountType" data-testid="select-account-type">
                  <SelectValue placeholder="選擇帳戶類型" />
                </SelectTrigger>
                <SelectContent>
                  {allTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ 自訂類型</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="輸入自訂類型"
                data-testid="input-custom-type"
              />
            )}
            {showCustomType && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomType(false);
                  setCustomType("");
                }}
              >
                返回選擇類型
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">帳戶名稱 *</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="例如：薪轉戶"
              data-testid="input-account-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備註</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="輸入備註資訊"
              data-testid="input-note"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">帳戶餘額 *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              data-testid="input-balance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">主要貨幣 *</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currency !== "TWD" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">匯率（轉換為台幣）</Label>
                <div className="flex gap-2">
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    data-testid="input-exchange-rate"
                    className="flex-1"
                  />
                  {exchangeRates[currency] && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExchangeRate(exchangeRates[currency].toString())}
                      data-testid="button-update-rate"
                    >
                      更新匯率
                    </Button>
                  )}
                </div>
                {exchangeRates[currency] && (
                  <p className="text-xs text-muted-foreground">
                    目前匯率: 1 {currency} = {exchangeRates[currency].toFixed(4)} TWD
                  </p>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">台幣等值</p>
                <p className="text-2xl font-bold text-primary">
                  NT$ {twdValue.toLocaleString()}
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="includeInTotal" className="cursor-pointer">
                計入總資產
              </Label>
              <p className="text-sm text-muted-foreground">
                此帳戶是否計入總資產計算
              </p>
            </div>
            <Switch
              id="includeInTotal"
              checked={includeInTotal}
              onCheckedChange={setIncludeInTotal}
              data-testid="switch-include-in-total"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              取消
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createAsset.isPending}
              data-testid="button-submit"
            >
              新增
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
