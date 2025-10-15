import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SavingsJar, InsertSavingsJar } from "@shared/schema";

export function useSavingsJars() {
  return useQuery<SavingsJar[]>({
    queryKey: ["/api/savings-jars"],
  });
}

export function useCreateSavingsJar() {
  return useMutation({
    mutationFn: async (data: Omit<InsertSavingsJar, "userId">) => {
      const res = await apiRequest("POST", "/api/savings-jars", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}

export function useUpdateSavingsJar() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSavingsJar> }) => {
      const res = await apiRequest("PATCH", `/api/savings-jars/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}

export function useDeleteSavingsJar() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/savings-jars/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-jars"] });
    },
  });
}
