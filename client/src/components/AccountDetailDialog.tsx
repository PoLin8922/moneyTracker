import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssets, useUpdateAsset } from "@/hooks/useAssets";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Edit2, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import type { AssetAccount, LedgerEntry } from "@shared/schema";

const currencies = [
  { value: "TWD", label: "台幣 (TWD)" },
  { value: "USD", label: "美元 (USD)" },
  { value: "JPY", label: "日幣 (JPY)" },
  { value: "EUR", label: "歐元 (EUR)" },
  { value: "GBP", label: "英鎊 (GBP)" },
  { value: "CNY", label: "人民幣 (CNY)" },
  { value: "HKD", label: "港幣 (HKD)" },
];

interface AccountDetailDialogProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountDetailDialog({ accountId, open, onOpenChange }: AccountDetailDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  const updateAsset = useUpdateAsset();

  const [isEditing, setIsEditing] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  
  // Form state
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("TWD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [includeInTotal, setIncludeInTotal] = useState(true);

  // Find the account
  const account = accounts?.find(a => a.id === accountId);

  // Fetch account transactions
  const { data: transactions } = useQuery<LedgerEntry[]>({
    queryKey: ['/api/ledger', { accountId }],
    queryFn: async () => {
      const response = await fetch(`/api/ledger?accountId=${accountId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!accountId && open,
  });

  useEffect(() => {
    if (account) {
      setAccountName(account.accountName);
      setNote(account.note || "");
      setBalance(account.balance);
      setCurrency(account.currency);
      setExchangeRate(account.exchangeRate || "1");
      setIncludeInTotal(account.includeInTotal === "true");
    }
  }, [account]);

  useEffect(() => {
    // Fetch exchange rates on mount
    fetch('/api/exchange-rates')
      .then(res => res.json())
      .then(rates => {
        setExchangeRates(rates);
      })
      .catch(err => console.error('Failed to fetch exchange rates:', err));
  }, []);

  useEffect(() => {
    if (exchangeRates[currency] && isEditing) {
      setExchangeRate(exchangeRates[currency].toString());
    }
  }, [currency, exchangeRates, isEditing]);

  const handleSave = async () => {
    if (!account || !accountId) return;

    try {
      await updateAsset.mutateAsync({
        id: accountId,
        data: {
          type: account.type,
          accountName,
          note,
          balance,
          currency,
          exchangeRate,
          includeInTotal: includeInTotal ? "true" : "false",
          userId: account.userId,
        },
      });
      toast({
        title: "成功",
        description: "帳戶資訊已更新",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "錯誤",
        description: "更新帳戶失敗",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (account) {
      setAccountName(account.accountName);
      setNote(account.note || "");
      setBalance(account.balance);
      setCurrency(account.currency);
      setExchangeRate(account.exchangeRate || "1");
      setIncludeInTotal(account.includeInTotal === "true");
    }
    setIsEditing(false);
  };

  const twdValue = currency === "TWD"
    ? parseFloat(balance || "0")
    : parseFloat(balance || "0") * parseFloat(exchangeRate);

  // Calculate balance progression from transactions
  // Note: transactions come sorted newest first, so we need to reverse to calculate from oldest
  const balanceHistory = transactions ? (() => {
    const sorted = [...transactions].reverse(); // oldest first
    let currentBalance = parseFloat(account?.balance || "0");
    
    // Calculate initial balance (before all transactions)
    sorted.forEach(tx => {
      const amount = parseFloat(tx.amount);
      if (tx.type === "income") {
        currentBalance -= amount; // subtract to go back in time
      } else {
        currentBalance += amount; // add to go back in time
      }
    });
    
    // Now calculate forward
    const history = sorted.map(tx => {
      const amount = parseFloat(tx.amount);
      const balanceAfter = tx.type === "income" ? currentBalance + amount : currentBalance - amount;
      
      const record = {
        date: tx.date,
        balance: balanceAfter,
        amount,
        type: tx.type,
        category: tx.category,
        note: tx.note,
      };
      
      currentBalance = balanceAfter;
      return record;
    });
    
    return history.reverse(); // newest first for display
  })() : [];

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{account.accountName}</span>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-account"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                編輯
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" data-testid="tab-info">帳戶資訊</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">交易記錄</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountName">帳戶名稱 *</Label>
                  <Input
                    id="edit-accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    data-testid="input-edit-account-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-note">備註</Label>
                  <Textarea
                    id="edit-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    data-testid="input-edit-note"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-balance">帳戶餘額 *</Label>
                  <Input
                    id="edit-balance"
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    data-testid="input-edit-balance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-currency">主要貨幣 *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="edit-currency" data-testid="select-edit-currency">
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
                      <Label htmlFor="edit-exchangeRate">匯率（轉換為台幣）</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-exchangeRate"
                          type="number"
                          step="0.0001"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value)}
                          data-testid="input-edit-exchange-rate"
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
                    <Label htmlFor="edit-includeInTotal" className="cursor-pointer">
                      計入總資產
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      此帳戶是否計入總資產計算
                    </p>
                  </div>
                  <Switch
                    id="edit-includeInTotal"
                    checked={includeInTotal}
                    onCheckedChange={setIncludeInTotal}
                    data-testid="switch-edit-include-in-total"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    data-testid="button-cancel-edit"
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    className="flex-1"
                    disabled={updateAsset.isPending}
                    data-testid="button-save-edit"
                  >
                    儲存
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">帳戶類型</p>
                      <p className="font-medium">{account.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">帳戶餘額</p>
                      <p className="text-2xl font-bold text-primary">
                        {account.currency} {parseFloat(account.balance).toLocaleString()}
                      </p>
                      {account.currency !== "TWD" && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ≈ NT$ {twdValue.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {account.note && (
                      <div>
                        <p className="text-sm text-muted-foreground">備註</p>
                        <p className="font-medium">{account.note}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">計入總資產</p>
                      <p className="font-medium">{account.includeInTotal === "true" ? "是" : "否"}</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            {!balanceHistory || balanceHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                此帳戶尚無交易記錄
              </div>
            ) : (
              <div className="space-y-2">
                {balanceHistory.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                          {item.type === 'income' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.category}</p>
                          {item.note && (
                            <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(item.date), 'PPP', { locale: zhTW })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.type === 'income' ? '+' : '-'} NT$ {item.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          餘額: NT$ {item.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
