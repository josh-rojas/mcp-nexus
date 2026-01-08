import { useState } from "react";
import {
  Loader2,
  RefreshCw,
  Copy,
  Monitor,
  Terminal,
  Code,
  Play,
  Wind,
  Server as ServerIcon,
} from "lucide-react";
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
      return <Code className={iconClass} />;
    case "claude-desktop":
      return <Monitor className={iconClass} />;
    case "cursor":
    case "vscode":
      return <Code className={iconClass} />;
    case "cline":
      return <Terminal className={iconClass} />;
    case "continue":
      return <Play className={iconClass} />;
    case "windsurf":
      return <Wind className={iconClass} />;
    case "warp":
      return <Terminal className={iconClass} />;
    default:
      return <ServerIcon className={iconClass} />;
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
                <Copy className="h-4 w-4" />
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
                    <Loader2
                      className="animate-spin h-4 w-4"
                      aria-label="Loading"
                      role="status"
                    />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
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
