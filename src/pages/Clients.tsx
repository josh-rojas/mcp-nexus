import { useState, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { ClientCard, SyncStatus, ManualConfigModal } from "../components/clients";
import {
  useClients,
  useSyncClient,
  useSyncAllClients,
  useSetClientSyncEnabled,
  useManualConfig,
} from "../hooks/useClients";
import type { ClientId, DetectedClient, SyncResult } from "../types";

export function Clients() {
  const { clients, isLoading, error, refetch } = useClients();
  const syncClient = useSyncClient();
  const syncAllClients = useSyncAllClients();
  const setClientSyncEnabled = useSetClientSyncEnabled();

  // Track which client is currently syncing
  const [syncingClientId, setSyncingClientId] = useState<ClientId | null>(null);

  // Track sync results for display
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Manual config modal state
  const [manualConfigClientId, setManualConfigClientId] = useState<ClientId | null>(null);
  const manualConfigQuery = useManualConfig(manualConfigClientId);

  // Get the client for the manual config modal
  const manualConfigClient = clients?.find(
    (c) => c.id === manualConfigClientId
  ) as DetectedClient | undefined;

  const handleSync = useCallback(
    async (clientId: ClientId) => {
      setSyncingClientId(clientId);
      setSyncResult(null);
      try {
        const result = await syncClient.mutateAsync(clientId);
        // Convert single result to SyncResult format for display
        setSyncResult({
          totalClients: 1,
          successful: result.success ? 1 : 0,
          failed: result.success ? 0 : 1,
          manualRequired: result.manualConfig ? 1 : 0,
          results: [result],
        });
      } finally {
        setSyncingClientId(null);
      }
    },
    [syncClient]
  );

  const handleSyncAll = useCallback(async () => {
    setIsSyncingAll(true);
    setSyncResult(null);
    try {
      const result = await syncAllClients.mutateAsync();
      setSyncResult(result);
    } finally {
      setIsSyncingAll(false);
    }
  }, [syncAllClients]);

  const handleToggleEnabled = useCallback(
    async (clientId: ClientId, enabled: boolean) => {
      await setClientSyncEnabled.mutateAsync({ clientId, enabled });
    },
    [setClientSyncEnabled]
  );

  const handleShowManualConfig = useCallback((clientId: ClientId) => {
    setManualConfigClientId(clientId);
  }, []);

  const handleCloseManualConfig = useCallback(() => {
    setManualConfigClientId(null);
  }, []);

  const handleDismissSyncResult = useCallback(() => {
    setSyncResult(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Clients" subtitle="Manage AI client configurations" />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                Detecting installed clients...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Clients" subtitle="Manage AI client configurations" />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Failed to detect clients
                </h3>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Count stats
  const detectedCount = clients?.filter((c) => c.detected).length ?? 0;
  const totalCount = clients?.length ?? 0;
  const enabledCount =
    clients?.filter((c) => c.detected && c.syncEnabled).length ?? 0;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Clients"
        subtitle={`${detectedCount} of ${totalCount} clients detected`}
        actions={
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll || enabledCount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSyncingAll ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync All
              </>
            )}
          </button>
        }
      />
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
        {/* Sync status notification */}
        {(syncResult || isSyncingAll) && (
          <div className="mb-6">
            <SyncStatus
              result={syncResult}
              isLoading={isSyncingAll}
              onDismiss={handleDismissSyncResult}
            />
          </div>
        )}

        {/* Client grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients?.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSync={handleSync}
              onToggleEnabled={handleToggleEnabled}
              onShowManualConfig={handleShowManualConfig}
              isSyncing={syncingClientId === client.id}
            />
          ))}
        </div>

        {/* Empty state */}
        {clients?.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No AI clients found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Install an AI client like Claude Desktop, Cursor, or VS Code to
              start managing MCP servers.
            </p>
          </div>
        )}
      </main>

      {/* Manual config modal */}
      <ManualConfigModal
        client={manualConfigClient ?? null}
        configJson={manualConfigQuery.data ?? null}
        isLoading={manualConfigQuery.isLoading}
        error={manualConfigQuery.error?.message ?? null}
        onClose={handleCloseManualConfig}
      />
    </div>
  );
}
