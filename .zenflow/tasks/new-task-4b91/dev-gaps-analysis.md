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

### GAP-017: Native macOS Window Styling (Tauri Config) ✅ **CRITICAL PATH**
**Status:** Phase 2 (NEW - macOS 2025/2026 alignment)
**Severity:** P1 (Should Have) – Visual polish, native appearance

**Problem:**
- `src-tauri/tauri.conf.json` lacks macOS-specific window configuration
- Window controls (traffic lights) not positioned according to macOS conventions
- Title bar not transparent; doesn't blend with content
- App doesn't respect macOS light/dark window chrome

**Current Config:**
```json
{
  "windows": [
    {
      "title": "mcp-nexus",
      "width": 800,
      "height": 600
    }
  ]
}
```

**Missing Properties (macOS Native Styling):**
- `titleBarStyle: "Overlay"` – Blends title bar with content
- `trafficLightPosition: { "x": 16, "y": 12 }` – Standard macOS positioning
- `hiddenTitle: false` – Show window title
- `decorations: true` – Native window controls
- `minWidth`, `minHeight` – Prevent UI breakage at small sizes

**Solution:**
```json
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

**Verification:**
- Window renders on macOS with traffic lights visible and positioned correctly
- Title bar blends with content (no harsh color separation)
- Window respects min dimensions without UI breakage

**Effort:** S (0.5–1 hr) | **Blocker:** None (visual polish, not functional)

---

### GAP-015: Liquid Glass Material (Modal Overlays) ✅ **PHASE 3**
**Status:** Phase 3
**Severity:** P2 (Nice to Have) – Modern visual design

**Problem:**
- macOS 2025 HIG introduces "Liquid Glass" material for visual depth
- Current modals use opaque backdrops with hardcoded colors
- No frosted glass / blur effect on modal overlays
- Doesn't align with latest Apple design trends

**Design Pattern (macOS 2025):**
- Modal background: `backdrop-filter: blur(10px)` with semi-transparent overlay
- Shadow: `-webkit-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)`
- Border: `border: 1px solid rgba(255, 255, 255, 0.2)` (subtle separation)

**Example Implementation:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.modal-content {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .modal-overlay {
    background: rgba(0, 0, 0, 0.6);
  }
  .modal-content {
    background: rgba(30, 30, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
```

**Applies To:**
- AddServerModal, ServerDetailModal, ManualConfigModal
- Any future popovers or dropdown menus
- Settings modal (if implemented)

**Verification:**
- Modal has subtle frosted glass appearance
- Blur effect visible on light and dark backgrounds
- No performance degradation on older macOS versions (graceful fallback)

**Effort:** M (2–3 hrs) | **Blocker:** None; depends on GAP-001 (shadcn/ui setup)

---

### GAP-016: System Accent Color Detection ✅ **PHASE 3**
**Status:** Phase 3
**Severity:** P2 (Nice to Have) – Dynamic theming

**Problem:**
- Hardcoded blue accent color throughout app (`#2563eb` / Tailwind `blue-600`)
- macOS allows users to select system accent color (Blue, Purple, Pink, Red, Orange, Yellow, Green, Graphite)
- App should respect user's system accent preference

**macOS 2025 Pattern:**
- User sets accent color in System Preferences → General
- Apps can read via `NSColor.controlAccentColor` (native) or infer from system colors
- Web apps can use CSS custom properties + system detection

**Implementation Approach (Phase 3):**
1. Create Tauri command to read system accent color (macOS native)
2. Inject CSS custom property: `--system-accent: #<hex>`
3. Replace hardcoded blue with `var(--system-accent)`
4. Fallback to blue if detection fails

**Example Custom Property:**
```css
:root {
  --system-accent: #2563eb; /* default blue */
  --system-accent-rgb: 37, 99, 235;
}

/* Usage */
.button-primary {
  background-color: var(--system-accent);
}

.button-primary:hover {
  opacity: 0.8;
}
```

**Verification:**
- Rust backend command returns system accent color
- CSS property updated on app startup
- Buttons, links, and highlights use dynamic color
- Fallback works if detection fails

**Effort:** M (2–4 hrs) | **Blocker:** None; nice-to-have dynamic theming

---

## Revised Dependency Matrix (Updated with macOS 2025/2026 Gaps)

| Gap | Blocks | Blocked By | Phase | Priority |
|-----|--------|-----------|-------|----------|
| **GAP-017 (Native Window Styling)** | **None** | **None** | **2** | **P1** |
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
| **GAP-015 (Liquid Glass)** | **None** | **GAP-001** | **3** | **P2** |
| **GAP-016 (System Accent Color)** | **None** | **None** | **3** | **P2** |

---

## Critical Path (Updated with macOS 2025/2026 Alignment)

```
PARALLEL GROUP 1 (Phase 2):
├─ GAP-017 (Native Window Styling) ──┐
├─ GAP-013 (Tailwind Config) ────────┤
└─ GAP-009 (Theme Context) ──────────┤
                                     ├─→ GAP-001 (shadcn/ui) ──→ GAP-010 (Toast) ──→ FEATURE-005 Tests ──→ Validation Gate
                                     │
PHASE 3 BLOCKERS:
├─ GAP-006 (Dark Mode) unblocked by GAP-009
├─ GAP-015 (Liquid Glass) unblocked by GAP-001
├─ GAP-016 (System Accent) independent
└─ All other Phase 3 gaps independent
```

**Phase 2 Critical Path Duration:** 
- GAP-017: 0.5–1 hr (parallel)
- GAP-013: 1–2 hrs (parallel)
- GAP-009: 2–3 hrs (parallel)
- GAP-001: 4–6 hrs (sequential after 013 + 009)
- GAP-010: 2–4 hrs (sequential after 001)
- FEATURE-005 Tests: 8–12 hrs (sequential after 010)
- Validation Gate: 1–2 hrs (final)
- **Total: 19–30 hours (~2.5–4 days)**

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

## Recommended Rollout (Updated with macOS 2025/2026 Standards)

**Phase 2 (MVP Validation) – 19–30 hours:**
- ✅ **GAP-017**: Native macOS window styling (Tauri config)
- ✅ **GAP-013**: Tailwind configuration (SF Pro, dark mode class strategy)
- ✅ **GAP-009**: Theme provider context (system preference detection, localStorage)
- ✅ **GAP-001**: shadcn/ui setup (component library, integration with theme)
- ✅ **GAP-010**: Toast replacement (custom → shadcn/ui Toaster)
- ✅ **FEATURE-005**: Smoke tests (validates FEATURE-002/003/004)
- ✅ **Validation Gate**: Lint, typecheck, full test suite passing

**Phase 3 (Quality, Polish & macOS Features) – 20–35 hours:**
- GAP-015: Liquid Glass material (modal overlays, frosted glass effect)
- GAP-016: System accent color detection (dynamic theming based on user preferences)
- GAP-006: Dark mode detection tests (system preference listener, localStorage persistence)
- GAP-011: Modal migration (custom → shadcn/ui Dialog, focus management)
- GAP-012: Icon system (inline SVG → lucide-react SF Symbols)
- GAP-005: Accessibility baseline (WCAG 2.1 AA: aria attributes, keyboard navigation)
- GAP-003: Error boundary testing (render errors, network failures)
- GAP-004: Component library documentation (Storybook or patterns catalog)
- GAP-007: Environment variable configuration
- GAP-008: Structured logging & instrumentation
- GAP-002: Pre-commit hooks & CI/CD pipeline

**Post-MVP (Compliance & Performance):**
- Extended accessibility testing (WCAG 2.1 AA full audit with screen reader testing)
- Performance monitoring & optimization
- Telemetry/analytics (if required by business)

---

## Impact on MVP Launch (Updated with macOS 2025/2026 Alignment)

**Blocking Items:** None – all gaps are incremental improvements aligned with macOS best practices.

**Phase 2 Essentials (Must Complete Before MVP):**
- ✅ **GAP-017**: Native window styling (visual polish, expected on macOS)
- ✅ **GAP-013**: Tailwind configuration (SF Pro fonts, dark mode class strategy)
- ✅ **GAP-009**: Theme context (system preference detection, user control)
- ✅ **GAP-001**: shadcn/ui (component consistency, accessibility baseline)
- ✅ **GAP-010**: Toast replacement (FEATURE-002 notifications via modern Toast)
- ✅ **FEATURE-005**: Smoke tests (validates all 3 completed features + infrastructure)

**Phase 3 Nice-to-Haves (Post-MVP Polish):**
- **Visual Enhancements**: GAP-015 (Liquid Glass), GAP-016 (System accent color)
- **Component Migration**: GAP-011 (shadcn/ui Dialog), GAP-012 (lucide-react icons)
- **Testing & CI/CD**: GAP-005 (Accessibility), GAP-006 (Dark mode tests), GAP-002 (Pre-commit/CI)
- **Developer Experience**: GAP-007 (Env config), GAP-008 (Logging), GAP-004 (Component docs)

**Can Defer to Phase 3 Without Blocking Release:** All Phase 3 items (10 gaps, 20–35 hours)
