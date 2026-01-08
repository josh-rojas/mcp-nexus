import { Header } from "../components/layout/Header";
import { EnvironmentStatus } from "../components/settings/EnvironmentStatus";
import { CredentialManager } from "../components/settings/CredentialManager";
import { useRefreshUpdates, useServersWithUpdates } from "../hooks/useUpdates";
import { useConfig, useUpdatePreferences } from "../hooks/useConfig";
import { formatDistanceToNow } from "../lib/utils";

export function Settings() {
  const {
    data: serversWithUpdates,
    count: updateCount,
    checkedAt,
    isLoading: isCheckingUpdates,
  } = useServersWithUpdates();

  const refreshUpdatesMutation = useRefreshUpdates();

  const handleCheckForUpdates = () => {
    refreshUpdatesMutation.mutate();
  };

  const { data: config } = useConfig();
  const updatePreferences = useUpdatePreferences();
  const autoSyncEnabled = config?.preferences.autoSyncOnChanges ?? true;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Settings" subtitle="Configure MCP Nexus" />
      <main
        className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto"
        role="main"
      >
        <div className="max-w-2xl space-y-6">
          <EnvironmentStatus />

          {/* Update Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Updates
            </h2>
            <div className="space-y-4">
              {/* Check for Updates Button */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Check for server updates
                  </span>
                  <p className="text-sm text-gray-500">
                    {checkedAt
                      ? `Last checked ${formatDistanceToNow(checkedAt)}`
                      : "Never checked"}
                  </p>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  disabled={refreshUpdatesMutation.isPending}
                  className="px-4 py-2 bg-system-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {refreshUpdatesMutation.isPending ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
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
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
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
                      Check Now
                    </>
                  )}
                </button>
              </div>

              {/* Update Results */}
              {updateCount > 0 && !refreshUpdatesMutation.isPending && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">
                        {updateCount} update{updateCount !== 1 ? "s" : ""}{" "}
                        available
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                        {serversWithUpdates.map((update) => (
                          <li
                            key={update.serverId}
                            className="flex items-center gap-2"
                          >
                            <span className="font-medium">
                              {update.serverName}
                            </span>
                            {update.installedVersion &&
                              update.latestVersion && (
                                <span className="text-amber-600 dark:text-amber-500">
                                  {update.installedVersion} →{" "}
                                  {update.latestVersion}
                                </span>
                              )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                        To update, uninstall and reinstall the server from the
                        Marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Updates Message */}
              {updateCount === 0 &&
                checkedAt &&
                !isCheckingUpdates &&
                !refreshUpdatesMutation.isPending && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>All servers are up to date</span>
                    </div>
                  </div>
                )}
            </div>
          </section>

          {/* Credential Manager */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CredentialManager />
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Sync Settings
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Auto-sync on changes
                  </span>
                  <p className="text-sm text-gray-500">
                    Automatically sync to clients when config changes. If a sync
                    fails, you will see a notification with a link to the log
                    file.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-system-accent rounded"
                  checked={autoSyncEnabled}
                  onChange={(e) =>
                    updatePreferences.mutate({
                      autoSyncOnChanges: e.target.checked,
                    })
                  }
                  disabled={updatePreferences.isPending}
                />
              </label>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Config Location
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              ~/.mcp-nexus/config.json
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
