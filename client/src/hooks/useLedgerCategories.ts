import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { LedgerCategory, InsertLedgerCategory } from "@shared/schema";

export function useLedgerCategories(type?: "income" | "expense") {
  return useQuery<LedgerCategory[]>({
    queryKey: type ? ["/api/ledger-categories", type] : ["/api/ledger-categories"],
    queryFn: async () => {
      const url = type ? `/api/ledger-categories?type=${type}` : "/api/ledger-categories";
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        // 嘗試解析錯誤訊息
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // 如果無法解析 JSON，使用預設訊息
          const textError = await response.text();
          if (textError) {
            errorMessage = textError;
          }
        }
        
        // 針對 403 錯誤提供友善訊息
        if (response.status === 403) {
          throw new Error("請重新登入以繼續使用");
        }
        
        throw new Error(errorMessage);
      }
      
      // 確保回應是有效的 JSON
      const text = await response.text();
      console.log('📥 GET ledger-categories 回應:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        bodyLength: text.length,
        body: text.substring(0, 200) // 顯示前 200 字元
      });
      
      if (!text) {
        console.log('⚠️ 空回應，返回空陣列');
        return [];
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('❌ JSON 解析錯誤 - 完整回應:', text);
        console.error('❌ 解析錯誤詳情:', e);
        throw new Error(`伺服器回應格式錯誤: ${text.substring(0, 100)}`);
      }
    },
  });
}

export function useCreateLedgerCategory() {
  return useMutation({
    mutationFn: async (data: Omit<InsertLedgerCategory, 'userId'>) => {
      const response = await fetch("/api/ledger-categories", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        // 嘗試解析錯誤訊息
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const textError = await response.text();
          if (textError) {
            errorMessage = textError;
          }
        }
        
        // 針對 403 錯誤提供友善訊息
        if (response.status === 403) {
          throw new Error("請重新登入以繼續使用");
        }
        
        throw new Error(errorMessage);
      }
      
      // 確保回應是有效的 JSON
      const text = await response.text();
      console.log('📥 POST ledger-categories 回應:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        bodyLength: text.length,
        body: text.substring(0, 200)
      });
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('❌ POST JSON 解析錯誤 - 完整回應:', text);
        console.error('❌ 解析錯誤詳情:', e);
        throw new Error(`伺服器回應格式錯誤: ${text.substring(0, 100)}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-categories"] });
    },
  });
}

export function useDeleteLedgerCategory() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ledger-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete ledger category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-categories"] });
    },
  });
}
