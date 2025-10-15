import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SavingsJarCategory, InsertSavingsJarCategory } from "@shared/schema";

export function useSavingsJarCategories(jarId?: string) {
  return useQuery<SavingsJarCategory[]>({
    queryKey: ["/api/savings-jars", jarId, "categories"],
    enabled: !!jarId,
  });
}

export function useCreateSavingsJarCategory() {
  return useMutation({
    mutationFn: async ({ jarId, data }: { jarId: string; data: Omit<InsertSavingsJarCategory, "jarId"> }) => {
      const res = await apiRequest("POST", `/api/savings-jars/${jarId}/categories`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars", variables.jarId, "categories"] });
    },
  });
}

export function useUpdateSavingsJarCategory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSavingsJarCategory> }) => {
      const res = await apiRequest("PATCH", `/api/savings-jars/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}

export function useDeleteSavingsJarCategory() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/savings-jars/categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}
