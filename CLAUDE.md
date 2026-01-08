# MCP Nexus - Project Configuration

## Overview
MCP Nexus is a desktop application for managing MCP (Model Context Protocol) servers across multiple AI clients. Built with Tauri (Rust backend) + React (TypeScript frontend).

## Technology Stack
- **Backend**: Rust with Tauri framework
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Project Structure
```
mcp-nexus/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── layout/         # Sidebar, Header
│   │   ├── servers/        # Server-related components
│   │   ├── marketplace/    # Marketplace UI
│   │   ├── clients/        # Client management
│   │   └── common/         # Shared components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── lib/                # Utilities, Tauri wrappers
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/                # Rust source
│   └── Cargo.toml          # Rust dependencies
├── index.html              # Entry HTML
└── vite.config.ts          # Vite configuration
```

## Development Commands
```bash
# Start development server
npm run tauri dev

# Build production app
npm run tauri build

# Run Rust tests
cd src-tauri && cargo test

# Type check frontend
npm run build
```

## Key Concepts

### Central Config
All MCP server configurations are stored in `~/.mcp-nexus/config.json` and synced to individual client config files.

### Supported Clients
- Claude Code (`~/.claude.json`)
- Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)
- Cursor (`~/.cursor/mcp.json`)
- Cline (`~/Documents/Cline/cline_mcp_settings.json`)
- VS Code (`~/.vscode/mcp.json`)
- Continue.dev (`~/.continue/config.json`)
- Windsurf (`~/.codeium/windsurf/mcp_config.json`)
- Warp (manual configuration)

### Tauri Commands
Frontend communicates with Rust backend via Tauri commands. Command wrappers are in `src/lib/tauri.ts`.

## Coding Standards
- Use functional components with hooks
- Prefer Tailwind CSS for styling
- Use TypeScript strict mode
- Handle errors gracefully with user notifications
- Keep Rust code async using tokio

## Current Phase
Phase 1: Foundation (MVP Core) - Setting up project scaffold
