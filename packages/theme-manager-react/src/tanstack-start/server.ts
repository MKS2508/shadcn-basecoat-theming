/**
 * Server-only entry for the TanStack Start integration.
 *
 * Groups the `createServerFn` server functions and the `getCookie`-based
 * server hook so they can be bundled WITHOUT the `"use client"` banner that
 * the client entry carries. Mixing server fns into a `"use client"` module
 * breaks the server/client boundary in TanStack Start.
 *
 * Import as `@mks2508/theme-manager-react/tanstack-start/server` and call
 * these inside `createServerFn` handlers or router `beforeLoad` (server-only).
 *
 * @module tanstack-start/server
 */

export { getThemeFromCookie, setThemeInCookie } from './server-fns';
export { getThemeConfigForSSR, getAvailableThemesForSSR } from './server-registry';
export { useServerTheme } from './ssr-hooks';
