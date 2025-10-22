import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestmentHolding } from "@shared/schema";

// 查詢所有持倉
export function useInvestments() {
  return useQuery<InvestmentHolding[]>({
    queryKey: ["/api/investments/holdings"],
    queryFn: async () => {
      const response = await fetch("/api/investments/holdings", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch investment holdings");
      }
      return response.json();
    },
  });
}

// 更新持倉價格
export function useUpdateHoldingPrice() {
  return useMutation({
    mutationFn: async ({ id, currentPrice }: { id: string; currentPrice: string }) => {
      return await apiRequest("PATCH", `/api/investments/holdings/${id}`, {
        currentPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    },
  });
}

// 刪除持倉
export function useDeleteHolding() {
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/investments/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    },
  });
}
