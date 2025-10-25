import { useEffect, useState, useMemo } from "react";
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
import { useAssets, useUpdateAsset } from "@/hooks/useAssets";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Edit2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { AssetAccount, LedgerEntry, InvestmentHolding } from "@shared/schema";

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

  // Balance adjustment state
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [excludeFromStats, setExcludeFromStats] = useState(true); // Default to true (exclude from stats)

  // Find the account
  const account = accounts?.find(a => a.id === accountId);

  // Fetch account transactions
  const { data: transactions } = useQuery<LedgerEntry[]>({
    queryKey: ['/api/ledger', { accountId }],
    queryFn: async () => {
      const { getApiUrl } = await import('@/lib/api');
      const sessionToken = localStorage.getItem('sessionToken');
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(getApiUrl(`/api/ledger?accountId=${accountId}`), { headers });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!accountId && open,
  });

  // Fetch investment holdings for calculating P&L
  const { data: holdings = [] } = useQuery<InvestmentHolding[]>({
    queryKey: ['/api/investments/holdings'],
    queryFn: async () => {
      const { getApiUrl } = await import('@/lib/api');
      const sessionToken = localStorage.getItem('sessionToken');
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(getApiUrl('/api/investments/holdings'), { headers });
      if (!response.ok) throw new Error('Failed to fetch holdings');
      return response.json();
    },
    enabled: !!accountId && open && (account?.type?.includes('股') || account?.type?.includes('加密貨幣')),
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

  // Balance adjustment mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: { newBalance: string; note: string; excludeFromStats: boolean }) => {
      if (!account || !accountId) throw new Error("No account selected");

      const currentBalance = parseFloat(account.balance);
      const targetBalance = parseFloat(data.newBalance);
      const difference = targetBalance - currentBalance;

      // Create a ledger entry for the adjustment
      await apiRequest('POST', '/api/ledger', {
        userId: account.userId,
        type: difference >= 0 ? 'income' : 'expense',
        amount: Math.abs(difference).toString(),
        category: '餘額調整',
        accountId: accountId,
        date: format(new Date(), 'yyyy-MM-dd'),
        note: data.note || '手動調整帳戶餘額',
        excludeFromMonthlyStats: data.excludeFromStats ? "true" : "false",
      });

      // Update account balance
      return await updateAsset.mutateAsync({
        id: accountId,
        data: {
          type: account.type,
          accountName: account.accountName,
          note: account.note,
          balance: data.newBalance,
          currency: account.currency,
          exchangeRate: account.exchangeRate,
          includeInTotal: account.includeInTotal,
          userId: account.userId,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ledger', { accountId }] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "成功",
        description: "帳戶餘額已調整",
      });
      setShowAdjustDialog(false);
      setNewBalance("");
      setAdjustmentNote("");
      setExcludeFromStats(true); // Reset to default
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "調整餘額失敗",
        variant: "destructive",
      });
    },
  });

  const handleAdjustBalance = () => {
    if (!newBalance || parseFloat(newBalance) < 0) {
      toast({
        title: "錯誤",
        description: "請輸入有效的餘額",
        variant: "destructive",
      });
      return;
    }

    adjustBalanceMutation.mutate({ newBalance, note: adjustmentNote, excludeFromStats });
  };

  const twdValue = currency === "TWD"
    ? parseFloat(balance || "0")
    : parseFloat(balance || "0") * parseFloat(exchangeRate);

  // 解析投資交易 note
  const parseInvestmentNote = (note: string) => {
    // 格式: "買入 台積電 (2330) 4股 @ $250"
    const match = note.match(/(.+?)\s+(.+?)\s+\((.+?)\)\s+(.+?)股\s+@\s+\$(.+?)(?:\s+|$)/);
    if (!match) return null;
    
    const [, action, name, ticker, quantityStr, priceStr] = match;
    return {
      action,
      name,
      ticker,
      quantity: parseFloat(quantityStr),
      pricePerShare: parseFloat(priceStr),
    };
  };

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
    
    // Filter holdings for this account
    const accountHoldings = holdings.filter(h => h.brokerAccountId === accountId);
    
    // Now calculate forward
    const history = sorted.map(tx => {
      const amount = parseFloat(tx.amount);
      const balanceAfter = tx.type === "income" ? currentBalance + amount : currentBalance - amount;
      
      // 處理持倉增加/減少，計算現值和損益
      let displayAmount = amount;
      let profitLoss: number | undefined;
      let profitLossPercent: number | undefined;
      
      if (tx.note && (tx.category === '持倉增加' || tx.category === '持倉減少')) {
        const parsed = parseInvestmentNote(tx.note);
        if (parsed) {
          const costBasis = parsed.quantity * parsed.pricePerShare;
          const holding = accountHoldings.find(h => h.ticker === parsed.ticker);
          
          if (holding) {
            const currentPrice = parseFloat(holding.currentPrice);
            const currentValue = parsed.quantity * currentPrice;
            profitLoss = currentValue - costBasis;
            profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
            displayAmount = currentValue; // 顯示現值而非本金
          }
        }
      }
      
      const record = {
        date: tx.date,
        balance: balanceAfter,
        amount: displayAmount,
        originalAmount: amount, // 保留原始本金
        type: tx.type,
        category: tx.category,
        note: tx.note,
        profitLoss,
        profitLossPercent,
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">帳戶餘額</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewBalance(account.balance);
                            setShowAdjustDialog(true);
                          }}
                          data-testid="button-adjust-balance"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          調整餘額
                        </Button>
                      </div>
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
                        {item.profitLoss !== undefined && (
                          <p className={`text-xs font-semibold mb-1 ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            損益: {item.profitLoss >= 0 ? '+' : ''}NT$ {item.profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            {item.profitLossPercent !== undefined && (
                              <span> ({item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercent.toFixed(2)}%)</span>
                            )}
                          </p>
                        )}
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

      <AlertDialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>調整帳戶餘額</AlertDialogTitle>
            <AlertDialogDescription>
              調整帳戶餘額將自動創建一筆「餘額調整」交易記錄。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-balance">新餘額</Label>
              <Input
                id="adjust-balance"
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="輸入新的帳戶餘額"
                data-testid="input-new-balance"
              />
              {account && newBalance && (
                <p className="text-sm text-muted-foreground">
                  差額: {parseFloat(newBalance) - parseFloat(account.balance) >= 0 ? '+' : ''}
                  {(parseFloat(newBalance) - parseFloat(account.balance)).toLocaleString()} {account.currency}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjust-note">備註</Label>
              <Textarea
                id="adjust-note"
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="例如：補登遺漏交易、銀行對帳調整"
                data-testid="input-adjustment-note"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="exclude-from-stats" className="text-base font-medium">
                  計入月收支統計
                </Label>
                <p className="text-sm text-muted-foreground">
                  開啟後，此調整會影響當月的收入或支出統計
                </p>
              </div>
              <Switch
                id="exclude-from-stats"
                checked={!excludeFromStats}
                onCheckedChange={(checked) => setExcludeFromStats(!checked)}
                data-testid="switch-exclude-from-stats"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-adjust">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdjustBalance}
              disabled={adjustBalanceMutation.isPending}
              data-testid="button-confirm-adjust"
            >
              確認調整
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
