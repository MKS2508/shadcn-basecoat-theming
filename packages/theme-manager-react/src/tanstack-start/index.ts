/**
 * TanStack Start integration for theme management.
 *
 * Re-exports all generic SSR utilities from `../ssr` plus TanStack Start
 * specific server functions that use `createServerFn` and `getCookie`.
 *
 * @module tanstack-start
 */

// Re-export everything from the generic SSR subpath
export {
  ThemeSSRHead,
  ThemeSSRStyle,
  SSRThemeProvider,
  useSSRTheme,
  generateFOUCScript,
} from '../ssr';
export type {
  IThemeSSRHeadProps,
  IThemeSSRStyleProps,
  ISSRThemeProviderProps,
  ISSRThemeContextValue,
  IFOUCScriptConfig,
  ThemeConfig,
} from '../ssr';

// TanStack Start specific server functions
export { getThemeFromCookie, setThemeInCookie } from './server-fns';
export { getThemeConfigForSSR, getAvailableThemesForSSR } from './server-registry';
export { useServerTheme } from './ssr-hooks';
