// src/hooks/use-stats.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStats() {
  return useQuery({
    // Use the string directly from your routes file
    queryKey: [api.stats], 
    queryFn: async () => {
      // Use the string directly here too
      const res = await fetch(api.stats, { credentials: "include" });
      
      if (!res.ok) throw new Error("Failed to fetch stats");
      
      const data = await res.json();
      
      // Since your route file doesn't have the Zod/Parser logic anymore,
      // just return the data directly or parse it here.
      return data; 
    },
  });
}
