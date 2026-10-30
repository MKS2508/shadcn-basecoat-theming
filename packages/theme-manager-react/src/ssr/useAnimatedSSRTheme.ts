'use client';

import { useCallback, useRef } from 'react';
import { useSSRTheme } from './ssr-provider';
import {
  animateThemeChange,
  type AnimationPreset,
  type Direction,
  type IAnimatedThemeOptions,
} from '../hooks/animate-transition';

export type { AnimationPreset, Direction, IAnimatedThemeOptions } from '../hooks/animate-transition';
export { ANIMATION_PRESETS, DIRECTIONAL_PRESETS, DIRECTION_OPTIONS } from '../hooks/animate-transition';

/**
 * SSR-context twin of {@link useAnimatedTheme}.
 *
 * Identical shape, but draws its theme API from {@link useSSRTheme}
 * (`SSRThemeProvider` context) instead of `useTheme`, so the animated
 * selector/toggle work under SSR providers without throwing
 * `useTheme debe usarse dentro de ThemeProvider`. The animation core is
 * shared via {@link animateThemeChange}.
 *
 * @param options - Preset/direction/duration overrides.
 * @returns The SSR context with an animated `setTheme`.
 */
export function useAnimatedSSRTheme(options?: IAnimatedThemeOptions) {
  const ctx = useSSRTheme();
  const optsRef = useRef(options);
  optsRef.current = options;

  const setThemeAnimated = useCallback(
    async (
      theme: string,
      mode?: 'light' | 'dark' | 'auto',
      event?: MouseEvent | React.MouseEvent,
    ) => {
      await animateThemeChange({ api: ctx, options: optsRef.current, theme, mode, event });
    },
    [ctx],
  );

  return { ...ctx, setTheme: setThemeAnimated };
}
