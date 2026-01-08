# Development Gaps Analysis
**Identified During Plan Reordering (FEATURE-005 Harness Setup)**

---

## Executive Summary

Phase 2 reordering revealed 8 development infrastructure gaps across UI components, testing, accessibility, and DevOps. These gaps were systematically discovered during test harness setup and feature dependency analysis. **None block MVP launch**, but addressing them before production improves quality, maintainability, and user experience.

---

## Identified Gaps

### GAP-001: shadcn/ui & macOS Theme Integration ✅ **CRITICAL PATH**
**Status:** Deferred to Phase 2 (DEV-GAP-001)
**Severity:** P1 (Should Have) – Directly affects UI/UX consistency

**Problem:**
- App uses Tailwind CSS directly; no component library abstraction
- Dark mode styling exists but no system preference detection (macOS `prefers-color-scheme`)
- No macOS-native typography (SF Pro), spacing conventions, or color palette alignment
- UI will look generic instead of macOS-native

**Impact:**
- Feature teams build inconsistent components
- Dark mode doesn't auto-switch with system settings
- Desktop app UX doesn't match platform conventions

**Solution:**
1. Install shadcn/ui and initialize component library
2. Configure Tailwind with macOS-specific theme (SF Pro fonts, system colors, spacing model)
3. Implement system dark mode detection and localStorage persistence
4. Create component patterns doc for consistency

**Effort:** M (4–6 hrs) | **Blocker:** DEV-GAP-006 (dark mode detection)

---

### GAP-002: Test Coverage for FEATURE-002/003/004 ✅ **CRITICAL PATH**
**Status:** Addressed by FEATURE-005 smoke tests (Phase 2)
**Severity:** P1 (Should Have) – Prevents regression

**Problem:**
- FEATURE-002 (notifications), FEATURE-003 (auto-sync), FEATURE-004 (branding) are implemented but lack automated test coverage
- Manual testing only; risk of silent UI regressions
- Branding strings, notification emissions, and auto-sync toggles not validated in tests

**Impact:**
- Notifications may not emit on certain flows
- Auto-sync checkbox may lose binding
- Config path references may revert to `~/.mcp-manager`

**Solution:**
- Implement smoke tests in Phase 2 that validate:
  - Notification toasts appear on install/uninstall/sync/credential operations
  - Auto-sync checkbox state persists and triggers sync on server changes
  - All UI strings use "MCP Nexus" and `~/.mcp-nexus/config.json`

**Effort:** M (4–6 hrs) | **Blocker:** None; depends on FEATURE-005 harness

---

### GAP-003: Error Boundary Testing ✅ **INCREMENTAL**
**Status:** Deferred to Phase 3 (DEV-GAP-002)
**Severity:** P2 (Nice to Have) – Improves resilience

**Problem:**
- ErrorBoundary component exists but has no test coverage
- Render error handling, network failures, permission denials not validated
- UI recovery paths untested

**Current State:**
```typescript
// src/components/common/ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error("ErrorBoundary caught an error:", error, errorInfo);
  // Recovery logic exists but untested
}
```

**Solution:**
- Write tests covering render errors, async operation failures, permission denials
- Validate fallback UI rendering and recovery buttons
- Test across critical pages (Servers, Clients, Marketplace, Settings)

**Effort:** S (2–4 hrs) | **Blocker:** DEV-GAP-008 (logging) for structured error reporting

---

### GAP-004: Accessibility Baseline (WCAG 2.1 AA) ✅ **IMPORTANT**
**Status:** Deferred to Phase 3 (DEV-GAP-005)
**Severity:** P2 (Nice to Have) – Compliance & user access

**Problem:**
- Current codebase has **2 aria attributes total** (grep confirms)
- No role attributes on custom components
- No aria-label/aria-describedby on buttons, forms, modals
- No keyboard navigation testing (Tab, Enter, Escape)
- Focus management missing on modal open/close

**Example Gap:**
```typescript
// src/components/Servers.tsx – No aria-label, no visible label
<button className="px-4 py-2 bg-blue-600 ...">+</button> // What does this button do?
```

**Solution:**
1. Add aria-labels to all interactive elements (buttons, inputs, links)
2. Add role attributes to custom components (role="button", role="navigation", etc.)
3. Implement focus management in modals (FocusTrap pattern)
4. Test keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)
5. Use axe-core or similar for a11y linting

**Priority Order:**
1. Navigation (Sidebar, Header) – role="navigation", aria-label
2. Modals/Dialogs – role="dialog", aria-modal, focus trap
3. Form inputs – aria-label, aria-describedby, aria-invalid
4. Action buttons – aria-label for icon-only buttons

**Effort:** M (4–8 hrs) | **Blocker:** None; independent

---

### GAP-005: System Dark Mode Detection & Persistence ✅ **CRITICAL PATH**
**Status:** Deferred to Phase 3 (DEV-GAP-006)
**Severity:** P1 (Should Have) – User experience

**Problem:**
- Current code uses Tailwind `dark:` classes but no system preference detection
- Dark mode doesn't auto-switch when user changes macOS system preference
- No localStorage persistence of user's dark mode choice
- Users must manually switch theme each session

**Current State:**
```typescript
// App.tsx – No system preference detection
export function App() {
  return (
    <div className="...">
      {/* Uses dark: classes but no detection logic */}
    </div>
  );
}
```

**Solution:**
```typescript
// src/hooks/useDarkMode.ts
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
    document.documentElement.classList.toggle("dark");
  };

  return { isDark, toggle };
}
```

**Effort:** S (2–4 hrs) | **Blocker:** DEV-GAP-001 (shadcn/ui theme setup)

---

### GAP-006: Pre-commit Hooks & CI/CD Pipeline ✅ **INCREMENTAL**
**Status:** Deferred to Phase 3 (DEV-GAP-003)
**Severity:** P1 (Should Have) – Quality assurance

**Problem:**
- No GitHub Actions workflows configured
- No pre-commit validation (lint, typecheck, test before commit)
- Developers can commit broken code
- No automated testing gate before merge

**Solution:**
1. Install Husky + lint-staged
2. Configure `.husky/pre-commit` to run:
   - `npm run lint` (ESLint)
   - `npm run typecheck` (TypeScript)
   - `npm test -- --run` (Vitest)
3. Create `.github/workflows/validate.yml` for GitHub Actions:
   - Run tests on PR/push
   - Report coverage
   - Block merge on failure

**Example Pre-commit Config:**
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "**/*.{ts,tsx}": ["npm run typecheck"]
  }
}
```

**Effort:** S–M (2–4 hrs) | **Blocker:** None

---

### GAP-007: Environment Variable Configuration ✅ **IMPORTANT**
**Status:** Deferred to Phase 3 (DEV-GAP-007)
**Severity:** P2 (Nice to Have) – DevOps flexibility

**Problem:**
- No `.env` or `.env.example` in repo
- No environment variable parsing utilities
- Hard-coded configuration values scattered in code
- No separation of dev/prod configuration

**Solution:**
1. Create `.env.example` documenting dev vars:
   ```env
   VITE_DEBUG_TAURI=false
   VITE_API_TIMEOUT=30000
   VITE_LOG_LEVEL=info
   ```
2. Create `src/lib/env.ts`:
   ```typescript
   export const env = {
     debugTauri: import.meta.env.VITE_DEBUG_TAURI === "true",
     apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT ?? "30000"),
     logLevel: (import.meta.env.VITE_LOG_LEVEL ?? "info") as LogLevel,
   };
   ```
3. Add `.env.local` to `.gitignore`

**Effort:** S (1–2 hrs) | **Blocker:** None

---

### GAP-008: Structured Logging & Instrumentation ✅ **INCREMENTAL**
**Status:** Deferred to Phase 3 (DEV-GAP-008)
**Severity:** P2 (Nice to Have) – Debuggability

**Problem:**
- ErrorBoundary logs errors with `console.error("ErrorBoundary caught an error:", ...)`
- No structured logging utility (no log levels, no context)
- No protection against logging sensitive data (credentials, tokens)
- Hard to filter logs by component/module

**Solution:**
Create `src/lib/logger.ts`:
```typescript
export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (isDev) console.debug(`[DEBUG] ${msg}`, ctx);
  },
  info: (msg: string, ctx?: Record<string, unknown>) => {
    console.info(`[INFO] ${msg}`, ctx);
  },
  warn: (msg: string, ctx?: Record<string, unknown>) => {
    console.warn(`[WARN] ${msg}`, ctx);
  },
  error: (msg: string, error?: Error, ctx?: Record<string, unknown>) => {
    console.error(`[ERROR] ${msg}`, { error, ...ctx });
  },
};
```

Replace all `console.*` calls with `logger.*`. Ensure no sensitive data is logged.

**Effort:** S (2–3 hrs) | **Blocker:** None

---

## Additional Gaps Discovered During Codebase Audit

### GAP-009: Theme Provider & Dark Mode Context ✅ **CRITICAL – BLOCKS DEV-GAP-001**
**Status:** Prerequisite for DEV-GAP-001 (shadcn/ui setup)
**Severity:** P1 (Critical)

**Problem:**
- `App.tsx` has no theme context provider (required for shadcn/ui + dark mode)
- No way to share dark mode state across components via React context
- QueryClient created as global singleton in App.tsx with no theme awareness
- No `<html class="dark">` toggling mechanism for Tailwind dark mode

**Current Gap:**
```typescript
// App.tsx – Missing theme provider
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**Solution:**
1. Create `src/contexts/ThemeContext.ts`:
   ```typescript
   export type Theme = "light" | "dark" | "system";
   
   interface ThemeContextValue {
     theme: Theme;
     resolvedTheme: "light" | "dark";
     setTheme: (theme: Theme) => void;
   }
   
   export const ThemeContext = createContext<ThemeContextValue>(null!);
   ```

2. Create `src/hooks/useTheme.ts` to consume context

3. Wrap App with `<ThemeProvider>` at root level

4. Update App.tsx to toggle `document.documentElement.classList` on theme change

**Effort:** S (2–3 hrs) | **Blocker:** **Unblocks DEV-GAP-001 and GAP-006**

---

### GAP-010: Toast Component Replacement (Custom → shadcn/ui) ✅ **CRITICAL**
**Status:** Depends on DEV-GAP-001 (shadcn/ui setup)
**Severity:** P1 (Critical)

**Problem:**
- Custom `Toast.tsx` uses hardcoded Tailwind colors (`bg-green-50 dark:bg-green-900/30`, etc.)
- Won't respect shadcn/ui theme variables (CSS custom properties)
- Custom animation `animate-slide-in` won't exist after shadcn/ui Tailwind config override
- Toast styling is duplicated from ErrorBoundary with different color scheme

**Current Implementation:**
```typescript
// src/components/common/Toast.tsx
const typeStyles: Record<NotificationType, { bg: string; ...}> = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    icon: "✓",
    ...
  },
  // ...
};
```

**Solution:**
1. Replace with `shadcn/ui` Toast + Toaster component after DEV-GAP-001
2. Use `toast()` API instead of Zustand store (keep store for backward compatibility during transition)
3. Leverage shadcn/ui variant system for success/error/warning/info styling

**Effort:** S (2–4 hrs) | **Blocker:** DEV-GAP-001 (shadcn/ui setup)

---

### GAP-011: Modal Components (Custom → shadcn/ui Dialog) ✅ **IMPORTANT**
**Status:** Depends on DEV-GAP-001
**Severity:** P2 (Should Have)

**Problem:**
- 3 custom modal components using controlled `isOpen` prop: `AddServerModal`, `ServerDetailModal`, `ManualConfigModal`
- All likely use custom overlay/backdrop styling (hardcoded Tailwind)
- No consistent modal behavior (animations, focus management, keyboard handling)
- Accessibility concerns (no focus trap, no role="dialog", no aria-modal)

**Affected Files:**
- `src/components/servers/AddServerModal.tsx`
- `src/components/marketplace/ServerDetailModal.tsx`
- `src/components/clients/ManualConfigModal.tsx`

**Solution:**
1. After DEV-GAP-001, replace modals with shadcn/ui `Dialog` component
2. Update modal signatures from `isOpen` + `onClose` to use Dialog's native state management
3. Leverage `DialogContent`, `DialogHeader`, `DialogFooter` for consistent styling
4. Gain built-in accessibility (focus trap, aria-modal, keyboard handling)

**Effort:** M (4–6 hrs) | **Blocker:** DEV-GAP-001 (shadcn/ui setup)

---

### GAP-012: Icon System (Inline SVG → Icon Library) ✅ **NICE TO HAVE**
**Status:** Deferred to Phase 3
**Severity:** P2 (Nice to Have)

**Problem:**
- `Sidebar.tsx` defines icons as inline SVG JSX (verbose, unmaintainable)
- No icon library (e.g., lucide-react, radix-icons) – common with shadcn/ui apps
- Hard to reuse icons across components
- Icon styling inconsistent (hardcoded `w-5 h-5`, etc.)

**Current Implementation:**
```typescript
// src/components/layout/Sidebar.tsx
const icons: Record<string, ReactNode> = {
  grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path ... />
    </svg>
  ),
  // ... 10+ more icons defined inline
};
```

**Solution:**
1. Install `lucide-react` (standard with shadcn/ui)
2. Replace inline SVGs with lucide components: `<Grid2x2 className="w-5 h-5" />`
3. Create `src/components/icons/` for project-specific icon variants
4. Update all icon usage across components

**Effort:** S (2–4 hrs) | **Blocker:** None; can follow DEV-GAP-001

---

### GAP-013: Tailwind Configuration (Default → shadcn/ui-Ready) ✅ **CRITICAL**
**Status:** Prerequisite for DEV-GAP-001
**Severity:** P1 (Critical)

**Problem:**
- No `tailwind.config.ts` or `tailwind.config.js` in repo (using Tailwind defaults)
- No shadcn/ui preset configuration
- No dark mode configuration (light/dark class strategy vs media query)
- No custom animations (e.g., `animate-slide-in` referenced in Toast.tsx doesn't exist in defaults)
- No custom spacing/colors aligned with macOS design language
- No CSS variables setup for theme-aware component styling

**Impact:**
- shadcn/ui setup won't have proper CSS variable layer
- Dark mode won't inherit from design tokens
- Custom animations will fail
- Component colors will be hardcoded instead of using semantic tokens

**Solution:**
Create `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";
import defaultConfig from "tailwindcss/defaultConfig";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      colors: {
        // macOS system colors (will be overridden by shadcn/ui)
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

**Effort:** S (1–2 hrs) | **Blocker:** **Required before DEV-GAP-001**

---

### GAP-014: Missing cn() Clsx Replacement ✅ **NICE TO HAVE**
**Status:** Phase 3
**Severity:** P2 (Nice to Have)

**Problem:**
- `src/lib/utils.ts` implements custom `cn()` that just filters and joins strings
- shadcn/ui projects typically use `clsx` or `classnames` for better conditional class handling
- Current `cn()` doesn't support object/array syntax: `cn({ "p-4": true, "bg-blue": active })`

**Current Implementation:**
```typescript
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

**Solution:**
Install `clsx`:
```bash
npm install clsx
```

Replace `cn()` with clsx import:
```typescript
import clsx from "clsx";

export const cn = clsx; // or create wrapper
```

**Effort:** S (< 1 hr) | **Blocker:** None

---

## Revised Dependency Matrix (Updated)

| Gap | Blocks | Blocked By | Phase | Priority |
|-----|--------|-----------|-------|----------|
| **GAP-009 (Theme Context)** | **GAP-010, GAP-001** | **None** | **2** | **CRITICAL** |
| **GAP-013 (Tailwind Config)** | **GAP-001** | **None** | **2** | **CRITICAL** |
| GAP-001 (shadcn/ui) | GAP-010, GAP-011, GAP-012 | GAP-009, GAP-013 | 2 | P1 |
| GAP-002 (Tests) | None | FEATURE-005 harness | 2 | P1 |
| GAP-010 (Toast) | None | GAP-001 | 2 | P1 |
| GAP-011 (Modals) | None | GAP-001 | 3 | P2 |
| GAP-003 (Error boundary tests) | None | None | 3 | P2 |
| GAP-004 (A11y) | None | None | 3 | P2 |
| **GAP-006 (Dark mode)** | **None** | **GAP-009** | **3** | **P1** |
| GAP-005 (Dark mode tests) | None | GAP-006 | 3 | P2 |
| GAP-007 (Env config) | GAP-008 | None | 3 | P2 |
| GAP-008 (Logging) | None | None | 3 | P2 |
| GAP-012 (Icons) | None | GAP-001 | 3 | P2 |
| GAP-014 (clsx) | None | None | 3 | P2 |

---

## Critical Path (Updated)

```
GAP-013 (Tailwind Config) ────┐
                              ├─→ GAP-001 (shadcn/ui) ──→ GAP-010 (Toast) ──→ FEATURE-005 Tests
                              │
GAP-009 (Theme Context) ──────┘

GAP-009 also unblocks: GAP-006 (Dark Mode Detection)
```

---

## Dependency Matrix

| Gap | Blocks | Blocked By | Phase |
|-----|--------|-----------|-------|
| GAP-001 (shadcn/ui) | GAP-006 (dark mode) | None | Phase 2 |
| GAP-002 (Tests) | None | FEATURE-005 harness | Phase 2 |
| GAP-003 (Error boundary tests) | None | None | Phase 3 |
| GAP-004 (A11y) | None | None | Phase 3 |
| **GAP-005 (Dark mode)** | **None** | **GAP-001** | **Phase 3** |
| GAP-006 (CI/CD) | None | None | Phase 3 |
| GAP-007 (Env config) | GAP-008 (logging) | None | Phase 3 |
| GAP-008 (Logging) | None | None | Phase 3 |

---

## Recommended Rollout

**Phase 2 (MVP Validation):**
- ✅ GAP-001: shadcn/ui + theme (unblocks all UI work)
- ✅ GAP-002: Smoke tests (validates FEATURE-002/003/004)

**Phase 3 (Quality & Polish):**
- GAP-005: Dark mode (depends on GAP-001)
- GAP-003: Error boundary tests
- GAP-004: Accessibility baseline
- GAP-006: CI/CD pipeline
- GAP-007: Env configuration
- GAP-008: Structured logging

**Post-MVP (Compliance):**
- Extended accessibility testing (WCAG 2.1 AA full audit)
- Performance monitoring
- Telemetry/analytics (if required)

---

## Impact on MVP Launch

**Blocking Items:** None – all gaps are incremental improvements.

**Recommended for MVP:** GAP-001, GAP-002 (Phase 2).

**Can Defer:** GAP-003–008 to Phase 3 without blocking release.
