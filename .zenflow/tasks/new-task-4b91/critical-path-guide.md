# Critical Path Guide: Phase 2 Implementation Order
**Complete Dependency Analysis for shadcn/ui + Dark Mode + Smoke Tests**

---

## Executive Summary

**Start Date:** Phase 2 begins after FEATURE-005 Vitest harness (✅ Complete)

**Critical Path (No-Skip Items):**
1. GAP-013: Tailwind Configuration (1–2 hrs)
2. GAP-009: Theme Provider Context (2–3 hrs, parallel)
3. GAP-001: shadcn/ui Setup (4–6 hrs, depends on 1+2)
4. GAP-010: Toast Replacement (2–4 hrs, depends on 3)
5. FEATURE-005 Smoke Tests (8–12 hrs, depends on 4)

**Total Critical Path:** ~17–27 hours (3–4 days at ~8 hrs/day)

**Parallel Work Possible:** GAP-013 and GAP-009 can run simultaneously (both prerequisites for GAP-001)

---

## Detailed Dependency Graph

```
Phase 1: Completed ✅
└─ FEATURE-005 Vitest Harness (test infrastructure ready)

Phase 2: Critical Path
├─ GAP-013 (Tailwind Config) ────────┐
│  └─ Effort: 1–2 hrs                 │
│  └─ Prereq: None                    ├─→ GAP-001 (shadcn/ui Setup) ──→ GAP-010 (Toast) ──→ Smoke Tests
│                                     │   └─ Effort: 4–6 hrs                │
│                                     │   └─ Prereq: Both 013 + 009         └─ Effort: 2–4 hrs
├─ GAP-009 (Theme Context) ──────────┘                                      └─ Effort: 8–12 hrs
│  └─ Effort: 2–3 hrs
│  └─ Prereq: None
│  └─ Also Unblocks: GAP-006 (Dark Mode Detection) in Phase 3
```

---

## Phase 2 Step-by-Step

### Step 1: GAP-013 – Tailwind Configuration (1–2 hrs)

**Status:** Ready to start (no blockers)

**What:** Create `tailwind.config.ts` with shadcn/ui preset, dark mode class strategy, custom animations, macOS fonts.

**Why:** shadcn/ui requires a properly configured Tailwind config. Without this, shadcn/ui installation will fail or produce incorrect styling.

**Output:** `/tailwind.config.ts`

**Deliverables:**
- ✅ shadcn/ui preset configuration
- ✅ Dark mode class strategy (`["class"]`)
- ✅ Custom `animate-slide-in` animation (referenced in existing Toast.tsx)
- ✅ macOS system font stack (SF Pro)
- ✅ tailwindcss-animate plugin

**Tests:** No unit tests; verify:
- `npm run build` produces correct CSS
- Dark mode classes compile correctly
- Custom animations available

**Blocks:** GAP-001

---

### Step 2: GAP-009 – Theme Provider & Dark Mode Context (2–3 hrs)
**Can run in parallel with Step 1**

**Status:** Ready to start (no blockers)

**What:** Create React Context for theme state (light/dark/system) with hooks, system preference detection, localStorage persistence.

**Why:** shadcn/ui components and custom components need access to theme state via React context (not just CSS classes). Also enables Settings page to wire up theme switcher.

**Output:**
- `src/contexts/ThemeContext.ts`
- `src/hooks/useTheme.ts`
- `src/components/ThemeProvider.tsx`

**Deliverables:**
- ✅ `ThemeContext` with type `Theme = "light" | "dark" | "system"`
- ✅ `resolvedTheme` computed value (system preference or user choice)
- ✅ `setTheme()` function with localStorage persistence
- ✅ `<ThemeProvider>` component that:
  - Detects system preference on mount via `prefers-color-scheme`
  - Restores user preference from localStorage
  - Listens to system preference changes
  - Toggles `document.documentElement.classList` for Tailwind dark mode
  - Provides context to children

**Tests:**
- Unit test: Theme detection on mount (localStorage vs system)
- Unit test: Theme change triggers class toggle
- Unit test: System preference listener updates resolved theme

**Blocks:** GAP-001

---

### Step 3: GAP-001 – shadcn/ui Setup (4–6 hrs)
**Depends on: Step 1 + Step 2 complete**

**Status:** Blocked until both prerequisites ready

**What:** Install shadcn/ui CLI, initialize component library, add primary components, integrate with theme provider.

**Why:** Provides standardized, accessible, theme-aware component library for all UI work.

**Output:**
- `src/components/ui/` directory with shadcn component stubs
- Updated `tailwind.config.ts` (verify no conflicts with Step 1)
- Integration with ThemeProvider from Step 2

**Deliverables:**
- ✅ shadcn/ui CLI initialized
- ✅ Primary components:
  - `Button` (for all action buttons)
  - `Card` (for server/client cards)
  - `Dialog` (for modals: ServerDetailModal, AddServerModal, ManualConfigModal)
  - `Input` (for form fields)
  - `Select` (for dropdowns)
  - `Badge` (for status badges)
  - `Toast` (for notifications)
  - `Checkbox` (for toggles like auto-sync)
- ✅ Tailwind config verified (no conflicts with Step 1)
- ✅ Dark mode CSS variables applied
- ✅ `docs/ui-patterns.md` documenting component usage, variant system, dark mode patterns
- ✅ Optional: lucide-react for icons (replaces inline SVGs in Sidebar)

**Tests:**
- Unit test: Each component renders in light/dark modes
- Unit test: Theme context integration (dark mode class applied)
- Snapshot test: Component variants

**Blocks:** GAP-010 (Toast replacement), GAP-011 (Modal migration), all subsequent UI work

---

### Step 4: GAP-010 – Toast Component Replacement (2–4 hrs)
**Depends on: Step 3 (GAP-001) complete**

**Status:** Blocked until shadcn/ui ready

**What:** Replace custom `Toast.tsx` with shadcn/ui Toast + Toaster. Migrate notification system to use shadcn/ui `toast()` API.

**Why:** Custom Toast uses hardcoded colors that won't respect shadcn/ui theme. shadcn/ui Toast integrates with context and dark mode seamlessly.

**Output:**
- Updated `src/components/common/Toast.tsx` (or delete, replace with shadcn Toaster)
- Updated `src/stores/notificationStore.ts` (integrate shadcn toast API or create bridge)

**Deliverables:**
- ✅ Custom Toast.tsx deleted or deprecated
- ✅ `<Toaster />` component added to App.tsx
- ✅ Notification store bridges to shadcn/ui `toast()` API:
  ```typescript
  showSuccess(title, message) → toast({ title, description: message, variant: "success" })
  showError(title, message) → toast({ title, description: message, variant: "destructive" })
  ```
- ✅ All notification helpers (`showSuccess`, `showError`, etc.) updated to use new API
- ✅ Animations (`animate-slide-in`) work with Tailwind config from Step 1

**Tests:**
- Unit test: Notification store emits shadcn/ui toasts
- Integration test: showSuccess/showError/showWarning/showInfo all call toast()
- Snapshot test: Toast variants (success/error/warning/info)

**Blocks:** FEATURE-005 Smoke Tests (tests will verify toasts render correctly)

---

### Step 5: FEATURE-005 – Servers & Marketplace Smoke Tests (4–6 hrs)
**Depends on: Step 4 (GAP-010) complete**

**Status:** Blocked until Toast replacement ready

**What:** Implement smoke tests for Servers and Marketplace pages. Verify notifications (shadcn/ui Toast), branding strings, marketplace interactions.

**Why:** Validates FEATURE-002 (notifications via shadcn/ui), FEATURE-004 (branding copy), and ensures components render correctly with new theme system.

**Coverage:**
- ✅ Server install → success toast + server added to list
- ✅ Server uninstall → success toast + server removed
- ✅ Server sync → loading state → success/error toast
- ✅ Marketplace search → results rendered with branding
- ✅ Marketplace detail modal → copy uses "MCP Nexus" and `~/.mcp-nexus/config.json`
- ✅ Detail modal close button works

**Tests:**
- Mock Tauri command for install (return mock server)
- Mock Tauri command for uninstall (return success)
- Mock Tauri command for sync (simulate loading → success)
- Assert toast appears with correct type/message
- Assert "MCP Nexus" string present in rendered output
- Assert branding strings correct in all locales

**Effort:** 4–6 hrs

---

### Step 6: FEATURE-005 – Clients, Settings, FirstRun Smoke Tests (4–6 hrs)
**Depends on: Step 5 complete (or can run in parallel once Step 4 done)**

**What:** Implement smoke tests for Clients sync, Settings (auto-sync toggle), FirstRun import, Dashboard actions.

**Why:** Validates FEATURE-003 (auto-sync preference bound to context), FEATURE-002 (sync toasts), FEATURE-004 (config path references).

**Coverage:**
- ✅ Auto-sync checkbox checked/unchecked → preference persists (localStorage or Zustand)
- ✅ Server change (add/toggle) with auto-sync enabled → Sync All triggered automatically
- ✅ Credential create → success toast + credential added
- ✅ Credential delete → success toast + credential removed
- ✅ FirstRun import → reads existing client configs → success toast
- ✅ Dashboard quick actions render correctly (with theme provider)
- ✅ Config path references show `~/.mcp-nexus/config.json` (not `~/.mcp-manager`)

**Tests:**
- Unit test: Auto-sync toggle binding (verify theme context accessible)
- Integration test: Simulate server mutation → check auto-sync debounce timer
- Integration test: FirstRun import with mocked Tauri commands
- Assert all toasts have correct type/message
- Assert config path strings correct

**Effort:** 4–6 hrs

---

### Step 7: Validation Gate (1–2 hrs)

**What:** Run full Phase 2 validation suite.

**Commands:**
```bash
npm run lint                # ESLint + TypeScript rules
npm run typecheck          # TypeScript strict mode
npm test -- --run         # All Vitest tests
```

**Success Criteria:**
- ✅ 0 lint errors
- ✅ 0 typecheck errors
- ✅ All tests pass (Vitest harness + FEATURE-005 smoke tests)
- ✅ Theme context accessible in all rendered components
- ✅ Dark mode toggle functional (system preference + localStorage)
- ✅ shadcn/ui components render correctly in light/dark modes
- ✅ Notifications emit correctly via shadcn/ui Toast

**If Failures:**
- Fix linting errors (`npm run lint:fix`)
- Fix typecheck errors (check `src/contexts/` and hook types)
- Debug failed tests with `npm test -- --ui` (Vitest UI)
- Verify shadcn/ui CSS variables are being applied

---

## Parallel Work Opportunities

**Can run simultaneously (both blockers for GAP-001):**
- Step 1: GAP-013 (Tailwind Config)
- Step 2: GAP-009 (Theme Provider Context)

**Recommended assignment:** 2 developers, both steps in parallel, meet after ~3 hours to integrate (verify Tailwind config and theme provider work together).

**Cannot parallelize:**
- GAP-001 depends on both
- GAP-010 depends on GAP-001
- Smoke tests depend on GAP-010

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Tailwind config conflicts with existing app | Pre-test: `npm run build` after GAP-013, check no CSS warnings |
| Theme context not accessible in components | Add `useTheme()` to ErrorBoundary test; verify context wraps all routes |
| shadcn/ui CSS variables not applied | Verify `tailwind.config.ts` plugin is loaded; check browser DevTools CSS |
| Notification store breaks during Toast migration | Keep custom toast store as fallback during Step 4; migrate incrementally |
| Smoke tests flaky due to animation timings | Use Vitest `vi.useFakeTimers()` in test setup; await animations |
| Dark mode persistence doesn't work | Test localStorage explicitly in useTheme hook unit tests |

---

## Effort Estimate Summary

| Step | Effort | Blocker | Critical? |
|------|--------|---------|-----------|
| 1: GAP-013 (Tailwind) | 1–2 hrs | No | ✅ YES |
| 2: GAP-009 (Theme) | 2–3 hrs | No | ✅ YES |
| 3: GAP-001 (shadcn/ui) | 4–6 hrs | 1+2 | ✅ YES |
| 4: GAP-010 (Toast) | 2–4 hrs | 3 | ✅ YES |
| 5: FEATURE-005 Tests (Servers/MP) | 4–6 hrs | 4 | ✅ YES |
| 6: FEATURE-005 Tests (Clients/Settings) | 4–6 hrs | 4 | ✅ YES |
| 7: Validation Gate | 1–2 hrs | 6 | ✅ YES |

**Total Phase 2:** 18–29 hours (~3–4 days)

---

## When to Move to Phase 3

**Phase 2 is complete when:**
- ✅ Validation Gate passes (all tests green, no lint/typecheck errors)
- ✅ Dark mode toggle works end-to-end (system preference detection + localStorage + CSS class toggle)
- ✅ shadcn/ui components integrated into at least 3 existing pages (Servers, Marketplace, Settings)
- ✅ Notifications render via shadcn/ui Toast (not custom Toast)
- ✅ All FEATURE-005 smoke tests pass

**Then proceed to Phase 3:**
- GAP-011 (Modal migration to shadcn/ui Dialog)
- GAP-005 (Accessibility)
- GAP-003 (Error boundary tests)
- GAP-006 (Dark mode tests)
- etc.

---

## Quick Reference Checklist

- [ ] Step 1: GAP-013 Tailwind config created
- [ ] Step 2: GAP-009 Theme context + provider created
- [ ] Step 1 + 2: Both tested with `npm run build` and `npm run typecheck`
- [ ] Step 3: shadcn/ui CLI initialized, components installed
- [ ] Step 3: `docs/ui-patterns.md` written
- [ ] Step 4: Custom Toast.tsx replaced, shadcn/ui Toast integrated
- [ ] Step 4: All notification helpers updated to use shadcn/ui API
- [ ] Step 5: Servers + Marketplace smoke tests implemented
- [ ] Step 6: Clients + Settings + FirstRun smoke tests implemented
- [ ] Step 7: All tests pass, lint clean, typecheck clean
- [ ] Step 7: Dark mode toggle tested manually
- [ ] Phase 2 Complete: Ready for Phase 3
