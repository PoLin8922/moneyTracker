import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { LedgerEntry, InsertLedgerEntry } from "@shared/schema";

export function useLedgerEntries() {
  return useQuery<LedgerEntry[]>({
    queryKey: ["/api/ledger"],
  });
}

export function useCreateLedgerEntry() {
  return useMutation({
    mutationFn: async (data: InsertLedgerEntry) => {
      const response = await import('@/lib/api').then(({ getApiUrl }) => 
        fetch(getApiUrl("/api/ledger"), {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(localStorage.getItem('sessionToken') ? {
              "Authorization": `Bearer ${localStorage.getItem('sessionToken')}`
            } : {})
          },
          body: JSON.stringify(data),
          credentials: "include",
        })
      );
      if (!response.ok) throw new Error("Failed to create ledger entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
    },
  });
}
