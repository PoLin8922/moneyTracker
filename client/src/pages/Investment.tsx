import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvestmentHoldingsTable from "@/components/InvestmentHoldingsTable";
import InvestmentTransactionDialog from "@/components/InvestmentTransactionDialog";
import AssetBreakdownChart from "@/components/AssetBreakdownChart";
import ThemeToggle from "@/components/ThemeToggle";
import { useInvestments, useSyncPrices } from "@/hooks/useInvestments";
import { Plus, RefreshCw } from "lucide-react";

export default function Investment() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { data: holdings = [], isLoading, error, refetch } = useInvestments();
  const syncPrices = useSyncPrices();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('💡 Investment 頁面渲染');
  console.log('📊 持倉狀態:', { 
    holdingsCount: holdings.length, 
    isLoading, 
    hasError: !!error,
    holdings: holdings.map(h => ({ ticker: h.ticker, name: h.name, quantity: h.quantity }))
  });

  // 執行價格同步
  const performSync = async () => {
    if (holdings.length === 0) {
      console.log('⚠️ 無持倉，跳過同步');
      return;
    }
    
    console.log('🔄 執行自動價格同步...');
    try {
      await syncPrices.mutateAsync();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('❌ 價格同步失敗:', error);
    }
  };

  // 組件掛載時：立即同步價格
  useEffect(() => {
    console.log('🔄 Investment 頁面已掛載，立即同步價格...');
    performSync();
  }, []); // 只在掛載時執行一次

  // 設置自動輪詢：每 10 秒同步一次
  useEffect(() => {
    if (holdings.length === 0) {
      console.log('⚠️ 無持倉，停止自動同步');
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    console.log('⏰ 啟動自動同步：每 10 秒更新一次價格');
    
    // 設置定時器
    syncIntervalRef.current = setInterval(() => {
      performSync();
    }, 10000); // 10 秒

    // 清理函數：組件卸載時清除定時器
    return () => {
      if (syncIntervalRef.current) {
        console.log('🛑 停止自動同步');
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [holdings.length]); // 持倉數量變化時重新設置

  // 按資產類型分組計算總市值
  const portfolioData = holdings.reduce((acc, holding) => {
    const type = holding.type;
    const marketValue = parseFloat(holding.quantity) * parseFloat(holding.currentPrice);
    
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += marketValue;
    } else {
      acc.push({
        name: type,
        value: marketValue,
        color: type === "台股" ? "hsl(220, 65%, 70%)" : 
               type === "美股" ? "hsl(200, 60%, 72%)" : 
               "hsl(180, 55%, 68%)",
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  // 計算總覽數據
  const totalValue = holdings.reduce((sum, h) => {
    return sum + (parseFloat(h.quantity) * parseFloat(h.currentPrice));
  }, 0);

  const totalCost = holdings.reduce((sum, h) => {
    return sum + (parseFloat(h.quantity) * parseFloat(h.averageCost));
  }, 0);

  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">投資組合</h1>
            {lastSyncTime && (
              <p className="text-xs text-muted-foreground mt-1">
                {syncPrices.isPending && (
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    同步中...
                  </span>
                )}
                {!syncPrices.isPending && (
                  <span>
                    最後更新: {lastSyncTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">總覽</h3>
              {holdings.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  🔄 價格每 10 秒自動更新
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              新增交易
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">載入中...</div>
          ) : holdings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              尚無投資持倉，點擊「新增交易」開始記錄
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">總市值</p>
                <p className="text-2xl font-bold" data-testid="text-total-value">
                  NT$ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">總成本</p>
                <p className="text-2xl font-bold" data-testid="text-total-cost">
                  NT$ {totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">總損益</p>
                <p
                  className={`text-2xl font-bold ${
                    totalPL >= 0 ? "text-chart-3" : "text-destructive"
                  }`}
                  data-testid="text-total-pl"
                >
                  {totalPL >= 0 ? "+" : ""}NT$ {totalPL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-sm ml-2">
                    ({totalPLPercent >= 0 ? "+" : ""}{totalPLPercent.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          )}
        </Card>

        {portfolioData.length > 0 && (
          <AssetBreakdownChart data={portfolioData} />
        )}

        <InvestmentHoldingsTable holdings={holdings} />
      </div>

      <InvestmentTransactionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}
