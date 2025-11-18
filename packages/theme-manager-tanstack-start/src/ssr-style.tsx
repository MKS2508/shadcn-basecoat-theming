/**
 * SSR Style Component - 100% Dynamic CSS Variables Injection
 * NO hardcoding, receives vars from server registry reader
 */

interface ThemeSSRStyleProps {
  cssVars: Record<string, string>;
  fonts?: {
    sans?: string;
    serif?: string;
    mono?: string;
  };
}

/**
 * Generate inline CSS for theme variables
 */
function generateCSSContent(cssVars: Record<string, string>, fonts?: ThemeSSRStyleProps['fonts']): string {
  let cssLines: string[] = [];

  if (Object.keys(cssVars).length > 0) {
    cssLines.push(':root {');
    Object.entries(cssVars).forEach(([key, value]) => {
      cssLines.push(`  ${key}: ${value};`);
    });
    cssLines.push('}');
  }

  if (fonts) {
    cssLines.push('');
    cssLines.push(':root {');
    if (fonts.sans) {
      cssLines.push(`  --font-sans: ${fonts.sans};`);
    }
    if (fonts.serif) {
      cssLines.push(`  --font-serif: ${fonts.serif};`);
    }
    if (fonts.mono) {
      cssLines.push(`  --font-mono: ${fonts.mono};`);
    }
    cssLines.push('}');
  }

  return cssLines.join('\n');
}

/**
 * Component to inject CSS variables in SSR
 * All data comes from registry, zero hardcoding
 */
export function ThemeSSRStyle({ cssVars, fonts }: ThemeSSRStyleProps) {
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
