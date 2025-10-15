import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BudgetCategory, InsertBudgetCategory } from "@shared/schema";

export function useBudgetCategories(budgetId: string | undefined) {
  return useQuery<BudgetCategory[]>({
    queryKey: ["/api/budgets", budgetId, "categories"],
    enabled: !!budgetId,
  });
}

export function useCreateBudgetCategory() {
  return useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string; data: Omit<InsertBudgetCategory, 'budgetId'> }) => {
      return apiRequest("POST", `/api/budgets/${budgetId}/categories`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", variables.budgetId, "categories"] });
    },
  });
}

export function useUpdateBudgetCategory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetCategory> }) => {
      return apiRequest("PATCH", `/api/budgets/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}

export function useDeleteBudgetCategory() {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/budgets/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}
