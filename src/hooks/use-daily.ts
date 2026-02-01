import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DailyQuest, Achievement } from "@db/schema";

async function fetchDailyQuests(): Promise<DailyQuest[]> {
  const response = await fetch("/api/daily", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch daily quests");
  }
  return response.json();
}

async function completeDailyQuest(data: {
  id: number;
  completed: boolean;
}): Promise<{ dailyQuest: DailyQuest; newAchievements: Achievement[] }> {
  const response = await fetch(`/api/daily/${data.id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ completed: data.completed }),
  });
  if (!response.ok) {
    throw new Error("Failed to complete quest");
  }
  return response.json();
}

export function useDailyQuests() {
  return useQuery<DailyQuest[]>({
    queryKey: ["/api/daily"],
    queryFn: fetchDailyQuests,
  });
}

export function useCompleteDailyQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeDailyQuest,
    onMutate: async ({ id, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/daily"] });

      // Snapshot previous value
      const previousQuests = queryClient.getQueryData<DailyQuest[]>(["/api/daily"]);

      // Optimistically update
      if (previousQuests) {
        queryClient.setQueryData<DailyQuest[]>(
          ["/api/daily"],
          previousQuests.map((q) =>
            q.id === id ? { ...q, completed, completedAt: completed ? new Date().toISOString() : null } : q
          )
        );
      }

      return { previousQuests };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQuests) {
        queryClient.setQueryData(["/api/daily"], context.previousQuests);
      }
    },
    onSuccess: (data) => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}