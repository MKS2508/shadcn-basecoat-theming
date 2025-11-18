/**
 * TanStack Start Theme Manager
 * SSR-optimized theme management for TanStack Start applications
 * 100% Dynamic - Zero hardcoded themes
 */

// Main provider and hooks
export { TanStackStartProvider, useTanStackStartTheme, useServerThemePreferences } from './provider';

// Server-side functions
export { getThemeFromCookie, setThemeInCookie } from './server-fns';

// Server-side registry functions (dynamic theme loading)
export { getThemeConfigForSSR, getAvailableThemesForSSR } from './server-registry';

// SSR components
export { ThemeSSRHead } from './ssr-head';
export { ThemeSSRStyle } from './ssr-style';
export { useServerTheme, useServerAvailableThemes, useServerThemeValidation } from './ssr-hooks';

// SSR script generation
export { generateFOUCScript } from './ssr-script';

// Re-export core types for convenience
export type {
  ThemeConfig,
  ThemeModeConfig,
  CachedTheme,
  FontOverrideConfig
} from '@mks2508/shadcn-basecoat-theme-manager';

// Re-export storage adapters
export { CookieStorageAdapter, LocalStorageAdapter } from '@mks2508/shadcn-basecoat-theme-manager';
export type { StorageAdapter } from '@mks2508/shadcn-basecoat-theme-manager';