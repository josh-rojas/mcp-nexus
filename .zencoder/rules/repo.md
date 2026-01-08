---
description: Repository Information Overview
alwaysApply: true
---

# MCP Nexus Repository Information

## Summary

MCP Nexus is a desktop application for managing Model Context Protocol (MCP) servers across 8+ AI clients (Claude Code, Claude Desktop, Cursor, Cline, VS Code, Continue, Windsurf, Warp). Built with Tauri (Rust backend) and React (TypeScript frontend), it provides centralized configuration management, marketplace integration, secure credential storage via macOS Keychain, and automatic syncing across multiple AI platforms.

## Structure

```
mcp-nexus/
├── src/                    # React 19 TypeScript frontend
│   ├── components/         # UI components (layout, servers, marketplace, clients, dashboard, settings, common)
│   ├── pages/              # Route pages (Dashboard, Servers, Marketplace, Clients, Settings)
│   ├── hooks/              # Custom React hooks (useServers, useMarketplace, useClients, useCredentials, useHealth, useKeyboard, useUpdates, useDoctor)
│   ├── stores/             # Zustand stores (appStore, notificationStore)
│   ├── lib/                # Utilities and Tauri command wrappers
│   ├── types/              # TypeScript types and interfaces
│   └── test/               # Vitest tests and setup
├── src-tauri/              # Rust backend with Tauri 2.0
│   ├── src/
│   │   ├── commands/       # Tauri command handlers (config, clients, sync, health, marketplace, keychain, installation, updates, doctor)
│   │   ├── models/         # Data structures (server, client, config, marketplace, doctor)
│   │   ├── services/       # Business logic (config_manager, client_detector, sync_engine, health, installation, marketplace_client, keychain, doctor, updates)
│   │   ├── lib.rs          # Tauri app initialization
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   ├── icons/              # Application icons
│   └── capabilities/       # Tauri security capabilities
├── vite.config.ts          # Vite build configuration (port 1420, React plugin, Tailwind)
├── tsconfig.json           # TypeScript configuration (ES2020 target, strict mode)
├── eslint.config.js        # ESLint configuration (React hooks, React Refresh)
├── vitest.config.ts        # Vitest configuration (jsdom, v8 coverage)
└── .prettierrc              # Prettier code formatting rules
```

## Language & Runtime

**Frontend**:

- **Language**: TypeScript (~5.8.3)
- **Runtime**: Node.js (ES2020 target)
- **Build System**: Vite 7.0
- **Package Manager**: npm

**Backend**:

- **Language**: Rust (Edition 2021)
- **Runtime**: Native macOS binary via Tauri
- **Build System**: Cargo (Rust toolchain)
- **Version**: 0.1.0

## Dependencies

**Frontend Main Dependencies**:

- `react` ^19.1.0 - UI framework
- `react-dom` ^19.1.0 - React DOM rendering
- `react-router-dom` ^7.11.0 - Client-side routing
- `@tauri-apps/api` ^2 - Tauri command invocation
- `@tanstack/react-query` ^5.90.16 - Server state management
- `zustand` ^5.0.9 - Global client state
- `@tauri-apps/plugin-opener` ^2 - Open external links/apps

**Frontend Dev Dependencies**:

- Vite (7.0.4), TypeScript (5.8.3)
- Testing: Vitest (1.0.4), React Testing Library (14.1.2), jsdom (23.0.1)
- Linting: ESLint (9.39.2), TypeScript ESLint (8.51.0), Prettier (3.7.4)
- UI: Tailwind CSS (4.1.18), @tailwindcss/vite (4.1.18)
- Tauri CLI (2)

**Backend Dependencies**:

- `tauri` 2 - Desktop framework with devtools feature
- `serde`/`serde_json` - Serialization
- `tokio` 1 - Async runtime (sync, time, process features)
- `reqwest` 0.12 - HTTP client (JSON support)
- `dirs` 5 - Platform-specific directories
- `uuid` 1 - Unique identifiers
- `chrono` 0.4 - Timestamps
- `keyring` 3 - Secure credential storage (macOS Keychain, Windows Credential Manager)
- `thiserror` 2 - Error handling
- `urlencoding` 2 - URL encoding
- `tauri-build` 2 - Build-time tauri setup
- `tauri-plugin-opener` 2 - Open external resources

**Dev Dependencies**: `tempfile` 3 (testing)

## Build & Installation

**Frontend**:

```bash
npm install                    # Install dependencies
npm run dev                    # Run Vite dev server (port 1420)
npm run build                  # Build TypeScript + Vite bundle
npm run typecheck              # TypeScript type checking
npm run lint                   # ESLint + config check
npm run lint:fix               # Auto-fix linting issues
npm run format                 # Prettier formatting
```

**Full Application**:

```bash
npm install                    # Install all dependencies
npm run tauri dev              # Development with hot reload (Rust + React)
npm run tauri build            # Production binary (.dmg for macOS)
```

**Rust Backend**:

```bash
cd src-tauri && cargo test     # Run Rust unit tests (91 tests)
cargo clippy                   # Rust linter
```

## Main Files & Resources

**Frontend Entry Points**:

- `src/main.tsx` - React entry point (renders App into #root)
- `index.html` - HTML template with root element
- `src/App.tsx` - Main App component with routing

**Backend Entry Points**:

- `src-tauri/src/lib.rs` - Tauri app initialization and invoke handler registration
- `src-tauri/src/main.rs` - Binary entry point

**Configuration Files**:

- `src-tauri/tauri.conf.json` - Tauri app config (800x600 window, security CSP, bundle targets)
- `vite.config.ts` - Vite configuration (React + Tailwind plugins, dev port 1420)
- `tsconfig.json` - TypeScript strict mode, ES2020 target, bundler module resolution
- `vitest.config.ts` - Vitest setup (jsdom environment, v8 coverage, setupFiles: src/test/setup.ts)
- `eslint.config.js` - ESLint rules (React hooks, React Refresh)
- `.prettierrc` - Prettier formatting (2-space indent, semicolons, trailing commas)

**Central Configuration** (runtime):

- `~/.mcp-nexus/config.json` - Central MCP server configuration
- `~/.mcp-nexus/repos/` - Cloned GitHub repositories

## Testing

**Frontend Testing Framework**: Vitest (1.0.4) with React Testing Library

**Test Location**: `src/test/`

- Setup file: `src/test/setup.ts` (global test environment config)
- Test files: `*.test.tsx` (co-located or in test directory)
- Mock data: `src/test/mockData.ts`

**Test Files**:

- `ErrorBoundary.test.tsx` - Error boundary testing
- `HealthIndicator.test.tsx` - Health indicator component testing
- `useServers.test.tsx` - Custom hook testing

**Run Tests**:

```bash
npm run test                   # Vitest watch mode
npm run test:ui                # Vitest UI dashboard
npm run test:coverage          # Coverage report (v8 provider, HTML output)
cd src-tauri && cargo test     # Rust unit tests (91 tests)
```

**Backend Testing**:

- Test modules defined with `#[cfg(test)]` in Rust source files
- Test utilities in `src-tauri/src/tests/`
- Uses `tempfile` crate for temporary test directories

**Linting & Type Checking**:

```bash
npm run lint                   # ESLint check
npm run typecheck              # tsc --noEmit
cargo clippy                   # Rust clippy linter
```

## Type System & IPC

**Type Synchronization**: TypeScript types in `src/types/index.ts` must match Rust struct definitions in `src-tauri/src/models/` (critical for IPC reliability).

**Tauri Bridge**: `src/lib/tauri.ts` provides type-safe command wrappers for invoking Rust commands from React.

**React Query Caching**:

- Servers: `queryKey: ["servers"]` (10s stale time)
- Single server: `queryKey: ["servers", id]`
- Marketplace: `queryKey: ["marketplace", params]` (5min cache)
- Credentials: List-only caching (never cache values)
- Invalidate related queries in mutation `onSuccess` callbacks

## Key Concepts

**Central Config**: All MCP servers stored in `~/.mcp-nexus/config.json`, synced to individual client configs.

**Supported Clients**: Claude Code, Claude Desktop, Cursor, Cline, VS Code, Continue, Windsurf, Warp (manual config only).

**Sync Engine** (`src-tauri/src/services/sync_engine.rs`): Transforms central config to client-specific formats, preserves keychain credential references, respects `TransformOptions` (resolve_credentials flag).

**Credential Storage**: Uses macOS Keychain (service: `com.mcp-manager.credentials`). Client configs reference credentials as `keychain:credential-name`, never stored as plaintext.

**Marketplace Integration**: PulseMCP API (`https://api.pulsemcp.com/v0beta`) for server discovery with in-memory caching (5min TTL).

## Component Organization

- **`src/components/layout/`**: Sidebar, Header (persistent across routes)
- **`src/components/{domain}/`**: Domain-specific (servers, marketplace, clients, dashboard, settings)
- **`src/components/common/`**: Reusable UI (CredentialInput, LoadingSpinner, etc.)
- **`src/pages/`**: Route containers composing domain components
- **Barrel exports**: Each domain folder exports via `index.ts`

## Build Output

**Production Build**:

```bash
npm run tauri build            # Creates .dmg (macOS)
```

Output: `src-tauri/target/release/bundle/`

## Platform Constraints

- **macOS only**: Keychain integration and client paths are macOS-specific
- **Warp client**: Manual configuration only (no file sync)
- **Docker servers**: Require Docker daemon
- **GitHub repos**: Cloned to `~/.mcp-nexus/repos/`, requires git
