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

---

### [ ] Step: Implement FEATURE-001 Marketplace Install Flow

Implement `installMapping` helper, `useInstallFromMarketplace` hook, and wire Marketplace UI to invoke the existing `install_mcp_server` command end-to-end (central config + client sync).

### [ ] Step: Implement FEATURE-002 Toast Notifications

Add `notifications` helper module and integrate success/error toasts for server install/uninstall, sync operations, Marketplace install, and credential operations.

### [ ] Step: Implement FEATURE-003 Auto-Sync Preference

Extend config models for `autoSyncOnChanges`, bind the Settings toggle to persisted state, and add debounced auto-sync triggering on server changes.

### [ ] Step: Implement FEATURE-004 Naming & Config Path Consistency

Update UI strings and documentation to consistently use “MCP Nexus” and `~/.mcp-nexus/config.json`, leaving keychain internals unchanged for compatibility.

### [ ] Step: Implement FEATURE-005 Frontend Smoke Tests

Configure Vitest + React Testing Library and add smoke tests for Servers, Marketplace, Clients, Settings/Credentials, and FirstRun flows.

### [ ] Step: Implement FEATURE-006 Marketplace Details Hook

Implement `useServerDetails` using `get_server_details` and enhance `ServerDetailModal` to consume richer detail data with graceful fallback.

### [ ] Step: Final Verification & Report

Run backend/frontend tests, perform targeted manual verification against acceptance criteria, and write `{@artifacts_path}/report.md` summarizing implementation and validation.
