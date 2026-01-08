# Phase Reordering Summary
**Finalized Plan Structure Based on Feature Dependencies & Dev Gaps**

---

## Overview

Plan reordering prioritizes **test harness completion and feature validation over app launch**. Features FEATURE-002, FEATURE-003, FEATURE-004 are implemented but untested; smoke tests in Phase 2 validate them before any UI testing occurs.

---

## Phase Structure (Updated)

### Phase 1: Foundation & Harness ✅ **COMPLETE**
- [x] FEATURE-005 Vitest & RTL harness setup

**Status:** Ready for Phase 2 smoke tests. Harness verified with 4/4 smoke tests passing, all dependencies pinned to specified versions.

---

### Phase 2: Feature Testing & Infrastructure 🔄 **NEXT**

**Ordering Logic:** Features are implemented; now validate them. Infrastructure gaps (shadcn/ui, dark mode) unblock all subsequent UI work.

**Steps:**
1. **DEV-GAP-001:** shadcn/ui + macOS theme integration
   - Unblocks: All subsequent UI work, component consistency
   - Priority: **P1 (Critical Path)**
   - Effort: M (4–6 hrs)

2. **FEATURE-005 – Servers & Marketplace smoke tests**
   - Validates: FEATURE-002 (notifications), FEATURE-004 (branding)
   - Coverage: Server install/uninstall, sync, Marketplace detail modal
   - Effort: M (4–6 hrs)

3. **FEATURE-005 – Clients, Settings, FirstRun smoke tests**
   - Validates: FEATURE-003 (auto-sync toggle), FEATURE-002 (sync toasts), FEATURE-004 (config path)
   - Coverage: Credential operations, first-run import, auto-sync triggering
   - Effort: M (4–6 hrs)

4. **Validation Gate after FEATURE-005**
   - Run: `npm run lint`, `npm run typecheck`, `npm test -- --run`
   - Success Criteria: All tests pass, no linting errors, branding/notification coverage confirmed

---

### Phase 3: Quality & Infrastructure 📋 **DEFERRED**

**Scope:** Accessibility, logging, error resilience, CI/CD setup. No changes to existing functionality; pure additions.

**Steps (In Order):**
1. **DEV-GAP-002:** Error boundary testing & resilience validation
   - Covers: Render errors, network failures, permission denials
   - Effort: S (2–4 hrs)

2. **DEV-GAP-003:** Pre-commit hooks & CI/CD validation script
   - Deliverables: Husky + lint-staged, GitHub Actions workflow
   - Effort: S–M (2–4 hrs)

3. **DEV-GAP-004:** Component library documentation
   - Deliverable: `docs/component-library.md`
   - Effort: S (1–2 hrs)

4. **DEV-GAP-005:** Accessibility baseline (aria-labels, roles, focus management)
   - Coverage: Navigation, modals, forms, buttons
   - Effort: M (4–8 hrs)

5. **DEV-GAP-006:** System dark mode detection & persistence
   - Deliverable: `useDarkMode` hook, localStorage persistence, system preference detection
   - Blocker: Requires GAP-001 (shadcn/ui theme)
   - Effort: S (2–4 hrs)

6. **DEV-GAP-007:** Environment variable configuration
   - Deliverables: `.env.example`, `src/lib/env.ts`
   - Effort: S (1–2 hrs)

7. **DEV-GAP-008:** Structured logging & instrumentation
   - Deliverable: `src/lib/logger.ts`, replace console calls
   - Effort: S (2–3 hrs)

---

### Phase 4: Post-MVP Features 🚀 **DEFERRED**

**FEATURE-006** (useServerDetails hook) and **FEATURE-001** (P2 Marketplace install flow).

**Steps:**
1. FEATURE-006 – useServerDetails hook implementation
2. FEATURE-006 – ServerDetailModal detail integration
3. FEATURE-006 – Details hook tests
4. Validation Gate after FEATURE-006
5. FEATURE-001 (P2) – Install mapping helper
6. FEATURE-001 (P2) – useInstallFromMarketplace hook
7. FEATURE-001 (P2) – Marketplace UI wiring
8. FEATURE-001 (P2) – Marketplace install tests
9. Cross-cutting notification behavior tests

---

### Phase 5: Final Verification 🎯 **DEFERRED**

1. Final Verification & Report
   - Run full backend/frontend test suite
   - Validate against all acceptance criteria
   - Write `report.md` summarizing implementation, test coverage, deferred items

---

## Key Changes from Original Plan

| Original | Reordered | Reason |
|----------|-----------|--------|
| FEATURE-002/003/004 implemented (no tests) | Features implemented → FEATURE-005 smoke tests validate | Dependencies: tests depend on harness; features need test coverage |
| FEATURE-005 harness setup → directly to FEATURE-005 detail hook | Added DEV-GAP-001 (shadcn/ui) before smoke tests | Unblocks component consistency; dark mode needs theme foundation |
| No dev gaps identified | Added 8 dev gaps (DEV-GAP-001 through -008) | Systematic gap analysis during reordering |
| No explicit "no app launch" gate | Added validation gate after FEATURE-005 | Ensures no app UI testing until core features validated |

---

## Blockers & Dependencies

### Critical Path (Longest Dependency Chain):
```
FEATURE-005 Vitest Harness ✅
    ↓
DEV-GAP-001 (shadcn/ui) ⟵ UNBLOCKS ALL UI WORK
    ↓
FEATURE-005 Smoke Tests (Servers, Marketplace, Clients)
    ↓
DEV-GAP-006 (Dark Mode) ⟵ DEPENDS ON GAP-001
    ↓
Phase 3 (A11y, Logging, CI/CD)
```

### No-Blocker Items (Can Run in Parallel):
- DEV-GAP-002 (Error boundary tests)
- DEV-GAP-003 (CI/CD setup)
- DEV-GAP-004 (Component docs)
- DEV-GAP-005 (Accessibility)
- DEV-GAP-007 (Env config)
- DEV-GAP-008 (Logging)

---

## Why No App Launch Until Phase 2 Complete?

1. **Feature-002/003/004 untested**: Notifications, auto-sync, branding could be broken
2. **No UI theme foundation**: shadcn/ui needed for component consistency
3. **Dark mode incomplete**: System preference detection missing
4. **Risk of regression**: Manual testing only; no automated safeguards

**Solution:** Phase 2 validates all implementations via smoke tests before any visual/interactive testing.

---

## Next Immediate Actions

1. ✅ **Review & Approve Reordering**: Confirm Phase 2 sequencing acceptable
2. 📋 **Start DEV-GAP-001**: shadcn/ui setup (critical path, unblocks all)
3. 🧪 **Begin FEATURE-005 smoke tests**: Parallel with DEV-GAP-001 if possible
4. ✔️ **Run validation gate**: All tests pass before considering Phase 3

---

## Success Metrics for Completion

**Phase 2 Complete When:**
- ✅ DEV-GAP-001 integrated (shadcn/ui components, macOS theme, Tailwind config updated)
- ✅ FEATURE-005 Servers & Marketplace smoke tests pass (10+ test cases)
- ✅ FEATURE-005 Clients, Settings, FirstRun smoke tests pass (10+ test cases)
- ✅ Validation gate passes: `npm run lint`, `npm run typecheck`, `npm test -- --run`
- ✅ All branding strings validated in tests ("MCP Nexus", `~/.mcp-nexus/config.json`)
- ✅ All notification emissions validated in tests (success/error toasts)
- ✅ Auto-sync toggle state validated in tests (UI binding + triggering)

---

## Notes

- **No app launch testing until Phase 2 complete**: Ensures features are validated before interactive testing
- **Dark mode deferred to Phase 3**: Depends on GAP-001 (shadcn/ui theme foundation)
- **Accessibility deferred to Phase 3**: No impact on feature functionality; pure UX improvement
- **Post-MVP gates remain**: FEATURE-001, FEATURE-006 to Phase 4 per original spec
