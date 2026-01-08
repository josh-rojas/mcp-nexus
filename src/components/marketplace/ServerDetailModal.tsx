import { useState, useCallback } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { MarketplaceServer, ClientId, DetectedClient } from "../../types";
import { useDetectedClients } from "../../hooks/useClients";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServerDetailModalProps {
  server: MarketplaceServer | null;
  onClose: () => void;
  onInstall: (
    server: MarketplaceServer,
    selectedClients: ClientId[],
    sseUrl?: string
  ) => void;
  isInstalling?: boolean;
}

/** Format large numbers with K/M suffixes */
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/** Get install command based on package registry */
function getInstallCommand(server: MarketplaceServer): string | null {
  if (!server.package_registry || !server.package_name) return null;

  switch (server.package_registry.toLowerCase()) {
    case "npm":
      return `npx -y ${server.package_name}`;
    case "pypi":
      return `uvx ${server.package_name}`;
    case "docker":
      return `docker run ${server.package_name}`;
    default:
      return null;
  }
}

/** Get runtime requirements based on package registry */
function getRuntimeRequirements(
  server: MarketplaceServer
): { runtime: string; description: string }[] {
  const requirements: { runtime: string; description: string }[] = [];

  if (server.package_registry) {
    switch (server.package_registry.toLowerCase()) {
      case "npm":
        requirements.push({
          runtime: "Node.js",
          description: "Required for npm packages",
        });
        break;
      case "pypi":
        requirements.push({
          runtime: "Python",
          description: "Required for Python packages",
        });
        requirements.push({
          runtime: "uv",
          description: "Recommended for fast package management",
        });
        break;
      case "docker":
        requirements.push({
          runtime: "Docker",
          description: "Required for containerized servers",
        });
        break;
    }
  }

  return requirements;
}

/** Get the transport type (stdio or sse) */
function getTransportType(server: MarketplaceServer): "stdio" | "sse" | "both" {
  const hasRemote = server.remotes && server.remotes.length > 0;
  const hasPackage = server.package_registry && server.package_name;

  if (hasRemote && hasPackage) return "both";
  if (hasRemote) return "sse";
  return "stdio";
}

/** Get initial transport mode based on server */
function getInitialTransportMode(server: MarketplaceServer): "stdio" | "sse" {
  return server.remotes && server.remotes.length > 0 ? "sse" : "stdio";
}

/** Inner content component - reset via key when server changes */
interface ServerDetailContentProps {
  server: MarketplaceServer;
  onClose: () => void;
  onInstall: (
    server: MarketplaceServer,
    selectedClients: ClientId[],
    sseUrl?: string
  ) => void;
  isInstalling: boolean;
}

function ServerDetailContent({
  server,
  onClose,
  onInstall,
  isInstalling,
}: ServerDetailContentProps) {
  const { data: clients, isLoading: isLoadingClients } = useDetectedClients();

  // Selected clients for installation
  const [selectedClients, setSelectedClients] = useState<Set<ClientId>>(
    new Set()
  );

  // SSE URL input for remote servers (initialize from server data)
  const [sseUrl, setSseUrl] = useState(server.remotes?.[0]?.url || "");

  // Transport mode selection (for servers that support both)
  const [transportMode, setTransportMode] = useState<"stdio" | "sse">(
    getInitialTransportMode(server)
  );

  const handleClientToggle = useCallback((clientId: ClientId) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const detected = clients?.filter((c) => c.detected) ?? [];
    const allSelected = detected.every((c) => selectedClients.has(c.id));

    if (allSelected) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(detected.map((c) => c.id)));
    }
  }, [clients, selectedClients]);

  const handleInstall = useCallback(() => {
    if (selectedClients.size === 0) return;

    const url = transportMode === "sse" ? sseUrl : undefined;
    onInstall(server, Array.from(selectedClients), url);
  }, [server, selectedClients, transportMode, sseUrl, onInstall]);

  const handleOpenSourceRepo = useCallback(async () => {
    if (server.source_code_url) {
      try {
        await openUrl(server.source_code_url);
      } catch {
        // Fallback to window.open if Tauri opener fails
        window.open(server.source_code_url, "_blank");
      }
    }
  }, [server.source_code_url]);

  const handleOpenExternalUrl = useCallback(async () => {
    if (server.external_url) {
      try {
        await openUrl(server.external_url);
      } catch {
        window.open(server.external_url, "_blank");
      }
    }
  }, [server.external_url]);

  const transportType = getTransportType(server);
  const installCommand = getInstallCommand(server);
  const requirements = getRuntimeRequirements(server);
  const detectedClients = clients?.filter((c) => c.detected) ?? [];
  const canInstall =
    selectedClients.size > 0 &&
    (transportMode === "stdio" || (transportMode === "sse" && sseUrl.trim()));

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="flex items-center gap-2">
              {server.name}
              {/* Transport badges */}
              {transportType === "both" && (
                <>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    stdio
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    SSE
                  </span>
                </>
              )}
              {transportType === "sse" && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  SSE / Remote
                </span>
              )}
              {transportType === "stdio" && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  stdio
                </span>
              )}
            </DialogTitle>
          </div>
          {server.package_registry && server.package_name && (
            <DialogDescription>
              {server.package_registry}: {server.package_name}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {server.short_description ||
                server.ai_description ||
                "No description available."}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            {server.github_stars !== undefined && server.github_stars > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{formatNumber(server.github_stars)} stars</span>
              </div>
            )}
            {server.package_download_count !== undefined &&
              server.package_download_count > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>
                    {formatNumber(server.package_download_count)} downloads
                  </span>
                </div>
              )}
          </div>

          {/* Links */}
          <div className="flex gap-3 flex-wrap">
            {server.source_code_url && (
              <button
                onClick={handleOpenSourceRepo}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View Source
              </button>
            )}
            {server.external_url && (
              <button
                onClick={handleOpenExternalUrl}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Website
              </button>
            )}
          </div>

          {/* Requirements */}
          {requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requirements
              </h3>
              <ul className="space-y-1">
                {requirements.map((req) => (
                  <li
                    key={req.runtime}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <svg
                      className="h-4 w-4 text-system-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{req.runtime}</span>
                    <span className="text-gray-400">- {req.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Install command preview */}
          {installCommand && transportMode === "stdio" && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Install Command
              </h3>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 font-mono text-sm text-gray-800 dark:text-gray-200">
                {installCommand}
              </div>
            </div>
          )}

          {/* Transport mode selection (for servers that support both) */}
          {transportType === "both" && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Type
              </h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="stdio"
                    checked={transportMode === "stdio"}
                    onChange={() => setTransportMode("stdio")}
                    className="w-4 h-4 text-system-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Local (stdio)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="sse"
                    checked={transportMode === "sse"}
                    onChange={() => setTransportMode("sse")}
                    className="w-4 h-4 text-system-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Remote (SSE)
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {transportMode === "stdio"
                  ? "Runs locally on your machine. Requires the runtime installed."
                  : "Connects to a remote server. No local installation needed."}
              </p>
            </div>
          )}

          {/* SSE URL input */}
          {(transportType === "sse" ||
            (transportType === "both" && transportMode === "sse")) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Server URL
              </h3>
              <input
                type="url"
                value={sseUrl}
                onChange={(e) => setSseUrl(e.target.value)}
                placeholder="https://api.example.com/mcp"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-system-accent focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the SSE endpoint URL for this MCP server
              </p>
            </div>
          )}

          {/* Client selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Install to Clients
              </h3>
              {detectedClients.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-system-accent dark:text-system-accent hover:underline"
                >
                  {detectedClients.every((c) => selectedClients.has(c.id))
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-system-accent"
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
            ) : detectedClients.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No AI clients detected. Install a supported client to continue.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {detectedClients.map((client: DetectedClient) => (
                  <label
                    key={client.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClients.has(client.id)
                        ? "border-system-accent bg-system-accent/5 dark:bg-system-accent/15"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      className="w-4 h-4 text-system-accent rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                        {client.name}
                      </span>
                      {client.syncMode === "manualOnly" && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Manual config
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            disabled={isInstalling}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInstall}
            disabled={!canInstall || isInstalling}
            className="px-4 py-2 bg-system-accent text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isInstalling ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Installing...
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Install
                {selectedClients.size > 0 && ` (${selectedClients.size})`}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Wrapper component that handles the key-based reset */
export function ServerDetailModal({
  server,
  onClose,
  onInstall,
  isInstalling = false,
}: ServerDetailModalProps) {
  // Fetch detailed information (with cache and background update)
  const { data: detailedServer } = useServerDetails(server?.name ?? null, server);
  
  // Use detailed server if available, otherwise fall back to the passed server
  const displayServer = detailedServer ?? server;

  if (!displayServer) return null;

  // Use key prop to reset the inner component when server changes
  return (
    <ServerDetailContent
      key={displayServer.name}
      server={displayServer}
      onClose={onClose}
      onInstall={onInstall}
      isInstalling={isInstalling}
    />
  );
}
