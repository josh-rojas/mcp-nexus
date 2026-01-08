import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  detectClients,
  getAllClientStatuses,
  syncClient,
  syncAllClients,
  getManualConfig,
  setClientSyncEnabled,
  importClientServers,
} from "../lib/tauri";
import type {
  DetectedClient,
  ClientSyncStatus,
  ClientId,
  ClientSyncResult,
  SyncResult,
  ImportResult,
} from "../types";
import { useAutoSync } from "./useAutoSync";

/** Hook for fetching detected clients */
export function useDetectedClients() {
  return useQuery<DetectedClient[], Error>({
    queryKey: ["clients", "detected"],
    queryFn: detectClients,
    staleTime: 30000, // 30 seconds
  });
}

/** Hook for fetching all client sync statuses */
export function useClientStatuses() {
  return useQuery<ClientSyncStatus[], Error>({
    queryKey: ["clients", "statuses"],
    queryFn: getAllClientStatuses,
    staleTime: 10000, // 10 seconds
  });
}

/** Hook for syncing to a single client */
export function useSyncClient() {
  const queryClient = useQueryClient();

  return useMutation<ClientSyncResult, Error, ClientId>({
    mutationFn: syncClient,
    onSuccess: () => {
      // Invalidate client statuses to refresh sync times
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Hook for syncing to all clients */
export function useSyncAllClients() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, void>({
    mutationFn: syncAllClients,
    onSuccess: () => {
      // Invalidate client statuses to refresh sync times
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Hook for getting manual config (for Warp) */
export function useManualConfig(clientId: ClientId | null) {
  return useQuery<string, Error>({
    queryKey: ["clients", "manualConfig", clientId],
    queryFn: () => getManualConfig(clientId!),
    enabled: clientId !== null,
    staleTime: 5000,
  });
}

/** Hook for toggling client sync enabled */
export function useSetClientSyncEnabled() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { clientId: ClientId; enabled: boolean }>({
    mutationFn: ({ clientId, enabled }) =>
      setClientSyncEnabled(clientId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Hook for importing servers from a client */
export function useImportClientServers() {
  const queryClient = useQueryClient();
  const { triggerAutoSync } = useAutoSync();

  return useMutation<
    ImportResult,
    Error,
    { clientId: ClientId; overwriteExisting?: boolean }
  >({
    mutationFn: ({ clientId, overwriteExisting }) =>
      importClientServers(clientId, overwriteExisting),
    onSuccess: () => {
      // Invalidate servers list after import
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      triggerAutoSync();
    },
  });
}

/** Combined hook for all client data */
export function useClients() {
  const detectedQuery = useDetectedClients();
  const statusesQuery = useClientStatuses();

  // Merge detected clients with their sync statuses
  const clients = detectedQuery.data?.map((detected) => {
    const status = statusesQuery.data?.find(
      (s) => s.clientId === detected.id
    );
    return {
      ...detected,
      syncEnabled: status?.enabled ?? true,
      lastSync: status?.lastSync,
      externallyModified: status?.externallyModified ?? false,
      syncError: status?.syncError,
    };
  });

  return {
    clients,
    isLoading: detectedQuery.isLoading || statusesQuery.isLoading,
    error: detectedQuery.error || statusesQuery.error,
    refetch: () => {
      detectedQuery.refetch();
      statusesQuery.refetch();
    },
  };
}
