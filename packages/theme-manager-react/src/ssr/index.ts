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

// Animated theme hooks + pre-built components (3.8.5 parity with classic stack).
// useAnimatedSSRTheme is the SSR twin of useAnimatedTheme; SSRThemeSelect /
// SSRModeToggle are pre-built selectors that work under SSRThemeProvider.
export { useAnimatedSSRTheme } from './useAnimatedSSRTheme';
export type { AnimationPreset, Direction, IAnimatedThemeOptions } from './useAnimatedSSRTheme';
export { ANIMATION_PRESETS, DIRECTIONAL_PRESETS, DIRECTION_OPTIONS } from './useAnimatedSSRTheme';
export { SSRThemeSelect, SSRModeToggle } from './components';
export type {
  ISSRThemeSelectProps,
  ISSRModeToggleProps,
  ISSRThemeSelectIcons,
  ISSRModeToggleIcons,
  SSRThemeIconType,
} from './components';
// NOTE: AnimationSettings is intentionally NOT re-exported here. It lives in
// the classic entry and imports `lucide-react` (decorative preset icons), so
// exposing it from the SSR barrel would drag the classic chunk (and its
// `lucide-react` import) into every SSR consumer. SSR consumers that want the
// settings panel import it from the classic entry `@mks2508/theme-manager-react`
// instead (where `lucide-react` is an expected optional peerDep).
