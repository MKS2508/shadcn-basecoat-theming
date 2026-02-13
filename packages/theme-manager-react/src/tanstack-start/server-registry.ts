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
 * @param css - Raw CSS file content.
 * @returns Map of `--property: value` pairs.
 */
function extractCSSVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/g);
  if (!rootMatch) return vars;

  for (const block of rootMatch) {
    const content = block.replace(/:root\s*\{/, '').replace(/\}/, '');
    const lines = content.split(';').filter(l => l.trim());
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (prop.startsWith('--')) vars[prop] = val;
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
        cssVars = extractCSSVariables(cssContent);
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
