"use server"

/**
 * TanStack Start server functions for reading theme registry on the server.
 *
 * Uses `createServerFn` to read `public/themes/registry.json` and
 * individual theme CSS files from the filesystem.
 *
 * @module tanstack-start/server-registry
 */

import { createServerFn } from '@tanstack/react-start';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Extract CSS custom properties from a CSS string.
 *
 * Matches `:root { … }` blocks and, when `mode` is given, also `.light { … }`
 * / `.dark { … }` blocks — the theme CSS emitted by
 * `shadcn-basecoat-theme-manager` scopes dark-mode vars under `.dark` instead
 * of `:root`, so parsing only `:root` returned `{}` for dark themes and the
 * SSR first paint lost the theme (FOUC). Class-scoped values override `:root`.
 *
 * @param css - Raw CSS file content.
 * @param mode - Active mode whose class-scoped block should also be parsed.
 * @returns Map of `--property: value` pairs.
 */
function extractCSSVariables(
  css: string,
  mode?: 'light' | 'dark',
): Record<string, string> {
  const vars: Record<string, string> = {};
  const selectors = [':root', ...(mode ? [`.${mode}`] : [])];

  for (const selector of selectors) {
    const re = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 'g');
    for (const match of css.matchAll(re)) {
      const lines = match[1].split(';').filter(l => l.trim());
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const prop = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (prop.startsWith('--')) vars[prop] = val;
      }
    }
  }
  return vars;
}

/**
 * Load a theme's full config including CSS variables from the filesystem.
 *
 * @param data - Object with `theme` name and `mode` ('light' | 'dark').
 * @returns Theme config, CSS variables, and font information.
 */
export const getThemeConfigForSSR = createServerFn({ method: 'GET' })
  .inputValidator((data: { theme: string; mode: string }) => data)
  .handler(async ({ data }) => {
    const registryPath = join(process.cwd(), 'public', 'themes', 'registry.json');
    const registryContent = await readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    const themeConfig = registry.themes?.find((t: any) => t.id === data.theme || t.name === data.theme);
    if (!themeConfig) {
      return { theme: data.theme, mode: data.mode, cssVars: {}, fonts: undefined, config: undefined };
    }

    const cssFile = themeConfig.modes?.[data.mode];
    let cssVars: Record<string, string> = {};
    if (cssFile) {
      const cssPath = join(process.cwd(), 'public', cssFile);
      try {
        const cssContent = await readFile(cssPath, 'utf-8');
        cssVars = extractCSSVariables(
          cssContent,
          data.mode === 'light' || data.mode === 'dark' ? data.mode : undefined,
        );
      } catch (_) {
        // CSS file not found — return empty vars
      }
    }

    return {
      theme: data.theme,
      mode: data.mode,
      cssVars,
      fonts: themeConfig.fonts,
      config: themeConfig.config,
    };
  });

/**
 * List all themes available in the server-side registry.
 *
 * @returns Array of theme summaries with id, label, and available modes.
 */
export const getAvailableThemesForSSR = createServerFn({ method: 'GET' }).handler(async () => {
  const registryPath = join(process.cwd(), 'public', 'themes', 'registry.json');
  const registryContent = await readFile(registryPath, 'utf-8');
  const registry = JSON.parse(registryContent);

  return (registry.themes || []).map((t: any) => ({
    id: t.id || t.name,
    label: t.label || t.name,
    modes: Object.keys(t.modes || {}),
  }));
});
