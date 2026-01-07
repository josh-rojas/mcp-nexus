# Full SDD workflow – Test Zenflow Wiring

## Configuration
- **Artifacts Path**: `.zenflow/tasks/test-wiring-marketplace`

---

## Workflow Steps

### [ ] Step: Requirements

Confirm that the task requirements are understood and aligned:

1. This is a sandbox task to verify Zenflow wiring only.
2. No product code or documentation changes are required.
3. Success is defined as “task is visible and can be progressed in Zenflow.”

Artifacts:
- `.zenflow/tasks/test-wiring-marketplace/requirements.md`

### [ ] Step: Technical Specification

Confirm the technical assumptions:

1. Zenflow discovers tasks by scanning `.zenflow/tasks/{task_id}` folders.
2. Each task folder must contain `requirements.md`, `spec.md`, and `plan.md`.

Artifacts:
- `.zenflow/tasks/test-wiring-marketplace/spec.md`

### [ ] Step: Planning

Ensure the plan is sufficient for this sandbox:

1. No code changes will be made for this task.
2. The only action is to verify discovery and, optionally, mark steps complete in Zenflow.

Artifacts:
- `.zenflow/tasks/test-wiring-marketplace/plan.md`

### [ ] Step: Verification

1. Open Zenflow (CLI or UI) and trigger task discovery/refresh.
2. Confirm that a task with ID or folder `test-wiring-marketplace` appears.
3. Optionally, progress the task through its steps to ensure state updates work.

