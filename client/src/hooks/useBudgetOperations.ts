import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertBudget, Budget } from "@shared/schema";

export function useCreateBudget() {
  return useMutation({
    mutationFn: async (data: Omit<InsertBudget, 'userId'>) => {
      return apiRequest("POST", "/api/budgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}

export function useUpdateBudget() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      return apiRequest("PATCH", `/api/budgets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
  });
}
