# UI Patterns and Component Library

## Overview

This document describes the UI patterns, components, and design standards used in MCP Nexus.

## Component Library

### shadcn/ui Dialog

All modal components use shadcn/ui Dialog primitives for consistent behavior and accessibility.

**Example Usage:**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function MyModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
          <DialogDescription>
            Modal description for screen readers
          </DialogDescription>
        </DialogHeader>

        {/* Modal content */}

        <DialogFooter>
          <button onClick={onClose}>Cancel</button>
          <button>Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Features:**

- Automatic focus trap
- Escape key handling
- ARIA attributes (aria-modal, aria-labelledby, aria-describedby)
- Portal rendering for proper z-index
- Focus restoration on close

### Icon System (lucide-react)

All icons use lucide-react for consistency and automatic dark mode support.

**Icon Standards:**

- **Navigation**: 20px (w-5 h-5)
- **Buttons**: 16px (w-4 h-4)
- **Headers**: 24px (w-6 h-6)
- **Status badges**: 16px (w-4 h-4)

**Example Usage:**

```tsx
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

// Success icon
<CheckCircle2 className="w-5 h-5 text-green-500" />

// Error icon
<XCircle className="w-5 h-5 text-red-500" />

// Warning icon
<AlertTriangle className="w-5 h-5 text-yellow-500" />

// Info icon
<Info className="w-5 h-5 text-blue-500" />
```

**Benefits:**

- Uses currentColor for automatic theme adaptation
- Tree-shakeable (only imports used icons)
- Consistent visual style across the app
- No hardcoded colors

### Toast Notifications

Toast notifications provide feedback for user actions.

**Usage:**

```tsx
import { useNotificationStore } from "../stores/notificationStore";

const { addNotification } = useNotificationStore();

addNotification({
  type: "success", // "success" | "error" | "warning" | "info"
  title: "Server Added",
  message: "Your server has been successfully added",
});
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

All components follow WCAG 2.1 AA guidelines:

1. **Semantic HTML**
   - Use proper heading hierarchy (h1, h2, h3)
   - Add role attributes (role="main", role="navigation")
   - Add ARIA labels where needed

2. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Focus visible indicators for keyboard navigation
   - Tab order follows logical flow

3. **Screen Reader Support**
   - Descriptive ARIA labels for icon-only buttons
   - aria-describedby for form fields
   - Proper announcement of dynamic content

**Example:**

```tsx
// Navigation with ARIA
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Main content with role
<main role="main">
  {/* Page content */}
</main>

// Button with ARIA label
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>
```

## Dark Mode Support

All components automatically support dark mode through Tailwind CSS classes.

**Pattern:**

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

## Form Patterns

### Input Fields

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Field Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
  />
</div>
```

### Buttons

**Primary:**

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Primary Action
</button>
```

**Secondary:**

```tsx
<button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
  Secondary Action
</button>
```

**Disabled:**

```tsx
<button
  disabled
  className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
>
  Disabled
</button>
```

## Loading States

Use consistent loading indicators:

```tsx
// Spinner
<svg
  className="animate-spin h-5 w-5 text-blue-600"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
  />
  <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  />
</svg>
```

## Error Handling

Use ErrorBoundary for component-level error handling:

```tsx
import { ErrorBoundary } from "../components/common/ErrorBoundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>;
```

## Best Practices

1. **Component Organization**
   - One component per file
   - Co-locate related components
   - Use index.ts for exports

2. **Styling**
   - Use Tailwind CSS utilities
   - Follow dark mode patterns
   - Maintain consistent spacing

3. **Accessibility**
   - Add ARIA labels for icon-only buttons
   - Use semantic HTML
   - Test with keyboard navigation

4. **Performance**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Lazy load heavy components

5. **Testing**
   - Write tests for critical components
   - Test accessibility features
   - Test error scenarios
