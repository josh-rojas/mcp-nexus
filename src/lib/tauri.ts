import { invoke } from "@tauri-apps/api/core";
import type {
  McpServer,
  McpHubConfig,
  DetectedClient,
  ClientSyncStatus,
  ClientConfigInfo,
  DoctorReport,
  SyncResult,
  ClientSyncResult,
  ImportResult,
  ClientId,
  MarketplaceServer,
  SearchServersParams,
  SearchResult,
  InstallServerRequest,
  InstallServerResponse,
  UninstallServerResponse,
  ValidateInstallResponse,
  InstallSource,
  UpdateCheckResult,
  ServerUpdate,
  CheckPackageVersionResponse,
  KeychainResponse,
  StoreCredentialResult,
  HealthCheckResult,
  HealthStatus,
} from "../types";

/** Result of initialization check */
export interface InitResult {
  firstRun: boolean;
  configDir: string;
  configPath: string;
}

/** Initialize the config system and return status */
export async function initializeConfig(): Promise<InitResult> {
  return invoke("initialize_config");
}

/** Get the full configuration */
export async function getConfig(): Promise<McpHubConfig> {
  return invoke("get_config");
}

/** Save the full configuration */
export async function saveConfig(config: McpHubConfig): Promise<void> {
  return invoke("save_config", { config });
}

/** Get all servers */
export async function getServers(): Promise<McpServer[]> {
  return invoke("get_servers");
}

/** Get a single server by ID */
export async function getServer(serverId: string): Promise<McpServer> {
  return invoke("get_server", { serverId });
}

/** Add a new server */
export async function addServer(server: McpServer): Promise<McpServer> {
  return invoke("add_server", { server });
}

/** Update an existing server */
export async function updateServer(server: McpServer): Promise<McpServer> {
  return invoke("update_server", { server });
}

/** Remove a server by ID */
export async function removeServer(serverId: string): Promise<McpServer> {
  return invoke("remove_server", { serverId });
}

/** Toggle a server's enabled status for a specific client */
export async function toggleServerClient(
  serverId: string,
  clientId: string,
  enabled: boolean
): Promise<void> {
  return invoke("toggle_server_client", { serverId, clientId, enabled });
}

// Client detection commands (Phase 2.1)

/** Detect installed AI clients */
export async function detectClients(): Promise<DetectedClient[]> {
  return invoke("detect_clients");
}

/** Get detailed sync status for a specific client */
export async function getClientStatus(
  clientId: ClientId
): Promise<ClientSyncStatus> {
  return invoke("get_client_status", { clientId });
}

/** Get sync status for all clients */
export async function getAllClientStatuses(): Promise<ClientSyncStatus[]> {
  return invoke("get_all_client_statuses");
}

/** Get config info for a client (for import purposes) */
export async function getClientConfig(
  clientId: ClientId
): Promise<ClientConfigInfo | null> {
  return invoke("get_client_config", { clientId });
}

// Sync commands

/** Sync configuration to a single client */
export async function syncClient(clientId: ClientId): Promise<ClientSyncResult> {
  return invoke("sync_client", { clientId });
}

/** Sync configuration to all enabled clients */
export async function syncAllClients(): Promise<SyncResult> {
  return invoke("sync_all_clients");
}

/** Import servers from a client's configuration */
export async function importClientServers(
  clientId: ClientId,
  overwriteExisting: boolean = false
): Promise<ImportResult> {
  return invoke("import_client_servers", { clientId, overwriteExisting });
}

/** Get the generated manual config JSON for a client (like Warp) */
export async function getManualConfig(clientId: ClientId): Promise<string> {
  return invoke("get_manual_config", { clientId });
}

/** Enable or disable syncing for a specific client */
export async function setClientSyncEnabled(
  clientId: ClientId,
  enabled: boolean
): Promise<void> {
  return invoke("set_client_sync_enabled", { clientId, enabled });
}

/** Run environment doctor check (Phase 1.4) */
export async function runDoctor(): Promise<DoctorReport> {
  return invoke("run_doctor");
}

/**
 * Helper to unwrap KeychainResponse
 */
async function invokeKeychain<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const response = await invoke<KeychainResponse<T>>(command, args);
  if (!response.success) {
    throw new Error(response.error || "Unknown keychain error");
  }
  return response.data as T;
}

/** Store a credential in the keychain (Phase 5) */
export async function saveCredential(
  name: string,
  value: string
): Promise<StoreCredentialResult> {
  return invokeKeychain("save_credential", { name, value });
}

/** Get a credential from the keychain (Phase 5) */
export async function getCredentialValue(name: string): Promise<string> {
  return invokeKeychain("get_credential_value", { name });
}

/** Delete a credential from the keychain (Phase 5) */
export async function deleteCredential(name: string): Promise<boolean> {
  return invokeKeychain("delete_credential", { name });
}

/** List credential keys (Phase 5) */
export async function listCredentials(): Promise<string[]> {
  return invokeKeychain("list_credentials");
}

/** Check if a credential exists */
export async function checkCredentialExists(name: string): Promise<boolean> {
  return invokeKeychain("check_credential_exists", { name });
}

/** Validate credential references in env vars */
export async function validateCredentialReferences(
  envVars: Record<string, string>
): Promise<string[]> {
  return invokeKeychain("validate_credential_references", { envVars });
}

// Marketplace commands (Phase 3.1)

/** Search for servers in the PulseMCP marketplace */
export async function searchServers(
  params: SearchServersParams
): Promise<SearchResult> {
  return invoke("search_servers", { params });
}

/** Get details for a specific server by name */
export async function getServerDetails(
  name: string
): Promise<MarketplaceServer | null> {
  return invoke("get_server_details", { name });
}

/** Clear the marketplace cache (for manual refresh) */
export async function clearMarketplaceCache(): Promise<void> {
  return invoke("clear_marketplace_cache");
}

/** Check if we have cached data for a search query */
export async function checkMarketplaceCache(
  params: SearchServersParams
): Promise<boolean> {
  return invoke("check_marketplace_cache", { params });
}

// Installation commands (Phase 4.1)

/**
 * Install a new MCP server
 *
 * This command:
 * 1. Validates that required runtimes are available
 * 2. For GitHub sources, clones the repository and runs setup
 * 3. Creates the server configuration
 * 4. Saves to central config
 * 5. Syncs to enabled clients (if syncAfterInstall is true)
 */
export async function installMcpServer(
  request: InstallServerRequest,
  syncAfterInstall: boolean = true
): Promise<InstallServerResponse> {
  return invoke("install_mcp_server", { request, syncAfterInstall });
}

/**
 * Uninstall an MCP server
 *
 * This command:
 * 1. Removes the server from the central config
 * 2. Cleans up any local resources (e.g., cloned repositories)
 * 3. Syncs the removal to all clients (if syncAfterUninstall is true)
 */
export async function uninstallMcpServer(
  serverId: string,
  cleanupResources: boolean = true,
  syncAfterUninstall: boolean = true
): Promise<UninstallServerResponse> {
  return invoke("uninstall_mcp_server", {
    serverId,
    cleanupResources,
    syncAfterUninstall,
  });
}

/**
 * Validate that a server can be installed
 *
 * Checks that required runtimes are available without actually installing
 */
export async function validateInstall(
  source: InstallSource
): Promise<ValidateInstallResponse> {
  return invoke("validate_install", { request: { source } });
}

/**
 * Check if required runtimes are available for a package registry
 *
 * @param registry - The package registry (npm, pypi, docker, github)
 */
export async function checkRuntimeForRegistry(
  registry: string
): Promise<ValidateInstallResponse> {
  return invoke("check_runtime_for_registry", { registry });
}

// Update checking commands (Phase 4.4)

/**
 * Check for updates for all installed servers
 *
 * This queries npm/PyPI registries to compare installed versions
 * against the latest available versions.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  return invoke("check_for_updates");
}

/**
 * Check for updates for a single server by ID
 *
 * @param serverId - The UUID of the server to check
 */
export async function checkServerUpdate(
  serverId: string
): Promise<ServerUpdate | null> {
  return invoke("check_server_update", { serverId });
}

/**
 * Check the latest version for a specific package
 *
 * Useful for checking before installation or for UI displays.
 *
 * @param packageName - The package name to check
 * @param registry - The package registry (npm, pypi)
 * @param installedVersion - Optional installed version for comparison
 */
export async function checkPackageVersion(
  packageName: string,
  registry: string,
  installedVersion?: string
): Promise<CheckPackageVersionResponse> {
  return invoke("check_package_version", {
    request: { packageName, registry, installedVersion },
  });
}

/**
 * Get the count of servers with available updates
 *
 * This is a quick check useful for dashboard badges.
 */
export async function getUpdateCount(): Promise<number> {
  return invoke("get_update_count");
}

// ============================================================================
// Health Check Commands
// ============================================================================

/**
 * Check health of a single server
 *
 * @param serverId - The server ID to check
 */
export async function checkHealth(serverId: string): Promise<HealthCheckResult> {
  return invoke("check_health", { serverId });
}

/**
 * Check health of all servers
 */
export async function checkAllHealth(): Promise<HealthCheckResult[]> {
  return invoke("check_all_health");
}

/**
 * Get quick status of a server (without full health check)
 *
 * @param serverId - The server ID to check
 */
export async function getServerStatus(serverId: string): Promise<HealthStatus> {
  return invoke("get_server_status", { serverId });
}

// ============================================================================
// System Commands
// ============================================================================

/**
 * Get the system accent color (macOS only)
 * Returns a hex color string (e.g., "#007AFF")
 */
export async function getSystemAccentColor(): Promise<string> {
  return invoke("get_system_accent_color");
}
