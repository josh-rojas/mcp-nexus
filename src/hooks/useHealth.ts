// src/hooks/useHealth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkHealth, checkAllHealth, getServerStatus } from "../lib/tauri";
import type { HealthCheckResult, HealthStatus } from "../types";

/** Hook for checking health of a single server */
export function useServerHealth(serverId: string | undefined) {
  return useQuery<HealthCheckResult, Error>({
    queryKey: ["health", serverId],
    queryFn: () => checkHealth(serverId!),
    enabled: !!serverId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

/** Hook for checking health of all servers */
export function useAllServerHealth() {
  return useQuery<HealthCheckResult[], Error>({
    queryKey: ["health", "all"],
    queryFn: checkAllHealth,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

/** Hook for getting quick server status */
export function useServerStatus(serverId: string | undefined) {
  return useQuery<HealthStatus, Error>({
    queryKey: ["status", serverId],
    queryFn: () => getServerStatus(serverId!),
    enabled: !!serverId,
    staleTime: 10000, // 10 seconds
  });
}

/** Hook for manually triggering a health check */
export function useHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation<HealthCheckResult, Error, string>({
    mutationFn: checkHealth,
    onSuccess: (result) => {
      // Update the cache for this server
      queryClient.setQueryData(["health", result.serverId], result);
      // Invalidate the all-health query
      queryClient.invalidateQueries({ queryKey: ["health", "all"] });
    },
  });
}

/** Hook for manually triggering health check on all servers */
export function useHealthCheckAll() {
  const queryClient = useQueryClient();

  return useMutation<HealthCheckResult[], Error, void>({
    mutationFn: checkAllHealth,
    onSuccess: (results) => {
      // Update the cache for each server
      for (const result of results) {
        queryClient.setQueryData(["health", result.serverId], result);
      }
      // Update the all-health query
      queryClient.setQueryData(["health", "all"], results);
    },
  });
}

/** Get a color class for a health status */
export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "text-green-500";
    case "unhealthy":
      return "text-red-500";
    case "running":
      return "text-blue-500";
    case "stopped":
      return "text-gray-400";
    case "unknown":
    default:
      return "text-yellow-500";
  }
}

/** Get a background color class for a health status */
export function getHealthStatusBgColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "bg-green-100 dark:bg-green-900/30";
    case "unhealthy":
      return "bg-red-100 dark:bg-red-900/30";
    case "running":
      return "bg-blue-100 dark:bg-blue-900/30";
    case "stopped":
      return "bg-gray-100 dark:bg-gray-800";
    case "unknown":
    default:
      return "bg-yellow-100 dark:bg-yellow-900/30";
  }
}

/** Get a human-readable label for a health status */
export function getHealthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "unhealthy":
      return "Unhealthy";
    case "running":
      return "Running";
    case "stopped":
      return "Stopped";
    case "unknown":
    default:
      return "Unknown";
  }
}

