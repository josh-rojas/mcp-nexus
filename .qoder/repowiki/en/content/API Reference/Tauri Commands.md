# Tauri Commands

<cite>
**Referenced Files in This Document**   
- [tauri.ts](file://src/lib/tauri.ts)
- [lib.rs](file://src-tauri/src/lib.rs)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [installation.rs](file://src-tauri/src/commands/installation.rs)
- [sync.rs](file://src-tauri/src/commands/sync.rs)
- [health.rs](file://src-tauri/src/commands/health.rs)
- [keychain.rs](file://src-tauri/src/commands/keychain.rs)
- [marketplace.rs](file://src-tauri/src/commands/marketplace.rs)
- [updates.rs](file://src-tauri/src/commands/updates.rs)
- [clients.rs](file://src-tauri/src/commands/clients.rs)
- [config.rs](file://src-tauri/src/commands/config.rs)
- [doctor.rs](file://src-tauri/src/commands/doctor.rs)
- [index.ts](file://src/types/index.ts)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Command Groups](#command-groups)
3. [Server Installation and Management](#server-installation-and-management)
4. [Client Synchronization](#client-synchronization)
5. [Health Monitoring](#health-monitoring)
6. [Credential Operations](#credential-operations)
7. [Marketplace Interactions](#marketplace-interactions)
8. [Update Management](#update-management)
9. [Type Safety and Serialization](#type-safety-and-serialization)
10. [Error Handling and Async Behavior](#error-handling-and-async-behavior)

## Introduction

This document provides comprehensive API documentation for all Tauri commands exposed by MCP Nexus. The commands enable communication between the frontend React application and the backend Rust code, facilitating server management, client synchronization, health monitoring, credential operations, marketplace interactions, and update management. Each command is designed with type safety in mind, leveraging Serde for serialization and deserialization between Rust and TypeScript.

**Section sources**

- [lib.rs](file://src-tauri/src/lib.rs#L5-L85)
- [tauri.ts](file://src/lib/tauri.ts#L1-L364)

## Command Groups

The Tauri commands in MCP Nexus are organized into logical groups based on their functionality. These groups include server installation and management, client synchronization, health monitoring, credential operations, marketplace interactions, and update management. Each group contains specific commands that address particular aspects of the application's functionality.

**Section sources**

- [lib.rs](file://src-tauri/src/lib.rs#L36-L85)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs#L11-L35)

## Server Installation and Management

The server installation and management commands handle the lifecycle of MCP servers, including installation, uninstallation, and validation of installation requirements.

### install_mcp_server

Installs a new MCP server based on the provided request. The command validates runtime requirements, installs the server, saves the configuration, and optionally syncs to enabled clients.

**Parameters**

- `request`: InstallServerRequest containing server details
- `syncAfterInstall`: Optional boolean to sync after installation (default: true)

**Return Type**

- `InstallServerResponse` containing installation and sync results

**Error Conditions**

- Invalid server ID
- Missing runtime
- Git clone error
- Setup error
- Docker error
- Invalid URL
- IO error
- Home directory not found
- Parse error

**Serialization**

- Uses Serde for serialization and deserialization of InstallServerRequest and InstallServerResponse

**Section sources**

- [installation.rs](file://src-tauri/src/commands/installation.rs#L98-L135)
- [tauri.ts](file://src/lib/tauri.ts#L236-L241)

### uninstall_mcp_server

Uninstalls an MCP server by removing it from the central configuration, cleaning up local resources, and optionally syncing the removal to all clients.

**Parameters**

- `serverId`: String representing the server ID
- `cleanupResources`: Optional boolean to clean up resources (default: true)
- `syncAfterUninstall`: Optional boolean to sync after uninstallation (default: true)

**Return Type**

- `UninstallServerResponse` containing uninstallation details

**Error Conditions**

- Invalid server ID

**Serialization**

- Uses Serde for serialization and deserialization of UninstallServerResponse

**Section sources**

- [installation.rs](file://src-tauri/src/commands/installation.rs#L144-L192)
- [tauri.ts](file://src/lib/tauri.ts#L251-L261)

### validate_install

Validates that a server can be installed by checking for required runtimes without actually installing the server.

**Parameters**

- `source`: InstallSource representing the installation source

**Return Type**

- `ValidateInstallResponse` indicating validation success or failure

**Error Conditions**

- Missing runtime

**Serialization**

- Uses Serde for serialization and deserialization of ValidateInstallResponse

**Section sources**

- [installation.rs](file://src-tauri/src/commands/installation.rs#L198-L225)
- [tauri.ts](file://src/lib/tauri.ts#L268-L272)

## Client Synchronization

The client synchronization commands manage the synchronization of server configurations to AI clients, including detection, status retrieval, and manual configuration generation.

### detect_clients

Detects installed AI clients on the system.

**Parameters**

- None

**Return Type**

- `DetectedClient[]` array of detected clients

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of DetectedClient

**Section sources**

- [clients.rs](file://src-tauri/src/commands/clients.rs#L12-L14)
- [tauri.ts](file://src/lib/tauri.ts#L89-L91)

### sync_client

Syncs configuration to a single client.

**Parameters**

- `clientId`: String representing the client ID

**Return Type**

- `ClientSyncResult` containing sync details

**Error Conditions**

- Invalid client ID

**Serialization**

- Uses Serde for serialization and deserialization of ClientSyncResult

**Section sources**

- [sync.rs](file://src-tauri/src/commands/sync.rs#L73-L104)
- [tauri.ts](file://src/lib/tauri.ts#L115-L117)

### sync_all_clients

Syncs configuration to all enabled clients.

**Parameters**

- None

**Return Type**

- `SyncResult` containing sync results for all clients

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of SyncResult

**Section sources**

- [sync.rs](file://src-tauri/src/commands/sync.rs#L108-L142)
- [tauri.ts](file://src/lib/tauri.ts#L120-L122)

### import_client_servers

Imports servers from a client's configuration.

**Parameters**

- `clientId`: String representing the client ID
- `overwriteExisting`: Optional boolean to overwrite existing servers (default: false)

**Return Type**

- `ImportResult` containing import details

**Error Conditions**

- Invalid client ID

**Serialization**

- Uses Serde for serialization and deserialization of ImportResult

**Section sources**

- [sync.rs](file://src-tauri/src/commands/sync.rs#L146-L176)
- [tauri.ts](file://src/lib/tauri.ts#L125-L130)

### get_manual_config

Generates the manual configuration JSON for a client that requires manual configuration.

**Parameters**

- `clientId`: String representing the client ID

**Return Type**

- `string` containing the manual configuration

**Error Conditions**

- Invalid client ID
- Client does not require manual configuration

**Serialization**

- Returns a JSON string

**Section sources**

- [sync.rs](file://src-tauri/src/commands/sync.rs#L180-L204)
- [tauri.ts](file://src/lib/tauri.ts#L133-L135)

### set_client_sync_enabled

Enables or disables syncing for a specific client.

**Parameters**

- `clientId`: String representing the client ID
- `enabled`: Boolean indicating whether to enable syncing

**Return Type**

- `void`

**Error Conditions**

- Invalid client ID

**Serialization**

- No return value

**Section sources**

- [sync.rs](file://src-tauri/src/commands/sync.rs#L208-L245)
- [tauri.ts](file://src/lib/tauri.ts#L138-L143)

## Health Monitoring

The health monitoring commands check the health status of MCP servers, either individually or in bulk.

### check_health

Checks the health of a single server.

**Parameters**

- `serverId`: String representing the server ID

**Return Type**

- `HealthCheckResult` containing health check details

**Error Conditions**

- Invalid server ID
- Server not found

**Serialization**

- Uses Serde for serialization and deserialization of HealthCheckResult

**Section sources**

- [health.rs](file://src-tauri/src/commands/health.rs#L32-L50)
- [tauri.ts](file://src/lib/tauri.ts#L345-L347)

### check_all_health

Checks the health of all servers.

**Parameters**

- None

**Return Type**

- `HealthCheckResult[]` array of health check results

**Error Conditions**

- Failed to get servers

**Serialization**

- Uses Serde for serialization and deserialization of HealthCheckResult

**Section sources**

- [health.rs](file://src-tauri/src/commands/health.rs#L54-L74)
- [tauri.ts](file://src/lib/tauri.ts#L352-L354)

### get_server_status

Gets the quick status of a server without performing a full health check.

**Parameters**

- `serverId`: String representing the server ID

**Return Type**

- `HealthStatus` indicating the server's status

**Error Conditions**

- Invalid server ID
- Server not found

**Serialization**

- Uses Serde for serialization and deserialization of HealthStatus

**Section sources**

- [health.rs](file://src-tauri/src/commands/health.rs#L78-L98)
- [tauri.ts](file://src/lib/tauri.ts#L361-L363)

## Credential Operations

The credential operations commands manage credentials stored in the OS keychain, including saving, retrieving, deleting, and listing credentials.

### save_credential

Stores a credential in the OS keychain.

**Parameters**

- `name`: String representing the credential name
- `value`: String representing the credential value

**Return Type**

- `StoreCredentialResult` indicating the result of the operation

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of StoreCredentialResult

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L52-L57)
- [tauri.ts](file://src/lib/tauri.ts#L162-L167)

### get_credential_value

Retrieves a credential from the OS keychain.

**Parameters**

- `name`: String representing the credential name

**Return Type**

- `string` containing the credential value

**Error Conditions**

- None

**Serialization**

- Returns the credential value as a string

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L64-L68)
- [tauri.ts](file://src/lib/tauri.ts#L170-L172)

### delete_credential

Deletes a credential from the OS keychain.

**Parameters**

- `name`: String representing the credential name

**Return Type**

- `boolean` indicating whether the credential was deleted

**Error Conditions**

- None

**Serialization**

- Returns a boolean value

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L73-L77)
- [tauri.ts](file://src/lib/tauri.ts#L175-L177)

### list_credentials

Lists all stored credential names.

**Parameters**

- None

**Return Type**

- `string[]` array of credential names

**Error Conditions**

- None

**Serialization**

- Returns an array of strings

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L84-L88)
- [tauri.ts](file://src/lib/tauri.ts#L180-L182)

### check_credential_exists

Checks if a credential exists in the OS keychain.

**Parameters**

- `name`: String representing the credential name

**Return Type**

- `boolean` indicating whether the credential exists

**Error Conditions**

- None

**Serialization**

- Returns a boolean value

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L93-L97)
- [tauri.ts](file://src/lib/tauri.ts#L185-L187)

### validate_credential_references

Validates that all keychain references in a server's environment variables are resolvable.

**Parameters**

- `envVars`: Record<string, string> containing environment variables

**Return Type**

- `string[]` array of missing credential names

**Error Conditions**

- None

**Serialization**

- Returns an array of strings

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L104-L122)
- [tauri.ts](file://src/lib/tauri.ts#L190-L194)

## Marketplace Interactions

The marketplace interactions commands facilitate searching for and retrieving details about servers in the PulseMCP marketplace.

### search_servers

Searches for servers in the PulseMCP marketplace based on the provided parameters.

**Parameters**

- `params`: SearchServersParams containing search criteria

**Return Type**

- `SearchResult` containing search results

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of SearchResult

**Section sources**

- [marketplace.rs](file://src-tauri/src/commands/marketplace.rs#L129-L153)
- [tauri.ts](file://src/lib/tauri.ts#L202-L203)

### get_server_details

Retrieves details for a specific server by name.

**Parameters**

- `name`: String representing the server name

**Return Type**

- `MarketplaceServer | null` containing server details or null if not found

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of MarketplaceServer

**Section sources**

- [marketplace.rs](file://src-tauri/src/commands/marketplace.rs#L157-L167)
- [tauri.ts](file://src/lib/tauri.ts#L209-L210)

### clear_marketplace_cache

Clears the marketplace cache for manual refresh.

**Parameters**

- None

**Return Type**

- `void`

**Error Conditions**

- None

**Serialization**

- No return value

**Section sources**

- [marketplace.rs](file://src-tauri/src/commands/marketplace.rs#L171-L176)
- [tauri.ts](file://src/lib/tauri.ts#L214-L215)

### check_marketplace_cache

Checks if cached data exists for a search query.

**Parameters**

- `params`: SearchServersParams containing search criteria

**Return Type**

- `boolean` indicating whether cached data exists

**Error Conditions**

- None

**Serialization**

- Returns a boolean value

**Section sources**

- [marketplace.rs](file://src-tauri/src/commands/marketplace.rs#L181-L188)
- [tauri.ts](file://src/lib/tauri.ts#L221-L222)

## Update Management

The update management commands handle checking for updates to installed servers and retrieving version information.

### check_for_updates

Checks for updates for all installed servers.

**Parameters**

- None

**Return Type**

- `UpdateCheckResult` containing update information

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of UpdateCheckResult

**Section sources**

- [updates.rs](file://src-tauri/src/commands/updates.rs#L54-L67)
- [tauri.ts](file://src/lib/tauri.ts#L293-L294)

### check_server_update

Checks for updates for a single server by ID.

**Parameters**

- `serverId`: String representing the server ID

**Return Type**

- `ServerUpdate | null` containing update information or null if no update is available

**Error Conditions**

- Invalid server ID

**Serialization**

- Uses Serde for serialization and deserialization of ServerUpdate

**Section sources**

- [updates.rs](file://src-tauri/src/commands/updates.rs#L71-L140)
- [tauri.ts](file://src/lib/tauri.ts#L304-L305)

### check_package_version

Checks the latest version for a specific package.

**Parameters**

- `packageName`: String representing the package name
- `registry`: String representing the package registry
- `installedVersion`: Optional string representing the installed version

**Return Type**

- `CheckPackageVersionResponse` containing version information

**Error Conditions**

- None

**Serialization**

- Uses Serde for serialization and deserialization of CheckPackageVersionResponse

**Section sources**

- [updates.rs](file://src-tauri/src/commands/updates.rs#L146-L226)
- [tauri.ts](file://src/lib/tauri.ts#L322-L324)

### get_update_count

Gets the count of servers with available updates.

**Parameters**

- None

**Return Type**

- `number` representing the count of servers with updates

**Error Conditions**

- None

**Serialization**

- Returns a number

**Section sources**

- [updates.rs](file://src-tauri/src/commands/updates.rs#L232-L242)
- [tauri.ts](file://src/lib/tauri.ts#L333-L334)

## Type Safety and Serialization

The Tauri commands in MCP Nexus leverage Serde for serialization and deserialization between Rust and TypeScript, ensuring type safety across the frontend and backend. Shared models such as McpServer and MarketplaceServer are defined in both Rust and TypeScript, with corresponding types and interfaces.

### McpServer

Represents an MCP server configuration, with properties such as ID, name, description, source, transport, enabled status, enabled clients, installation timestamp, update timestamp, installed version, source URL, and tags.

**Section sources**

- [index.ts](file://src/types/index.ts#L38-L51)
- [models/server.rs](file://src-tauri/src/models/server.rs)

### MarketplaceServer

Represents a server from the PulseMCP marketplace, with properties such as name, URL, external URL, short description, source code URL, GitHub stars, package registry, package name, package download count, AI description, and remote endpoints.

**Section sources**

- [index.ts](file://src/types/index.ts#L179-L202)
- [models/marketplace.rs](file://src-tauri/src/models/marketplace.rs)

## Error Handling and Async Behavior

The Tauri commands in MCP Nexus employ consistent error handling patterns and async behavior, particularly in the context of React Query integration. Errors are handled using Result types in Rust, which are serialized to corresponding error types in TypeScript. Async commands are marked with async/await in Rust and return Promises in TypeScript.

### Error Handling

Errors are handled using custom error types in Rust, which are serialized to corresponding error types in TypeScript. For example, InstallationError in Rust is serialized to InstallError in TypeScript, with properties such as message and errorType.

**Section sources**

- [installation.rs](file://src-tauri/src/commands/installation.rs#L12-L37)
- [tauri.ts](file://src/lib/tauri.ts#L321-L324)

### Async Behavior

Async commands are marked with async/await in Rust and return Promises in TypeScript. This allows for non-blocking operations and better integration with React Query, which can handle loading states and error states based on the Promise resolution.

**Section sources**

- [health.rs](file://src-tauri/src/commands/health.rs#L32-L50)
- [tauri.ts](file://src/lib/tauri.ts#L345-L347)
