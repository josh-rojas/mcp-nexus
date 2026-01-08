# Frontend Architecture

<cite>
**Referenced Files in This Document**   
- [App.tsx](file://src/App.tsx)
- [main.tsx](file://src/main.tsx)
- [appStore.ts](file://src/stores/appStore.ts)
- [notificationStore.ts](file://src/stores/notificationStore.ts)
- [tauri.ts](file://src/lib/tauri.ts)
- [useKeyboard.ts](file://src/hooks/useKeyboard.ts)
- [useClients.ts](file://src/hooks/useClients.ts)
- [useServers.ts](file://src/hooks/useServers.ts)
- [useMarketplace.ts](file://src/hooks/useMarketplace.ts)
- [ErrorBoundary.tsx](file://src/components/common/ErrorBoundary.tsx)
- [Toast.tsx](file://src/components/common/Toast.tsx)
- [Header.tsx](file://src/components/layout/Header.tsx)
- [Sidebar.tsx](file://src/components/layout/Sidebar.tsx)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction

The MCP Nexus frontend architecture is a React 19 application built with a domain-driven component structure and modern state management patterns. The application serves as a desktop interface for managing MCP (Model Context Protocol) servers, clients, and marketplace interactions through a Tauri backend. The architecture emphasizes separation of concerns, reusability, and maintainability through a well-defined component hierarchy, state management strategy, and custom hooks system.

## Project Structure

```mermaid
graph TD
A[src] --> B[components]
A --> C[hooks]
A --> D[lib]
A --> E[pages]
A --> F[stores]
B --> G[clients]
B --> H[common]
B --> I[dashboard]
B --> J[layout]
B --> K[marketplace]
B --> L[servers]
B --> M[settings]
C --> N[useClients.ts]
C --> O[useServers.ts]
C --> P[useMarketplace.ts]
C --> Q[useKeyboard.ts]
D --> R[tauri.ts]
E --> S[Dashboard.tsx]
E --> T[Marketplace.tsx]
E --> U[Servers.tsx]
E --> V[Clients.tsx]
E --> W[Settings.tsx]
F --> X[appStore.ts]
F --> Y[notificationStore.ts]
```

**Diagram sources**

- [src/components](file://src/components)
- [src/hooks](file://src/hooks)
- [src/lib](file://src/lib)
- [src/pages](file://src/pages)
- [src/stores](file://src/stores)

**Section sources**

- [src](file://src)

## Core Components

The MCP Nexus frontend is organized around domain-based component directories (servers, clients, marketplace, etc.) with a clear separation between presentational and container components. The application uses React 19 features and follows modern React patterns for state management and data fetching. The component structure is designed to be scalable and maintainable, with reusable common components and domain-specific components.

**Section sources**

- [App.tsx](file://src/App.tsx)
- [main.tsx](file://src/main.tsx)

## Architecture Overview

```mermaid
graph TD
A[React Frontend] --> B[Zustand Stores]
A --> C[React Query]
A --> D[Custom Hooks]
A --> E[Tauri Commands]
B --> F[appStore]
B --> G[notificationStore]
C --> H[Server State]
C --> I[Client State]
C --> J[Marketplace State]
D --> K[useServers]
D --> L[useClients]
D --> M[useMarketplace]
D --> N[useKeyboard]
E --> O[Tauri Rust Backend]
F --> P[Global UI State]
F --> Q[Config State]
G --> R[Toast Notifications]
H --> S[Server List]
H --> T[Server Details]
I --> U[Client List]
I --> V[Client Status]
J --> W[Marketplace Search]
J --> X[Marketplace Cache]
```

**Diagram sources**

- [appStore.ts](file://src/stores/appStore.ts)
- [notificationStore.ts](file://src/stores/notificationStore.ts)
- [tauri.ts](file://src/lib/tauri.ts)
- [useServers.ts](file://src/hooks/useServers.ts)
- [useClients.ts](file://src/hooks/useClients.ts)
- [useMarketplace.ts](file://src/hooks/useMarketplace.ts)

## Detailed Component Analysis

### Component Hierarchy and Organization

The MCP Nexus frontend follows a domain-driven component organization with clear separation between presentational and container components. Components are organized by domain (servers, clients, marketplace, etc.) with reusable common components shared across the application.

```mermaid
graph TD
A[Root]
A --> B[App]
B --> C[ErrorBoundary]
B --> D[QueryClientProvider]
B --> E[BrowserRouter]
E --> F[AppContent]
F --> G[Sidebar]
F --> H[ErrorBoundary]
H --> I[Routes]
I --> J[Dashboard]
I --> K[Marketplace]
I --> L[Servers]
I --> M[Clients]
I --> N[Settings]
F --> O[ToastContainer]
```

**Diagram sources**

- [App.tsx](file://src/App.tsx)
- [main.tsx](file://src/main.tsx)
- [Sidebar.tsx](file://src/components/layout/Sidebar.tsx)
- [Toast.tsx](file://src/components/common/Toast.tsx)

### State Management Strategy

The application uses a hybrid state management approach combining Zustand for global client state and React Query for server state management. This separation allows for efficient state management with appropriate caching and synchronization strategies.

#### Global State with Zustand

```mermaid
classDiagram
class appStore {
+config : McpHubConfig | null
+isConfigLoaded : boolean
+servers : McpServer[]
+detectedClients : DetectedClient[]
+doctorReport : DoctorReport | null
+isLoading : boolean
+isSyncing : boolean
+error : string | null
+setConfig(config)
+setServers(servers)
+setDetectedClients(clients)
+setDoctorReport(report)
+setLoading(loading)
+setSyncing(syncing)
+setError(error)
+addServer(server)
+removeServer(serverId)
+updateServer(serverId, updates)
+updatePreferences(updates)
+clearError()
}
class notificationStore {
+notifications : Notification[]
+addNotification(notification)
+removeNotification(id)
+clearAll()
}
appStore <|-- useAppStore : "create"
notificationStore <|-- useNotificationStore : "create"
```

**Diagram sources**

- [appStore.ts](file://src/stores/appStore.ts)
- [notificationStore.ts](file://src/stores/notificationStore.ts)

#### Server State with React Query

```mermaid
sequenceDiagram
participant Component as "UI Component"
participant Hook as "Custom Hook"
participant Query as "React Query"
participant Tauri as "Tauri Command"
Component->>Hook : Call useServers()
Hook->>Query : useQuery(['servers'], getServers)
Query->>Query : Check cache/staleTime
alt Cached data available
Query-->>Hook : Return cached data
Hook-->>Component : Return servers
else Data stale or not cached
Query->>Tauri : invoke('get_servers')
Tauri-->>Query : Return server data
Query->>Query : Cache data with staleTime
Query-->>Hook : Return fresh data
Hook-->>Component : Return servers
end
Component->>Hook : mutate server data
Hook->>Query : useMutation(updateServer)
Query->>Tauri : invoke('update_server')
Tauri-->>Query : Return updated server
Query->>Query : Update cache with setQueryData
Query->>Query : Invalidate related queries
Query-->>Hook : Mutation complete
Hook-->>Component : Mutation complete
```

**Diagram sources**

- [useServers.ts](file://src/hooks/useServers.ts)
- [tauri.ts](file://src/lib/tauri.ts)

### Custom Hooks Architecture

The custom hooks architecture abstracts Tauri command interactions and provides data fetching, caching, and synchronization capabilities. These hooks serve as the primary interface between the UI components and the backend services.

```mermaid
flowchart TD
A[Custom Hooks] --> B[Data Fetching]
A --> C[Data Mutation]
A --> D[State Synchronization]
A --> E[Error Handling]
B --> F[useQuery for GET operations]
C --> G[useMutation for POST/PUT/DELETE]
D --> H[QueryClient.invalidateQueries]
D --> I[QueryClient.setQueryData]
E --> J[Error boundaries]
E --> K[Toast notifications]
F --> K
G --> K
H --> K
I --> K
subgraph Hook Examples
L[useServers] --> M[useServerList]
L --> N[useServer]
L --> O[useUpdateServer]
L --> P[useRemoveServer]
Q[useClients] --> R[useDetectedClients]
Q --> S[useClientStatuses]
Q --> T[useSyncClient]
U[useMarketplace] --> V[useMarketplace]
U --> W[useServerDetails]
end
```

**Diagram sources**

- [useServers.ts](file://src/hooks/useServers.ts)
- [useClients.ts](file://src/hooks/useClients.ts)
- [useMarketplace.ts](file://src/hooks/useMarketplace.ts)
- [tauri.ts](file://src/lib/tauri.ts)

### UI Component Organization

The UI components are organized into reusable common components and domain-specific components. This structure promotes consistency and reusability across the application.

```mermaid
graph TD
A[Components] --> B[Common]
A --> C[Domain-Specific]
B --> D[ErrorBoundary]
B --> E[Toast]
B --> F[CredentialInput]
B --> G[HealthIndicator]
C --> H[Servers]
C --> I[Clients]
C --> J[Marketplace]
C --> K[Dashboard]
C --> L[Settings]
C --> M[Layout]
H --> N[ServerCard]
H --> O[ServerList]
H --> P[AddServerModal]
I --> Q[ClientCard]
I --> R[SyncStatus]
I --> S[ManualConfigModal]
J --> T[MarketplaceCard]
J --> U[FilterPanel]
J --> V[SearchBar]
J --> W[SortDropdown]
K --> X[SummaryCard]
K --> Y[QuickActions]
K --> Z[RecentActivity]
M --> AA[Header]
M --> AB[Sidebar]
```

**Diagram sources**

- [components/common](file://src/components/common)
- [components/servers](file://src/components/servers)
- [components/clients](file://src/components/clients)
- [components/marketplace](file://src/components/marketplace)
- [components/dashboard](file://src/components/dashboard)
- [components/layout](file://src/components/layout)

### React Query Caching Strategy

The application implements a comprehensive caching strategy using React Query to optimize data fetching and improve user experience.

```mermaid
flowchart LR
A[Query Key] --> B[Cache Key]
B --> C[Stale Time]
C --> D[Cache Expiration]
subgraph Query Examples
E["['servers']"] --> F[10s staleTime]
G["['clients', 'detected']"] --> H[30s staleTime]
I["['clients', 'statuses']"] --> J[10s staleTime]
K["['marketplace', 'search']"] --> L[5m staleTime]
end
M[Data Fetch] --> N{In Cache?}
N --> |Yes| O{Stale?}
N --> |No| P[Fetch from Tauri]
O --> |No| Q[Return cached data]
O --> |Yes| R[Fetch from Tauri in background]
S[Mutation] --> T[Update Cache]
T --> U[setQueryData]
T --> V[invalidateQueries]
W[User Interaction] --> X[Refetch Data]
X --> Y[Pull to refresh]
X --> Z[Manual refresh button]
```

**Diagram sources**

- [useServers.ts](file://src/hooks/useServers.ts)
- [useClients.ts](file://src/hooks/useClients.ts)
- [useMarketplace.ts](file://src/hooks/useMarketplace.ts)

## Dependency Analysis

```mermaid
graph LR
A[App.tsx] --> B[React Router]
A --> C[React Query]
A --> D[Zustand]
A --> E[ErrorBoundary]
A --> F[ToastContainer]
A --> G[useGlobalKeyboardShortcuts]
A --> H[Pages]
H --> I[Dashboard]
H --> J[Marketplace]
H --> K[Servers]
H --> L[Clients]
H --> M[Settings]
I --> N[useServerList]
I --> O[useDetectedClients]
I --> P[initializeConfig]
N --> Q[useQuery]
N --> R[getServers]
O --> S[useQuery]
O --> T[detectClients]
Q --> U[React Query]
S --> U
R --> V[tauri.ts]
T --> V
V --> W[Tauri Commands]
W --> X[Rust Backend]
D --> Y[appStore.ts]
D --> Z[notificationStore.ts]
G --> AA[useKeyboard.ts]
AA --> AB[useNavigate]
F --> AC[notificationStore.ts]
```

**Diagram sources**

- [App.tsx](file://src/App.tsx)
- [useServers.ts](file://src/hooks/useServers.ts)
- [useClients.ts](file://src/hooks/useClients.ts)
- [tauri.ts](file://src/lib/tauri.ts)
- [appStore.ts](file://src/stores/appStore.ts)
- [notificationStore.ts](file://src/stores/notificationStore.ts)
- [useKeyboard.ts](file://src/hooks/useKeyboard.ts)

## Performance Considerations

The MCP Nexus frontend architecture incorporates several performance optimizations:

1. **React Query Caching**: Strategic use of staleTime and caching to minimize redundant data fetching
2. **Infinite Query**: Implementation of infinite scrolling for marketplace results to handle large datasets efficiently
3. **Selective Re-renders**: Proper use of React.memo and useCallback to prevent unnecessary re-renders
4. **Code Splitting**: Domain-based component organization enables potential code splitting
5. **Efficient State Updates**: Zustand stores provide efficient state updates with minimal re-renders
6. **Background Refetching**: React Query handles background data updates without blocking the UI
7. **Mutation Optimistic Updates**: useMutation with cache updates provides immediate UI feedback

The architecture balances real-time data requirements with performance considerations, ensuring a responsive user interface while maintaining data consistency.

## Troubleshooting Guide

### Error Boundary Implementation

The application implements a comprehensive error boundary system to handle runtime errors gracefully:

```mermaid
flowchart TD
A[Error Occurs] --> B[ErrorBoundary catches error]
B --> C[Log error to console]
C --> D[Set error state]
D --> E[Display fallback UI]
E --> F[Show error details]
F --> G[Provide reset option]
G --> H[Allow navigation to safe route]
```

**Section sources**

- [ErrorBoundary.tsx](file://src/components/common/ErrorBoundary.tsx)

### Toast Notification System

The toast notification system provides user feedback for various application events:

```mermaid
flowchart TD
A[Notification Trigger] --> B[showSuccess/showError/showWarning/showInfo]
B --> C[addNotification to notificationStore]
C --> D[Create notification object]
D --> E[Add to notifications array]
E --> F[Render ToastContainer]
F --> G[Display toast item]
G --> H{Duration > 0?}
H --> |Yes| I[Auto-remove after duration]
H --> |No| J[Wait for manual dismissal]
I --> K[Remove from store]
J --> L[Remove on click]
K --> M[Clean up]
L --> M
```

**Section sources**

- [notificationStore.ts](file://src/stores/notificationStore.ts)
- [Toast.tsx](file://src/components/common/Toast.tsx)

### Keyboard Event Handling

The keyboard event handling system provides global keyboard shortcuts for enhanced user experience:

```mermaid
flowchart TD
A[Key Press] --> B[Document listens for keydown]
B --> C[Check against registered shortcuts]
C --> D{Match found?}
D --> |Yes| E[Prevent default behavior]
E --> F[Execute shortcut action]
F --> G[Handle navigation or other actions]
D --> |No| H[Allow normal processing]
subgraph Shortcuts
I[Cmd+K: Open search]
J[Cmd+1: Dashboard]
K[Cmd+2: Marketplace]
L[Cmd+3: Servers]
M[Cmd+4: Clients]
N[Cmd+5: Settings]
end
```

**Section sources**

- [useKeyboard.ts](file://src/hooks/useKeyboard.ts)

### Integration with Tailwind CSS

The component styling approach leverages Tailwind CSS for consistent and maintainable styling:

1. **Utility-First Approach**: Direct application of Tailwind classes in JSX
2. **Consistent Design System**: Reusable components with consistent styling
3. **Dark Mode Support**: Implementation of dark mode using Tailwind's dark variant
4. **Responsive Design**: Mobile-first approach with responsive breakpoints
5. **Component-Specific Styling**: Scoped styles within components
6. **Animation Support**: Use of Tailwind's animation utilities for smooth transitions

The integration with Tailwind CSS enables rapid UI development while maintaining consistency across the application.

## Conclusion

The MCP Nexus frontend architecture demonstrates a well-structured React application with clear separation of concerns, effective state management, and reusable components. The domain-driven organization, combined with modern React patterns and tools, creates a maintainable and scalable codebase. The hybrid state management approach using Zustand for global client state and React Query for server state provides an optimal balance between performance and data consistency. The custom hooks architecture abstracts backend interactions and provides a clean interface for data fetching and mutation. Overall, the architecture supports the application's requirements for managing MCP servers, clients, and marketplace interactions while providing a responsive and user-friendly interface.
