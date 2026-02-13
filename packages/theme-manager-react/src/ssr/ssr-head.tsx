/**
 * SSR Head Component - Framework-agnostic theme head injection.
 *
 * Combines {@link ThemeSSRStyle} (CSS variables) with FOUC prevention
 * and SSR metadata into a single composable `<head>` fragment.
 * Works with any React SSR framework.
 *
 * @module ssr/ssr-head
 */

import { ThemeSSRStyle, type IThemeSSRStyleProps } from './ssr-style';
import { generateFOUCScript, type IFOUCScriptConfig } from '@mks2508/shadcn-basecoat-theme-manager';

/** Props for {@link ThemeSSRHead}. */
export interface IThemeSSRHeadProps {
  /** Current theme name (e.g. `'synthwave84'`). */
  theme: string;
  /** Current mode preference. */
  mode: 'light' | 'dark' | 'auto';
  /** CSS custom properties from the theme's CSS file. */
  cssVars: Record<string, string>;
  /** Optional font family overrides. */
  fonts?: IThemeSSRStyleProps['fonts'];
  /**
   * Whether to inject the FOUC prevention inline script.
   * @default true
   */
  injectFOUCScript?: boolean;
  /**
   * Configuration for the FOUC script.
   * Defaults to cookie-based storage for SSR compatibility.
   */
  foucConfig?: IFOUCScriptConfig;
}

/**
 * Render theme-related `<head>` elements for SSR.
 *
 * Outputs:
 * 1. `<style>` with CSS variables (via {@link ThemeSSRStyle})
 * 2. Inline FOUC prevention `<script>` (optional)
 * 3. Hidden JSON metadata for client-side hydration
 *
 * @param props - Theme data, mode, and FOUC configuration.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * <head>
 *   <ThemeSSRHead
 *     theme="synthwave84"
 *     mode="dark"
 *     cssVars={vars}
 *     foucConfig={{ storageType: 'cookie' }}
 *   />
 * </head>
 *
 * // TanStack Start __root.tsx
 * <head>
 *   <ThemeSSRHead theme={theme} mode={mode} cssVars={vars} />
 * </head>
 * ```
 */
export function ThemeSSRHead({
  theme,
  mode,
  cssVars,
  fonts,
  injectFOUCScript = true,
  foucConfig = { storageType: 'cookie' },
}: IThemeSSRHeadProps) {
  const effectiveMode = mode === 'auto' ? 'light' : mode;

  return (
    <>
      <ThemeSSRStyle cssVars={cssVars} {...(fonts ? { fonts } : {})} />

      {injectFOUCScript && (
        <script
          id="theme-fouc-prevention"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: generateFOUCScript(foucConfig),
          }}
        />
      )}

      <script
        id="theme-ssr-data"
        type="application/json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            theme,
            mode,
            effectiveMode,
            hasCSSVars: Object.keys(cssVars).length > 0,
          }),
        }}
      />
    </>
  );
}
