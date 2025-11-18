/**
 * SSR Head Component for TanStack Start
 * 100% Dynamic - receives all data from server functions
 */

import { ThemeSSRStyle } from './ssr-style';
import { generateFOUCScript } from './ssr-script';

interface ThemeSSRHeadProps {
  theme: string;
  mode: 'light' | 'dark' | 'auto';
  cssVars: Record<string, string>;
  fonts?: {
    sans?: string;
    serif?: string;
    mono?: string;
  };
  injectFOUCScript?: boolean;
}

export function ThemeSSRHead({
  theme,
  mode,
  cssVars,
  fonts,
  injectFOUCScript = true
}: ThemeSSRHeadProps) {
  const effectiveMode = mode === 'auto' ? 'light' : mode;

  return (
    <>
      <ThemeSSRStyle cssVars={cssVars} {...(fonts ? { fonts } : {})} />

      {injectFOUCScript && (
        <script
          id="theme-fouc-prevention"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: generateFOUCScript('cookie')
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
            hasCSSVars: Object.keys(cssVars).length > 0
          })
        }}
      />
    </>
  );
}