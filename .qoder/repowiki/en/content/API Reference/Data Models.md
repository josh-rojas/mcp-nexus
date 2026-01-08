# Data Models

<cite>
**Referenced Files in This Document**   
- [index.ts](file://src/types/index.ts)
- [server.rs](file://src-tauri/src/models/server.rs)
- [client.rs](file://src-tauri/src/models/client.rs)
- [marketplace.rs](file://src-tauri/src/models/marketplace.rs)
- [useServers.ts](file://src/hooks/useServers.ts)
- [useMarketplace.ts](file://src/hooks/useMarketplace.ts)
- [tauri.ts](file://src/lib/tauri.ts)
- [ServerCard.tsx](file://src/components/servers/ServerCard.tsx)
- [MarketplaceCard.tsx](file://src/components/marketplace/MarketplaceCard.tsx)
- [health.rs](file://src-tauri/src/services/health.rs)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Core Data Models](#core-data-models)
   - [McpServer](#mcpservers)
   - [MarketplaceServer](#marketplaceserver)
   - [DetectedClient](#detectedclient)
   - [HealthCheckResult](#healthcheckresult)
3. [TypeScript and Rust Type Alignment](#typescript-and-rust-type-alignment)
4. [Data Flow Between Frontend and Backend](#data-flow-between-frontend-and-backend)
5. [Usage in Hooks and Components](#usage-in-hooks-and-components)
6. [Validation and Serialization](#validation-and-serialization)
7. [Conclusion](#conclusion)

## Introduction

This document provides comprehensive documentation for the data models used in MCP Nexus, a desktop application for managing Model Context Protocol (MCP) servers. The application enables users to discover, install, configure, and monitor MCP servers across various AI clients such as Claude, VS Code, Cursor, and others. The architecture follows a Tauri-based pattern with a React frontend and Rust backend, where data models are defined in both TypeScript and Rust to ensure type safety across the entire stack.

The core data models include `McpServer` for representing installed servers, `MarketplaceServer` for discovering servers from the PulseMCP directory, `DetectedClient` for tracking AI client integrations, and `HealthCheckResult` for monitoring server status. These models are carefully designed to maintain consistency between the frontend and backend through Tauri commands, with proper serialization using Serde in Rust and TypeScript interfaces ensuring schema alignment.

## Core Data Models

### McpServer

The `McpServer` model represents a configured MCP server instance within the application. It exists in both TypeScript (frontend) and Rust (backend) with identical structure to ensure type safety across the Tauri boundary.

**TypeScript Interface** (`src/types/index.ts`)

```typescript
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
```

**Rust Struct** (`src-tauri/src/models/server.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub source: ServerSource,
    pub transport: Transport,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub enabled_clients: Vec<String>,
    pub installed_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub installed_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
}
```

**Field Descriptions**

- `id`: Unique identifier (UUID in Rust, string in TypeScript after serialization)
- `name`: Display name for the server
- `description`: Optional description of the server's functionality
- `source`: Installation source (npm, uvx, local, docker, remote, github)
- `transport`: Communication mechanism (stdio or sse)
- `enabled`: Global enable/disable flag (defaults to true)
- `enabledClients`: List of client IDs this server is configured for
- `installedAt`: ISO timestamp when server was installed
- `updatedAt`: ISO timestamp of last modification
- `installedVersion`: Version string for update tracking
- `sourceUrl`: Link to source repository or documentation
- `tags`: Array of tags for categorization

The model uses several design patterns:

- Optional fields are represented with `Option<T>` in Rust and `?` in TypeScript
- Default values are handled via `#[serde(default)]` and `#[serde(default = "function")]` attributes
- Camel case naming is enforced via `#[serde(rename_all = "camelCase")]` to match JavaScript conventions
- Empty collections are omitted during serialization when empty

**Section sources**

- [index.ts](file://src/types/index.ts#L38-L51)
- [server.rs](file://src-tauri/src/models/server.rs#L51-L85)

### MarketplaceServer

The `MarketplaceServer` model represents a server available for installation from the PulseMCP marketplace. It contains metadata about servers that can be discovered and installed through the application's marketplace interface.

**TypeScript Interface** (`src/types/index.ts`)

```typescript
export interface MarketplaceServer {
  name: string;
  url: string;
  external_url?: string;
  short_description: string;
  source_code_url?: string;
  github_stars?: number;
  package_registry?: string;
  package_name?: string;
  package_download_count?: number;
  ai_description?: string;
  remotes: RemoteEndpoint[];
}
```

**Rust Struct** (`src-tauri/src/models/marketplace.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceServer {
    pub name: String,
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external_url: Option<String>,
    pub short_description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_code_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub github_stars: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_registry: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_download_count: Option<u64>,
    #[serde(
        rename = "EXPERIMENTAL_ai_generated_description",
        skip_serializing_if = "Option::is_none"
    )]
    pub ai_description: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub remotes: Vec<RemoteEndpoint>,
}
```

**Field Descriptions**

- `name`: Server display name
- `url`: PulseMCP directory URL for the server
- `external_url`: External website or documentation URL
- `short_description`: Brief description of the server
- `source_code_url`: GitHub or other repository URL
- `github_stars`: Number of GitHub stars (if applicable)
- `package_registry`: Package registry (npm, pypi, etc.)
- `package_name`: Package name in the registry
- `package_download_count`: Download count from the package registry
- `ai_description`: AI-generated description (experimental field)
- `remotes`: Array of remote endpoints for SSE-based servers

The marketplace model includes special handling for the `ai_description` field, which is renamed from `EXPERIMENTAL_ai_generated_description` in the API response to maintain compatibility while providing a cleaner interface.

**Section sources**

- [index.ts](file://src/types/index.ts#L179-L202)
- [marketplace.rs](file://src-tauri/src/models/marketplace.rs#L17-L51)

### DetectedClient

The `DetectedClient` model represents information about an AI client that has been detected on the user's system. This includes clients like Claude, VS Code, Cursor, and others that can integrate with MCP servers.

**TypeScript Interface** (`src/types/index.ts`)

```typescript
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
```

**Rust Struct** (`src-tauri/src/models/client.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedClient {
    pub id: ClientId,
    pub name: String,
    pub detected: bool,
    pub config_path: Option<PathBuf>,
    pub config_exists: bool,
    pub server_count: usize,
    pub sync_mode: SyncMode,
    pub config_format: ConfigFormat,
    pub error: Option<String>,
    pub docs_url: Option<String>,
}
```

**Field Descriptions**

- `id`: Client identifier (enum value)
- `name`: Display name of the client
- `detected`: Whether the client was found on the system
- `configPath`: Path to the client's MCP configuration file
- `configExists`: Whether the configuration file exists
- `serverCount`: Number of MCP servers currently configured
- `syncMode`: How configuration is synchronized (automatic or manual)
- `configFormat`: Configuration file format used by the client
- `error`: Any error encountered during detection
- `docsUrl`: Documentation URL for manual configuration

The model uses an enum for `ClientId` with specific values for each supported client, ensuring type safety and preventing invalid client identifiers.

**Section sources**

- [index.ts](file://src/types/index.ts#L84-L95)
- [client.rs](file://src-tauri/src/models/client.rs#L117-L138)

### HealthCheckResult

The `HealthCheckResult` model represents the outcome of a health check performed on an MCP server. This allows the application to monitor server availability and responsiveness.

**TypeScript Interface** (`src/types/index.ts`)

```typescript
export interface HealthCheckResult {
  serverId: string;
  status: HealthStatus;
  message?: string;
  checkedAt: string;
  responseTimeMs?: number;
}
```

**Rust Struct** (`src-tauri/src/services/health.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResult {
    pub server_id: String,
    pub status: HealthStatus,
    pub message: Option<String>,
    pub checked_at: String,
    pub response_time_ms: Option<u64>,
}
```

**Field Descriptions**

- `serverId`: ID of the server that was checked
- `status`: Current health status (healthy, unhealthy, unknown, running, stopped)
- `message`: Additional information about the health check result
- `checkedAt`: ISO timestamp when the check was performed
- `responseTimeMs`: Response time in milliseconds (for SSE servers)

The health check system performs different types of checks based on the server's transport:

- **SSE servers**: HTTP request to the server's URL with timeout handling
- **Stdio servers**: Attempt to spawn the server process and verify it starts correctly

**Section sources**

- [index.ts](file://src/types/index.ts#L419-L425)
- [health.rs](file://src-tauri/src/services/health.rs#L28-L34)

## TypeScript and Rust Type Alignment

MCP Nexus maintains strict type alignment between the TypeScript frontend and Rust backend through several mechanisms:

### Serde Serialization

The Rust models use Serde attributes to ensure compatibility with TypeScript conventions:

- `#[serde(rename_all = "camelCase")]` ensures field names match JavaScript camelCase convention
- `#[serde(skip_serializing_if = "Option::is_none")]` omits null/undefined optional fields
- `#[serde(default)]` handles default values for missing fields
- Field-specific defaults via `#[serde(default = "function")]`

This ensures that when Rust structs are serialized to JSON and sent to the frontend, they match the expected TypeScript interface structure exactly.

### Type Definitions

The TypeScript interfaces in `src/types/index.ts` are designed to mirror the Rust structs precisely:

- Both use the same field names (after camelCase conversion)
- Optional fields are marked with `?` in TypeScript and `Option<T>` in Rust
- Enum types have identical variants with proper string serialization
- Collection types use compatible representations (Vec<T> in Rust, T[] in TypeScript)

### Type Safety

The Tauri command system provides type safety through:

- Strongly typed command definitions
- Automatic serialization/deserialization
- Compile-time verification of parameter and return types
- Error handling that preserves type information

This alignment prevents common issues like field name mismatches, type coercion errors, and missing field handling that often occur in loosely typed systems.

**Section sources**

- [server.rs](file://src-tauri/src/models/server.rs#L53)
- [index.ts](file://src/types/index.ts#L38)

## Data Flow Between Frontend and Backend

The data flow between the React frontend and Rust backend in MCP Nexus follows a well-defined pattern using Tauri commands and React Query for state management.

### Tauri Command Pattern

Tauri commands serve as the bridge between frontend and backend, with each command having:

- A Rust implementation that performs the actual work
- A TypeScript wrapper that handles serialization
- Type definitions that ensure compatibility

For example, the `getServers` command:

```typescript
// TypeScript wrapper
export async function getServers(): Promise<McpServer[]> {
  return invoke("get_servers");
}

// Rust implementation
#[tauri::command]
pub async fn get_servers(state: State<'_, Mutex<AppState>>) -> Result<Vec<McpServer>, String> {
    let state = state.lock().unwrap();
    Ok(state.config_manager.get_servers()?)
}
```

### React Query Integration

The application uses React Query to manage server state with hooks like `useServerList`:

```typescript
export function useServerList() {
  return useQuery<McpServer[], Error>({
    queryKey: ["servers"],
    queryFn: getServers,
    staleTime: 10000,
  });
}
```

This provides:

- Automatic caching of server data
- Background refetching
- Loading and error states
- Cache invalidation when data changes

### State Synchronization

When data is modified, the application follows a consistent pattern:

1. Mutation is performed via a Tauri command
2. On success, React Query cache is updated
3. Related queries are invalidated
4. Auto-sync is triggered if enabled

For example, in `useUpdateServer`:

```typescript
onSuccess: (updatedServer) => {
  queryClient.setQueryData<McpServer[]>(["servers"], (old) =>
    old?.map((s) => (s.id === updatedServer.id ? updatedServer : s))
  );
  queryClient.invalidateQueries({ queryKey: ["servers", updatedServer.id] });
  triggerAutoSync();
};
```

This ensures that the UI remains consistent with the underlying data model.

**Section sources**

- [tauri.ts](file://src/lib/tauri.ts#L53)
- [useServers.ts](file://src/hooks/useServers.ts#L24)
- [Servers.tsx](file://src/pages/Servers.tsx#L137)

## Usage in Hooks and Components

The data models are used extensively throughout the application's hooks and components to provide a consistent user experience.

### ServerCard Component

The `ServerCard` component displays information about an `McpServer` instance:

```tsx
function ServerCard({ server, onToggleClient, onRemove }: ServerCardProps) {
  return (
    <div>
      <h3>{server.name}</h3>
      <p>{server.description}</p>
      <span>{getSourceLabel()}</span>
      {/* Client badges */}
      {server.enabledClients.map((clientId) => (
        <span key={clientId}>{getClientName(clientId)}</span>
      ))}
    </div>
  );
}
```

Key features:

- Displays server metadata (name, description, source)
- Shows transport type badge (stdio or sse)
- Lists enabled clients with toggle functionality
- Provides remove confirmation workflow
- Formats dates relative to current time

The component uses the `McpServer` model directly, accessing its fields to render the UI and using callback props to handle interactions that modify the server state.

### MarketplaceCard Component

The `MarketplaceCard` component displays `MarketplaceServer` instances from the PulseMCP directory:

```tsx
function MarketplaceCard({ server, onSelect }: MarketplaceCardProps) {
  return (
    <button onClick={() => onSelect(server)}>
      <h3>{server.name}</h3>
      <p>{server.short_description}</p>
      {/* Stats */}
      {server.github_stars && (
        <div>{formatNumber(server.github_stars)} stars</div>
      )}
      {server.package_download_count && (
        <div>{formatNumber(server.package_download_count)} downloads</div>
      )}
    </button>
  );
}
```

Features:

- Displays server name and description
- Shows package registry badge with appropriate coloring
- Indicates remote/SSE support
- Formats large numbers with K/M suffixes
- Displays GitHub stars and download counts

### Hook Usage

The application's hooks abstract away the complexity of Tauri commands and provide a clean interface to the data models:

```typescript
// useServers hook provides access to McpServer operations
const { servers, install, uninstall, sync } = useServers();

// useMarketplace hook provides access to MarketplaceServer discovery
const { servers, totalCount, refresh } = useMarketplace(params);
```

These hooks handle:

- Data fetching and caching
- Error handling and user feedback
- Loading states
- Cache invalidation
- Business logic (e.g., auto-sync after installation)

**Section sources**

- [ServerCard.tsx](file://src/components/servers/ServerCard.tsx#L42)
- [MarketplaceCard.tsx](file://src/components/marketplace/MarketplaceCard.tsx#L30)
- [useServers.ts](file://src/hooks/useServers.ts#L146)

## Validation and Serialization

The MCP Nexus application employs comprehensive validation and serialization strategies to ensure data integrity across the system.

### Rust Validation

The backend uses Serde attributes for validation and serialization control:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    // ...
    #[serde(default = "default_true")]
    pub enabled: bool,
}
```

Key validation patterns:

- `skip_serializing_if` - Omit optional fields when null/empty
- `default` - Provide default values for missing fields
- Custom default functions (e.g., `default_true`)
- Type-safe enums with string serialization

### TypeScript Type Safety

The frontend uses TypeScript interfaces to ensure type safety:

```typescript
export interface McpServer {
  id: string;
  name: string;
  description?: string; // Optional property
  enabled: boolean; // Required with default value
  enabledClients: string[]; // Array with default empty array
}
```

### Data Flow Validation

The application validates data at multiple levels:

1. **Frontend validation**: Form inputs are validated before sending to backend
2. **Tauri command validation**: Parameters are validated in Rust
3. **Business logic validation**: Domain-specific rules are enforced
4. **Serialization validation**: Serde ensures data conforms to expected structure

For example, when installing a server, the `installMcpServer` command validates:

- Required fields are present
- Runtime dependencies are available
- Package sources are valid
- Configuration is syntactically correct

### Error Handling

The system uses typed error responses to communicate validation failures:

```typescript
export interface InstallServerResponse {
  installResult: InstallResult;
  syncResult?: SyncResult;
}

export interface InstallResult {
  success: boolean;
  server?: McpServer;
  error?: string;
  warnings: string[];
}
```

This allows the frontend to handle different error types appropriately and provide meaningful feedback to users.

**Section sources**

- [server.rs](file://src-tauri/src/models/server.rs#L53)
- [index.ts](file://src/types/index.ts#L280)

## Conclusion

The data model architecture in MCP Nexus demonstrates a well-designed approach to maintaining type safety and consistency across a full-stack application. By carefully aligning TypeScript interfaces with Rust structs through Serde serialization attributes, the application ensures that data flows seamlessly between the frontend and backend without type mismatches or data corruption.

Key strengths of the design include:

- Consistent naming conventions across languages
- Proper handling of optional fields and default values
- Comprehensive validation at multiple levels
- Efficient data flow patterns using React Query
- Clear separation of concerns between data models and UI components

The use of Tauri as a bridge between React and Rust enables type-safe communication while maintaining the performance benefits of a compiled backend and the flexibility of a modern frontend framework. This architecture provides a solid foundation for the application's core functionality of managing MCP servers across multiple AI clients.
