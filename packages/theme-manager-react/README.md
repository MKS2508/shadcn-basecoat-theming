# @mks2508/theme-manager-react

React hooks and components for theme management — shadcn/ui compatible,
**animated** theme transitions via the View Transitions API, SSR-ready for
Next.js, TanStack Start and Remix.

## Entries

| Subpath | Stack | Contents |
|---|---|---|
| `@mks2508/theme-manager-react` | Classic (SPA/CSR) | `ThemeProvider`, `useTheme`, `useAnimatedTheme`, `SettingsModal`, `ThemeManagementModal`, `FontSettingsModal`, `AnimationSettings` |
| `…/ssr` | SSR (framework-agnostic) | `SSRThemeProvider`, `useSSRTheme`, `useAnimatedSSRTheme`, `SSRThemeSelect`, `SSRModeToggle`, `ThemeSSRHead`, `ThemeSSRStyle`, `generateFOUCScript` |
| `…/tanstack-start` | SSR (client side) | everything in `/ssr` (client) |
| `…/tanstack-start/server` | SSR (server only) | `getThemeFromCookie`, `setThemeInCookie`, `getThemeConfigForSSR`, `getAvailableThemesForSSR`, `useServerTheme` |
| `…/nextjs` | Next.js | `NextJSThemeProvider`, `createNextJSConfig` |

> **Note:** selector/toggle components are **not** exported pre-built from the
> classic `/nextjs` entry. For SSR use `SSRThemeSelect` / `SSRModeToggle` from
> `/ssr` or `/tanstack-start`. For a classic SPA, build them on top of
> `useAnimatedTheme` (see the starter pattern below).

## Install

```bash
bun add @mks2508/theme-manager-react @mks2508/shadcn-basecoat-theme-manager
# peers
bun add react react-dom lucide-react class-variance-authority clsx tailwind-merge
# optional (for SSR server functions)
bun add @tanstack/react-start
# optional (pre-built selectors use DropdownMenu / Button)
bun add @mks2508/mks-ui
```

## SSR setup (TanStack Start) — zero-FOUC

The server reads the theme cookie, resolves the CSS variables from the
registry, and injects them into `<head>` **before** the first paint. The
client hydrates against the same values — no flash.

```tsx
// src/routes/__root.tsx
import { createServerFn } from '@tanstack/react-start';
import {
  getThemeFromCookie,
  getThemeConfigForSSR,
  SSRThemeProvider,
  ThemeSSRHead,
} from '@mks2508/theme-manager-react/tanstack-start';
import { getThemeFromCookie as readCookie, getThemeConfigForSSR as readConfig } from '@mks2508/theme-manager-react/tanstack-start/server';

// Resolve theme server-side (no "use client")
const resolveTheme = createServerFn({ method: 'GET' }).handler(async () => {
  const { theme, mode } = await readCookie();
  const { cssVars, fonts } = await readConfig({ data: { theme, mode } });
  return { theme, mode, cssVars, fonts };
});

export function RootDocument({ children, theme, mode, cssVars, fonts }: RootProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeSSRHead
          theme={theme}
          mode={mode}
          cssVars={cssVars}
          fonts={fonts}
          foucConfig={{ storageType: 'cookie', defaultTheme: 'graphite', defaultMode: 'dark' }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

export function RootLayout() {
  return (
    <SSRThemeProvider defaultTheme="graphite" defaultMode="dark" registryUrl="/themes/registry.json">
      <Outlet />
    </SSRThemeProvider>
  );
}
```

### Pre-built animated selector + toggle

```tsx
import { SSRThemeSelect, SSRModeToggle } from '@mks2508/theme-manager-react/tanstack-start';

export function Header() {
  return (
    <div className="flex gap-2">
      <SSRThemeSelect animation="wipe" duration={500} />
      <SSRModeToggle modes={['light', 'dark', 'system']} animation="circle-expand" />
    </div>
  );
}
```

Animation presets: `wipe` · `circle-expand` · `circle-shrink` · `diamond` ·
`crossfade` · `slide` · `gif-mask` · `none`. Honours `prefers-reduced-motion`
(instant swap when set or when the View Transitions API is unavailable).

## Classic setup (SPA / CSR — Vite)

```tsx
// src/main.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react';

<ThemeProvider registryUrl="/themes/registry.json" defaultTheme="synthwave84" defaultMode="auto">
  <App />
</ThemeProvider>
```

Build an animated selector on top of `useAnimatedTheme` (the classic hook):

```tsx
import { useAnimatedTheme } from '@mks2508/theme-manager-react';
import { DropdownMenu, DropdownMenuTrigger, Button } from '@mks2508/mks-ui/react';

function ThemeSelector() {
  const { currentTheme, themes, setTheme } = useAnimatedTheme({ animation: 'wipe', duration: 500 });
  // …render a DropdownMenu bound to currentTheme / setTheme
}
```

`useAnimatedTheme` spreads the full classic context and replaces `setTheme`
with an animated version. `useAnimatedSSRTheme` (SSR entry) is the twin built
on `useSSRTheme` — same shape, safe under `SSRThemeProvider`.

## Settings modal (classic)

```tsx
import { SettingsModal, type IAnimationSettings } from '@mks2508/theme-manager-react';
import { useState } from 'react';

function Settings() {
  const [open, setOpen] = useState(false);
  const [anim, setAnim] = useState<IAnimationSettings>({ preset: 'wipe', direction: 'ltr', duration: 500 });
  return <SettingsModal open={open} onOpenChange={setOpen} animationSettings={anim} onAnimationSettingsChange={setAnim} />;
}
```

`AnimationSettings` (the preset/direction/duration panel) is context-free and
SSR-safe — it can be rendered under either provider.

## Registry & CSS

```json
// public/themes/registry.json
{
  "themes": [
    {
      "id": "synthwave84",
      "label": "Synthwave84",
      "modes": { "light": "/themes/synthwave84-light.css", "dark": "/themes/synthwave84-dark.css" },
      "fonts": { "sans": "…", "serif": "…", "mono": "…" },
      "preview": { "primary": "oklch(…)", "background": "oklch(…)", "accent": "oklch(…)" },
      "config": { "radius": "0.5rem" }
    }
  ]
}
```

Each theme CSS file defines its variables under `:root { … }`. For SSR,
`getThemeConfigForSSR` reads `public/themes/<cssFile>` relative to
`process.cwd()` and extracts those variables — keep mode paths absolute
from the `public/` root (`/themes/…`).

## Compatibility

| Framework | React | Status |
|---|---|---|
| TanStack Start (SSR) | 19 | ✅ Recommended (zero-FOUC via `/tanstack-start` + `/tanstack-start/server`) |
| Next.js 15 (App Router) | 19 | ✅ via `/nextjs` |
| Any React SSR | 18.2+ / 19 | ✅ via `/ssr` (framework-agnostic) |
| Vite SPA (classic) | 18.2+ / 19 | ✅ via `.` entry |

## License

MIT — MKS2508
