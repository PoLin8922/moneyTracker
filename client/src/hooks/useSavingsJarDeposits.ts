import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SavingsJarDeposit, InsertSavingsJarDeposit } from "@shared/schema";

export function useSavingsJarDeposits(jarId?: string) {
  return useQuery<SavingsJarDeposit[]>({
    queryKey: ["/api/savings-jars", jarId, "deposits"],
    enabled: !!jarId,
  });
}

export function useCreateSavingsJarDeposit() {
  return useMutation({
    mutationFn: async ({ jarId, data }: { jarId: string; data: Omit<InsertSavingsJarDeposit, "jarId"> }) => {
      const res = await apiRequest("POST", `/api/savings-jars/${jarId}/deposits`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars", variables.jarId, "deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}
