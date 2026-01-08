// src/hooks/useConfig.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfig, saveConfig } from "../lib/tauri";
import type { McpHubConfig, UserPreferences } from "../types";

/** Fetch the full MCP hub configuration */
export function useConfig() {
  return useQuery<McpHubConfig, Error>({
    queryKey: ["config"],
    queryFn: getConfig,
    staleTime: 60_000,
  });
}

/** Update user preferences within the central config */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation<McpHubConfig, Error, Partial<UserPreferences>>({
    mutationFn: async (updates) => {
      const current =
        queryClient.getQueryData<McpHubConfig>(["config"]) ??
        (await getConfig());

      const updated: McpHubConfig = {
        ...current,
        preferences: {
          ...current.preferences,
          ...updates,
        },
      };

      await saveConfig(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["config"], updated);
    },
  });
}

