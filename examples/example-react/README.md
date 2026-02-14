# example-react

Example React app for theme-manager-react

> Generated with [create-bunspace](https://github.com/mks2508/create-bunspace)

## Features

- **React 19.2** with TypeScript 5.9
- **Vite 8 (experimental)** for blazing fast builds
- **Tailwind CSS v4** with `@tailwindcss/vite`
- **BaseUI/MKS-UI** component library (`@mks2508/mks-ui`)
- **Theme Manager** (`@mks2508/theme-manager-react`)
- Animated theme transitions with multiple presets
- Light/dark/system mode support

## Quick Start

```bash
bun install
bun run dev
```

## Stack

| Tool | Version |
|------|---------|
| React | 19.2 |
| Vite | 8.0.0-beta |
| Tailwind CSS | v4 |
| @mks2508/mks-ui | latest |
| TypeScript | 5.9 |

## Components

All UI components are imported from `@mks2508/mks-ui/react`:

- **AlertDialog** — Animated alert dialog with 3D flip entrance
- **Badge** — Status/label badges with variants
- **Button** — Button with multiple variants and sizes
- **Card** — Container card with header, content, footer, action sections
- **Combobox** — Searchable select with autocomplete
- **Dialog** — Animated modal dialog
- **DropdownMenu** — Menu with groups, checkboxes, radios, sub-menus
- **Field** — Form field wrapper with label, description, error
- **Input** — Text input
- **Select** — Select dropdown with groups
- **Tabs** — Tab navigation with animated indicators
- **Progress** — Progress bar
- **Switch** — Toggle switch
- **Checkbox** — Checkbox input
- **Separator** — Visual divider

## Theme Management

### Built-in Themes

The starter includes 4 built-in themes:
- **default** — Clean, neutral theme
- **synthwave84** — Retro synthwave aesthetic
- **graphite** — Dark, professional look
- **darkmatteviolet** — Dark with violet accents

### Animated Transitions

Theme switching supports multiple animation presets:
- `wipe` — Horizontal wipe transition
- `circle-expand` — Expanding circle
- `circle-shrink` — Shrinking circle
- `diamond` — Diamond-shaped reveal
- `crossfade` — Smooth fade
- `gif-mask` — Mask-based transition
- `slide` — Slide transition
- `none` — Instant switch

### Adding Themes

Install themes from TweakCN or custom registries:

```bash
bun run install-theme https://tweakcn.com/r/themes/your-theme.json
```

## CRITICAL: Tailwind v4 Consumer Setup

This app uses `@mks2508/mks-ui` which ships compiled JS with Tailwind class strings. Tailwind v4's `@tailwindcss/vite` plugin **does not scan `node_modules` by default**, so the following `@source` directive is required in `src/index.css`:

```css
@source "../node_modules/@mks2508/mks-ui/dist";
```

Without this directive, component utility classes will not be generated, and components will render unstyled.

## Template Usage

Click "Use this template" to create a new repository from this starter.

## License

MIT
