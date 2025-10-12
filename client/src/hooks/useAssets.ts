import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetAccount, InsertAssetAccount } from "@shared/schema";

export function useAssets() {
  return useQuery<AssetAccount[]>({
    queryKey: ["/api/assets"],
  });
}

export function useCreateAsset() {
  return useMutation({
    mutationFn: async (data: InsertAssetAccount) => {
      const res = await apiRequest("POST", "/api/assets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/history"] });
    },
  });
}

export function useUpdateAsset() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAssetAccount> }) => {
      const res = await apiRequest("PATCH", `/api/assets/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/history"] });
    },
  });
}

export function useDeleteAsset() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/assets/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    },
  });
}

export function useAssetHistory() {
  return useQuery({
    queryKey: ["/api/assets/history"],
  });
}
