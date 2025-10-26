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
      if (!response.ok) throw new Error("Failed to fetch ledger categories");
      return response.json();
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
        const errorText = await response.text();
        throw new Error(`Failed to create ledger category: ${errorText}`);
      }
      return response.json();
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
