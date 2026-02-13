"use server"

/**
 * TanStack Start server-side hooks for reading theme preferences.
 *
 * These use `getCookie` from `@tanstack/react-start/server` and must
 * be called in a server context.
 *
 * @module tanstack-start/ssr-hooks
 */

import { getCookie } from '@tanstack/react-start/server';

/**
 * Read the current theme and mode from request cookies.
 *
 * @returns Resolved theme name and effective mode.
 */
export function useServerTheme() {
  const theme = getCookie('theme-current') || 'default';
  const mode = (getCookie('theme-mode') || 'auto') as 'light' | 'dark' | 'auto';
  const effectiveMode = mode === 'auto' ? 'light' : mode;
  return { theme, mode, effectiveMode };
}
