# MCP Nexus

> A unified manager for Model Context Protocol (MCP) servers across multiple AI clients

MCP Nexus is a desktop application that centralizes the management of MCP servers, allowing you to install, configure, and sync servers across 8+ AI clients from one place.

## Features

- **🎯 Central Configuration** - Manage all MCP servers from a single config file
- **🔄 Multi-Client Sync** - Automatically sync to Claude Code, Claude Desktop, Cursor, Cline, VS Code, Continue, Windsurf, and Warp
- **🛍️ Marketplace Browsing** - Discover servers from the PulseMCP marketplace (browse-only in MVP; one-click install planned post-MVP)
- **🔐 Secure Credentials** - Store API keys and tokens securely in macOS Keychain
- **✅ Health Monitoring** - Check server health and connection status
- **📦 Multiple Sources** - Install from NPM, PyPI, Docker, GitHub, local paths, or remote URLs
- **🔄 Update Notifications** - Get notified when new server versions are available
- **⚡ Keyboard Shortcuts** - Navigate quickly with Cmd+1-5, Cmd+K, and more

## Installation

### Prerequisites

- macOS (currently macOS-only, Linux/Windows support planned)
- Node.js (for NPM-based servers)
- Python (for Python-based servers)
- Docker (optional, for Docker-based servers)
- Git (optional, for GitHub repo installations)

### Download

1. Download the latest `.dmg` from [Releases](https://github.com/josh-rojas/mcp-nexus/releases)
2. Open the `.dmg` and drag MCP Nexus to Applications
3. Launch MCP Nexus from Applications

## Getting Started

### First Run

On first launch, MCP Nexus will:

1. Create `~/.mcp-nexus/` directory for central config
2. Detect installed AI clients
3. Offer to import existing MCP server configurations

### Installing Your First Server

For the MVP, install servers via the **Servers** page:

1. Go to **Servers** (Cmd+3)
2. Click **Add Server Manually**
3. Choose the source type (Local, Remote/SSE, NPM, etc.)
4. Configure transport (stdio or SSE) and environment variables
5. Select target clients and save
6. Click **Sync All** to update client configs

You can use the **Marketplace** (Cmd+2) to discover servers and view recommended install commands, then configure them manually on the Servers page. Full one-click install from Marketplace is planned post-MVP.

### Managing Servers

- **View Installed Servers**: Go to Servers page (Cmd+3)
- **Toggle Per-Client**: Expand a server card and enable/disable for specific clients
- **Check Health**: Click Test Connection on any server
- **Remove Server**: Click Remove button with confirmation

### Supported Clients

| Client         | Config Path                                                       | Sync Mode |
| -------------- | ----------------------------------------------------------------- | --------- |
| Claude Code    | `~/.claude.json`                                                  | ✅ Auto   |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | ✅ Auto   |
| Cursor         | `~/.cursor/mcp.json`                                              | ✅ Auto   |
| Cline          | `~/Documents/Cline/cline_mcp_settings.json`                       | ✅ Auto   |
| VS Code        | `~/.vscode/mcp.json`                                              | ✅ Auto   |
| Continue.dev   | `~/.continue/config.json`                                         | ✅ Auto   |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`                             | ✅ Auto   |
| Warp           | Manual copy-paste                                                 | 📋 Manual |

## Advanced Usage

### Credential Management

Store sensitive API keys in macOS Keychain:

1. Go to **Settings** (Cmd+5)
2. Click **Add Credential**
3. Enter name (e.g., `anthropic-api-key`) and value
4. Reference in server env vars as `keychain:anthropic-api-key`

Credentials are never written to client configs - only the reference is synced.

### Manual Server Installation

For local paths or custom configurations:

1. Go to **Servers** page
2. Click **Add Server Manually**
3. Choose source type (Local, Remote/SSE, NPM, etc.)
4. Configure transport (stdio or SSE)
5. Add environment variables
6. Select target clients

### Keyboard Shortcuts

- **Cmd+1-5**: Navigate between pages
- **Cmd+K**: Focus search / go to Marketplace
- **Cmd+R**: Refresh current page
- **?**: Show keyboard shortcuts help (coming soon)

## Troubleshooting

### Server Won't Start

1. Check **Settings > Environment** to verify required runtimes are installed
2. Click **Test Connection** on the server to see detailed error
3. Verify environment variables and credentials are set correctly

### Sync Fails

1. Check file permissions on client config files (should be readable/writable)
2. Verify the client is installed and config path exists
3. For Continue.dev, ensure existing config.json is valid JSON

### Client Not Detected

1. Verify the client is installed in the standard location
2. Check **Clients** page to see detection status
3. Some clients (like Claude Code) may need to be run once to create config

### Warp Configuration

Warp doesn't support automatic config file sync. To configure Warp:

1. Go to **Clients** page
2. Click on Warp card
3. Copy the generated JSON
4. Open Warp → Settings → MCP
5. Paste the JSON

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production binary
npm run tauri build

# Run tests
cargo test  # Rust tests (91 tests)
npm run typecheck  # TypeScript checks
npm run lint  # Linting
```

### Project Structure

```
mcp-nexus/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── lib/                # Utilities, Tauri wrappers
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── models/         # Data structures
│   │   └── services/       # Business logic
│   └── Cargo.toml          # Rust dependencies
└── .mcp-nexus/             # Runtime directory (user home)
    ├── config.json         # Central config
    └── repos/              # Cloned GitHub repos
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, React Query
- **Backend**: Rust, Tauri 2.0
- **State**: Zustand for global state
- **Security**: macOS Keychain for credentials

## MVP Readiness & Gap Analysis

The current MVP readiness assessment and launch-blocking gap analysis for MCP Nexus is documented in [docs/mvp-gap-analysis.md](docs/mvp-gap-analysis.md). This document is the source of truth for P0/P1 gaps, feature specs, and launch criteria.

Core maintainers should review and update the gap analysis:

- Before each minor or major release.
- After landing any feature that touches Marketplace install, sync engine, credential handling, or client detection.
- At least once per quarter during active development.

Responsibility for keeping the analysis current sits with the MCP Nexus core maintainers and release owners.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/josh-rojas/mcp-nexus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/josh-rojas/mcp-nexus/discussions)

## Roadmap

- [ ] Linux and Windows support
- [ ] Per-tool enable/disable within servers
- [ ] Request logging and debugging
- [ ] CLI interface (`mcp` command)
- [ ] Automatic update installation
- [ ] File watcher for auto-sync
- [ ] Hot reload for clients that support it

---

Made with ❤️ for the MCP community
