// src/hooks/useUpdates.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  checkForUpdates,
  checkServerUpdate,
  getUpdateCount,
} from "../lib/tauri";
import type { UpdateCheckResult, ServerUpdate } from "../types";

/** Query key for update-related queries */
const UPDATE_QUERY_KEY = ["updates"];

/**
 * Hook to check for updates for all installed servers
 *
 * This performs a full update check against npm/PyPI registries.
 * The check is relatively expensive (network calls per server),
 * so we use a longer stale time.
 */
export function useCheckForUpdates(options?: { enabled?: boolean }) {
  return useQuery<UpdateCheckResult, Error>({
    queryKey: [...UPDATE_QUERY_KEY, "all"],
    queryFn: checkForUpdates,
    // Don't refetch automatically - let user trigger manually
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get just the update count
 *
 * Useful for dashboard badges where we don't need the full details.
 */
export function useUpdateCount(options?: { enabled?: boolean }) {
  return useQuery<number, Error>({
    queryKey: [...UPDATE_QUERY_KEY, "count"],
    queryFn: getUpdateCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to check updates for a single server
 *
 * @param serverId - The UUID of the server to check
 */
export function useServerUpdate(
  serverId: string,
  options?: { enabled?: boolean }
) {
  return useQuery<ServerUpdate | null, Error>({
    queryKey: [...UPDATE_QUERY_KEY, "server", serverId],
    queryFn: () => checkServerUpdate(serverId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Mutation hook to manually trigger an update check
 *
 * This is useful for a "Check for Updates" button in settings.
 */
export function useRefreshUpdates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkForUpdates,
    onSuccess: (data) => {
      // Update the cache with the new results
      queryClient.setQueryData([...UPDATE_QUERY_KEY, "all"], data);
      queryClient.setQueryData([...UPDATE_QUERY_KEY, "count"], data.updatesAvailable);
    },
  });
}

/**
 * Helper to invalidate all update-related queries
 *
 * Call this after installing/uninstalling a server to refresh update status.
 */
export function useInvalidateUpdates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: UPDATE_QUERY_KEY });
  };
}

/**
 * Hook to get servers that have updates available
 *
 * Filters the full update check result to only return servers with updates.
 */
export function useServersWithUpdates() {
  const { data, ...rest } = useCheckForUpdates();

  const serversWithUpdates = data?.updates.filter((u) => u.updateAvailable) ?? [];

  return {
    ...rest,
    data: serversWithUpdates,
    count: serversWithUpdates.length,
    totalChecked: data?.serversChecked ?? 0,
    skipped: data?.serversSkipped ?? 0,
    errors: data?.errors ?? [],
    checkedAt: data?.checkedAt,
  };
}
