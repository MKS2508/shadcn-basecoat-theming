/**
 * TanStack Start integration — CLIENT entry.
 *
 * Re-exports the generic SSR client utilities (`../ssr`) plus the 3.8.6 SSR
 * animated-theme additions (`useAnimatedSSRTheme`, `SSRThemeSelect`,
 * `SSRModeToggle`). This chunk is built WITH the `"use client"` banner.
 * `AnimationSettings` is intentionally NOT re-exported here (it imports
 * `lucide-react`; see `../ssr/index.ts`).
 *
 * Server functions (`getThemeFromCookie`, `getThemeConfigForSSR`, etc.) live
 * in the separate `./tanstack-start/server` entry — import them from there to
 * keep the server/client boundary clean.
 *
 * @module tanstack-start
 */

// Generic SSR client utilities + types
export {
  ThemeSSRHead,
  ThemeSSRStyle,
  SSRThemeProvider,
  useSSRTheme,
  generateFOUCScript,
  useAnimatedSSRTheme,
  SSRThemeSelect,
  SSRModeToggle,
  ANIMATION_PRESETS,
  DIRECTIONAL_PRESETS,
  DIRECTION_OPTIONS,
} from '../ssr';
export type {
  IThemeSSRHeadProps,
  IThemeSSRStyleProps,
  ISSRThemeProviderProps,
  ISSRThemeContextValue,
  IFOUCScriptConfig,
  ThemeConfig,
  AnimationPreset,
  Direction,
  IAnimatedThemeOptions,
  ISSRThemeSelectProps,
  ISSRModeToggleProps,
  ISSRThemeSelectIcons,
  ISSRModeToggleIcons,
  SSRThemeIconType,
} from '../ssr';
