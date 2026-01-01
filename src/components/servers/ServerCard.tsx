import { useState } from "react";
import type { McpServer, ClientId } from "../../types";
import { ServerRuntimeBadge } from "./ServerRuntimeBadge";
import { getServerRuntimeRequirement } from "../../hooks/useDoctor";

interface ServerCardProps {
  server: McpServer;
  onToggleClient?: (serverId: string, clientId: ClientId, enabled: boolean) => void;
  onRemove?: (serverId: string) => void;
  onViewDetails?: (server: McpServer) => void;
}

/** Format relative time for installed date */
function formatInstalledDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Installed today";
  if (diffDays === 1) return "Installed yesterday";
  if (diffDays < 7) return `Installed ${diffDays}d ago`;
  if (diffDays < 30) return `Installed ${Math.floor(diffDays / 7)}w ago`;
  return `Installed ${date.toLocaleDateString()}`;
}

/** Get human-readable client name */
function getClientName(clientId: string): string {
  const names: Record<string, string> = {
    "claude-code": "Claude Code",
    "claude-desktop": "Claude Desktop",
    cursor: "Cursor",
    cline: "Cline",
    vscode: "VS Code",
    continue: "Continue",
    windsurf: "Windsurf",
    warp: "Warp",
  };
  return names[clientId] || clientId;
}

export function ServerCard({
  server,
  onToggleClient,
  onRemove,
  onViewDetails,
}: ServerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const runtimeRequirement = getServerRuntimeRequirement(server.source.type);

  const getSourceLabel = () => {
    switch (server.source.type) {
      case "npm":
        return `npm: ${server.source.package}`;
      case "uvx":
        return `uvx: ${server.source.package}`;
      case "docker":
        return `docker: ${server.source.image}`;
      case "local":
        return `local: ${server.source.path}`;
      case "remote":
        return `remote: ${server.source.url}`;
      case "github":
        return `github: ${server.source.repo}`;
      default:
        return "unknown";
    }
  };

  const getTransportBadge = () => {
    const isStdio = server.transport.type === "stdio";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          isStdio
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
        }`}
      >
        {isStdio ? "stdio" : "sse"}
      </span>
    );
  };

  const handleRemove = () => {
    if (showRemoveConfirm) {
      onRemove?.(server.id);
      setShowRemoveConfirm(false);
    } else {
      setShowRemoveConfirm(true);
    }
  };

  const handleToggleClient = (clientId: string, enabled: boolean) => {
    onToggleClient?.(server.id, clientId as ClientId, enabled);
  };

  // All available clients
  const allClients: ClientId[] = [
    "claude-code",
    "claude-desktop",
    "cursor",
    "cline",
    "vscode",
    "continue",
    "windsurf",
    "warp",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Main card content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {server.name}
              </h3>
              {getTransportBadge()}
              <ServerRuntimeBadge requirement={runtimeRequirement} compact />
            </div>

            {server.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {server.description}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
              {getSourceLabel()}
            </p>
          </div>

          {/* Actions dropdown */}
          <div className="flex items-center gap-2 ml-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={server.enabled}
                onChange={() => {
                  // Toggle all clients at once
                  if (server.enabled) {
                    // Disable for all clients
                    allClients.forEach((clientId) => {
                      if (server.enabledClients.includes(clientId)) {
                        handleToggleClient(clientId, false);
                      }
                    });
                  } else {
                    // Enable for all clients
                    allClients.forEach((clientId) => {
                      if (!server.enabledClients.includes(clientId)) {
                        handleToggleClient(clientId, true);
                      }
                    });
                  }
                }}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Client badges */}
        {server.enabledClients.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Enabled for {server.enabledClients.length} client
              {server.enabledClients.length !== 1 ? "s" : ""}:
            </p>
            <div className="flex flex-wrap gap-1">
              {server.enabledClients.map((clientId) => (
                <span
                  key={clientId}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {getClientName(clientId)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer with version and actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {server.installedVersion && (
              <span className="mr-3">v{server.installedVersion}</span>
            )}
            <span>{formatInstalledDate(server.installedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(server)}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View details"
              >
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
            {server.sourceUrl && (
              <a
                href={server.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View source"
              >
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded section with per-client toggles */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Enable for clients:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {allClients.map((clientId) => {
                const isEnabled = server.enabledClients.includes(clientId);
                return (
                  <label
                    key={clientId}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggleClient(clientId, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getClientName(clientId)}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Remove button */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              {showRemoveConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Remove this server?
                  </span>
                  <button
                    onClick={handleRemove}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remove Server
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
