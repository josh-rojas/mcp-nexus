# Git Commit Plan: Modal Migration & Icon System Replacement

This document outlines the logical sequence of git commits for implementing the Modal Migration and Icon System Replacement design. Each commit represents a functional, testable unit of work following conventional commit patterns.

## Phase 1: Foundation Setup (6 commits)

### 1.1 Dependencies and Configuration

```
chore(deps): install shadcn/ui dialog, lucide-react, and development tooling

- Add lucide-react for icon system
- Add @radix-ui/react-dialog for shadcn/ui Dialog primitives
- Add husky and lint-staged for pre-commit hooks
- Add eslint-plugin-jsx-a11y for accessibility linting
- Update package.json with new dependencies

Related: GAP-011, GAP-012, GAP-002
```

### 1.2 Pre-commit Hook Configuration

```
chore(git): configure husky pre-commit hooks and lint-staged

- Initialize husky git hooks
- Create .husky/pre-commit script
- Add .lintstagedrc.json with linting, formatting, and type checking rules
- Configure lint-staged to run on TypeScript and TSX files only
- Add npm scripts for hook management

Related: GAP-002
```

### 1.3 Environment Configuration

```
feat(config): implement environment variable validation and configuration

- Create src/lib/env.ts with environment validation utility
- Add .env.example with documented variables (VITE_DEBUG_TAURI, VITE_API_TIMEOUT, etc.)
- Implement type-safe environment variable access
- Add runtime validation with helpful error messages
- Create TypeScript types for import.meta.env augmentation

Related: GAP-007
```

### 1.4 Structured Logging System

```
feat(logging): implement structured logging utility with sensitive data masking

- Create src/lib/logger.ts with log level filtering
- Implement debug, info, warn, error methods
- Add automatic timestamp generation and context serialization
- Implement sensitive data masking (credentials, tokens, PII)
- Add environment-based log level filtering
- Write comprehensive unit tests for logger utility

Related: GAP-008
```

### 1.5 shadcn/ui Dialog Component

```
feat(ui): add shadcn/ui Dialog component primitives

- Create src/components/ui/dialog.tsx with Dialog primitives
- Include DialogRoot, DialogTrigger, DialogPortal, DialogOverlay
- Add DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- Add DialogClose component for accessible close functionality
- Style with Tailwind CSS following macOS design system
- Ensure ARIA attributes and focus trap functionality

Related: GAP-011
```

### 1.6 Environment Setup Documentation

```
docs(config): add environment setup documentation

- Create docs/environment-setup.md
- Document all environment variables with descriptions and defaults
- Add development and production configuration examples
- Include troubleshooting section for common issues
- Add security best practices for sensitive variables

Related: GAP-007
```

---

## Phase 2: Modal Migration (3 commits)

### 2.1 Migrate AddServerModal

```
refactor(servers): migrate AddServerModal to shadcn/ui Dialog

- Replace custom modal implementation with Dialog primitives
- Preserve all form state management and validation logic
- Maintain client selection grid functionality
- Keep environment variable management intact
- Add proper DialogTitle and DialogDescription for accessibility
- Implement focus trap and keyboard navigation (Tab, Escape)
- Update tests to verify Dialog behavior
- Add logger instrumentation for modal interactions

Related: GAP-011, GAP-005
```

### 2.2 Migrate ServerDetailModal

```
refactor(marketplace): migrate ServerDetailModal to shadcn/ui Dialog

- Replace custom modal with Dialog primitives
- Preserve marketplace server display and installation flow
- Maintain transport mode selection and SSE URL input
- Keep client selection functionality intact
- Add ARIA attributes for screen reader support
- Implement proper focus management
- Update integration tests for new Dialog structure
- Add logging for installation workflows

Related: GAP-011, GAP-005
```

### 2.3 Migrate ManualConfigModal

```
refactor(clients): migrate ManualConfigModal to shadcn/ui Dialog

- Replace custom modal implementation with Dialog primitives
- Preserve configuration display and clipboard copy functionality
- Maintain loading and error states
- Add accessible labels and descriptions
- Ensure keyboard navigation through instructions
- Update component tests for Dialog behavior
- Verify no visual or functional regressions

Related: GAP-011, GAP-005
```

---

## Phase 3: Icon System Replacement (4 commits)

### 3.1 Navigation and Core Icons

```
refactor(icons): replace navigation and core icons with lucide-react

- Replace inline SVG icons in Sidebar with lucide-react components
- Update: LayoutGrid (dashboard), Store (marketplace), Server, Monitor (clients), Settings
- Standardize size to 20px (w-5 h-5) for navigation
- Ensure icons respect currentColor for automatic dark mode support
- Update NavIcon component to use lucide-react
- Verify dark mode compatibility

Related: GAP-012
```

### 3.2 Status and Action Icons

```
refactor(icons): replace status and action icons with lucide-react

- Replace status icons: CheckCircle, XCircle, AlertTriangle, Info
- Replace action icons: RefreshCw, Plus, X, Copy, Edit, Trash, ExternalLink
- Standardize button icons to 16px (w-4 h-4)
- Standardize header icons to 24px (w-6 h-6)
- Update Toast notification icons
- Ensure consistent usage across all components

Related: GAP-012
```

### 3.3 Loading Spinners

```
refactor(icons): standardize loading spinners with lucide-react Loader2

- Replace all loading spinner implementations with Loader2 icon
- Add animate-spin class for rotation animation
- Standardize sizes (16px for inline, 24px for page-level)
- Add aria-label="Loading" and role="status" for accessibility
- Remove unused spinner SVG code
- Update all components using loading states

Related: GAP-012, GAP-019
```

### 3.4 Client Type and Health Icons

```
refactor(icons): replace client type and health status icons with lucide-react

- Update client type icons: Code (editor), Monitor (desktop), Terminal
- Replace health status indicators with appropriate icons
- Update badge and status indicator components
- Ensure consistent sizing (16px for inline status)
- Verify all icon colors respect currentColor
- Eliminate all remaining inline SVG icons

Related: GAP-012
```

---

## Phase 4: Accessibility Enhancement (5 commits)

### 4.1 Navigation Accessibility

```
feat(a11y): enhance navigation accessibility with ARIA attributes

- Add role="navigation" to Sidebar component
- Add aria-label="Main navigation" to nav element
- Implement aria-current="page" for active route
- Ensure visible focus indicators on all nav links
- Add keyboard navigation support verification
- Test with VoiceOver for proper announcements

Related: GAP-005
```

### 4.2 Main Content Landmarks

```
feat(a11y): add semantic landmarks to page components

- Add role="main" to primary content area in Dashboard
- Add role="main" to Servers, Clients, Marketplace, Settings pages
- Ensure each page has unique main landmark
- Implement skip link component (hidden until focused)
- Add skip link styling that appears on keyboard focus
- Verify logical document structure

Related: GAP-005
```

### 4.3 Form Accessibility

```
feat(a11y): enhance form accessibility across application

- Add aria-describedby to form inputs linking to help text and errors
- Add aria-required to required form fields
- Add aria-invalid with descriptive error messages for validation
- Ensure all labels properly associated with inputs
- Add fieldset and legend for grouped form fields in AddServerModal
- Test form validation announcements with screen reader

Related: GAP-005
```

### 4.4 Button and Interactive Elements

```
feat(a11y): add ARIA labels to icon-only buttons and interactive elements

- Add aria-label to all icon-only buttons describing actions
- Add aria-disabled to inactive buttons
- Implement aria-busy for loading button states
- Add aria-live regions for dynamic content updates
- Ensure all interactive elements have visible focus indicators
- Verify button purpose clear to screen readers

Related: GAP-005
```

### 4.5 Heading Hierarchy and Structure

```
feat(a11y): implement proper heading hierarchy across pages

- Ensure single h1 per page with descriptive content
- Establish logical h2, h3 nesting without skipping levels
- Update Dashboard summary cards with proper heading structure
- Update Servers, Clients, Marketplace page headings
- Verify Settings page heading organization
- Test heading navigation with VoiceOver rotor

Related: GAP-005
```

---

## Phase 5: Testing Infrastructure (5 commits)

### 5.1 Theme System Tests

```
test(theme): add comprehensive tests for ThemeProvider and useTheme

- Test ThemeProvider initialization with default theme
- Test system preference detection on initial load
- Test localStorage persistence and restoration
- Test theme toggle between light/dark/system modes
- Mock window.matchMedia for system preference simulation
- Mock localStorage for persistence verification
- Test useTheme hook returns and updates
- Achieve >90% coverage for theme system

Related: GAP-006
```

### 5.2 Error Boundary Tests

```
test(errors): add comprehensive ErrorBoundary component tests

- Test error catching for render errors
- Test fallback UI rendering with error details
- Test "Try Again" button resets boundary state
- Test "Go to Dashboard" navigation functionality
- Test custom fallback prop support
- Create error-throwing test components
- Mock console.error to prevent test pollution
- Test error scenarios for each page component
- Achieve >90% coverage for error handling

Related: GAP-003
```

### 5.3 Logger Utility Tests

```
test(logging): add comprehensive logger utility tests

- Test log level filtering (debug disabled in production)
- Test timestamp format validation (ISO 8601)
- Test context object serialization
- Test sensitive data masking (credentials, tokens, PII)
- Test environment detection for log filtering
- Test error stack trace formatting
- Verify no sensitive data leaks in logs
- Achieve >90% coverage for logger utility

Related: GAP-008
```

### 5.4 Modal Accessibility Tests

```
test(a11y): add accessibility tests for migrated modals

- Test Dialog ARIA attributes (aria-modal, aria-labelledby, aria-describedby)
- Test focus trap prevents tab navigation outside modal
- Test Escape key closes modal
- Test focus restoration to trigger element on close
- Test keyboard navigation through modal form elements
- Use @testing-library/user-event for realistic interactions
- Add jest-axe accessibility assertions
- Test all three migrated modals (Add, Detail, Manual)

Related: GAP-011, GAP-005
```

### 5.5 CI/CD Pipeline Configuration

```
ci(github): add GitHub Actions validation workflow

- Create .github/workflows/validate.yml
- Configure triggers: push to main, pull requests, manual dispatch
- Add job for frontend: lint, type check, test, coverage
- Add job for Rust: cargo test, cargo clippy
- Implement dependency caching (npm, cargo)
- Configure parallel job execution for faster feedback
- Add test coverage reporting and PR comments
- Block PR merge on validation failures

Related: GAP-002, GAP-015
```

---

## Phase 6: Documentation & Polish (3 commits)

### 6.1 UI Patterns Documentation

```
docs(ui): create comprehensive UI patterns documentation

- Create docs/ui-patterns.md
- Document shadcn/ui Dialog usage patterns with examples
- Document lucide-react icon system and standards (16px, 20px, 24px)
- Include macOS theme customization guidelines
- Document dark mode implementation patterns
- Add accessibility best practices (ARIA, keyboard, focus)
- Include complete example implementations
- Add testing patterns with React Testing Library

Related: GAP-004
```

### 6.2 Logging Instrumentation

```
refactor(logging): replace console calls with structured logger

- Replace console.log calls with logger.debug/info
- Replace console.error calls with logger.error
- Add logging to critical workflows (installation, sync, credentials)
- Add logging to API calls and Tauri commands
- Instrument error handlers with stack traces
- Log marketplace searches and installs
- Verify no sensitive data in production logs
- Add logging context for better debugging

Related: GAP-008
```

### 6.3 Final Polish and Verification

```
chore: final polish and verification for MVP gap closure

- Run full accessibility audit with Axe DevTools
- Verify manual VoiceOver testing on all pages
- Verify keyboard navigation through entire application
- Test all modals for functionality and accessibility
- Verify icon consistency in light and dark modes
- Run performance checks (bundle size, initial load)
- Verify all tests passing with >90% coverage
- Update README with new features and setup instructions

Related: GAP-003, GAP-005, GAP-006, GAP-011, GAP-012
```

---

## Phase 7: Extended Quality Improvements (8 commits)

### 7.1 Shared Button Component

```
feat(ui): create shared Button component library

- Create src/components/ui/button.tsx
- Implement variants: primary, secondary, danger, ghost, link
- Implement sizes: sm, md, lg
- Add states: default, hover, active, disabled, loading
- Add icon support: left, right, icon-only
- Include proper ARIA attributes and keyboard support
- Write comprehensive component tests
- Create Storybook stories for all variants (if Storybook enabled)

Related: GAP-013
```

### 7.2 Shared Input and Select Components

```
feat(ui): create shared Input and Select components

- Create src/components/ui/input.tsx with all input types
- Implement states: default, focused, error, disabled
- Add features: label, help text, error message, prefix/suffix
- Create src/components/ui/select.tsx with single/multi-select
- Add search/filter functionality and keyboard navigation
- Include proper ARIA roles and attributes
- Write component tests for all states and interactions

Related: GAP-013
```

### 7.3 Route-Based Code Splitting

```
perf(bundle): implement route-based code splitting

- Replace static imports with React.lazy for page components
- Wrap Routes with Suspense boundaries
- Create loading fallback UI for page transitions
- Handle loading errors gracefully
- Measure and verify bundle size reduction
- Ensure initial bundle < 200KB gzipped
- Verify time to interactive improvement

Related: GAP-014
```

### 7.4 Bundle Size Monitoring

```
chore(bundle): add bundle size visualization and monitoring

- Add rollup-plugin-visualizer to vite config
- Generate bundle visualization on build
- Set size budget thresholds (main: 200KB, vendor: 300KB)
- Configure build to fail if budgets exceeded
- Verify lucide-react tree-shaking working correctly
- Add bundle size reporting to CI pipeline
- Document bundle optimization guidelines

Related: GAP-014
```

### 7.5 Enhanced ESLint Rules

```
chore(lint): enhance ESLint with accessibility and import rules

- Add eslint-plugin-jsx-a11y with comprehensive rules
- Add eslint-plugin-import for import management
- Configure import ordering and duplicate detection
- Add stricter TypeScript rules (no-explicit-any, prefer-nullish-coalescing)
- Enable unused code detection
- Configure auto-fix for development, strict checking for CI
- Update existing code to comply with new rules

Related: GAP-016
```

### 7.6 Loading State Components

```
feat(ui): create standardized Spinner and Skeleton components

- Create src/components/ui/spinner.tsx using Loader2 icon
- Implement sizes: sm (16px), md (24px), lg (32px), xl (48px)
- Add accessible attributes: aria-label, role="status"
- Create src/components/ui/skeleton.tsx with shimmer animation
- Implement variants: text, circle, rectangle
- Create LoadingState wrapper component for page-level loading
- Replace all scattered loading implementations
- Add component tests and stories

Related: GAP-019
```

### 7.7 Focus Management Utilities

```
feat(a11y): implement focus management utilities and hooks

- Create useFocusTrap hook for custom overlays
- Implement useFocusReturn hook for focus restoration
- Add useArrowNavigation hook for list components
- Create skip link component (hidden until focused)
- Implement focus-visible polyfill styles
- Add roving tabindex support for toolbars
- Write comprehensive tests for focus utilities
- Document usage patterns and examples

Related: GAP-020
```

### 7.8 CI/CD Enhancements

```
ci(github): enhance CI pipeline with caching and coverage

- Add dependency caching (npm, cargo) to reduce build time
- Add frontend test execution with coverage reporting
- Configure Codecov or similar for coverage tracking
- Add coverage diff comments on PRs
- Implement security scanning (npm audit, cargo audit)
- Add bundle size reporting to PR comments
- Create .github/dependabot.yml for automated updates
- Optimize parallel job execution

Related: GAP-015
```

---

## Phase 8: UI Layout Implementation (6 commits)

### 8.1 TanStack Table Setup

```
feat(servers): add TanStack Table library and column definitions

- Install @tanstack/react-table dependency
- Create src/components/servers/ServersTable.tsx
- Define column structure: Name, Status, Transport, Clients, LastSync, Health, Actions
- Implement type-safe column definitions with TypeScript
- Add basic table rendering without interactivity
- Create table styling following macOS design system

Related: GAP-021
```

### 8.2 Table Features and Interactions

```
feat(servers): implement table sorting, filtering, and search

- Add multi-column sorting with visual indicators
- Implement filtering by status, transport, health
- Add real-time search for server name/description
- Implement pagination with 25/50/100 options
- Add row expansion for inline server details
- Create bulk selection and batch actions
- Add keyboard navigation (Tab, Arrow keys, Space, Enter)
- Test table interactions and accessibility

Related: GAP-021
```

### 8.3 Table View Toggle

```
feat(servers): add table/grid view toggle with persistence

- Create view mode selector component (Table/Grid icons)
- Implement view preference persistence in localStorage
- Add smooth transition between views
- Update Servers page to support both layouts
- Preserve all existing grid view functionality
- Ensure responsive behavior (auto-switch on mobile)
- Add toggle to QuickActions or page header
- Test view switching and preference persistence

Related: GAP-021
```

### 8.4 ReactFlow Network Diagram Foundation

```
feat(dashboard): implement network diagram with ReactFlow

- Install reactflow dependency
- Create src/components/dashboard/NetworkDiagram.tsx
- Define custom ServerNode component with icon and metadata
- Define custom ClientNode component with logo and actions
- Transform server/client data to ReactFlow nodes/edges format
- Implement two-column layout (servers left, clients right)
- Add NetworkLegend component for line state explanations
- Create static positioning algorithm

Related: GAP-022
```

### 8.5 Connection Line Animations

```
feat(dashboard): implement animated connection lines for network diagram

- Create ConnectionEdge custom component
- Implement line state styling: inactive (gray dashed), failed (red), active (animated)
- Add flowing dots animation using SVG stroke-dasharray
- Add status icons: lightning bolt (active), X (failed)
- Implement gradient animation (blue to purple)
- Add smooth state transitions with CSS animations
- Optimize animation performance
- Test animations across browsers

Related: GAP-022
```

### 8.6 Interactive Network Behaviors

```
feat(dashboard): add interactive behaviors to network diagram

- Implement bidirectional hover highlighting
- Add global toggle functionality per server
- Connect to existing sync mutations for real-time updates
- Add settings icon that opens configuration modal
- Implement line click tooltips with connection details
- Add keyboard navigation between connected nodes
- Implement screen reader support with live regions
- Add empty states and onboarding tooltips
- Test all interactions for accessibility and performance

Related: GAP-022
```

---

## Summary Statistics

**Total Commits:** 41

- Phase 1 (Foundation): 6 commits
- Phase 2 (Modal Migration): 3 commits
- Phase 3 (Icon System): 4 commits
- Phase 4 (Accessibility): 5 commits
- Phase 5 (Testing): 5 commits
- Phase 6 (Documentation): 3 commits
- Phase 7 (Extended Quality): 8 commits
- Phase 8 (UI Layouts): 6 commits

**Commit Type Distribution:**

- feat (features): 17 commits (41%)
- refactor (refactoring): 7 commits (17%)
- test (testing): 4 commits (10%)
- docs (documentation): 3 commits (7%)
- chore (maintenance): 6 commits (15%)
- ci (CI/CD): 2 commits (5%)
- perf (performance): 1 commit (2%)

**Scope Distribution:**

- UI components: 12 commits
- Accessibility: 8 commits
- Configuration/tooling: 7 commits
- Testing: 5 commits
- Documentation: 3 commits
- Icons: 4 commits
- Servers/Dashboard: 6 commits
- Other: 6 commits

**Estimated Total Effort:** 50-68 hours

- Core (Phases 1-6): 22-32 hours
- Extended (Phase 7): 12-16 hours
- UI Layouts (Phase 8): 16-20 hours

## Principles Applied

1. **Atomic Commits:** Each commit represents a single, complete unit of work
2. **Functional:** Application remains functional after each commit
3. **Testable:** Each commit includes or updates tests as appropriate
4. **Conventional:** All commits follow conventional commit format
5. **Logical Grouping:** Related changes grouped together
6. **Progressive Enhancement:** Features build incrementally
7. **Risk Management:** Lower-risk changes first, complex changes broken down
8. **Documentation:** Documentation commits at appropriate milestones

## Notes for Implementation

- Each commit should be tested before proceeding to the next
- All tests should pass before committing
- Pre-commit hooks will enforce linting and formatting
- CI pipeline will validate each push
- Breaking changes should be avoided; flag features if necessary
- Commit messages should reference related GAP items
- Each phase can be reviewed and merged independently
- Regression testing after each phase completion
- Accessibility testing with VoiceOver throughout
- Performance monitoring for bundle size and load times
