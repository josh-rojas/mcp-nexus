## Task: Test Zenflow Wiring – Sandbox

This task exists solely to verify that Zenflow discovers tasks based on the presence of `.zenflow/tasks/{task_id}` folders in the repo.

### Objective

Confirm that a newly added task folder (`.zenflow/tasks/test-wiring-marketplace`) is:

- Detected by Zenflow.
- Presented in your orchestration UI / CLI as a distinct task.
- Usable end-to-end (requirements → spec → plan → implementation).

### Scope

- No code changes are required for this task.
- The only deliverable is validation that the wiring between the repository and Zenflow task discovery works as expected.

### Out of Scope

- Implementing any of the MVP hardening features (FEATURE-002–FEATURE-005).
- Modifying existing tasks or workflow templates.

