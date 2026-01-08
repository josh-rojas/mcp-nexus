# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 152ba68a-a19a-4e54-a945-75a8b99e5994 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

### [ ] Step: FEATURE-002 – Notification helper module

Introduce a `notifications` helper module that wraps `showSuccess`/`showError`/`showWarning`/`showInfo` with semantic functions for installs, uninstalls, syncs, and credential operations, avoiding exposure of secrets.

### [ ] Step: FEATURE-002 – Servers & Marketplace toast integration

Integrate notification helpers into Servers and Marketplace flows so server install/uninstall and Marketplace install paths consistently emit success/error toasts.

### [ ] Step: FEATURE-002 – Clients & credential toast integration

Integrate notification helpers into Clients sync operations and `CredentialManager` create/delete flows, ensuring completion/failure states are clearly surfaced.

### [ ] Step: FEATURE-002 – Notification behavior tests

Add focused tests around notification helpers and at least one UI-level assertion per critical flow to validate that expected notifications are emitted.

### [ ] Step: Validation Gate after FEATURE-002

Run `npm run lint`, `npm run typecheck`, and `cd src-tauri && cargo test` (if backend touched) to ensure no regressions before starting FEATURE-003.

### [ ] Step: FEATURE-003 – Auto-sync preference modeling (Rust/TS)

Extend `UserPreferences` in Rust and TS with an `autoSyncOnChanges` flag, maintain backwards-compatible defaults, and expose the preference via existing config commands.

### [ ] Step: FEATURE-003 – Settings UI binding for auto-sync

Bind the Settings “Auto-sync on changes” checkbox to the persisted preference using a config hook, handling loading/disabled states and error conditions.

### [ ] Step: FEATURE-003 – Auto-sync triggering on server changes

Implement a debounced auto-sync mechanism on the frontend that, when enabled, triggers a Sync All after relevant server mutations (install/uninstall/toggle) while reusing existing sync commands and notifications.

### [ ] Step: FEATURE-003 – Auto-sync tests & behavior verification

Add tests around preference persistence and auto-sync trigger logic, then manually verify that enabling/disabling the flag toggles background sync behavior as expected.

### [ ] Step: Validation Gate after FEATURE-003

Run `npm run lint`, `npm run typecheck`, and `cd src-tauri && cargo test` (if backend touched) to ensure no regressions before starting FEATURE-004.

### [ ] Step: FEATURE-004 – Branding & config path updates in UI

Update UI components (Sidebar, Settings, FirstRun, page metadata) so all user-facing app-name and central-config-path references use “MCP Nexus” and `~/.mcp-nexus/config.json`.

### [ ] Step: FEATURE-004 – Branding & config path updates in docs

Review README and relevant docs for residual “MCP Manager” / `~/.mcp-manager` references and update them or add clarifying migration notes where appropriate.

### [ ] Step: FEATURE-004 – Branding verification sweep

Run a repo-wide search to confirm no incorrect user-facing branding or config-path references remain, explicitly excluding intentional keychain internals.

### [ ] Step: Validation Gate after FEATURE-004

Run `npm run lint` and `npm run typecheck` to ensure UI-only branding changes are clean before starting FEATURE-005.

### [ ] Step: FEATURE-005 – Vitest & RTL harness setup

Configure Vitest and React Testing Library (plus jsdom) in `package.json` and `vitest.config.ts`, including a shared `src/test/setup.ts` that mocks Tauri `invoke`.

### [ ] Step: FEATURE-005 – Servers & Marketplace smoke tests

Implement smoke tests for the Servers and Marketplace pages that cover server install/sync and Marketplace install flows (post FEATURE-001 wiring).

### [ ] Step: FEATURE-005 – Clients, Settings, and FirstRun smoke tests

Implement smoke tests for Clients sync, credential create/delete in Settings, and first-run import behavior, ensuring they rely on mocked backends only.

### [ ] Step: Validation Gate after FEATURE-005

Run `npm run lint`, `npm run typecheck`, and `npm test` to confirm the new frontend test harness and smoke tests are stable before starting FEATURE-006.

### [ ] Step: FEATURE-006 – useServerDetails hook implementation

Replace the stubbed `useServerDetails` with a real React Query hook that calls `get_server_details`, keyed per server name and respecting Marketplace cache semantics.

### [ ] Step: FEATURE-006 – ServerDetailModal detail integration

Enhance `ServerDetailModal` to consume `useServerDetails`, prefer richer metadata when available, and degrade gracefully to list data on errors.

### [ ] Step: FEATURE-006 – Details hook tests & UX verification

Add tests for `useServerDetails` query behavior and a UI-level assertion for the detail modal, then manually inspect a few Marketplace entries to validate UX and error resilience.

### [ ] Step: Validation Gate after FEATURE-006

Run `npm run lint`, `npm run typecheck`, and UI-focused tests touching Marketplace to ensure detail hook changes are stable before any P2 work on FEATURE-001.

---

### [ ] Step: FEATURE-001 (P2) – Install mapping helper & type alignment

Design and implement a TS mapping helper that converts `MarketplaceServer` plus client/transport selections into a valid `InstallServerRequest`, ensuring TS types remain aligned with Rust models.

### [ ] Step: FEATURE-001 (P2) – useInstallFromMarketplace hook

Add a dedicated `useInstallFromMarketplace` mutation in `useMarketplace` that consumes the mapping helper, calls `install_mcp_server`, and invalidates `servers`, `clients/statuses`, and `updates` queries on success.

### [ ] Step: FEATURE-001 (P2) – Marketplace UI wiring & UX

Wire `ServerDetailModal` and the `Marketplace` page to the new hook, thread through transport mode and SSE URL, surface loading/error states, and close the modal only on successful installation.

### [ ] Step: FEATURE-001 (P2) – Marketplace install tests & manual verification

Add TS tests for the mapping helper plus at least one Marketplace install smoke test, then manually verify end-to-end installs for npm/uvx/docker/remote sources.

### [ ] Step: Final Verification & Report

Run backend/frontend tests, perform targeted manual verification against acceptance criteria, and write `{@artifacts_path}/report.md` summarizing implementation and validation.
