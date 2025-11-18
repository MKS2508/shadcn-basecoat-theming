/**
 * Server-side hooks for TanStack Start theme management
 * These hooks run on the server and can access cookies
 */

import { getCookie } from '@tanstack/react-start/server';

/**
 * Server-side hook to get theme preferences from cookies
 */
export function useServerTheme() {
  try {
    const theme = getCookie('theme-current') || 'default';
    const mode = getCookie('theme-mode') || 'auto';

    // Resolve auto mode (server defaults to light since can't detect system preference)
    const effectiveMode = mode === 'auto' ? 'light' : mode;

    return {
      theme,
      mode,
      effectiveMode: effectiveMode as 'light' | 'dark',
      // Server validation
      isValid: ['default', 'supabase'].includes(theme)
    };
  } catch (error) {
    console.warn('Failed to read theme preferences from cookies:', error);
    return {
      theme: 'default',
      mode: 'auto',
      effectiveMode: 'light',
      isValid: false
    };
  }
}

/**
 * Server-side hook to get available themes
 */
export function useServerAvailableThemes() {
  // This would normally come from the ThemeManager core
  // For now, return hardcoded themes - in production this would be dynamic
  return [
    {
      id: 'default',
      name: 'default',
      label: 'Default',
      modes: ['light', 'dark'],
      description: 'Default shadcn/ui theme'
    },
    {
      id: 'supabase',
      name: 'supabase',
      label: 'Supabase',
      modes: ['light', 'dark'],
      description: 'Supabase inspired theme with green accents'
    }
  ];
}

/**
 * Server-side hook to validate theme/mode combination
 */
export function useServerThemeValidation(theme: string, mode: string) {
  const availableThemes = useServerAvailableThemes();
  const themeConfig = availableThemes.find(t => t.id === theme || t.name === theme);

  if (!themeConfig) {
    return {
      valid: false,
      error: `Theme "${theme}" not found`,
      fallback: {
        theme: 'default',
        mode: 'light'
      }
    };
  }

  const supportedModes = themeConfig.modes;
  let resolvedMode = mode;

  // Handle 'auto' mode resolution (server defaults to light)
  if (mode === 'auto') {
    resolvedMode = 'light';
  }

  if (!supportedModes.includes(resolvedMode)) {
    resolvedMode = supportedModes[0] as 'light' | 'dark';
  }

  return {
    valid: true,
    theme: themeConfig.id,
    mode: resolvedMode as 'light' | 'dark',
    effectiveMode: resolvedMode as 'light' | 'dark'
  };
}