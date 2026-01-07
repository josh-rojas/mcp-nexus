# PRD: MVP Readiness Assessment & Launch-Blocking Gap Analysis

## 1. Product Context

MCP Nexus is a macOS Tauri desktop app that centrally manages MCP servers and syncs them across multiple AI clients (Claude Code/Desktop, Cursor, Cline, VS Code, Continue, Windsurf, Warp). The current codebase already implements the core desktop experience: React 19 + TS frontend with routing, marketplace browsing, server management, client detection/sync, health checks, updates, and secure credential storage via macOS Keychain.

The new capability is not a user-facing UI feature inside MCP Nexus itself, but a meta-level workflow: systematically assessing MVP readiness of the MCP Nexus product and generating a structured set of launch-blocking feature specifications based on the current repository state.

The output of this capability is a set of machine- and human-consumable feature specs (P0/P1/P2) that can be fed into Zenflow and other orchestration tools, plus a launch readiness summary.

## 2. Objectives & Outcomes

### 2.1 Primary Objective

Produce an auditable, repeatable MVP readiness assessment for the current MCP Nexus codebase, culminating in:

- A comprehensive inventory of implemented features, their completion % and health.
- A catalog of gaps, broken paths, and technical debt that materially affect launch readiness.
- A set of standalone, implementation-ready feature specs for each gap (suitable for Zenflow tasks).
- A launch readiness summary that clearly lists P0 launch blockers, P1 should-haves, and P2 post-launch items, including rough effort estimates.

### 2.2 Secondary Objectives

- Align the gap analysis with the existing architecture and roadmap in `README.md` and `CLAUDE.md`.
- Ensure the specs are compatible with the users spec-driven, multi-agent workflow (Zenflow, Cursor, Claude, etc.).
- Minimize rework by grounding all specs in the actual implementation (Rust commands, React hooks, Tauri wrappers), not just the README roadmap.

## 3. Scope

### 3.1 In Scope

- Static analysis of the repository (Rust backend, React frontend, Tauri bridge, hooks, stores, types).
- Identification of:
  - Implemented features vs. those only documented in README/CLAUDE.md.
  - Broken or incomplete flows (e.g., TODOs, stub hooks, unimplemented UI actions).
  - Gaps in error handling, notifications, and UX around critical paths.
  - Test harness presence and apparent coverage level (Rust tests, TS typechecking, linting).
- Generation of feature-level specifications for each identified gap using the provided template.
- Prioritization of specs into P0/P1/P2, with effort estimates.
- Launch readiness summary and (if >5 P0 items) a dependency diagram in Mermaid.

### 3.2 Out of Scope

- Implementing any of the identified feature specs (that will happen in later phases).
- Running tests or builds (analysis is source-based, though it should respect existing test-related files).
- Changing repository code or configuration for the sake of the assessment.

## 4. Users & Stakeholders

- Primary user: The expert consultant using Zenflow and other AI tools to orchestrate work on MCP Nexus.
- Secondary users:
  - Engineers implementing the generated feature specs.
  - Product owner responsible for deciding launch scope and timing.
  - DevOps/Platform engineers integrating MCP Nexus into internal tooling.

## 5. Current State Summary (High-Level)

This section captures the current state as input to the later gap analysis.

### 5.1 Frontend

- Routing and layout:
  - `src/App.tsx` defines routes for Dashboard, Marketplace, Servers, Clients, Settings.
  - Global `Sidebar`, keyboard shortcuts (`useKeyboard`), and `ToastContainer` are wired.
- Servers:
  - `src/hooks/useServers.ts` provides a full set of React Query hooks for list, single server, update, remove, toggle client, install/uninstall, and sync.
  - `src/components/servers/*` implements server cards, list, add server modal, health/status/update badges.
  - `src/pages/Servers.tsx` orchestrates server list UI and uses `useServers` for all operations.
  - TODOs exist for toast notifications around server operations.
- Marketplace:
  - `src/hooks/useMarketplace.ts` wraps Tauri commands for PulseMCP marketplace search, paging, and cache clearing.
  - `Marketplace` page and components (search, filter panel, cards, detail modal) exist.
  - There is a TODO indicating that the Marketplace "Install" flow is not fully wired to backend installation.
- Clients:
  - `src/hooks/useClients.ts` (not fully inspected yet) likely wraps client detection and sync status.
  - `src/components/clients` and `src/pages/Clients.tsx` provide UI for client status, manual config, and sync.
- Settings & Credentials:
  - `src/hooks/useCredentials.ts` and `src/components/settings` handle Keychain-backed credentials and environment status.
- Health & Updates:
  - `src/hooks/useHealth.ts` and `src/components/common/HealthIndicator.tsx` expose health checks.
  - `src/hooks/useUpdates.ts` and dashboard components summarize updates.

### 5.2 Backend (Rust / Tauri)

- Commands:
  - `src-tauri/src/commands/*.rs` implement domains: config, clients, sync, installation, marketplace, health, doctor, keychain, updates.
  - `src-tauri/src/lib.rs` wires all commands into Tauri `invoke_handler`, using `ConfigManager` and `MarketplaceClient`.
- Models:
  - `src-tauri/src/models/*.rs` define core structs: `McpServer`, `McpHubConfig`, `DetectedClient`, marketplace models, doctor report, health, etc.
- Services:
  - `ConfigManager` encapsulates file I/O, central config at `~/.mcp-nexus/config.json`.
  - `sync_engine` transforms central config to client-specific formats for all supported clients; warp is manual-only.
  - `marketplace_client` wraps PulseMCP API with in-memory caching.
  - `installation` handles installing servers from multiple sources and building transports.
  - `keychain` uses macOS Keychain for credentials with `keychain:` references.
  - `updates` checks for version updates via registries.

### 5.3 Cross-Cutting

- Types:
  - `src/types/index.ts` mirrors Rust models for use in the TS frontend, including server, client, marketplace, installation, updates, health, and doctor types.
- State and Notifications:
  - Zustand used via `src/stores/appStore.ts` and `src/stores/notificationStore.ts`.
  - Notification helpers (`showSuccess`, `showError`) exist but are not consistently used (per TODOs).
- Testing:
  - Rust: `README.md` references `cargo test` with 91 tests, implying decent backend coverage, but the test files are not yet inspected for this step.
  - Frontend: TypeScript type checking and linting commands exist; no explicit Jest/React Testing Library tests present in the tree.

## 6. Functional Requirements (For the Assessment Capability)

1. The assessment must scan the current repo and cross-reference:
   - Documented features in `README.md` and `CLAUDE.md`.
   - Implemented features across Rust, TS types, hooks, components, and pages.
   - TODO comments and placeholder logic (e.g., unimplemented install, missing toasts).
2. The assessment must classify each gap into:
   - P0 (launch blocker)  prevents reliable use of the advertised MVP features.
   - P1 (should have)  strongly recommended for a smooth launch, but not strictly blocking.
   - P2 (nice to have/post-launch)  quality-of-life and roadmap items.
3. For each gap, the assessment must output a standalone feature spec using the provided template, including:
   - Feature ID and name.
   - Current state description, gap description, acceptance criteria.
   - Technical approach (files, dependencies, breaking changes).
   - Verification steps (unit, integration, manual).
   - Effort estimate (S/M/L/XL) and dependency links.
4. The assessment must produce a launch readiness summary that includes:
   - List of P0, P1, P2 feature IDs.
   - Technical debt register (items tracked but not required for launch).
   - Aggregate effort estimate for all P0 items.
5. If more than 5 P0 items exist, the assessment must include a Mermaid dependency diagram connecting features.

## 7. Non-Functional Requirements

1. The specs must be consumable by both humans and tools:
   - Markdown format with stable headings and checklists.
   - Conservative use of assumptions and clear notes where behavior is inferred.
2. The analysis must be reproducible:
   - Grounded in static code and configuration, not runtime introspection.
   - Avoids dependency on local developer environment beyond the repo contents.
3. The specs must respect existing architecture and patterns:
   - Rust command flow: `commands` → `services` → `models` and TS types/hooks/UI.
   - React Query cache invalidation and keying strategy.
   - Keychain credential rules (never writing plaintext credentials to client configs).
   - Sync engine constraints (all 8 clients, correct file formats, 0600 permissions).
4. Security and compliance:
   - No spec should propose writing secrets into config files.
   - Any new diagnostics or logging should avoid leaking credentials or sensitive paths.

## 8. Assumptions & Open Questions

### 8.1 Assumptions

- The codebase in this repository is the single source of truth for MVP scope; external documentation is advisory.
- README features represent the intended MVP feature set for 1.0.
- The referenced 91 Rust tests exist and provide at least smoke coverage for core services; a detailed coverage audit is out of scope for this step.
- The target platform for initial launch is macOS only.
- The user will run the generated feature specs through Zenflow and may further decompose them.

### 8.2 Open Questions (for later clarification)

- Are there additional enterprise requirements (audit logging, RBAC, air-gapped operation) that must be considered P0 for specific deployments?
- Should the gap analysis treat roadmap items in README (e.g., CLI, Linux support) as P2 features, or leave them as roadmap-only?
- Is there an expected minimum level of frontend automated testing (e.g., smoke tests for critical flows) for MVP, or is manual QA acceptable initially?
- Are there any non-public integrations or clients that must be included in the sync engine before launch?

