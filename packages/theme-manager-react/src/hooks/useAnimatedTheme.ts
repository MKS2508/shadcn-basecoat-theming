import { useCallback, useRef } from 'react';
import { useTheme } from '../index';
import {
  animateThemeChange,
  type AnimationPreset,
  type Direction,
  type IAnimatedThemeOptions,
} from './animate-transition';

export type { AnimationPreset, Direction, IAnimatedThemeOptions } from './animate-transition';
export { ANIMATION_PRESETS, DIRECTIONAL_PRESETS, DIRECTION_OPTIONS } from './animate-transition';

/**
 * Classic-context hook that wraps {@link useTheme} with animated theme
 * changes via the View Transitions API.
 *
 * Returns the full classic context (`{...ctx}`) with `setTheme` replaced by
 * an animated version. The animation core lives in {@link animateThemeChange}
 * (framework-agnostic) and is shared with `useAnimatedSSRTheme`.
 *
 * @param options - Preset/direction/duration overrides.
 * @returns The classic context with an animated `setTheme`.
 */
export function useAnimatedTheme(options?: IAnimatedThemeOptions) {
  const ctx = useTheme();
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
