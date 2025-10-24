import { motion } from "framer-motion";
import PiggyBankIcon from "@/components/PiggyBankIcon";
import AssetTrendChart from "@/components/AssetTrendChart";
import AssetBreakdownChart from "@/components/AssetBreakdownChart";
import AssetDetailTable from "@/components/AssetDetailTable";
import ThemeToggle from "@/components/ThemeToggle";
import AddAccountDialog from "@/components/AddAccountDialog";
import AccountDetailDialog from "@/components/AccountDetailDialog";
import TransferDialog from "@/components/TransferDialog";
import { useAssets } from "@/hooks/useAssets";
import { useMemo, useState } from "react";

export default function AssetOverview() {
  const { data: accounts, isLoading } = useAssets();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [accountDetailOpen, setAccountDetailOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const netWorth = useMemo(() => {
    if (!accounts) return 0;
    return accounts
      .filter(account => account.includeInTotal === "true")
      .reduce((total, account) => {
        const twd = account.currency === "TWD"
          ? parseFloat(account.balance)
          : parseFloat(account.balance) * parseFloat(account.exchangeRate || "1");
        return total + twd;
      }, 0);
  }, [accounts]);

  const { totalAssets, totalLiabilities } = useMemo(() => {
    if (!accounts) return { totalAssets: 0, totalLiabilities: 0 };
    
    return accounts
      .filter(account => account.includeInTotal === "true")
      .reduce((acc, account) => {
        const twd = account.currency === "TWD"
          ? parseFloat(account.balance)
          : parseFloat(account.balance) * parseFloat(account.exchangeRate || "1");
        
        if (twd >= 0) {
          acc.totalAssets += twd;
        } else {
          acc.totalLiabilities += Math.abs(twd);
        }
        return acc;
      }, { totalAssets: 0, totalLiabilities: 0 });
  }, [accounts]);

  const breakdownData = useMemo(() => {
    if (!accounts) return [];
    
    const typeGroups = accounts
      .filter(account => account.includeInTotal === "true")
      .reduce((acc, account) => {
        const twd = account.currency === "TWD"
          ? parseFloat(account.balance)
          : parseFloat(account.balance) * parseFloat(account.exchangeRate || "1");
        
        if (!acc[account.type]) {
          acc[account.type] = 0;
        }
        acc[account.type] += twd;
        return acc;
      }, {} as Record<string, number>);

    // 使用投資組合風格的藍綠色調，確保顏色不重複
    const colors = [
      "hsl(220, 65%, 70%)", // 藍色
      "hsl(200, 60%, 72%)", // 淺藍
      "hsl(180, 55%, 68%)", // 青色
      "hsl(210, 60%, 70%)", // 天藍
      "hsl(190, 58%, 70%)", // 藍綠
      "hsl(230, 62%, 72%)", // 深藍
      "hsl(170, 52%, 66%)", // 綠藍
      "hsl(240, 60%, 68%)", // 紫藍
      "hsl(160, 50%, 65%)", // 青綠
      "hsl(195, 58%, 71%)", // 天空藍
    ];

    return Object.entries(typeGroups).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [accounts]);

  const detailData = useMemo(() => {
    if (!accounts) return [];
    
    const grouped = accounts.reduce((acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = [];
      }
      const twd = account.currency === "TWD"
        ? parseFloat(account.balance)
        : parseFloat(account.balance) * parseFloat(account.exchangeRate || "1");
      
      acc[account.type].push({
        accountId: account.id,
        bank: account.accountName,
        balance: parseFloat(account.balance),
        currency: account.currency,
        exchangeRate: parseFloat(account.exchangeRate || "1"),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([type, assets]) => ({
      type,
      assets,
    }));
  }, [accounts]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
    setAccountDetailOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">資產總覽</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center py-8"
        >
          <PiggyBankIcon netWorth={netWorth} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 text-center space-y-4"
          >
            <div>
              <p className="text-sm text-muted-foreground mb-1">總資產淨值</p>
              <h2 className="text-5xl font-bold text-primary" data-testid="text-networth">
                NT$ {netWorth.toLocaleString()}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div>
                <p className="text-sm text-muted-foreground mb-1">資產</p>
                <p className="text-2xl font-bold text-chart-3" data-testid="text-total-assets">
                  NT$ {totalAssets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">負債</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-total-liabilities">
                  NT$ {totalLiabilities.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AssetTrendChart currentNetWorth={netWorth} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AssetBreakdownChart data={breakdownData.length > 0 ? breakdownData : undefined} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AssetDetailTable 
            data={detailData.length > 0 ? detailData : undefined} 
            onAccountClick={handleAccountClick}
            onAddAccount={() => setAddAccountOpen(true)}
            onTransfer={() => setTransferOpen(true)}
          />
        </motion.div>
      </div>

      <AddAccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
      />

      <AccountDetailDialog
        accountId={selectedAccountId}
        open={accountDetailOpen}
        onOpenChange={setAccountDetailOpen}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
    </div>
  );
}
