import { ShoppingCart, Coffee, Home, Car, Gift, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LedgerEntryProps {
  type: "income" | "expense";
  amount: number;
  originalAmount?: number;
  currency?: string;
  category: string;
  account: string;
  date: string;
  note?: string;
  onClick?: () => void;
  // 投資交易相關資訊
  investmentInfo?: {
    ticker: string;
    name: string;
    quantity: number;
    pricePerShare: number;
    currentPrice?: number; // 如果有提供，顯示現值和損益
    currentValue?: number; // 現值（持倉專用）
    profitLoss?: number; // 損益（持倉專用）
    costBasis?: number; // 本金（持倉專用）
  };
  profitLoss?: number; // 傳入的損益（用於持倉增加/減少）
}

const categoryIcons: Record<string, any> = {
  購物: ShoppingCart,
  餐飲: Coffee,
  房租: Home,
  交通: Car,
  禮物: Gift,
  薪資: DollarSign,
};

const categoryColors: Record<string, string> = {
  購物: "hsl(var(--chart-1))",
  餐飲: "hsl(var(--chart-2))",
  房租: "hsl(var(--chart-3))",
  交通: "hsl(var(--chart-4))",
  禮物: "hsl(var(--chart-5))",
  薪資: "hsl(var(--chart-3))",
};

export default function LedgerEntry({
  type,
  amount,
  originalAmount,
  currency = "TWD",
  category,
  account,
  date,
  note,
  onClick,
  investmentInfo,
  profitLoss: propProfitLoss,
}: LedgerEntryProps) {
  const Icon = categoryIcons[category] || DollarSign;
  const color = categoryColors[category] || "hsl(var(--chart-1))";
  
  // 如果是外幣，顯示原幣別金額和台幣金額
  const showOriginalCurrency = currency !== "TWD" && originalAmount !== undefined;
  
  // 計算投資損益
  const getInvestmentMetrics = () => {
    // 持倉增加/減少：使用傳入的 investmentInfo
    if ((category === '持倉增加' || category === '持倉減少') && investmentInfo) {
      if (investmentInfo.currentValue !== undefined && investmentInfo.costBasis !== undefined && investmentInfo.profitLoss !== undefined) {
        const profitLossPercent = investmentInfo.costBasis > 0 
          ? (investmentInfo.profitLoss / investmentInfo.costBasis) * 100 
          : 0;
        
        return {
          costBasis: investmentInfo.costBasis,
          currentValue: investmentInfo.currentValue,
          profitLoss: investmentInfo.profitLoss,
          profitLossPercent,
          isProfit: investmentInfo.profitLoss >= 0,
        };
      }
      return null;
    }
    
    // 股票買入/賣出：計算當前損益（如果有現價）
    if ((category === '股票買入' || category === '股票賣出') && investmentInfo && investmentInfo.currentPrice) {
      const { quantity, pricePerShare, currentPrice } = investmentInfo;
      const costBasis = quantity * pricePerShare;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      
      return {
        costBasis,
        currentValue,
        profitLoss,
        profitLossPercent,
        isProfit: profitLoss >= 0,
      };
    }
    
    return null;
  };
  
  const investmentMetrics = investmentInfo ? getInvestmentMetrics() : null;
  const isInvestmentTransaction = category === '股票買入' || category === '股票賣出' || category === '持倉增加' || category === '持倉減少';

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b last:border-b-0 ${onClick ? 'hover-elevate active-elevate-2 cursor-pointer transition-all' : ''}`}
      data-testid={`ledger-entry-${category}`}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{category}</p>
          {note && (
            <span className="text-xs text-muted-foreground">· {note}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{account}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
      <div className="text-right">
        {/* 持倉增加/減少：顯示本金、現值、損益 */}
        {(category === '持倉增加' || category === '持倉減少') && investmentMetrics && (
          <div className="space-y-0.5 mb-1">
            <div className="text-xs text-muted-foreground">
              本金: NT$ {investmentMetrics.costBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs font-medium">
              現值: NT$ {investmentMetrics.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className={`text-xs font-semibold ${investmentMetrics.isProfit ? 'text-green-600' : 'text-red-600'}`}>
              損益: {investmentMetrics.isProfit ? '+' : ''}NT$ {investmentMetrics.profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {' '}({investmentMetrics.isProfit ? '+' : ''}{investmentMetrics.profitLossPercent.toFixed(2)}%)
            </div>
          </div>
        )}
        
        {/* 股票買入/賣出：只顯示本金，如果有現價則顯示現值和損益 */}
        {(category === '股票買入' || category === '股票賣出') && investmentMetrics && (
          <div className="space-y-0.5 mb-1">
            <div className="text-xs text-muted-foreground">
              本金: NT$ {investmentMetrics.costBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs font-medium">
              現值: NT$ {investmentMetrics.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className={`text-xs font-semibold ${investmentMetrics.isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {investmentMetrics.isProfit ? '+' : ''}NT$ {investmentMetrics.profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {' '}({investmentMetrics.isProfit ? '+' : ''}{investmentMetrics.profitLossPercent.toFixed(2)}%)
            </div>
          </div>
        )}
        
        {/* 外幣交易 */}
        {showOriginalCurrency && !(category === '股票買入' || category === '股票賣出' || category === '持倉增加' || category === '持倉減少') && (
          <div className="text-xs text-muted-foreground mb-1">
            {type === "income" ? "+" : "-"}{currency} {originalAmount.toLocaleString()}
          </div>
        )}
        
        {/* 交易金額 - 持倉顯示現值，股票買入/賣出顯示本金，其他顯示原金額 */}
        <div
          className={`text-lg font-semibold ${
            type === "income" ? "text-chart-3" : "text-foreground"
          }`}
        >
          {type === "income" ? "+" : "-"}NT$ {amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
