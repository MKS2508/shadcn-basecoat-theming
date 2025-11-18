/**
 * Server functions for theme management in TanStack Start
 */

import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

/**
 * Get theme preference from cookies (server-side)
 */
export const getThemeFromCookie = createServerFn({ method: 'GET' })
  .handler(async () => {
    'use server';

    const theme = getCookie('theme-current') || 'default';
    const mode = getCookie('theme-mode') || 'auto';

    return {
      theme,
      mode
    };
  });

/**
 * Set theme preference in cookies (server-side)
 */
export const setThemeInCookie = createServerFn({ method: 'POST' })
  .handler(async (data) => {
    'use server';

    const { theme, mode } = data as unknown as { theme: string; mode: 'light' | 'dark' | 'auto' };

    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    setCookie('theme-current', theme, {
      expires,
      path: '/',
      sameSite: 'lax'
    });

    setCookie('theme-mode', mode, {
      expires,
      path: '/',
      sameSite: 'lax'
    });

    return { success: true };
  });

