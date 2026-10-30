# Changelog

## [3.8.6] — 2026-07-12

### Changed — SSR components no longer hard-depend on `lucide-react`
- **`SSRModeToggle`** / **`SSRThemeSelect`** now receive their icons via an
  `icons` prop instead of hard-importing `lucide-react`. This removes the hard
  `lucide-react` resolution requirement from the SSR entry: consumers that
  standardized on `lucide-animated` (mks stack, REGLA 14) no longer need to
  install `lucide-react` to use the pre-built SSR selectors.
  - `SSRModeToggle`: `icons?: { Sun?, Moon?, Monitor? }` — absent icons render
    as nothing; mode cycling keeps working regardless.
  - `SSRThemeSelect`: `icons?: { palette? }` — absent trigger icon is omitted
    (the `sr-only` label keeps the button accessible).
  - New shared type `SSRThemeIconType = React.ComponentType<{ className?: string }>`,
    re-exported from `/ssr` and `/tanstack-start`. Matches `lucide-react`,
    `lucide-animated`, and custom SVG wrappers.
- **Breaking (minor)** for 3.8.5 callers that relied on the built-in
  `lucide-react` icons in `SSRThemeSelect`/`SSRModeToggle`: pass them via
  `icons` now. `lucide-react` remains an optional peerDep (the classic
  `SettingsModal` / `ThemeManagementContent` still import it).

### Fixed — SSR entry no longer transitively imports `lucide-react`
- The SSR barrel (`/ssr`, `/tanstack-start`) used to re-export
  `AnimationSettings` from the classic entry. `AnimationSettings` imports
  `lucide-react` (decorative preset icons), so every SSR consumer transitively
  loaded `lucide-react` even if it never rendered the settings panel — breaking
  apps that standardized on `lucide-animated` and don't install `lucide-react`
  (Vite stubs the optional peerDep and the import throws).
- The animation core (`hooks/animate-transition` + `ANIMATION_PRESETS` /
  `DIRECTIONAL_PRESETS` / `DIRECTION_OPTIONS`) is now forced into its own
  `animation-*.js` chunk via rolldown `manualChunks`, so the SSR barrel/chunk
  depend on it directly instead of on the classic chunk (`src-*.js`, which
  carries `lucide-react`).
- **Breaking**: `AnimationSettings` + `IAnimationSettings` /
  `IAnimationSettingsProps` are no longer exported from `/ssr` or
  `/tanstack-start`. Import them from the classic entry
  (`@mks2508/theme-manager-react`) instead, where `lucide-react` is an expected
  optional peerDep.

## [3.8.5] — 2026-07-12

### Added — SSR parity with the classic stack
- **`useAnimatedSSRTheme`** (`/ssr`, `/tanstack-start`): SSR twin of
  `useAnimatedTheme`. Same shape, draws its theme API from `useSSRTheme`
  instead of `useTheme`, so animated theme changes work under
  `SSRThemeProvider` without throwing.
- **`SSRThemeSelect`** / **`SSRModeToggle`** (`/ssr`, `/tanstack-start`):
  pre-built animated selector (DropdownMenu + Palette) and mode toggle
  (Sun/Moon/Monitor cycle). Built on `useAnimatedSSRTheme`.
- **`AnimationSettings`** + types/constants re-exported from `/ssr`
  (already SSR-safe, pure props).
- Animation core extracted to `hooks/animate-transition.ts`
  (framework-agnostic: types, 8 presets, `animateThemeChange`). Shared by
  `useAnimatedTheme` (classic) and `useAnimatedSSRTheme` (SSR) — single
  source of truth.

### Fixed
- **`defaultTheme`/`defaultMode` now propagated to `ThemeCore.init`** via
  `ThemeCoreConfig.defaults`. Previously `SSRThemeProvider` accepted but
  ignored them: `ThemeManager.init` fell back to the hardcoded id
  `"default"` (absent from non-basecoat registries), `applyTheme` threw
  `"Default theme not found in registry"`, `init()` swallowed the error,
  and the app booted with `currentTheme="default"` and no CSS applied.
  Bonus: `applySyncFOUCPrevention` also reads `defaults.theme`, fixing the
  first-frame FOUC. A defensive guard additionally recovers from a
  persisted theme id that no longer exists in the registry.

### Changed — server/client boundary
- New **`/tanstack-start/server`** entry groups the `createServerFn` server
  functions and `getCookie` hook, bundled **without** the `"use client"`
  banner. Previously the banner was applied globally and marked server-only
  code as client, breaking the boundary in TanStack Start.
- `rolldown.config.ts` now builds two configs: client entries (with
  `"use client"` banner) and the server entry (without).
- `useAnimatedTheme` (classic) refactored to delegate to
  `animate-transition.ts`. **API is identical** — no breaking change for
  existing classic consumers.

## [3.8.4] — 2026-07-11

### Fixed
- `SSRThemeProvider` now provides the context on **every** render (SSR +
  first client render) with deterministic pre-mount defaults. The previous
  `if (!mounted) return <div>{children}</div>` guard left children outside
  the provider during SSR (`useSSRTheme must be used within SSRThemeProvider`)
  and injected an extra `<div>` that altered layout.

## [3.8.3] — 2026-04-27

- Re-bundle of the source chunk (cosmetic, no functional SSR change).

## [3.8.2] — 2026-04-27

- Baseline release.
