import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServers,
  getServer,
  updateServer,
  removeServer,
  toggleServerClient,
  installMcpServer,
  uninstallMcpServer,
  syncAllClients,
} from "../lib/tauri";
import type {
  McpServer,
  ClientId,
  InstallServerRequest,
  InstallServerResponse,
  UninstallServerResponse,
  SyncResult,
} from "../types";
import { useAutoSync } from "./useAutoSync";

/** Hook for fetching all servers */
export function useServerList() {
  return useQuery<McpServer[], Error>({
    queryKey: ["servers"],
    queryFn: getServers,
    staleTime: 10000, // 10 seconds
  });
}

/** Hook for fetching a single server by ID */
export function useServer(serverId: string | null) {
  return useQuery<McpServer, Error>({
    queryKey: ["servers", serverId],
    queryFn: () => getServer(serverId!),
    enabled: serverId !== null,
    staleTime: 10000,
  });
}

/** Hook for updating a server */
export function useUpdateServer() {
  const queryClient = useQueryClient();
  const { triggerAutoSync } = useAutoSync();

  return useMutation<McpServer, Error, McpServer>({
    mutationFn: updateServer,
    onSuccess: (updatedServer) => {
      // Update the server in the cache
      queryClient.setQueryData<McpServer[]>(["servers"], (old) =>
        old?.map((s) => (s.id === updatedServer.id ? updatedServer : s))
      );
      queryClient.invalidateQueries({ queryKey: ["servers", updatedServer.id] });
      triggerAutoSync();
    },
  });
}

/** Hook for removing a server */
export function useRemoveServer() {
  const queryClient = useQueryClient();

  return useMutation<McpServer, Error, string>({
    mutationFn: removeServer,
    onSuccess: (_, serverId) => {
      // Remove the server from the cache
      queryClient.setQueryData<McpServer[]>(["servers"], (old) =>
        old?.filter((s) => s.id !== serverId)
      );
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

/** Hook for toggling a server's client status */
export function useToggleServerClient() {
  const queryClient = useQueryClient();
  const { triggerAutoSync } = useAutoSync();

  return useMutation<
    void,
    Error,
    { serverId: string; clientId: ClientId; enabled: boolean }
  >({
    mutationFn: ({ serverId, clientId, enabled }) =>
      toggleServerClient(serverId, clientId, enabled),
    onSuccess: () => {
      // Invalidate servers to refresh the list
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      triggerAutoSync();
    },
  });
}

/** Hook for installing a new MCP server */
export function useInstallServer() {
  const queryClient = useQueryClient();

  return useMutation<
    InstallServerResponse,
    Error,
    { request: InstallServerRequest; syncAfterInstall?: boolean }
  >({
    mutationFn: ({ request, syncAfterInstall = true }) =>
      installMcpServer(request, syncAfterInstall),
    onSuccess: () => {
      // Refresh the servers list after installation
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Hook for uninstalling an MCP server */
export function useUninstallServer() {
  const queryClient = useQueryClient();

  return useMutation<
    UninstallServerResponse,
    Error,
    { serverId: string; cleanupResources?: boolean; syncAfterUninstall?: boolean }
  >({
    mutationFn: ({ serverId, cleanupResources = true, syncAfterUninstall = true }) =>
      uninstallMcpServer(serverId, cleanupResources, syncAfterUninstall),
    onSuccess: () => {
      // Refresh the servers list after uninstallation
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Hook for syncing all clients */
export function useSyncServers() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, void>({
    mutationFn: syncAllClients,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", "statuses"] });
    },
  });
}

/** Combined hook for server management */
export function useServers() {
  const listQuery = useServerList();
  const toggleClientMutation = useToggleServerClient();
  const removeMutation = useRemoveServer();
  const uninstallMutation = useUninstallServer();
  const installMutation = useInstallServer();
  const syncMutation = useSyncServers();

  return {
    // Data
    servers: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,

    // Toggle client for a server
    toggleClient: toggleClientMutation.mutate,
    isTogglingClient: toggleClientMutation.isPending,

    // Remove/uninstall a server
    remove: removeMutation.mutate,
    uninstall: uninstallMutation.mutate,
    isRemoving: removeMutation.isPending || uninstallMutation.isPending,

    // Install a new server
    install: installMutation.mutate,
    installAsync: installMutation.mutateAsync,
    isInstalling: installMutation.isPending,
    installError: installMutation.error,

    // Sync all servers to clients
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
}
