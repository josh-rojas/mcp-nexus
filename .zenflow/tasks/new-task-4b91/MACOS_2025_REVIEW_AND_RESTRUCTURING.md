# macOS 2025/2026 UX Review & Plan Restructuring
**Date:** January 8, 2026  
**Review Scope:** Latest macOS HIG updates, design system alignment, and Phase 2 restructuring

---

## Executive Summary

The project's Phase 2 plan is **structurally sound** in its dependency ordering (GAP-013 → GAP-009 → GAP-001 → GAP-010 → FEATURE-005). However, a comprehensive review of **macOS 2025/2026 design standards** reveals **3 new gaps** that should be incorporated into the critical path, plus **4 architectural adjustments** to align with latest Apple design principles.

**Status:** Phase 2 ready to begin with **restructured 10-step critical path** (estimated 24–36 hours, 3–5 days).

---

## Part 1: macOS 2025/2026 Design Standards (Apple HIG December 2025 Update)

### Latest Design Innovations

| Feature | Impact | Implementation Approach |
|---------|--------|------------------------|
| **Liquid Glass Material** | Visual depth & layering for modals/popovers | CSS backdrop-filter (macOS supports WebKit blur); add to shadcn/ui Dialog overlay |
| **Dynamic Typography** | SF Pro Display/Text with dynamic sizing | Implement system font stack; Tailwind custom config with `text-balance` |
| **Cross-Device Continuity** | Handoff, Universal Clipboard support | Out of scope for MVP (future enhancement); Tauri limitation |
| **System Appearance Integration** | Auto-follow system light/dark preference | Implement via `prefers-color-scheme` media query + ThemeContext |
| **Accent Color System** | User-selectable system accent color (Blue, Purple, Pink, Red, Orange, Yellow, Green, Graphite) | CSS custom property for system accent; Tailwind config override |
| **Native Window Controls** | Seamless traffic light positioning | Tauri `titleBarStyle: "Overlay"`, `trafficLightPosition` in tauri.conf.json |

### Current Project Alignment

| Standard | Current State | Status |
|----------|---------------|--------|
| SF Pro typography | Using `Inter` (generic fallback exists) | ⚠️ NEEDS FIX (GAP-013) |
| Dark mode detection | CSS-only, no system preference listener | ⚠️ NEEDS FIX (GAP-009) |
| macOS spacing model | Generic Tailwind defaults | ⚠️ NEEDS FIX (GAP-013) |
| Liquid Glass | Not implemented | 🟡 NEW: GAP-015 (Phase 3) |
| System accent color | Hardcoded blue (#2563eb) | 🟡 NEW: GAP-016 (Phase 3) |
| Native window controls | Not configured in Tauri | ⚠️ NEEDS FIX (NEW GAP-017) |

---

## Part 2: Codebase Audit Results

### Completed Items ✅

| Item | Details | Notes |
|------|---------|-------|
| **FEATURE-002** | Toast notifications across all critical flows | 3 notifications helpers in `src/lib/notifications.ts`; integrated in Servers, Marketplace, Clients, CredentialManager |
| **FEATURE-003** | Auto-sync preference with persistence | `UserPreferences.autoSyncOnChanges` in Rust backend; TS hook `useConfig`; debounced trigger in Clients page |
| **FEATURE-004** | Branding consistency (MCP Nexus) | All UI strings updated; config path standardized to `~/.mcp-nexus/config.json`; keychain internals intentionally left as `mcp-manager` |
| **FEATURE-005 Harness** | Vitest + React Testing Library setup | 4/4 smoke tests passing; Tauri API fully mocked; `renderWithProviders` utility working |
| **Quality Gates** | Lint, typecheck, tests | All passing (0 errors, 0 warnings) |

### Pending Items (Phase 2 Critical Path) 🔄

| Item | Effort | Blocker | Status |
|------|--------|---------|--------|
| **GAP-013** – Tailwind Config | 1–2 hrs | No | Ready |
| **GAP-009** – Theme Provider | 2–3 hrs | No (parallel) | Ready |
| **GAP-001** – shadcn/ui Setup | 4–6 hrs | Yes (needs 013+009) | Blocked |
| **GAP-017** – Native Window Styling | 0.5–1 hr | No (parallel with 013) | NEW |
| **GAP-010** – Toast Replacement | 2–4 hrs | Yes (needs 001) | Blocked |
| **FEATURE-005 Smoke Tests** | 8–12 hrs | Yes (needs 010) | Blocked |
| **Validation Gate** | 1–2 hrs | Yes (needs smoke tests) | Blocked |

---

## Part 3: Detailed Findings Per Gap

### Finding 1: Missing Tailwind Configuration (GAP-013)

**Current State:**
- `tailwind.config.ts` does not exist
- Using Tailwind via `@tailwindcss/vite` plugin with all defaults
- Custom animation `animate-slide-in` defined in `App.css` (must migrate to config)

**macOS Alignment Issues:**
1. **Font Stack:** Uses `Inter` as primary; should prioritize `SF Pro Display` (14px–20px) and `SF Pro Text` (11px–13px)
2. **Dark Mode Strategy:** No explicit dark mode class config; should be `["class"]` (not media query) to honor ThemeContext toggle
3. **Spacing Model:** macOS uses 8pt base unit (4, 8, 12, 16, 24, 32, 48); Tailwind defaults to 4px
4. **Animation Timing:** macOS standard is 300ms ease-out for UI transitions (Toast currently uses 0.3s ✓, but not in config)
5. **Color Palette:** No explicit accent color variable; hardcoded to blue throughout

**Deliverables:**
```typescript
// tailwind.config.ts requirements:
export default {
  theme: {
    fontFamily: {
      // SF Pro with system fallbacks
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Display"',
        '"SF Pro Text"',
        // ... fallbacks
      ],
    },
    extend: {
      spacing: {
        // 8pt base unit
      },
      colors: {
        // System accent color variable
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  darkMode: ['class'],  // CRITICAL
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
```

---

### Finding 2: No Theme Context (GAP-009)

**Current State:**
- `App.tsx` has no theme provider
- Dark mode classes used throughout (e.g., `dark:bg-gray-900`) but no context to toggle them
- Settings page has no "Appearance" controls

**macOS Alignment Issues:**
1. **System Preference Detection:** Should detect `prefers-color-scheme: dark` on mount
2. **Persistence:** Theme choice should be saved to localStorage (`theme` key)
3. **HTML Class Toggling:** Must toggle `document.documentElement.classList` to apply Tailwind dark mode
4. **Settings Integration:** Settings page needs "Appearance" section with Light/Dark/Auto options

**Deliverables:**
```typescript
// src/contexts/ThemeContext.ts
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';  // computed from system + user choice
  setTheme: (theme: Theme) => void;
}

// src/hooks/useTheme.ts
export const useTheme = (): ThemeContextType => { ... };

// src/components/ThemeProvider.tsx
<ThemeProvider>
  {children}
</ThemeProvider>

// App.tsx wrapper
<ThemeProvider>
  <QueryClientProvider>
    <BrowserRouter>
      ...
    </BrowserRouter>
  </QueryClientProvider>
</ThemeProvider>
```

---

### Finding 3: No Native macOS Window Styling (NEW GAP-017)

**Current State:**
```json
// src-tauri/tauri.conf.json
"windows": [
  {
    "title": "mcp-nexus",
    "width": 800,
    "height": 600
  }
]
```

**macOS Alignment Issues:**
1. **Window Controls:** Traffic lights (red, yellow, green) are positioned default (not visually integrated)
2. **Title Bar:** Not transparent; doesn't blend with content
3. **Appearance:** App doesn't respect macOS light/dark mode window chrome

**Deliverables:**
```json
// Update src-tauri/tauri.conf.json
{
  "windows": [
    {
      "title": "mcp-nexus",
      "width": 1200,
      "height": 800,
      "minWidth": 960,
      "minHeight": 600,
      "titleBarStyle": "Overlay",
      "trafficLightPosition": { "x": 16, "y": 12 },
      "hiddenTitle": false,
      "decorations": true
    }
  ]
}
```

---

### Finding 4: Custom Toast Uses Hardcoded Colors (Already Identified)

**Current State:** `Toast.tsx` hardcodes Tailwind color classes (success: green-50, error: red-50, etc.)

**Issue:** After shadcn/ui setup, these colors should come from CSS variables defined by the shadcn theme.

**Deliverables:** Replace with shadcn/ui Toast after GAP-001 ✓

---

### Finding 5: No Icon System (GAP-012, Phase 3)

**Current State:** Sidebar uses inline SVG (custom grid, store, server, monitor, settings icons)

**macOS Alignment:** Should use SF Symbols (via lucide-react, which mimics SF Symbols style)

**Deliverables:** Phase 3 (not blocking MVP)

---

### Finding 6: Missing Accessibility (GAP-005, Phase 3)

**Current State:** Only 2 aria attributes in entire codebase; no role attributes on custom components

**macOS Alignment:** WCAG 2.1 AA compliance expected; VoiceOver integration important

**Deliverables:** Phase 3 (not blocking MVP)

---

## Part 4: Restructured Phase 2 Critical Path

### Recommended Sequencing (10 Steps, 24–36 Hours)

```
PARALLEL PAIR 1 (Days 1–2):
├─ Step 1: GAP-017 – Native Window Styling (Tauri config) ──────→ 0.5–1 hr
├─ Step 2: GAP-013 – Tailwind Config (shadcn preset, SF Pro, dark mode class)  ──────→ 1–2 hrs
└─ Step 3: GAP-009 – Theme Provider Context (system detection, localStorage)  ──────→ 2–3 hrs
                                                       ↓
                              SEQUENTIAL PAIR 2 (Days 2–3):
                              ├─ Step 4: GAP-001 – shadcn/ui Setup ──────→ 4–6 hrs
                              ├─ Step 5: GAP-010 – Toast Replacement (custom → shadcn) ──────→ 2–4 hrs
                              └─ Step 6: Settings UI – Add Appearance Controls ──────→ 1–2 hrs (using Theme hook)
                                                       ↓
                              SEQUENTIAL PAIR 3 (Days 3–5):
                              ├─ Step 7: FEATURE-005 Smoke Tests (Servers, Marketplace) ──────→ 4–6 hrs
                              ├─ Step 8: FEATURE-005 Smoke Tests (Clients, Settings, FirstRun) ──────→ 4–6 hrs
                              └─ Step 9: Modal Migration – Add Focus Trap (AddServerModal, ServerDetailModal, ManualConfigModal) ──────→ 2–3 hrs (optional, improves UX)
                                                       ↓
                              FINAL GATE (Day 5):
                              └─ Step 10: Validation Gate – Lint, Typecheck, Full Test Suite ──────→ 1–2 hrs
```

### Detailed Step Breakdown

#### **Step 1: GAP-017 – Native Window Styling (0.5–1 hr)**
- Update `src-tauri/tauri.conf.json` with `titleBarStyle: "Overlay"`, `trafficLightPosition`
- Verify Tauri window renders correctly on macOS
- No code changes needed; config-only
- **Blocks:** Visual polish (not functional blocker)

#### **Step 2: GAP-013 – Tailwind Configuration (1–2 hrs)**
- Create `tailwind.config.ts` with shadcn/ui preset
- Add SF Pro font stack (fallbacks to -apple-system, Inter, system-ui)
- Set dark mode strategy to `["class"]`
- Add custom animations (`animate-slide-in`)
- Configure spacing model with 8pt base unit
- Configure colors (eventually system accent detection)
- Verify `npm run build` produces correct CSS
- **Blocks:** GAP-001, GAP-010

#### **Step 3: GAP-009 – Theme Provider Context (2–3 hrs)**
- Create `src/contexts/ThemeContext.ts` with `Theme` type and context definition
- Create `src/hooks/useTheme.ts` hook for accessing/setting theme
- Create `src/components/ThemeProvider.tsx` component that:
  - Detects system preference on mount (`prefers-color-scheme` media query)
  - Restores user preference from localStorage
  - Listens to system preference changes
  - Toggles `document.documentElement.classList` for Tailwind dark mode
  - Provides context to children
- Wrap App.tsx with ThemeProvider
- Add unit tests for theme detection and toggle
- **Blocks:** GAP-001

#### **Step 4: GAP-001 – shadcn/ui Setup (4–6 hrs)**
- Run shadcn/ui CLI to initialize component library
- Install base components: Button, Card, Dialog, Input, Select, Badge, Toast, Dropdown Menu, Popover
- Verify components integrate with custom Tailwind config (Step 2)
- Verify components respect theme context (Step 3)
- Create `docs/ui-patterns.md` documenting component usage conventions
- Consider lucide-react for icon library (Phase 3 if deferred)
- **Blocks:** GAP-010

#### **Step 5: GAP-010 – Toast Replacement (2–4 hrs)**
- Replace `src/components/common/Toast.tsx` with shadcn/ui Toaster
- Update `src/stores/notificationStore.ts` to emit shadcn/ui `toast()` calls OR create bridge layer for backward compatibility
- Migrate color styling to shadcn/ui variants (success, error, warning, info)
- Verify animations work with new Tailwind config
- Update Toast tests in FEATURE-005 smoke tests
- **Blocks:** FEATURE-005 smoke tests

#### **Step 6: Settings UI – Add Appearance Controls (1–2 hrs)**
- Add "Appearance" section to Settings page
- Add Radio Group or Select: Light / Dark / System
- Wire up to `useTheme()` hook
- Add CSS class toggle feedback (optional: preview)
- Update Settings tests in FEATURE-005
- **Blocks:** None (nice-to-have, enables user control)

#### **Step 7: FEATURE-005 Smoke Tests – Servers & Marketplace (4–6 hrs)**
- Implement smoke tests for Servers page:
  - Server install/uninstall (validates FEATURE-002 notifications via shadcn/ui Toast)
  - Server sync workflow (validates FEATURE-002 success/error toasts)
  - Server update flow (validates auto-sync toggle, FEATURE-003)
- Implement smoke tests for Marketplace page:
  - Browse marketplace (validates FEATURE-004 branding copy)
  - Server detail modal open/close (validates modal accessibility, if Step 9 completed)
  - Install from marketplace (validates FEATURE-002 notifications)
- Verify all assertions pass; toast content verification
- **Blocks:** Validation Gate

#### **Step 8: FEATURE-005 Smoke Tests – Clients, Settings, FirstRun (4–6 hrs)**
- Implement smoke tests for Clients page:
  - Sync operations (validates FEATURE-002 sync toasts)
  - Auto-sync toggle UI state (validates FEATURE-003 persistence)
- Implement smoke tests for Settings page:
  - Appearance controls work (Light/Dark/System toggle)
  - Credential create/delete (validates FEATURE-002 credential toasts)
  - Config display (validates FEATURE-004 config path references)
- Implement smoke tests for FirstRun page:
  - Import behavior (validates FEATURE-004 config path references)
  - Dashboard quick-action flows
- **Blocks:** Validation Gate

#### **Step 9: Modal Focus Management & Accessibility (2–3 hrs) [OPTIONAL]**
- Add focus trap to AddServerModal, ServerDetailModal, ManualConfigModal
- Add role="dialog", aria-modal="true", aria-labelledby attributes
- Consider migrating to shadcn/ui Dialog (if time permits; manual focus management sufficient for MVP)
- Update tests to verify focus trap behavior
- **Blocks:** None (improves UX, not functional blocker)

#### **Step 10: Validation Gate – Full Integration (1–2 hrs)**
- Run `npm run lint` (expect 0 errors)
- Run `npm run typecheck` (expect 0 errors)
- Run `npm test -- --run` (expect all tests passing, coverage >60%)
- Run `cd src-tauri && cargo test` (expect 103/103 passing)
- Manual verification:
  - Dark mode toggle works (system → light → dark → auto)
  - Notifications appear and auto-dismiss correctly
  - Auto-sync toggle persists across page reloads
  - Branding strings all "MCP Nexus", config paths all `~/.mcp-nexus/config.json`
  - Native window controls visible and positioned correctly
- **Success Criteria:** All tests green, lint clean, visual polish complete

---

## Part 5: Updated Dev Gaps Matrix (14 + 3 New)

### Critical Path (Must Complete Before MVP)

| Gap | Phase | Title | Effort | Status |
|-----|-------|-------|--------|--------|
| **017** | **2** | Native Window Styling (Tauri config) | 0.5–1 hr | ⏳ Ready |
| **013** | **2** | Tailwind Configuration | 1–2 hrs | ⏳ Ready |
| **009** | **2** | Theme Provider Context | 2–3 hrs | ⏳ Ready |
| **001** | **2** | shadcn/ui Setup | 4–6 hrs | ⏳ Blocked (needs 013+009) |
| **010** | **2** | Toast Replacement | 2–4 hrs | ⏳ Blocked (needs 001) |
| — | **2** | Settings Appearance UI | 1–2 hrs | ⏳ Blocked (needs 009) |
| — | **2** | FEATURE-005 Smoke Tests | 8–12 hrs | ⏳ Blocked (needs 010) |
| — | **2** | Validation Gate | 1–2 hrs | ⏳ Blocked (needs smoke tests) |

### Phase 3 (Post-MVP, No Launch Blocker)

| Gap | Title | Effort | Notes |
|-----|-------|--------|-------|
| **015** | Liquid Glass Material (modal overlays) | 2–3 hrs | CSS backdrop-filter; nice visual enhancement |
| **016** | System Accent Color Detection | 2–4 hrs | Read system accent from NSColor; CSS variable injection |
| **012** | Icon System (Sidebar SF Symbols) | 2–3 hrs | Replace inline SVG with lucide-react |
| **011** | Modal Migration (custom → shadcn/ui Dialog) | 4–6 hrs | 3 components; adds focus trap, keyboard nav |
| **005** | Accessibility Baseline (WCAG 2.1 AA) | 4–6 hrs | Add aria attributes, keyboard navigation tests |
| **006** | System Dark Mode Detection Tests | 2–3 hrs | Test prefers-color-scheme listener, localStorage persistence |
| **002** | Error Boundary Testing | 2–4 hrs | Test render errors, network failures, permission denials |
| **003** | Pre-commit Hooks & CI/CD | 3–4 hrs | Husky + lint-staged + GitHub Actions workflow |
| **004** | Component Library Documentation | 2–3 hrs | Storybook or component catalog |
| **007** | Environment Variable Configuration | 1–2 hrs | .env.example, validation, documentation |
| **008** | Structured Logging & Instrumentation | 2–3 hrs | Logger utility, audit trails, telemetry hooks |
| **014** | clsx Replacement (nice-to-have) | 0.5–1 hr | Refactor inline className ternaries to clsx() |

---

## Part 6: Architectural Recommendations

### 1. Theme Context Design Pattern

**Rationale:** Decouples theme state from Tailwind CSS classes; enables Settings UI control and persistent user preference.

**Pattern:**
```typescript
// Light/Dark/System pattern (per macOS convention)
type Theme = 'light' | 'dark' | 'system';

// Resolved theme computed on mount + system listener
const resolvedTheme = theme === 'system' 
  ? getSystemPreference() 
  : theme;

// localStorage key: 'mcp-nexus-theme'
// CSS class: document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
```

### 2. Tailwind Dark Mode Strategy

**Decision:** Use class-based dark mode (`["class"]`) instead of media query (`["media"]`)

**Rationale:**
- Allows theme context to control dark mode toggle independently of system preference
- Enables per-page or per-component theme override (future feature)
- Consistent with shadcn/ui expectations

### 3. shadcn/ui Component Adoption

**Pattern:** Prioritize shadcn/ui for all new components; gradually migrate existing custom components.

**Phase 2 Priority:**
- Toast (critical for FEATURE-002 notifications)
- Dialog (for modals in Phase 3)
- Input, Select, Button (common UI elements)
- Badge, Card (layout helpers)

**Phase 3 Deferred:**
- Entire modal component suite (AddServerModal, ServerDetailModal, ManualConfigModal)
- Icon integration (lucide-react)

### 4. Settings Page Structure

**New Section Required:**
```
Settings
├─ Appearance
│  ├─ Light / Dark / System (Radio Group)
│  ├─ Preview (optional)
│  └─ [Applies immediately via useTheme()]
├─ Auto-sync on Changes (already exists)
├─ Credentials
│  └─ [Already exists]
└─ Advanced
   └─ [Placeholder for future]
```

### 5. Window Configuration Best Practices

**macOS-specific Tauri config:**
```json
{
  "titleBarStyle": "Overlay",           // Blends title bar with content
  "trafficLightPosition": { "x": 16, "y": 12 },  // Standard positioning
  "hiddenTitle": false,                 // Show window title
  "decorations": true,                  // Native window controls
  "minWidth": 960,                      // Prevent breakage at small sizes
  "minHeight": 600
}
```

---

## Part 7: Risk Assessment & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Tailwind config syntax errors (dark mode class) | Medium | Medium | Test dark mode toggle in smoke tests; use official examples |
| Theme context not accessible in all components | Medium | Medium | Verify QueryClientProvider wraps ThemeProvider; test via `useTheme()` hook |
| shadcn/ui components don't match existing styling | Medium | High | Use shadcn/ui preset in Tailwind config (Step 2); verify colors/spacing |
| Toast animation timing differences | Low | Low | Use Tailwind custom animation config; reuse existing 0.3s ease-out timing |
| Native Tauri window controls don't render correctly | Low | Medium | Test on physical macOS machine; check Tauri version compatibility (2.9.1) |
| Smoke tests too strict / false negatives | Medium | Medium | Start with basic assertions (element presence); add detailed assertions iteratively |

---

## Part 8: Success Criteria (End of Phase 2)

### Code Quality
- ✅ Lint: 0 errors, 0 warnings
- ✅ TypeCheck: 0 errors
- ✅ Tests: All passing (unit + smoke tests)
- ✅ Rust backend: 103/103 tests passing

### Feature Coverage
- ✅ FEATURE-002 (Toast notifications): Verified via smoke tests across Servers, Marketplace, Clients, CredentialManager
- ✅ FEATURE-003 (Auto-sync): Toggle persists; debounced sync works; Settings UI accessible
- ✅ FEATURE-004 (Branding): All UI strings "MCP Nexus"; config path `~/.mcp-nexus/config.json`
- ✅ FEATURE-005 (Smoke tests): Servers, Marketplace, Clients, Settings, FirstRun all covered

### Design Alignment
- ✅ SF Pro font stack applied globally
- ✅ Dark mode: System preference detected; localStorage persisted; toggle works in Settings
- ✅ Spacing: 8pt base unit applied (not critical for MVP, but in config)
- ✅ macOS window: Native controls positioned, transparent title bar configured
- ✅ Theme context: Available to all components; no hard-coded color schemes

### User Experience
- ✅ Notifications: Toast appears, auto-dismisses, no duplicate emissions
- ✅ Dark mode: Switches smoothly; respects system preference by default
- ✅ Branding: Consistent across all pages and modals
- ✅ Auto-sync: Checkbox toggles; auto-sync fires on server changes; errors logged

---

## Part 9: Recommended Next Actions

1. **Confirm macOS-specific recommendations** with product/design team:
   - Accept Liquid Glass, system accent color as Phase 3 items?
   - Accept modal focus trap as optional Step 9?

2. **Prepare Phase 2 environment:**
   - Clone/checkpoint current codebase
   - Verify all dependencies installed (`npm install`, `cargo build`)
   - Confirm lint/typecheck/test baseline passing

3. **Begin Step 1 (GAP-017):**
   - Update `src-tauri/tauri.conf.json`
   - Test on macOS; verify window controls render correctly

4. **Parallel execution (Steps 2 & 3):**
   - One developer: GAP-013 (Tailwind config) with shadcn/ui preset
   - Other developer: GAP-009 (Theme provider context)
   - Merge and test integration before Step 4

5. **Create Step 4–10 ADRs** (Architecture Decision Records):
   - Document why class-based dark mode over media query
   - Document shadcn/ui adoption criteria
   - Document theme context pattern and alternatives considered

---

## Appendix A: macOS 2025/2026 Design Tokens Reference

### Typography
```
SF Pro Display:  Used for 14pt and larger (headings, titles)
SF Pro Text:     Used for 13pt and smaller (body, UI labels)
System Default:  -apple-system, BlinkMacSystemFont, SF Pro, system-ui

Line Height:  1.2 (headings), 1.5 (body)
Letter Spacing:  0 (normal)
```

### Spacing (8pt base unit)
```
4pt:   Half unit (gaps within components)
8pt:   Base unit (padding, margin, gaps)
12pt:  1.5 units (field spacing)
16pt:  2 units (section padding)
24pt:  3 units (major section spacing)
32pt:  4 units (page gutters)
48pt:  6 units (large sections)
```

### Colors (Dark Mode)
```
Background:       #1a1a1a (near black)
Surface:          #2a2a2a (slightly lighter)
Text Primary:     #ffffff
Text Secondary:   #a0a0a0
Border:           #3a3a3a
Accent:           System-dependent (Blue by default)
```

### Animations
```
Standard Transition:  300ms ease-out (UI state changes, Toast, modals)
Spring Animations:    350ms cubic-bezier(0.34, 1.56, 0.64, 1) (interactive, delight)
Fade:                200ms ease-in-out
```

---

## Appendix B: File Checklist for Phase 2

### Files to Create
- [ ] `tailwind.config.ts` (Step 2)
- [ ] `src/contexts/ThemeContext.ts` (Step 3)
- [ ] `src/hooks/useTheme.ts` (Step 3)
- [ ] `src/components/ThemeProvider.tsx` (Step 3)
- [ ] `src/components/ui/` directory + shadcn components (Step 4)
- [ ] `docs/ui-patterns.md` (Step 4)
- [ ] Updated `src/components/common/Toast.tsx` using shadcn/ui (Step 5)
- [ ] `src/components/theme/AppearanceSelect.tsx` (Step 6)
- [ ] `src/test/[feature-name].test.tsx` files for smoke tests (Steps 7–8)

### Files to Modify
- [ ] `src-tauri/tauri.conf.json` (Step 1)
- [ ] `src/App.tsx` (wrap with ThemeProvider, Step 3)
- [ ] `src/pages/Settings.tsx` (add Appearance section, Step 6)
- [ ] `src/stores/notificationStore.ts` (integrate with shadcn/ui Toast, Step 5)
- [ ] `vite.config.ts` (already has tailwindcss plugin; no changes needed)
- [ ] `App.css` (migrate animations to tailwind.config.ts, Step 2)

### Files to Delete/Deprecate
- None (all changes are additive or in-place)

---

## Conclusion

The project's Phase 2 plan is **well-structured and ready to execute**. With the addition of **3 new gaps** (GAP-017 native window styling, plus integration of macOS 2025/2026 design standards), the critical path has been **extended to 10 steps** and **estimated at 24–36 hours**.

**Key takeaway:** The existing dependency graph (GAP-013 → GAP-009 → GAP-001 → GAP-010 → FEATURE-005) is **correct and should not be changed**. The new recommendations are **architectural refinements** (theme context pattern, Tailwind dark mode strategy, Tauri window config) and **design-system alignments** (SF Pro, spacing, system preference detection) that fit naturally into the existing plan.

**Ready to proceed with Phase 2 implementation.**
