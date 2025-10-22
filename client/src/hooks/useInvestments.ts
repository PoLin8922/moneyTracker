import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestmentHolding } from "@shared/schema";

// 查詢所有持倉
export function useInvestments() {
  return useQuery<InvestmentHolding[]>({
    queryKey: ["/api/investments/holdings"],
    queryFn: async () => {
      console.log('🔍 前端: 開始查詢持倉...');
      console.log('🔍 API URL:', '/api/investments/holdings');
      
      try {
        const response = await fetch("/api/investments/holdings", {
          credentials: "include",
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response OK:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ 前端: 持倉查詢失敗', response.status, errorText);
          throw new Error(`Failed to fetch investment holdings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ 前端: 持倉查詢成功，數量:', data.length);
        console.log('📊 前端: 持倉資料:', data);
        
        if (!Array.isArray(data)) {
          console.error('❌ 前端: 返回的資料不是陣列:', data);
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('❌ 前端: 查詢持倉時發生錯誤:', error);
        throw error;
      }
    },
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
