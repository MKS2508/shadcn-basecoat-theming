/**
 * Server-side Theme Registry Reader
 * Reads theme configurations dynamically from registry.json without hardcoding
 */

import { createServerFn } from '@tanstack/react-start';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  description: string;
  modes: {
    light?: string;
    dark?: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  config: {
    radius: string;
  };
}

interface ThemeRegistry {
  version: string;
  lastUpdated: string;
  themes: ThemeConfig[];
}

/**
 * Extract CSS variables from CSS file content
 */
function extractCSSVariables(cssContent: string): Record<string, string> {
  const vars: Record<string, string> = {};

  const rootBlockMatch = cssContent.match(/:root\s*{([^}]*)}/s);
  if (!rootBlockMatch) {
    return vars;
  }

  const rootContent = rootBlockMatch[1];
  const varPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;

  let match;
  while ((match = varPattern.exec(rootContent)) !== null) {
    const [, varName, varValue] = match;
    vars[varName] = varValue.trim();
  }

  return vars;
}

/**
 * Get theme configuration from registry
 */
export const getThemeConfigForSSR = createServerFn({ method: 'POST' })
  .handler(async (data) => {
    'use server';

    const { theme = 'default', mode = 'light' } = data as {
      theme?: string;
      mode?: 'light' | 'dark'
    };

    try {
      const registryPath = join(process.cwd(), 'public', 'themes', 'registry.json');
      const registryContent = await readFile(registryPath, 'utf-8');
      const registry: ThemeRegistry = JSON.parse(registryContent);

      const themeConfig = registry.themes.find(t => t.id === theme || t.name === theme);

      if (!themeConfig) {
        console.warn(`Theme "${theme}" not found in registry, using default`);
        return {
          theme: 'default',
          mode,
          config: null,
          cssVars: {},
          error: `Theme "${theme}" not found`
        };
      }

      const cssFilePath = themeConfig.modes[mode as 'light' | 'dark'];
      if (!cssFilePath) {
        console.warn(`Mode "${mode}" not available for theme "${theme}"`);
        return {
          theme: themeConfig.id,
          mode,
          config: themeConfig,
          cssVars: {},
          error: `Mode "${mode}" not available`
        };
      }

      const fullCSSPath = join(process.cwd(), 'public', cssFilePath);
      const cssContent = await readFile(fullCSSPath, 'utf-8');
      const cssVars = extractCSSVariables(cssContent);

      return {
        theme: themeConfig.id,
        mode,
        config: themeConfig,
        cssVars,
        fonts: themeConfig.fonts,
        radius: themeConfig.config.radius
      };

    } catch (error) {
      console.error('Failed to read theme config for SSR:', error);
      return {
        theme: 'default',
        mode: 'light',
        config: null,
        cssVars: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

/**
 * Get available themes list for SSR
 */
export const getAvailableThemesForSSR = createServerFn({ method: 'GET' })
  .handler(async () => {
    'use server';

    try {
      const registryPath = join(process.cwd(), 'public', 'themes', 'registry.json');
      const registryContent = await readFile(registryPath, 'utf-8');
      const registry: ThemeRegistry = JSON.parse(registryContent);

      return {
        success: true,
        themes: registry.themes.map(t => ({
          id: t.id,
          name: t.name,
          label: t.label,
          description: t.description,
          modes: Object.keys(t.modes)
        }))
      };
    } catch (error) {
      console.error('Failed to read themes registry for SSR:', error);
      return {
        success: false,
        themes: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
