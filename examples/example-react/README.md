# example-react

Example React app demonstrating `@mks2508/mks-ui` component library integration with theme management.

## Setup

```bash
bun install
bun run dev
```

## CRITICAL: Tailwind v4 Consumer Setup

This app uses `@mks2508/mks-ui` which ships compiled JS with Tailwind class strings. Tailwind v4's `@tailwindcss/vite` plugin **does not scan `node_modules` by default**, so the following `@source` directive is required in `src/index.css`:

```css
@source "../node_modules/@mks2508/mks-ui/dist";
```

Without this directive, component utility classes (e.g. `bg-popover`, `border-input`, `data-placeholder:text-muted-foreground`) will not be generated, and components will render unstyled.

## Components

All UI components are imported from `@mks2508/mks-ui/react`:

- **AlertDialog** — Animated alert dialog with 3D flip entrance (`AlertDialog`, `AlertDialogTrigger`, `AlertDialogPortal`, `AlertDialogBackdrop`, `AlertDialogPopup`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogClose`)
- **Badge** — Status/label badges with variants
- **Button** — Button with multiple variants and sizes
- **Card** — Container card with header, content, footer, action sections
- **Combobox** — Searchable select with autocomplete
- **Dialog** — Animated modal dialog
- **DropdownMenu** — Menu with groups, checkboxes, radios, sub-menus
- **Field** — Form field wrapper with label, description, error
- **Input** — Text input
- **Select** — Select dropdown with groups
- **Textarea** — Multi-line text input

### Custom app components

- **AnimationPicker** — Dialog for selecting theme transition animation presets
- **ThemeSelector** — Theme switcher using `@mks2508/theme-manager-react`
- **ComponentExample** — Showcase of all integrated mks-ui components

## Stack

- React 19.2 + TypeScript
- Tailwind CSS v4 with `@tailwindcss/vite`
- `@mks2508/mks-ui` v0.2.1
- `@mks2508/theme-manager-react` + `@mks2508/shadcn-basecoat-theme-manager`
- Vite 8 (beta)
