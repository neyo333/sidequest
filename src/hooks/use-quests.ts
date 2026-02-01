import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Quest } from "@db/schema";

async function fetchQuests(): Promise<Quest[]> {
  const response = await fetch("/api/quests", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch quests");
  }
  return response.json();
}

async function createQuest(content: string): Promise<Quest> {
  const response = await fetch("/api/quests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error("Failed to create quest");
  }
  return response.json();
}

async function bulkCreateQuests(quests: string[]): Promise<Quest[]> {
  const response = await fetch("/api/quests/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quests }),
  });
  if (!response.ok) {
    throw new Error("Failed to create quests");
  }
  return response.json();
}

async function deleteQuest(id: number): Promise<void> {
  const response = await fetch(`/api/quests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete quest");
  }
}

async function bulkDeleteQuests(questIds: number[]): Promise<{ deleted: number }> {
  const response = await fetch("/api/quests/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ questIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete quests");
  }
  return response.json();
}

async function bulkArchiveQuests(questIds: number[]): Promise<{ archived: number }> {
  const response = await fetch("/api/quests/bulk-archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ questIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to archive quests");
  }
  return response.json();
}

export function useQuests() {
  return useQuery<Quest[]>({
    queryKey: ["/api/quests"],
    queryFn: fetchQuests,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}

export function useBulkCreateQuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCreateQuests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/quests"] });
      const previousQuests = queryClient.getQueryData<Quest[]>(["/api/quests"]);

      if (previousQuests) {
        queryClient.setQueryData<Quest[]>(
          ["/api/quests"],
          previousQuests.filter((q) => q.id !== id)
        );
      }

      return { previousQuests };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(["/api/quests"], context.previousQuests);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}

export function useBulkDeleteQuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteQuests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}

export function useBulkArchiveQuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkArchiveQuests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await fetch(`/api/quests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to update quest");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
  });
}