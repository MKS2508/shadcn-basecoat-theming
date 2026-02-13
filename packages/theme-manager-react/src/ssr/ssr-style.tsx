/**
 * SSR Style Component - Framework-agnostic CSS variable injection.
 *
 * Renders a `<style>` tag with theme CSS variables for instant server-side
 * rendering without FOUC. Works with any React SSR framework (Next.js,
 * TanStack Start, Remix, etc.).
 *
 * @module ssr/ssr-style
 */

/** Props for {@link ThemeSSRStyle}. */
export interface IThemeSSRStyleProps {
  /** CSS custom properties to inject (e.g. `{ '--background': '0 0% 100%' }`). */
  cssVars: Record<string, string>;
  /** Optional font family overrides. */
  fonts?: {
    sans?: string;
    serif?: string;
    mono?: string;
  };
}

/**
 * Generate inline CSS string from CSS variables and font overrides.
 *
 * @param cssVars - CSS custom properties map.
 * @param fonts - Optional font family overrides.
 * @returns CSS string ready for `<style>` injection.
 */
function generateCSSContent(cssVars: Record<string, string>, fonts?: IThemeSSRStyleProps['fonts']): string {
  const cssLines: string[] = [];

  if (Object.keys(cssVars).length > 0) {
    cssLines.push(':root {');
    for (const [key, value] of Object.entries(cssVars)) {
      cssLines.push(`  ${key}: ${value};`);
    }
    cssLines.push('}');
  }

  if (fonts) {
    cssLines.push('');
    cssLines.push(':root {');
    if (fonts.sans) cssLines.push(`  --font-sans: ${fonts.sans};`);
    if (fonts.serif) cssLines.push(`  --font-serif: ${fonts.serif};`);
    if (fonts.mono) cssLines.push(`  --font-mono: ${fonts.mono};`);
    cssLines.push('}');
  }

  return cssLines.join('\n');
}

/**
 * Inject theme CSS variables into a `<style>` tag during SSR.
 *
 * Place this in your document `<head>` so the browser applies theme
 * variables before the first paint.
 *
 * @param props - CSS variables and optional font overrides.
 * @returns A `<style>` element, or `null` if no data to inject.
 *
 * @example
 * ```tsx
 * // In any SSR layout (Next.js, TanStack Start, Remix…)
 * <head>
 *   <ThemeSSRStyle cssVars={cssVars} fonts={{ sans: 'Inter' }} />
 * </head>
 * ```
 */
export function ThemeSSRStyle({ cssVars, fonts }: IThemeSSRStyleProps) {
  if (Object.keys(cssVars).length === 0 && !fonts) {
    return null;
  }

  const cssContent = generateCSSContent(cssVars, fonts);

  return (
    <style
      id="theme-ssr-variables"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: cssContent }}
    />
  );
}
