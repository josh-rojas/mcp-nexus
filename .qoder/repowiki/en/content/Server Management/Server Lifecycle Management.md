# Server Lifecycle Management

<cite>
**Referenced Files in This Document**   
- [ServerCard.tsx](file://src/components/servers/ServerCard.tsx)
- [useServers.ts](file://src/hooks/useServers.ts)
- [tauri.ts](file://src/lib/tauri.ts)
- [installation.rs](file://src-tauri/src/services/installation.rs)
- [config.rs](file://src-tauri/src/commands/config.rs)
- [installation.rs](file://src-tauri/src/commands/installation.rs)
- [index.ts](file://src/types/index.ts)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [ServerCard Interface Implementation](#servercard-interface-implementation)
3. [Server Removal and Cleanup Process](#server-removal-and-cleanup-process)
4. [State Management and Client Synchronization](#state-management-and-client-synchronization)
5. [Error Handling and Rollback Procedures](#error-handling-and-rollback-procedures)
6. [Source-Specific Cleanup Operations](#source-specific-cleanup-operations)
7. [Performance Considerations](#performance-considerations)
8. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

## Introduction

The MCP Nexus server lifecycle management system provides comprehensive control over server instances, including creation, configuration, removal, and state management. This document details the implementation of server removal operations, cleanup procedures, and state management through the ServerCard interface and backend services. The system handles various server source types including GitHub repositories, Docker images, npm packages, and local installations, with appropriate cleanup strategies for each type. The lifecycle operations are designed to maintain system integrity while allowing flexible management of server instances across multiple client environments.

## ServerCard Interface Implementation

The ServerCard component serves as the primary user interface for managing individual server instances within MCP Nexus. It provides visual representation of server properties and interactive controls for lifecycle operations.

```mermaid
flowchart TD
A[ServerCard Component] --> B[Display Server Information]
A --> C[Handle State Changes]
A --> D[Initiate Removal Process]
B --> E[Name, Description, Source]
B --> F[Installation Date, Version]
B --> G[Transport Type, Runtime]
C --> H[Toggle Enabled State]
C --> I[Manage Client Associations]
D --> J[Confirmation Dialog]
D --> K[Remove Server Action]
```

**Section sources**

- [ServerCard.tsx](file://src/components/servers/ServerCard.tsx#L1-L341)

## Server Removal and Cleanup Process

The server removal process in MCP Nexus follows a structured sequence of operations to ensure proper cleanup and synchronization. When a user initiates server removal through the ServerCard interface, the operation flows through multiple layers of the application architecture.

```mermaid
sequenceDiagram
participant UI as ServerCard UI
participant Hook as useServers Hook
participant Tauri as Tauri Bridge
participant Backend as Rust Backend
participant Config as Config Manager
participant Cleanup as Cleanup Service
UI->>Hook : handleRemove(serverId)
Hook->>Tauri : uninstallMcpServer(serverId)
Tauri->>Backend : uninstall_mcp_server(serverId)
Backend->>Config : get_server(serverId)
Config-->>Backend : McpServer object
Backend->>Cleanup : cleanup_server(server)
Cleanup-->>Backend : Cleanup result
Backend->>Config : remove_server(serverId)
Config-->>Backend : Removed server
Backend->>Tauri : UninstallServerResponse
Tauri-->>Hook : Promise<UninstallServerResponse>
Hook-->>UI : Update UI state
```

**Section sources**

- [ServerCard.tsx](file://src/components/servers/ServerCard.tsx#L86-L93)
- [useServers.ts](file://src/hooks/useServers.ts#L114-L131)
- [tauri.ts](file://src/lib/tauri.ts#L251-L261)
- [installation.rs](file://src-tauri/src/commands/installation.rs#L144-L192)

## State Management and Client Synchronization

Server state management in MCP Nexus distinguishes between server configuration state and client synchronization state. The enabled/disabled state of a server controls its availability across client environments, while the removal operation permanently deletes the server configuration.

```mermaid
classDiagram
class McpServer {
+string id
+string name
+string description
+ServerSource source
+Transport transport
+boolean enabled
+string[] enabledClients
+string installedAt
+string updatedAt
+string installedVersion
+string sourceUrl
+string[] tags
+enableForClient(clientId)
+disableForClient(clientId)
}
class ServerSource {
+string type
+string package
+string version
+string path
+string image
+string repo
+string branch
+string url
}
class Transport {
+string type
+string command
+string[] args
+Record~string,string~ env
+string url
+Record~string,string~ headers
}
class ClientSyncStatus {
+ClientId clientId
+boolean enabled
+string lastSync
+string lastSyncChecksum
+boolean externallyModified
+string syncError
}
McpServer --> ServerSource : "has"
McpServer --> Transport : "uses"
McpServer --> ClientSyncStatus : "syncs to"
```

**Section sources**

- [index.ts](file://src/types/index.ts#L38-L51)
- [useServers.ts](file://src/hooks/useServers.ts#L146-L181)
- [tauri.ts](file://src/lib/tauri.ts#L114-L122)

## Error Handling and Rollback Procedures

The server removal system implements comprehensive error handling to maintain data integrity during lifecycle operations. Errors are handled at multiple levels with appropriate rollback procedures to prevent inconsistent states.

```mermaid
flowchart TD
A[Initiate Server Removal] --> B{Validate Server ID}
B --> |Invalid| C[Return Invalid ID Error]
B --> |Valid| D[Retrieve Server Configuration]
D --> |Not Found| E[Return Server Not Found Error]
D --> |Found| F[Attempt Resource Cleanup]
F --> |Cleanup Failed| G[Log Warning, Continue]
F --> |Cleanup Success| H[Remove from Configuration]
H --> |Remove Failed| I[Return Config Error]
H --> |Remove Success| J[Sync to Clients]
J --> |Sync Failed| K[Log Sync Error]
J --> |Sync Success| L[Return Success Response]
```

**Section sources**

- [installation.rs](file://src-tauri/src/commands/installation.rs#L150-L191)
- [config.rs](file://src-tauri/src/commands/config.rs#L119-L132)
- [installation.rs](file://src-tauri/src/services/installation.rs#L531-L554)

## Source-Specific Cleanup Operations

The cleanup_server function implements source-specific cleanup operations to handle different server types appropriately. This ensures that local resources are properly cleaned up while preserving shared resources.

```mermaid
flowchart TD
A[cleanup_server Function] --> B{Server Source Type}
B --> |GitHub| C[Remove Cloned Repository]
B --> |Docker| D[No Image Removal]
B --> |npm| E[No Package Removal]
B --> |uvx| F[No Package Removal]
B --> |Local| G[No File Removal]
B --> |Remote| H[No Action]
C --> I[Check Repos Directory]
I --> J[Verify Directory Ownership]
J --> K[Remove Directory Recursively]
K --> L[Return Result]
D --> M[Preserve Docker Images]
M --> N[User Manual Cleanup]
N --> L
E --> O[Preserve npm Packages]
O --> L
F --> P[Preserve uvx Packages]
P --> L
G --> Q[Preserve Local Files]
Q --> L
H --> L
```

**Section sources**

- [installation.rs](file://src-tauri/src/services/installation.rs#L531-L554)
- [installation.rs](file://src-tauri/src/commands/installation.rs#L164-L169)

## Performance Considerations

The server lifecycle management system incorporates several performance optimizations for batch operations and resource monitoring during state transitions.

### Batch Operation Performance

For operations involving multiple servers, the system implements efficient batch processing to minimize overhead:

```mermaid
flowchart LR
A[Batch Operation] --> B[Single Configuration Load]
B --> C[Process All Servers]
C --> D[Single Configuration Save]
D --> E[Single Sync Operation]
E --> F[Optimized Client Updates]
```

The system avoids repeated configuration loads and saves during batch operations, instead performing these operations once for the entire batch. This reduces I/O overhead and improves overall performance.

### Resource Monitoring

During lifecycle transitions, the system monitors resource usage to prevent performance degradation:

```mermaid
flowchart TD
A[State Transition] --> B[Monitor CPU Usage]
A --> C[Monitor Memory Usage]
A --> D[Monitor Disk I/O]
A --> E[Monitor Network Activity]
B --> F{High CPU Usage}
C --> G{High Memory Usage}
D --> H{High Disk I/O}
E --> I{High Network Activity}
F --> |Yes| J[Throttle Operations]
G --> |Yes| J
H --> |Yes| J
I --> |Yes| J
J --> K[Queue Remaining Operations]
K --> L[Process When Resources Available]
```

**Section sources**

- [useServers.ts](file://src/hooks/useServers.ts#L114-L131)
- [installation.rs](file://src-tauri/src/commands/installation.rs#L178-L184)
- [tauri.ts](file://src/lib/tauri.ts#L253-L254)

## Common Issues and Troubleshooting

This section addresses common issues encountered during server lifecycle operations and provides troubleshooting guidance.

### Failed Removals

Server removal operations may fail due to various reasons:

- **Invalid server ID**: The server ID provided does not match any existing server
- **Configuration access errors**: Issues reading or writing the configuration file
- **Permission errors**: Insufficient permissions to modify configuration or resources
- **Locked files**: Configuration file is locked by another process

### Orphaned Resources

Orphaned resources may occur when cleanup operations fail:

- **GitHub repositories**: Cloned repositories not properly removed
- **Temporary files**: Setup or installation artifacts left behind
- **Credential references**: Keychain entries not cleaned up

### Permission Errors

Permission errors during cleanup typically occur when:

- The application lacks write permissions to the repositories directory
- System-level file locks prevent directory removal
- Antivirus software interferes with file operations

### Troubleshooting Steps

When encountering issues with server lifecycle operations:

1. Verify the server ID is correct and the server exists
2. Check application permissions for configuration and data directories
3. Ensure no other processes are using the configuration file
4. Review application logs for detailed error messages
5. Restart the application to clear any transient state issues

**Section sources**

- [installation.rs](file://src-tauri/src/services/installation.rs#L531-L554)
- [config.rs](file://src-tauri/src/commands/config.rs#L119-L132)
- [installation.rs](file://src-tauri/src/commands/installation.rs#L150-L191)
