import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import {
  ServerSummary,
  ClientSummary,
  EnvironmentSummary,
  QuickActions,
  FirstRunWelcome,
  RecentActivity,
  UpdateSummary,
} from "../components/dashboard";
import { useServerList } from "../hooks/useServers";
import { useDetectedClients } from "../hooks/useClients";
import { initializeConfig, type InitResult } from "../lib/tauri";

export function Dashboard() {
  const { data: servers, isLoading: isLoadingServers } = useServerList();
  const { data: clients } = useDetectedClients();
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize config on mount
  useEffect(() => {
    initializeConfig()
      .then(setInitResult)
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : "Failed to initialize");
      });
  }, []);

  const hasServers = (servers?.length ?? 0) > 0;
  const hasClients =
    (clients?.filter((c) => c.detected).length ?? 0) > 0;
  const isFirstRun = initResult?.firstRun && !hasServers;

  // Show error if initialization failed
  if (initError) {
    return (
      <div className="flex-1 flex flex-col">
        <Header
          title="Dashboard"
          subtitle="Overview of your MCP servers and clients"
        />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-700 dark:text-red-300">
            <h3 className="text-lg font-medium mb-2">Initialization Error</h3>
            <p>{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard"
        subtitle="Overview of your MCP servers and clients"
      />
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        {/* First Run Welcome */}
        {isFirstRun && (
          <div className="mb-6">
            <FirstRunWelcome />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <ServerSummary />
          <ClientSummary />
          <EnvironmentSummary />
          {hasServers && <UpdateSummary />}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions hasServers={hasServers} hasClients={hasClients} />
        </div>

        {/* Recent Activity (only show if there are servers) */}
        {hasServers && (
          <div>
            <RecentActivity />
          </div>
        )}

        {/* Empty state for new users who dismissed the welcome */}
        {!isFirstRun && !hasServers && !isLoadingServers && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No servers installed yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Browse the marketplace to discover and install MCP servers, or add
              your own servers manually.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
