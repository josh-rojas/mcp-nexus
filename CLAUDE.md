# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Nexus is a Tauri-based desktop application for managing MCP (Model Context Protocol) servers across multiple AI clients. The architecture consists of a Rust backend (Tauri) with React frontend (TypeScript + Tailwind CSS).

**Current Status**: Phase 1 MVP (Foundation)

## Development Commands

### Frontend (React)

```bash
# Development mode (starts Tauri with hot reload)
npm run tauri dev

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Tests (Vitest + React Testing Library)
npm run test              # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Generate coverage report
```

### Backend (Rust)

```bash
# Run all Rust tests (91 tests as of Phase 1)
cd src-tauri && cargo test

# Run specific test module
cd src-tauri && cargo test config_manager

# Build production binary
npm run tauri build

# Check Rust code
cd src-tauri && cargo check
cd src-tauri && cargo clippy
```

### Tauri CLI

```bash
# Direct Tauri commands
npm run tauri -- <command>

# Example: Create new icon
npm run tauri icon path/to/icon.png
```

## Architecture

### Frontend-Backend Communication

All communication between the React frontend and Rust backend happens via **Tauri commands**. These are async functions defined in Rust and invoked from TypeScript.

**Rust Side** (`src-tauri/src/commands/`):

- Define `#[tauri::command]` functions
- Register in `lib.rs` via `.invoke_handler(tauri::generate_handler![...])`
- Commands are grouped by domain: config, clients, sync, marketplace, installation, keychain, health, updates

**TypeScript Side** (`src/lib/tauri.ts`):

- Wrapper functions that call `invoke()` from `@tauri-apps/api/core`
- Type-safe interfaces matching Rust structs
- All types defined in `src/types/index.ts` mirror `src-tauri/src/models/`

**Key Pattern**: When adding a new feature:

1. Define model in `src-tauri/src/models/<domain>.rs`
2. Implement service logic in `src-tauri/src/services/<domain>.rs`
3. Create command handler in `src-tauri/src/commands/<domain>.rs`
4. Register command in `src-tauri/src/lib.rs`
5. Add TypeScript wrapper in `src/lib/tauri.ts`
6. Add TypeScript types in `src/types/index.ts`

### Rust Backend Structure

**Three-Layer Architecture**:

1. **Models** (`src-tauri/src/models/`):
   - `config.rs` - McpHubConfig, McpServer, UserPreferences, ClientSettings
   - `server.rs` - ServerSource (npm, uvx, local, docker, remote, github), Transport (stdio, sse)
   - `client.rs` - DetectedClient, ClientSyncStatus, ConfigFormat
   - `marketplace.rs` - MarketplaceServer, SearchServersParams
   - `doctor.rs` - DoctorReport, VersionInfo, DoctorIssue

2. **Services** (`src-tauri/src/services/`):
   - `config_manager.rs` - Central config file management (~/.mcp-nexus/config.json)
   - `sync_engine.rs` - Multi-client config sync (Claude Code, Cursor, VS Code, etc.)
   - `client_detector.rs` - Auto-detect installed AI clients by config paths
   - `marketplace_client.rs` - Fetch servers from PulseMCP API (with caching)
   - `installation.rs` - Install from npm, PyPI, GitHub, Docker, local paths
   - `keychain.rs` - macOS Keychain integration for secure credentials
   - `health.rs` - Server health checks (stdio process spawn, SSE endpoint tests)
   - `updates.rs` - Check npm/PyPI registries for version updates
   - `doctor.rs` - Environment validation (Node, Python, Docker, Git detection)

3. **Commands** (`src-tauri/src/commands/`):
   - Thin handlers that call services and return results to frontend
   - All commands registered in `lib.rs`

**Central Config Location**: `~/.mcp-nexus/config.json`

**Client Config Paths** (macOS):

- Claude Code: `~/.claude.json`
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`
- Cline: `~/Documents/Cline/cline_mcp_settings.json`
- VS Code: `~/.vscode/mcp.json`
- Continue.dev: `~/.continue/config.json`
- Windsurf: `~/.codeium/windsurf/mcp_config.json`
- Warp: Manual copy-paste only (no auto-sync)

### Frontend Structure

**React 19 + TypeScript Stack**:

- **State**: Zustand stores (`src/stores/`)
  - `appStore.ts` - Global app state (sidebar open, search query)
  - `notificationStore.ts` - Toast notifications
- **Data Fetching**: TanStack React Query (`src/hooks/`)
  - Each domain has a dedicated hook: `useConfig`, `useServers`, `useClients`, `useMarketplace`, etc.
  - Queries cached and auto-refreshed
- **Routing**: React Router DOM
  - Single-page app with 5 main routes (Dashboard, Marketplace, Servers, Clients, Settings)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)

**Component Organization** (`src/components/`):

- Organized by domain (not by type): `servers/`, `clients/`, `marketplace/`, `settings/`, `dashboard/`
- `layout/` - Sidebar, Header, MainLayout
- `common/` - Shared UI components (Button, Modal, etc.)

**Pages** (`src/pages/`):

- Thin containers that compose domain components
- Each page corresponds to a route

### State Management Philosophy

- **Server State** (config, servers, clients): TanStack React Query
  - Cached, auto-invalidated on mutations
  - Optimistic updates for better UX
- **UI State** (sidebar, modals): Zustand stores
  - Keep stores small and focused
- **Local Component State**: React hooks (`useState`, `useReducer`)

### Sync Engine Architecture

The sync engine is a critical component that writes MCP server configurations to client config files.

**Key Implementation** (`src-tauri/src/services/sync_engine.rs`):

- `sync_to_client()` - Main sync function
- Client-specific formatters for different config schemas
- Automatic backup before write (`.backup` suffix)
- Checksum tracking to detect external modifications
- Credential reference resolution (`keychain:<name>` → actual value from macOS Keychain)

**Client Config Formats**:

- **Standard** (Claude Code, Claude Desktop, Cursor, Cline, Windsurf): `{ "mcpServers": { ... } }`
- **VS Code**: Nested under `{ "mcp": { "servers": { ... } } }`
- **Continue.dev**: Special merge into existing `config.json` preserving other settings

**File Permissions**: All config files written with 0600 (user read/write only) for security.

### Marketplace Integration

**PulseMCP API** (https://mcp.pulsebridge.app):

- Search endpoint: `/v1/search`
- Caching layer: 10-minute TTL in Rust service
- Pagination support
- Sort options: last_updated, popular_week, recommended, etc.

**Marketplace Flow**:

1. User searches in UI → `searchServers()` Tauri command
2. Rust service checks cache → fresh? return cached : fetch from API
3. Results displayed in `<MarketplaceGrid>` component
4. Click server → View details modal (description, install commands, GitHub stars, etc.)
5. **MVP**: Copy install command manually
6. **Post-MVP**: One-click install from marketplace

### Installation Architecture

**Multi-Source Support** (`src-tauri/src/services/installation.rs`):

1. **NPM** (`{ type: "npm", package: "..." }`):
   - Validate Node.js installed
   - Generate `{ command: "npx", args: ["-y", "package-name"] }` transport

2. **PyPI/uvx** (`{ type: "uvx", package: "..." }`):
   - Validate Python or `uv` installed
   - Generate `{ command: "uvx", args: ["package-name"] }` transport

3. **GitHub** (`{ type: "github", repo: "owner/repo" }`):
   - Clone to `~/.mcp-nexus/repos/<owner>-<repo>/`
   - Run optional `runCommand` (e.g., `npm install`)
   - Generate transport based on cloned content

4. **Local** (`{ type: "local", path: "/path/to/script" }`):
   - Validate path exists
   - Generate transport with custom command/args

5. **Docker** (`{ type: "docker", image: "..." }`):
   - Validate Docker installed
   - Generate docker run command

6. **Remote/SSE** (`{ type: "remote", url: "https://..." }`):
   - Generate SSE transport with URL + headers

**Installation Flow**:

1. UI: User fills install form → `installMcpServer()` Tauri command
2. Rust: Validate runtime available
3. Rust: Perform install (clone repo, etc.)
4. Rust: Add to central config
5. Rust: Sync to enabled clients
6. UI: Show success notification

### Credential Management

**macOS Keychain Integration** (`src-tauri/src/services/keychain.rs`):

- Uses `keyring` crate (cross-platform, macOS Keychain on macOS)
- Service name: `"mcp-nexus"`
- Entry name: credential key (e.g., `"anthropic-api-key"`)

**Reference Pattern**:

- UI: User stores credential "my-api-key" = "sk-..."
- Server env var: `{ "API_KEY": "keychain:my-api-key" }`
- Sync engine: Detects `keychain:` prefix → fetches actual value → writes to client config
- Client configs never contain `keychain:` references (resolved at sync time)

**Security**:

- Credentials never stored in `~/.mcp-nexus/config.json`
- Only credential names stored, values in OS secure storage
- Config files have 0600 permissions

### Health Checks

**Health Check Service** (`src-tauri/src/services/health.rs`):

- **stdio servers**: Spawn process with 5-second timeout, check if it responds
- **SSE servers**: HTTP GET to URL, check 200 response + content-type header
- Returns: `HealthStatus` (healthy, unhealthy, unknown, running, stopped)

**UI Integration**:

- "Test Connection" button on server cards
- Dashboard shows health status summary
- Auto-refresh every 30 seconds (configurable)

### Update Checking

**Version Comparison** (`src-tauri/src/services/updates.rs`):

- Query npm registry: `https://registry.npmjs.org/<package>/latest`
- Query PyPI registry: `https://pypi.org/pypi/<package>/json`
- Compare installed version (stored in McpServer.installedVersion) to latest
- Return update available flag + latest version

**Update Flow**:

1. Background job checks for updates (every 1 hour in MVP)
2. Dashboard badge shows count of available updates
3. User clicks "Update" → Re-run install command (to be implemented in Phase 4)

### Testing Strategy

**Frontend Tests** (Vitest + React Testing Library):

- Component tests in `src/test/`
- Focus on user interactions, not implementation details
- Mock Tauri commands using `vi.mock("@tauri-apps/api/core")`

**Backend Tests** (Rust):

- 91 tests covering models, services, commands
- Use `tempfile` crate for testing config file operations
- Mock HTTP client for marketplace tests
- Test all sync engine client formatters

**Critical Test Scenarios**:

- Config serialization/deserialization
- Sync engine handles all client formats
- Credential resolution in env vars
- Installation runtime validation
- Marketplace API response parsing

## Key Design Decisions

### Central Config Philosophy

All MCP servers are defined once in `~/.mcp-nexus/config.json` and synced to clients. This enables:

- Single source of truth
- Consistent server configs across clients
- Bulk enable/disable per client
- Credential management without duplicating secrets

### Per-Client Toggle

Each server has `enabledClients: string[]` array. Sync engine only writes server to client config if client ID is in this array.

### Backup Before Sync

Every sync creates `.backup` file before writing. If sync fails, backup can be restored.

### Checksum Tracking

After sync, calculate checksum of written config. Store in `ClientSettings.lastSyncChecksum`. On next sync, compare to detect external modifications.

### Async All The Way

All Rust operations are async (using `tokio`). All Tauri commands are async. Frontend uses async/await with React Query.

## Common Development Tasks

### Adding a New Client

1. Add client ID to `ClientId` type in `src/types/index.ts` and `src-tauri/src/models/client.rs`
2. Add config path to `get_client_config_path()` in `src-tauri/src/services/client_detector.rs`
3. Implement formatter in `src-tauri/src/services/sync_engine.rs` (follow existing patterns)
4. Add client logo to `src/components/clients/ClientLogo.tsx`
5. Update supported clients list in README

### Adding a New Server Source Type

1. Add variant to `ServerSource` enum in `src-tauri/src/models/server.rs` and `src/types/index.ts`
2. Implement install logic in `src-tauri/src/services/installation.rs`
3. Add UI form fields in `src/components/servers/AddServerModal.tsx`
4. Update install validation in `validate_runtime()`

### Adding a New Tauri Command

1. Define Rust function in `src-tauri/src/commands/<domain>.rs`
2. Register in `lib.rs` invoke_handler
3. Add TypeScript wrapper in `src/lib/tauri.ts`
4. Add types in `src/types/index.ts` (if needed)
5. Use in React hook/component

## Deferred Features (Post-MVP)

The following features are documented but not yet implemented:

- One-click marketplace install
- Per-tool enable/disable within servers
- Request logging and debugging UI
- CLI interface (`mcp` command)
- Automatic update installation (currently only detection)
- File watcher for auto-sync
- Hot reload for clients that support it
- Linux and Windows support (currently macOS only)

## Troubleshooting

### "Config file not found" errors

Check that `~/.mcp-nexus/` directory exists. Run `initialize_config` command to create it.

### Sync fails silently

Enable logging: `RUST_LOG=debug npm run tauri dev` to see Rust logs.

### Credential not resolved

Verify credential exists in keychain: `list_credentials()` command. Ensure `keychain:` prefix is used in env vars.

### Tests fail in CI

Ensure `tempfile` cleanup is working. Check for race conditions in parallel tests.
