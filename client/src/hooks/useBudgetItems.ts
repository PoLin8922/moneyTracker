import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BudgetItem, InsertBudgetItem } from "@shared/schema";

export function useBudgetItems(budgetId?: string) {
  return useQuery<BudgetItem[]>({
    queryKey: ["/api/budgets", budgetId, "items"],
    enabled: !!budgetId,
  });
}

export function useCreateBudgetItem() {
  return useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string; data: Omit<InsertBudgetItem, "budgetId"> }) => {
      const res = await apiRequest("POST", `/api/budgets/${budgetId}/items`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", variables.budgetId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}

export function useUpdateBudgetItem() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBudgetItem> }) => {
      const res = await apiRequest("PATCH", `/api/budgets/items/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}

export function useDeleteBudgetItem() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/budgets/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}
