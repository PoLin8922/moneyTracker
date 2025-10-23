import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestmentHolding } from "@shared/schema";

// 查詢所有持倉
export function useInvestments() {
  return useQuery<InvestmentHolding[]>({
    queryKey: ["/api/investments/holdings"],
    // 使用默認的 queryFn，它會自動帶上認證 token
    staleTime: 0, // 資料立即過期，確保每次都重新獲取
    refetchOnMount: 'always', // 每次組件掛載時都重新獲取
    refetchOnWindowFocus: true, // 視窗獲得焦點時重新獲取
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
