# UI Patterns & Guidelines

## Overview
MCP Nexus uses a modern, accessible, and theme-aware UI system built on:
- **Tailwind CSS** (Styling)
- **shadcn/ui** (Components)
- **Radix UI** (Primitives)
- **Lucide React** (Icons)

## Design System

### Colors
We use semantic CSS variables for theming, supporting Light and Dark modes.
- `bg-background` / `text-foreground`: Main page background and text.
- `bg-card` / `text-card-foreground`: Card containers.
- `bg-primary` / `text-primary-foreground`: Primary actions.
- `bg-muted` / `text-muted-foreground`: Secondary text/backgrounds.
- `border-border`: Borders.

### Typography
Font stack prioritizes native system fonts (San Francisco on macOS):
`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", ...`

### Spacing
Standard 8pt grid system.
- `p-2` = 0.5rem = 8px
- `m-4` = 1rem = 16px

## Components

### Buttons
Use the `Button` component from `@/components/ui/button`.
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="destructive">Dangerous Action</Button>
```

### Cards
Use `Card` for grouped content.
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Server Info</CardTitle>
  </CardHeader>
  <CardContent>
    Details...
  </CardContent>
</Card>
```

### Dialogs (Modals)
Use `Dialog` for modal interactions.
```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    Modal Content
  </DialogContent>
</Dialog>
```

### Toast Notifications
Use `sonner` for notifications.
```tsx
import { toast } from "sonner"

toast.success("Operation successful")
toast.error("Something went wrong")
```

## Icons
Use `lucide-react` for icons.
```tsx
import { Server, Settings } from "lucide-react"

<Server className="h-4 w-4" />
```

## Dark Mode
Dark mode is toggled via `ThemeProvider`.
Components automatically adapt using the semantic variables.
To force dark mode for a section, wrap in a class-provider or manually apply styles (discouraged).
