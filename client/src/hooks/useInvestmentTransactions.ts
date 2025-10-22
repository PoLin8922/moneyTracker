import { useQuery } from "@tanstack/react-query";
import type { InvestmentTransaction } from "@shared/schema";

// 查詢所有投資交易記錄
export function useInvestmentTransactions() {
  return useQuery<InvestmentTransaction[]>({
    queryKey: ["/api/investments/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/investments/transactions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch investment transactions");
      }
      return response.json();
    },
  });
}
