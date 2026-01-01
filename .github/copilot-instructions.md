# MCP Nexus - AI Agent Instructions

## Architecture Overview

**MCP Nexus** is a Tauri desktop app that manages Model Context Protocol (MCP) servers across 8+ AI clients (Claude, Cursor, Cline, etc.). It maintains a **central config** at `~/.mcp-nexus/config.json` and syncs to client-specific configs.

**Three-layer architecture:**

1. **Rust Backend** (`src-tauri/`): Config management, client detection, marketplace API, keychain integration
2. **React Frontend** (`src/`): UI with React Query for state management
3. **Tauri Bridge** (`src/lib/tauri.ts`): Type-safe command wrappers connecting frontend to Rust

## Critical Patterns

### Rust Command Flow

All Rust commands follow this pattern:

1. Define in `src-tauri/src/commands/{domain}.rs` (e.g., `config.rs`, `marketplace.rs`)
2. Export in `src-tauri/src/commands/mod.rs`
3. Register in `src-tauri/src/lib.rs` invoke_handler
4. Wrap in `src/lib/tauri.ts` with TypeScript types
5. Create React Query hook in `src/hooks/use{Domain}.ts`

**Example:** Adding a new server management command requires changes in all 5 files.

### Type Synchronization

TypeScript types in `src/types/index.ts` MUST match Rust structs in `src-tauri/src/models/`. The `Transport` enum supports both `stdio` (command + args + env) and `sse` (url + headers). When adding fields, update both simultaneously.

### React Query Cache Strategy

- Server list: `queryKey: ["servers"]`, 10s stale time
- Single server: `queryKey: ["servers", id]`
- Credentials: `queryKey: ["credentials"]`, list only (never cache values)
- Marketplace: `queryKey: ["marketplace", params]`, 5min cache via Rust layer
- **Always invalidate** related queries in mutation `onSuccess` callbacks

### Client Sync Engine

The sync engine (`src-tauri/src/services/sync_engine.rs`) transforms central config to client-specific formats:

- **Standard**: `{"mcpServers": {...}}`
- **VS Code**: `{"mcp": {"servers": {...}}}`
- **Continue.dev**: Merge into existing config without overwriting unrelated settings
- **Warp**: Manual-only (no file sync)

When modifying sync logic, test against all 8 clients. File permissions are set to 0600 for security.

### Credential References

Env vars support `keychain:credential-name` syntax. The sync engine resolves these at runtime via macOS Keychain (service: `com.mcp-manager.credentials`). **Never** write plaintext credentials to client configs - preserve the keychain reference.

## Development Workflow

### Commands

```bash
npm run tauri dev          # Hot reload for both Rust + React
cd src-tauri && cargo test # Run Rust unit tests (91 tests)
npm run lint              # ESLint + TypeScript check
npm run typecheck         # TypeScript only
cargo clippy              # Rust linter
npm run tauri build       # Production .dmg for macOS
```

### Adding a New Server Source

1. Add variant to `ServerSource` enum in `src-tauri/src/models/server.rs`
2. Update `install_server()` in `src-tauri/src/services/installation.rs` to handle new source
3. Add transport builder in `build_transport()` for the source type
4. Update TypeScript `InstallSource` in `src/types/index.ts`
5. Add UI form option in `src/components/servers/AddServerModal.tsx`
6. Write tests in `src-tauri/src/services/installation.rs`

### Notification Pattern

Use `showSuccess()` and `showError()` from `src/stores/notificationStore.ts`:

```typescript
import { showSuccess, showError } from "../../stores/notificationStore";

try {
  await someOperation();
  showSuccess("Title", "Description with details");
} catch (err) {
  showError("Title", err instanceof Error ? err.message : "Generic fallback");
}
```

### Component Organization

- `src/components/layout/`: Sidebar, Header (persistent across routes)
- `src/components/{domain}/`: Domain-specific components (servers, marketplace, clients, dashboard)
- `src/components/common/`: Reusable UI (CredentialInput, LoadingSpinner)
- `src/pages/`: Route containers that compose components

Each domain folder exports via `index.ts` barrel file for clean imports.

## Marketplace Integration

The PulseMCP API (`https://api.pulsemcp.com/v0beta`) is the source of truth for available MCP servers. Responses are cached in-memory (5min TTL) via `src-tauri/src/services/marketplace_client.rs`. Search supports:

- Query text (debounced 300ms in UI)
- Sort: `recommended`, `popular_week`, `popular_month`, `popular_all`, `last_updated`, `recently_released`, `alphabetical`
- Filters: `official`, `community`, `remote` (via `remotes` field presence)

When displaying servers, show both `stdio` and `sse` transport badges based on metadata.

## Testing Checklist

Before PRs, verify:

- [ ] `cargo test` passes (91 tests)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Sync to all clients works (test against real client configs)
- [ ] Credentials stored with 0600 permissions
- [ ] React Query cache invalidated after mutations
- [ ] Notifications shown for success/error cases

## Known Constraints

- **Warp**: Only supports manual config (no file sync). Show JSON in UI for copy-paste.
- **macOS only**: Keychain and client paths are macOS-specific. Linux/Windows support requires porting.
- **Docker servers**: Require Docker daemon running (check via doctor module).
- **GitHub repos**: Cloned to `~/.mcp-nexus/repos/`, requires git installed.

## Common Pitfalls

1. **Forgetting to invalidate React Query cache**: Always call `queryClient.invalidateQueries()` in mutations
2. **Breaking Rust-TypeScript type sync**: Changes to Rust structs require matching TypeScript updates
3. **Not setting file permissions**: New config files must be created with 0600 (`fs::write` + `fs::set_permissions`)
4. **Hardcoding client paths**: Use `dirs` crate for platform-appropriate paths
5. **Blocking Rust commands**: All Tauri commands should be `async` and use `tokio` for I/O

## Version Update Strategy

Version tracking compares `installedVersion` against PulseMCP/npm/PyPI latest. The UI shows update badges but doesn't auto-install (manual reinstall required). Check logic in `src-tauri/src/services/updates.rs` uses semver parsing with fallback to string comparison.
