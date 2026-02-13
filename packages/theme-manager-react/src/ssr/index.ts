/**
 * Framework-agnostic SSR utilities for theme management.
 *
 * Use this subpath (`@mks2508/theme-manager-react/ssr`) in any React SSR
 * framework: Next.js, TanStack Start, Remix, Waku, etc.
 *
 * @module ssr
 */

// Components
export { ThemeSSRHead } from './ssr-head';
export type { IThemeSSRHeadProps } from './ssr-head';
export { ThemeSSRStyle } from './ssr-style';
export type { IThemeSSRStyleProps } from './ssr-style';
export { SSRThemeProvider, useSSRTheme } from './ssr-provider';
export type { ISSRThemeProviderProps, ISSRThemeContextValue } from './ssr-provider';

// Re-export FOUC from core
export { generateFOUCScript } from '@mks2508/shadcn-basecoat-theme-manager';
export type { IFOUCScriptConfig } from '@mks2508/shadcn-basecoat-theme-manager';

// Re-export core types consumers typically need
export type {
  ThemeConfig,
  FontOverride,
} from '@mks2508/shadcn-basecoat-theme-manager';
