import { useState } from "react";
import type { DetectedClient, ClientId } from "../../types";

interface ClientCardProps {
  client: DetectedClient & {
    syncEnabled: boolean;
    lastSync?: string;
    externallyModified: boolean;
    syncError?: string;
  };
  onSync: (clientId: ClientId) => void;
  onToggleEnabled: (clientId: ClientId, enabled: boolean) => void;
  onShowManualConfig: (clientId: ClientId) => void;
  isSyncing: boolean;
}

/** Get icon for client type */
function ClientIcon({ clientId }: { clientId: ClientId }) {
  const iconClass = "h-8 w-8";

  switch (clientId) {
    case "claude-code":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 17l6-6-6-6 2-2 8 8-8 8-2-2z" />
          <path d="M12 19h8v2h-8z" />
        </svg>
      );
    case "claude-desktop":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6l-2 2v2h8v-2l-2-2h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h16v12z" />
        </svg>
      );
    case "cursor":
    case "vscode":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
        </svg>
      );
    case "cline":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-3 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      );
    case "continue":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7L8 5z" />
        </svg>
      );
    case "windsurf":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 2C9.64 2 7.21 3.79 6.3 6.28L2 12l4.3 5.72C7.21 20.21 9.64 22 12.5 22c3.31 0 6-2.69 6-6V8c0-3.31-2.69-6-6-6zm0 18c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
        </svg>
      );
    case "warp":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
  }
}

/** Format relative time for last sync */
function formatLastSync(isoString?: string): string {
  if (!isoString) return "Never synced";

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function ClientCard({
  client,
  onSync,
  onToggleEnabled,
  onShowManualConfig,
  isSyncing,
}: ClientCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isManualOnly = client.syncMode === "manualOnly";
  const hasError = !!client.error || !!client.syncError;

  const getStatusBadge = () => {
    if (!client.detected) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          Not detected
        </span>
      );
    }

    if (isManualOnly) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          Manual Config
        </span>
      );
    }

    if (hasError) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          Error
        </span>
      );
    }

    if (client.externallyModified) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          Modified externally
        </span>
      );
    }

    if (client.configExists) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          Configured
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        Ready
      </span>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-shadow ${
        isHovered ? "shadow-md" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                client.detected
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}
            >
              <ClientIcon clientId={client.id} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {client.name}
              </h3>
              {client.detected && client.configPath && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[200px]">
                  {client.configPath.toString()}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Stats */}
        {client.detected && (
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
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
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                />
              </svg>
              <span>{client.serverCount} servers</span>
            </div>
            {!isManualOnly && (
              <div className="flex items-center gap-1">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formatLastSync(client.lastSync)}</span>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {hasError && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
            {client.error || client.syncError}
          </div>
        )}

        {/* Actions */}
        {client.detected && (
          <div className="mt-4 flex items-center justify-between">
            {/* Enable/Disable toggle */}
            {!isManualOnly && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={client.syncEnabled}
                  onChange={(e) => onToggleEnabled(client.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-sync
                </span>
              </label>
            )}

            {/* Sync button */}
            {isManualOnly ? (
              <button
                onClick={() => onShowManualConfig(client.id)}
                className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
              >
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Config
              </button>
            ) : (
              <button
                onClick={() => onSync(client.id)}
                disabled={isSyncing || !client.syncEnabled}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isSyncing ? (
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
                    Sync
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
