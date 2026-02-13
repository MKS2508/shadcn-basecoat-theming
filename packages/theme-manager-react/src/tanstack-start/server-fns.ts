"use server"

/**
 * TanStack Start server functions for cookie-based theme persistence.
 *
 * These use `createServerFn` from `@tanstack/react-start` and are only
 * usable in TanStack Start projects.
 *
 * @module tanstack-start/server-fns
 */

import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

/**
 * Read theme and mode from request cookies (server-side).
 *
 * @returns An object with `theme` and `mode` strings.
 */
export const getThemeFromCookie = createServerFn({ method: 'GET' }).handler(async () => {
  const theme = getCookie('theme-current') || 'default';
  const mode = getCookie('theme-mode') || 'auto';
  return { theme, mode };
});

/**
 * Write theme and mode to response cookies (server-side).
 *
 * @param data - Object with `theme` and `mode` to persist.
 */
export const setThemeInCookie = createServerFn({ method: 'POST' })
  .inputValidator((data: { theme: string; mode: string }) => data)
  .handler(async ({ data }) => {
    const oneYear = 60 * 60 * 24 * 365;
    setCookie('theme-current', data.theme, { maxAge: oneYear, sameSite: 'lax', path: '/' });
    setCookie('theme-mode', data.mode, { maxAge: oneYear, sameSite: 'lax', path: '/' });
    return { success: true };
  });
