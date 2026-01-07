# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 6b031852-820f-4504-ab0f-e6bfef04b2a9 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: bb32c793-9e03-4862-b023-87005affc80c -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 703391b7-e7f3-4682-b342-e7961f74e3d2 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step: Draft MVP gap analysis document

Create the final launch-blocking gap analysis markdown document as specified in `{@artifacts_path}/requirements.md` and `{@artifacts_path}/spec.md`.

1. Use the Phase 1–3 structure and feature specs (FEATURE-001–FEATURE-006) from `spec.md` as the canonical source, incorporating refinements from the latest analysis.
2. Ensure each gap is represented as a standalone, copy-pasteable feature spec in the requested format.
3. Include the launch readiness summary sections and Mermaid dependency diagram if there are >5 P0 items.
4. Save the final document to a durable file in the repo (e.g., `docs/mvp-gap-analysis.md`) and/or return it in the assistant response, as required by the workflow.

Verification:
- Manually review that all gaps and sections from `spec.md` are present and up to date.
- Spot-check feature IDs, priorities, and effort estimates for consistency.

### [x] Step: Validate analysis against codebase snapshot

Confirm that the gap analysis remains accurate against the current repository state.

1. Re-scan key areas referenced in `spec.md` (marketplace install flow, notifications, settings auto-sync toggle, config location, test harness, server details hook).
2. Verify that each referenced file and hook still exists and behaves as assumed in the analysis.
3. Adjust wording in the gap analysis if any assumptions are no longer accurate (e.g., partial implementations added).

Verification:
- Manually confirm at least one example per FEATURE-00X in the codebase.
- Record any deviations or updates in the gap analysis document.

### [x] Step: Integrate gap analysis into project documentation
<!-- chat-id: baec9b78-8de5-4a65-be3c-3321e8660641 -->

Make the gap analysis discoverable for maintainers and contributors.

1. Decide on a permanent home for the document (e.g., `docs/mvp-gap-analysis.md` or a similar path) based on repo conventions.
2. Add a short “MVP Readiness & Gap Analysis” section in `README.md` or an appropriate docs index, linking to the document.
3. Note how often the analysis should be revisited (e.g., before major releases) and who is responsible.

Verification:
- Open the rendered README/docs and confirm links are correct.
- Ensure naming (“MCP Nexus”, config paths, client list) is consistent between the gap analysis and existing docs.
