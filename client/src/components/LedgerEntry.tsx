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
}: LedgerEntryProps) {
  const Icon = categoryIcons[category] || DollarSign;
  const color = categoryColors[category] || "hsl(var(--chart-1))";
  
  // 如果是外幣，顯示原幣別金額和台幣金額
  const showOriginalCurrency = currency !== "TWD" && originalAmount !== undefined;

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
        {showOriginalCurrency && (
          <div className="text-xs text-muted-foreground mb-1">
            {type === "income" ? "+" : "-"}{currency} {originalAmount.toLocaleString()}
          </div>
        )}
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
