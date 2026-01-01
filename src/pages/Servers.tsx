import { useState, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { ServerList } from "../components/servers/ServerList";
import { AddServerModal } from "../components/servers/AddServerModal";
import { useServers } from "../hooks/useServers";
import type { McpServer, ClientId, InstallSource } from "../types";

/** Loading state component */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        className="animate-spin h-8 w-8 text-blue-600"
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
    </div>
  );
}

/** Error state component */
function ErrorState({
  errorMessage,
  onRetry,
}: {
  errorMessage?: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-lg text-red-600 dark:text-red-400 font-medium">
        Error loading servers
      </p>
      <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{errorMessage}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

/** Empty state component */
function EmptyState({ onAddServer }: { onAddServer: () => void }) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-gray-900 dark:text-white">
        No servers installed
      </p>
      <p className="text-sm mt-2 max-w-md mx-auto">
        Install servers from the Marketplace or add them manually using the button above.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onAddServer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Server Manually
        </button>
        <a
          href="/marketplace"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Browse Marketplace
        </a>
      </div>
    </div>
  );
}

export function Servers() {
  const {
    servers,
    isLoading,
    error,
    refetch,
    toggleClient,
    isTogglingClient,
    uninstall,
    isRemoving,
    install,
    isInstalling,
    sync,
    isSyncing,
  } = useServers();

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Reserved for future server detail modal
  const [, setSelectedServer] = useState<McpServer | null>(null);

  const handleToggleClient = useCallback(
    (serverId: string, clientId: ClientId, enabled: boolean) => {
      toggleClient({ serverId, clientId, enabled });
    },
    [toggleClient]
  );

  const handleRemove = useCallback(
    (serverId: string) => {
      uninstall({ serverId, cleanupResources: true, syncAfterUninstall: true });
    },
    [uninstall]
  );

  const handleViewDetails = useCallback((server: McpServer) => {
    setSelectedServer(server);
    // For now, we just log - a detail modal could be added later
    console.log("View details for server:", server);
  }, []);

  const handleInstall = useCallback(
    (
      name: string,
      description: string,
      source: InstallSource,
      enabledClients: ClientId[],
      env?: Record<string, string>
    ) => {
      install(
        {
          request: {
            name,
            description: description || undefined,
            source,
            enabledClients,
            env,
          },
          syncAfterInstall: true,
        },
        {
          onSuccess: () => {
            setIsAddModalOpen(false);
          },
          onError: (err) => {
            console.error("Installation failed:", err);
            // TODO: Show error toast
          },
        }
      );
    },
    [install]
  );

  const handleSyncAll = useCallback(() => {
    sync(undefined, {
      onSuccess: (result) => {
        console.log("Sync completed:", result);
        // TODO: Show success toast
      },
      onError: (err) => {
        console.error("Sync failed:", err);
        // TODO: Show error toast
      },
    });
  }, [sync]);

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  // Count servers by transport type for subtitle
  const stdioCount = servers.filter((s) => s.transport.type === "stdio").length;
  const sseCount = servers.filter((s) => s.transport.type === "sse").length;
  const subtitle =
    servers.length > 0
      ? `${servers.length} server${servers.length !== 1 ? "s" : ""} (${stdioCount} stdio, ${sseCount} SSE)`
      : "Manage your installed MCP servers";

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Servers"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            {servers.length > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
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
                {isSyncing ? "Syncing..." : "Sync All"}
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Server
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
        {/* Status indicators */}
        {(isTogglingClient || isRemoving) && (
          <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2">
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
            {isRemoving ? "Removing server..." : "Updating server configuration..."}
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState errorMessage={error.message} onRetry={refetch} />
        ) : servers.length === 0 ? (
          <EmptyState onAddServer={handleOpenAddModal} />
        ) : (
          <ServerList
            servers={servers}
            onToggleClient={handleToggleClient}
            onRemove={handleRemove}
            onViewDetails={handleViewDetails}
          />
        )}
      </main>

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onInstall={handleInstall}
        isInstalling={isInstalling}
      />
    </div>
  );
}
