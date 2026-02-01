import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserSettings } from "@db/schema";

async function fetchSettings(): Promise<UserSettings> {
  const response = await fetch("/api/settings", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json();
}

async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update settings");
  }
  return response.json();
}

async function completeOnboarding(): Promise<void> {
  const response = await fetch("/api/settings/complete-onboarding", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to complete onboarding");
  }
}

export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    queryFn: fetchSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      // Immediately update the local cache with the new values
      queryClient.setQueryData(["/api/settings"], data);
    },
  });
}



export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}