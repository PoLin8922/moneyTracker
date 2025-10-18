import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import type { Budget } from "@shared/schema";

export function useBudget(month: string) {
  return useQuery<Budget | null>({
    queryKey: ["/api/budgets", month],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(getApiUrl(`/api/budgets/${month}`), {
        headers,
        credentials: 'include',
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch budget");
      return response.json();
    },
  });
}
