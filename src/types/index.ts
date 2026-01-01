// Types matching Rust structs from src-tauri/src/models/

/** Client IDs supported by the application */
export type ClientId =
  | "claude-code"
  | "claude-desktop"
  | "cursor"
  | "cline"
  | "vscode"
  | "continue"
  | "windsurf"
  | "warp";

/** Represents an MCP server's source/installation type */
export type ServerSource =
  | { type: "npm"; package: string; version?: string }
  | { type: "uvx"; package: string }
  | { type: "local"; path: string }
  | { type: "docker"; image: string }
  | { type: "remote"; url: string }
  | { type: "github"; repo: string; branch?: string };

/** Transport mechanism for communicating with the MCP server */
export type Transport =
  | {
      type: "stdio";
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }
  | {
      type: "sse";
      url: string;
      headers?: Record<string, string>;
    };

/** Represents an MCP server configuration */
export interface McpServer {
  id: string;
  name: string;
  description?: string;
  source: ServerSource;
  transport: Transport;
  enabled: boolean;
  enabledClients: string[];
  installedAt: string;
  updatedAt: string;
  installedVersion?: string;
  sourceUrl?: string;
  tags: string[];
}

/** Client-specific settings */
export interface ClientSettings {
  enabled: boolean;
  configPath: string;
  lastSync?: string;
  lastSyncChecksum?: string;
}

/** User preferences for the application */
export interface UserPreferences {
  autoDetectClients: boolean;
  showNotifications: boolean;
  registryRefreshInterval: number;
}

/** The central MCP Hub configuration */
export interface McpHubConfig {
  version: string;
  servers: McpServer[];
  clients: Record<string, ClientSettings>;
  preferences: UserPreferences;
}

/** Sync mode for a client */
export type SyncMode = "automatic" | "manualOnly";

/** Config format used by a client */
export type ConfigFormat = "standard" | "vscode" | "continue";

/** Detected client information */
export interface DetectedClient {
  id: ClientId;
  name: string;
  detected: boolean;
  configPath?: string;
  configExists: boolean;
  serverCount: number;
  syncMode: SyncMode;
  configFormat: ConfigFormat;
  error?: string;
  docsUrl?: string;
}

/** Client sync status */
export interface ClientSyncStatus {
  clientId: ClientId;
  enabled: boolean;
  lastSync?: string;
  lastSyncChecksum?: string;
  externallyModified: boolean;
  syncError?: string;
}

/** Client config info for import purposes */
export interface ClientConfigInfo {
  serverCount: number;
  serverNames: string[];
  rawConfig?: Record<string, unknown>;
}

/** Client status with server count (legacy compatibility) */
export interface ClientStatus {
  id: ClientId;
  detected: boolean;
  configPath: string;
  lastSync?: string;
  serverCount: number;
}

export interface VersionInfo {
  version: string;
  path?: string;
}

export interface DoctorIssue {
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export interface DoctorReport {
  node?: VersionInfo;
  python?: VersionInfo;
  uv?: VersionInfo;
  docker?: VersionInfo;
  git?: VersionInfo;
  issues: DoctorIssue[];
}

/** Result of syncing to a single client */
export interface ClientSyncResult {
  clientId: ClientId;
  success: boolean;
  serversSynced: number;
  backupPath?: string;
  error?: string;
  manualConfig?: string;
}

/** Result of syncing to all clients */
export interface SyncResult {
  totalClients: number;
  successful: number;
  failed: number;
  manualRequired: number;
  results: ClientSyncResult[];
}

/** Result of importing servers from a client */
export interface ImportResult {
  clientId: ClientId;
  serversImported: number;
  serverNames: string[];
  skippedExisting: number;
}

// Marketplace types (from PulseMCP API)

/** Remote endpoint for SSE-based servers */
export interface RemoteEndpoint {
  type?: string;
  url?: string;
}

/** Represents a server from the PulseMCP marketplace */
export interface MarketplaceServer {
  /** Server display name */
  name: string;
  /** PulseMCP directory URL for the server */
  url: string;
  /** External URL (website, docs, etc.) */
  external_url?: string;
  /** Brief description of the server */
  short_description: string;
  /** Source code repository URL */
  source_code_url?: string;
  /** GitHub star count */
  github_stars?: number;
  /** Package registry (npm, pypi, etc.) */
  package_registry?: string;
  /** Package name in the registry */
  package_name?: string;
  /** Download count from the package registry */
  package_download_count?: number;
  /** AI-generated description (experimental field from PulseMCP) */
  ai_description?: string;
  /** Remote endpoints for SSE-based servers */
  remotes: RemoteEndpoint[];
}

/** Sort options for marketplace search */
export type SortOption =
  | "last_updated"
  | "alphabetical"
  | "popular_week"
  | "popular_month"
  | "popular_all"
  | "recommended"
  | "recently_released";

/** Search parameters for marketplace queries */
export interface SearchServersParams {
  /** Search query text */
  query?: string;
  /** Number of results per page */
  pageSize?: number;
  /** Page number (0-indexed) */
  page?: number;
  /** Sort option */
  sort?: SortOption;
  /** Filter for official servers only */
  officialOnly?: boolean;
  /** Filter for community servers only */
  communityOnly?: boolean;
  /** Filter for servers with remote/SSE support */
  remoteAvailable?: boolean;
}

/** Search result response from the marketplace */
export interface SearchResult {
  /** List of servers matching the query */
  servers: MarketplaceServer[];
  /** Total count of matching servers */
  totalCount: number;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Current page number */
  page: number;
  /** Page size used */
  pageSize: number;
}

/** Error response from marketplace commands */
export interface MarketplaceError {
  message: string;
  errorType?: "network" | "rate_limit" | "invalid_request" | "api_error" | "parse_error";
  retryAfterSeconds?: number;
}

// Installation types

/** Source type for installation request */
export type InstallSource =
  | { type: "npm"; package: string; version?: string; args?: string[] }
  | { type: "uvx"; package: string; args?: string[] }
  | { type: "local"; path: string; command?: string; args?: string[] }
  | { type: "github"; repo: string; branch?: string; runCommand?: string }
  | { type: "docker"; image: string; dockerArgs?: string[] }
  | { type: "remote"; url: string; headers?: Record<string, string> };

/** Request to install a server */
export interface InstallServerRequest {
  /** Display name for the server */
  name: string;
  /** Optional description */
  description?: string;
  /** Source type for installation */
  source: InstallSource;
  /** List of client IDs to enable this server for */
  enabledClients: string[];
  /** Optional source URL (repository, documentation, etc.) */
  sourceUrl?: string;
  /** Environment variables for the server */
  env?: Record<string, string>;
}

/** Result of server installation */
export interface InstallResult {
  /** Whether installation succeeded */
  success: boolean;
  /** The installed server (if successful) */
  server?: McpServer;
  /** Error message (if failed) */
  error?: string;
  /** Warnings during installation */
  warnings: string[];
}

/** Response from install_mcp_server command */
export interface InstallServerResponse {
  /** Installation result */
  installResult: InstallResult;
  /** Sync result (if sync was performed) */
  syncResult?: SyncResult;
}

/** Response from uninstall_mcp_server command */
export interface UninstallServerResponse {
  /** Whether uninstall succeeded */
  success: boolean;
  /** Name of the removed server */
  serverName: string;
  /** Sync result (if sync was performed) */
  syncResult?: SyncResult;
  /** Error message (if any) */
  error?: string;
}

/** Response from validate_install command */
export interface ValidateInstallResponse {
  valid: boolean;
  error?: string;
  missingRuntime?: string;
  suggestion?: string;
}

/** Error from installation commands */
export interface InstallError {
  message: string;
  errorType: string;
}

// Update checking types

/** Information about an available update for a server */
export interface ServerUpdate {
  /** The server ID */
  serverId: string;
  /** Server display name */
  serverName: string;
  /** Currently installed version (if known) */
  installedVersion?: string;
  /** Latest available version (if known) */
  latestVersion?: string;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Package name for reference */
  packageName?: string;
  /** Package registry (npm, pypi, etc.) */
  packageRegistry?: string;
  /** Source URL for the update */
  sourceUrl?: string;
}

/** Result of checking for updates across all servers */
export interface UpdateCheckResult {
  /** List of servers with version info */
  updates: ServerUpdate[];
  /** Total number of servers checked */
  serversChecked: number;
  /** Number of servers with updates available */
  updatesAvailable: number;
  /** Servers that couldn't be checked (e.g., local paths, custom remotes) */
  serversSkipped: number;
  /** Any errors encountered during the check */
  errors: string[];
  /** Timestamp of the check */
  checkedAt: string;
}

/** Request to check a single package version */
export interface CheckPackageVersionRequest {
  packageName: string;
  registry: string;
  installedVersion?: string;
}

/** Response for single package version check */
export interface CheckPackageVersionResponse {
  packageName: string;
  installedVersion?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  error?: string;
}

/** Error from update commands */
export interface UpdateError {
  message: string;
  errorType: string;
}

// Keychain types

/** Response from keychain commands */
export interface KeychainResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Result of storing a credential */
export interface StoreCredentialResult {
  name: string;
  success: boolean;
  isUpdate: boolean;
}

/** Information about a stored credential */
export interface CredentialListItem {
  name: string;
  inUse: boolean;
}

// Health check types

/** Health status for a server */
export type HealthStatus =
  | "healthy"
  | "unhealthy"
  | "unknown"
  | "running"
  | "stopped";

/** Result of a health check */
export interface HealthCheckResult {
  serverId: string;
  status: HealthStatus;
  message?: string;
  checkedAt: string;
  responseTimeMs?: number;
}
