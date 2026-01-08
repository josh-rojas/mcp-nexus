# Contributing to MCP Nexus

## Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/josh-rojas/mcp-nexus.git
cd mcp-nexus
npm install

# Start development
npm run tauri dev
```

## Build & Test

```bash
# Type check and lint
npm run typecheck
npm run lint

# Run Rust tests
cd src-tauri && cargo test

# Production build
npm run tauri build
```

## Project Structure

- **src/** - React frontend (TypeScript, Tailwind CSS)
- **src-tauri/** - Rust backend (Tauri framework)
- **src/components/** - UI components by domain
- **src-tauri/src/commands/** - Tauri command handlers
- **src-tauri/src/services/** - Core business logic
- **src-tauri/src/models/** - Data models and types

## Architecture Decisions

See `.github/copilot-instructions.md` for detailed architectural patterns, critical workflows, and development guidelines.

## Code Standards

- Use TypeScript strict mode
- Follow existing component patterns
- Add tests for business logic
- Keep Rust commands async using tokio
- Set file permissions to 0600 for config files

## Submitting Changes

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and test locally
3. Run `npm run lint` and `npm run typecheck`
4. Commit with clear message: `git commit -m "feat: description"`
5. Push and open PR

## v2 Roadmap

See `CLAUDE.md` for deferred features planned for future releases.
