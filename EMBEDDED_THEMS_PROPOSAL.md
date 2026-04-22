# Embedded CSS Themes — Proposal

## Problem Statement

**CSS fails to load in Electrobun desktop environment.**

```typescript
// In ThemeManager.applyTheme()
const cssPath = finalThemeConfig.modes[resolvedMode];  // "./themes/graphite-dark.css"
const response = await fetch(cssPath);  // ← FAILS with "Failed to fetch CSS: 0"
```

### Root Cause

In Electrobun webview, pages load from `views://main/` protocol. When ThemeManager does `fetch("./themes/graphite-dark.css")`, it resolves to `views://main/themes/graphite-dark.css` — that file doesn't exist in the app bundle because CSS files live elsewhere (or aren't bundled at all).

### Current Workaround

`registryData` prop bypass in ThemeProvider loads registry JSON inline (so theme metadata works), but CSS fetch still fails because the actual `.css` files aren't accessible:

```typescript
// apps/web/src/App.tsx
<ThemeProvider
  registryUrl="/themes/registry.json"
  registryData={bundledRegistry}  // ← Works for metadata
>
  {/* CSS still fails to load */}
</ThemeProvider>
```

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  @mks2508/shadcn-basecoat-theme-manager (v4.2.0)              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ThemeCore                                                │ │
│  │   ├─ ThemeManager (fetches CSS, applies variables)      │ │
│  │   ├─ ThemeRegistry (loads registry.json)                │ │
│  │   ├─ FontManager (loads Google Fonts)                    │ │
│  │   └─ StorageManager (IndexedDB persistence)              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────────────┐
│  @mks2508/theme-manager-react (v3.7.0)                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ThemeProvider                                            │ │
│  │   ├─ registryUrl?: string                               │ │
│  │   ├─ registryData?: any  ← Only for JSON metadata       │ │
│  │   └─ Passes to ThemeCore.init()                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### ThemeConfig Schema (Current)

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  modes: {
    light: string;  // ← CSS file path: "./themes/graphite-light.css"
    dark: string;   // ← CSS file path: "./themes/graphite-dark.css"
  };
  fonts: { sans: string; serif: string; mono: string; };
  preview: { primary: string; background: string; accent: string; };
  config: { radius: string; };
}
```

**Problem:** `modes` only stores paths, not content. Content is fetched at runtime.

---

## Proposed Solutions

### Option A: Inline CSS in ThemeConfig (Minimal Change)

Extend `ThemeConfig` to support both path and inline CSS:

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  modes: {
    light: string;  // Path OR inline CSS (discriminated by content)
    dark: string;   // Path OR inline CSS
  };
  // OR explicit:
  inlineCSS?: {
    light: string;  // Raw CSS content
    dark: string;   // Raw CSS content
  };
  // ... rest
}
```

**Usage:**
```typescript
const bundledRegistry: ThemeRegistryData = {
  version: "1.0.0",
  themes: [
    {
      id: "graphite",
      name: "Graphite",
      label: "Graphite",
      modes: {
        light: ":root { --background: 0 0% 100%; ... }",  // ← Inline CSS
        dark: ":root { --background: 0 0% 5%; ... }",
      },
      // OR with explicit field:
      inlineCSS: {
        light: ":root { ... }",
        dark: ":root { ... }",
      },
      // ...
    }
  ]
};
```

**Changes needed:**
1. Extend `ThemeConfig` interface
2. Modify `ThemeManager.applyTheme()` to check for inline CSS first
3. No changes to `ThemeProvider` (already supports `registryData`)

**Pros:**
- ✅ Minimal API change
- ✅ Backward compatible (path still works)
- ✅ Works with existing `registryData` prop

**Cons:**
- ❌ Large inline strings in JSON (not pretty)
- ❌ No lazy loading (all CSS in memory)
- ❌ Doesn't solve custom themes from disk

---

### Option B: CSS Modules + Bundler Integration

Use Vite's `?raw` import to embed CSS as modules:

```typescript
// apps/web/src/themes/bundled.ts
import graphiteDark from '@/themes/graphite-dark.css?raw';
import graphiteLight from '@/themes/graphite-light.css?raw';
import cyberpunkDark from '@/themes/cyberpunk-dark.css?raw';

export const BUNDLED_THEMES = {
  'graphite': { light: graphiteLight, dark: graphiteDark },
  'cyberpunk': { light: '', dark: cyberpunkDark },
};

// apps/web/src/App.tsx
import { BUNDLED_THEMES } from './themes/bundled';

<ThemeProvider
  registryUrl="/themes/registry.json"
  registryData={bundledRegistry}
  bundledCSS={BUNDLED_THEMES}  // ← New prop
>
```

**Changes needed:**
1. Add `bundledCSS?: Record<string, { light: string; dark: string }>` to `ThemeProviderProps`
2. Pass to `ThemeCore.init({ bundledCSS })`
3. Modify `ThemeManager.applyTheme()` to check `bundledCSS` before fetch

**Pros:**
- ✅ Clean separation (CSS in `.css` files, not in JSON)
- ✅ Tree-shaking friendly (unused themes can be excluded)
- ✅ TypeScript friendly
- ✅ Works in all environments (no fetch needed)

**Cons:**
- ❌ New prop in `ThemeProvider`
- ❌ Requires bundler support (Vite `?raw` import)
- ❌ Doesn't solve custom themes from disk

---

### Option C: ThemeResolver Class (Full Solution)

New class that handles disk scanning, CSS loading, and metadata parsing:

```typescript
interface ThemeResolverConfig {
  themesDir: string;           // ~/.mks-mission-control/themes/
  registryPath: string;        // auto-generated or provided
  embeddedThemes?: Record<string, { light: string; dark: string }>;
}

class ThemeResolver {
  async scanDirectory(): Promise<ThemeRegistryData>;
  async loadThemeCSS(themeId: string, mode: 'light' | 'dark'): Promise<string>;
  parseCSSMetadata(css: string): IThemeMetadata;
}

// Usage
const resolver = new ThemeResolver({
  themesDir: '~/.mks-mission-control/themes/',
  embeddedThemes: BUNDLED_THEMES,  // Fallback
});

const registry = await resolver.scanDirectory();
const css = await resolver.loadThemeCSS('graphite', 'dark');
```

**Integration:**
```typescript
// apps/web/src/App.tsx
<ThemeProvider
  themeResolver={resolver}  // ← New prop, replaces registryUrl/registryData
>
```

**Resolution Chain:**
1. Try disk read via `ThemeResolver` (Desktop/Web)
2. Fallback to `embeddedThemes` (Bundled CSS modules)
3. Fallback to `fetch()` (Web only, for remote themes)

**Pros:**
- ✅ Complete solution (disk + embedded + remote)
- ✅ Supports custom themes from directory
- ✅ Clean API (single `themeResolver` prop)
- ✅ Extensible for future (install, uninstall, scan)

**Cons:**
- ❌ Largest API change
- ❌ Requires new class implementation
- ❌ Breaking change if removing old props

---

## Recommended Approach

### Phase 1: Quick Fix (Option B) — 30 min

Implement CSS modules support in `@mks2508/shadcn-basecoat-theme-manager`:

```typescript
// New prop in ThemeProvider
interface ThemeProviderProps {
  bundledCSS?: Record<string, { light: string; dark: string }>;
}

// In ThemeManager.applyTheme()
const cssContent = this.bundledCSS?.[themeName]?.[mode];
if (cssContent) {
  // Use inline CSS, skip fetch
  cssVariables = this.extractCSSVariables(cssContent);
} else {
  // Fall back to fetch
  const response = await fetch(cssPath);
  // ...
}
```

### Phase 2: Full Solution (Option C) — 4-6h

Implement `ThemeResolver` class with env var support:

```bash
MKS_MC_THEMES_DIR=/path/to/themes
MKS_MC_THEMES_REGISTRY={THEMES_DIR}/registry.json
```

Add Settings UI for theme directory configuration.

---

## Open Questions

1. **CSS inline format:** Should we use `modes.*` directly (discriminated by content) or explicit `inlineCSS` field?
2. **Backward compatibility:** Should we keep `registryUrl`/`registryData` alongside new `themeResolver` prop?
3. **CSS metadata parsing:** Do we need CSS comment parsing (`/* @theme: ... */`) or is JSON registry sufficient?
4. **Env var names:** Are `MKS_MC_THEMES_DIR` and `MKS_MC_THEMES_REGISTRY` good names?

---

## Related Files

- `packages/theme-manager-core/src/core/theme-manager.ts` — `applyTheme()` method (line 281-320)
- `packages/theme-manager-core/src/core/theme-registry.ts` — `ThemeConfig` interface (line 7-44)
- `packages/theme-manager-react/src/index.tsx` — `ThemeProvider` component (line 57-235)

---

## Next Steps

1. **Decide on Option A vs Option B** for embedded CSS format
2. **Implement Phase 1** in `@mks2508/shadcn-basecoat-theme-manager`
3. **Publish v4.3.0** with embedded CSS support
4. **Update mission-control** to use CSS modules for core themes
5. **Plan Phase 2** implementation (ThemeResolver class)
