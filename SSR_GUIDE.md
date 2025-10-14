# SSR Compatibility Guide

The Theme Manager is now fully compatible with Server-Side Rendering (SSR) frameworks like Next.js, Remix, and others.

## Overview

All theme management packages now include SSR-safe implementations that:
- ✅ Prevent `window`/`document` access on server
- ✅ Provide mock instances for server-side rendering
- ✅ Include proper hydration safety
- ✅ Handle client-side initialization gracefully

## Usage Examples

### Next.js App Router

```typescript
// app/layout.tsx
import { ThemeProvider } from '@mks2508/theme-manager-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="default" defaultMode="auto">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@mks2508/theme-manager-react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="default" defaultMode="auto">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### Remix

```typescript
// app/root.tsx
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ThemeProvider } from '@mks2508/theme-manager-react';

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```

## Core Features

### 1. SSR-Safe Initialization

The system automatically detects server vs client environments:

```typescript
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

// Safe to call on server and client
const themeCore = await ThemeCore.init({
  registryPath: '/themes/registry.json',
  debug: false
});

// Returns mock instance on server, real instance on client
```

### 2. React Provider with SSR Support

```typescript
import { useTheme } from '@mks2508/theme-manager-react';

function ThemeSwitcher() {
  const {
    currentTheme,
    currentMode,
    setTheme,
    initialized,
    isServer,
    loading,
    error
  } = useTheme();

  if (isServer || !initialized || loading) {
    return <div>Loading themes...</div>;
  }

  if (error) {
    return <div>Theme loading failed: {error}</div>;
  }

  return (
    <select
      value={currentTheme}
      onChange={(e) => setTheme(e.target.value)}
    >
      {/* theme options */}
    </select>
  );
}
```

### 3. SSR-Safe Components

```typescript
import { SSRWrapper, SSRSafe } from '@mks2508/theme-manager-react';

function ThemeSelector() {
  return (
    <div>
      {/* Always rendered, but content is client-only */}
      <SSRWrapper fallback={<div>Loading theme selector...</div>}>
        <ThemeSelectorComponent />
      </SSRWrapper>

      {/* Only rendered on client */}
      <SSRSafe>
        <ClientOnlyThemeUI />
      </SSRSafe>
    </div>
  );
}
```

## FOUC Prevention

The system includes FOUC (Flash of Unstyled Content) prevention:

```typescript
// Add to your HTML head (optional)
<script dangerouslySetInnerHTML={{
  __html: ThemeCore.getFOUCScript()
}} />
```

## Configuration Options

### ThemeProvider Props

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;        // 'default'
  defaultMode?: 'light' | 'dark' | 'auto';  // 'auto'
  registryUrl?: string;        // '/themes/registry.json'
  storageKey?: string;         // 'theme-preference'
  enableTransitions?: boolean; // true
}
```

### ThemeCore Options

```typescript
interface ThemeCoreConfig {
  registryPath?: string;
  themesPath?: string;
  debug?: boolean;

  // FOUC prevention
  fouc?: {
    prevent?: boolean;
    method?: 'auto' | 'inline' | 'programmatic';
    revealDelay?: number;
  };

  // Default configuration
  defaults?: {
    theme?: string;
    mode?: 'auto' | 'light' | 'dark';
    fonts?: {
      sans?: string;
      serif?: string;
      mono?: string;
    };
  };
}
```

## Best Practices

### 1. Initialization

- **Always wrap** theme-dependent components with `SSRWrapper` or `SSRSafe`
- **Check initialization state** before rendering theme UI
- **Handle loading and error states** appropriately

### 2. Performance

- **Debounce theme changes** for better performance
- **Use server-side fallbacks** for initial render
- **Lazy load theme components** when possible

### 3. SEO and Accessibility

- **Theme switching doesn't affect SEO** - themes are cosmetic only
- **Maintain semantic HTML** regardless of theme
- **Test color contrast** for all themes

## Migration from v3.x

If upgrading from v3.x, the changes are minimal:

```typescript
// Before (v3.x)
import { ThemeProvider } from '@mks2508/theme-manager-react';

// After (v4.x) - same import, SSR-safe by default
import { ThemeProvider } from '@mks2508/theme-manager-react';

// Optional: Add SSR wrapper for complex components
import { SSRWrapper } from '@mks2508/theme-manager-react';
```

## Troubleshooting

### Hydration Mismatches

If you encounter hydration errors:

1. **Use SSRWrapper** for client-only content
2. **Check initialization state** before rendering
3. **Avoid theme-dependent initial state**

### Performance Issues

If theme switching is slow:

1. **Enable theme preloading** (automatic in v4.x)
2. **Check network requests** for theme files
3. **Use CSS transitions** for smooth switching

### Server-Side Errors

If you see server-side errors:

1. **Check environment detection** in logs
2. **Verify mock instances** are working
3. **Ensure no direct DOM access** in server code

## Framework-Specific Notes

### Next.js

- ✅ Works with both App Router and Pages Router
- ✅ Compatible with middleware and edge functions
- ✅ Supports static generation and SSR

### Remix

- ✅ Works with both SSR and SSG
- ✅ Compatible with loader and action functions
- ✅ Supports progressive enhancement

### Other Frameworks

The core packages are framework-agnostic:

```typescript
// Works in any SSR framework
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

// React wrapper works in any React SSR app
import { ThemeProvider } from '@mks2508/theme-manager-react';
```

## TypeScript Support

Full TypeScript support with proper types:

```typescript
import { ThemeCore, ThemeManager } from '@mks2508/shadcn-basecoat-theme-manager';
import { ThemeProvider, ThemeContextValue } from '@mks2508/theme-manager-react';

// All props and methods are fully typed
const themeManager: ThemeManager | null = themeCore?.themeManager || null;
```

## Performance Metrics

SSR mode provides these improvements:

- **Server-side**: Zero additional overhead (mock instances)
- **Client-side**: Faster initial render (preloaded themes)
- **Network**: Fewer requests (built-in theme preloading)
- **Memory**: Lower usage (efficient caching)