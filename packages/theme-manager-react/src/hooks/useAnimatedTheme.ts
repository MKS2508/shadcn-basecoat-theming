import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '../index';

export type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';

export type AnimationPreset =
  | 'wipe'
  | 'circle-expand'
  | 'circle-shrink'
  | 'diamond'
  | 'crossfade'
  | 'slide'
  | 'gif-mask'
  | 'none';

export interface IAnimatedThemeOptions {
  animation?: AnimationPreset;
  direction?: Direction;
  duration?: number;
}

function resolveMode(mode: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function injectTransitionStyles(css: string): () => void {
  const style = document.createElement('style');
  style.setAttribute('data-theme-transition', '');
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}

function getOrigin(event?: MouseEvent | React.MouseEvent): { x: number; y: number } {
  if (event && 'clientX' in event) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function maxRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
}

const BASE_NO_ANIMATION = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}`;

const OLD_ON_TOP = `
::view-transition-old(root) { z-index: 10; }
::view-transition-new(root) { z-index: 9; }`;

type PresetHandler = (opts: {
  direction: Direction;
  duration: number;
  event?: MouseEvent | React.MouseEvent;
}) => {
  css: string;
  animate: (() => Animation | void) | null;
};

const presets: Record<AnimationPreset, PresetHandler> = {
  wipe: ({ direction, duration }) => {
    const keyframes: Record<Direction, [string, string]> = {
      ltr: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'],
      rtl: ['inset(0 0 0 100%)', 'inset(0 0 0 0)'],
      ttb: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'],
      btt: ['inset(100% 0 0 0)', 'inset(0 0 0 0)'],
    };
    const [from, to] = keyframes[direction];
    return {
      css: BASE_NO_ANIMATION,
      animate: () => {
        document.documentElement.animate(
          { clipPath: [from, to] },
          { duration, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      },
    };
  },

  'circle-expand': ({ duration, event }) => {
    const { x, y } = getOrigin(event);
    const r = maxRadius(x, y);
    return {
      css: BASE_NO_ANIMATION,
      animate: () => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      },
    };
  },

  'circle-shrink': ({ duration, event }) => {
    const { x, y } = getOrigin(event);
    const r = maxRadius(x, y);
    return {
      css: BASE_NO_ANIMATION + OLD_ON_TOP,
      animate: () => {
        document.documentElement.animate(
          { clipPath: [`circle(${r}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`] },
          { duration, easing: 'ease-in-out', pseudoElement: '::view-transition-old(root)' },
        );
      },
    };
  },

  diamond: ({ duration }) => ({
    css: BASE_NO_ANIMATION,
    animate: () => {
      document.documentElement.animate(
        {
          clipPath: [
            'polygon(50% 50%, 50% 50%, 50% 50%)',
            'polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)',
          ],
        },
        { duration, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      );
    },
  }),

  crossfade: ({ duration }) => ({
    css: `
::view-transition-old(root) {
  animation: ${duration}ms ease-out both vt-fade-out;
}
::view-transition-new(root) {
  animation: ${duration}ms ease-in both vt-fade-in;
}
@keyframes vt-fade-out { to { opacity: 0; } }
@keyframes vt-fade-in { from { opacity: 0; } }`,
    animate: null,
  }),

  slide: ({ direction, duration }) => {
    const axis = direction === 'ltr' || direction === 'rtl' ? 'X' : 'Y';
    const outSign = direction === 'ltr' || direction === 'ttb' ? '-' : '';
    const inSign = direction === 'ltr' || direction === 'ttb' ? '' : '-';
    return {
      css: `
::view-transition-old(root) {
  animation: ${duration}ms ease-in-out both vt-slide-out;
}
::view-transition-new(root) {
  animation: ${duration}ms ease-in-out both vt-slide-in;
}
@keyframes vt-slide-out {
  to { transform: translate${axis}(${outSign}100%); opacity: 0; }
}
@keyframes vt-slide-in {
  from { transform: translate${axis}(${inSign}100%); opacity: 0; }
}`,
      animate: null,
    };
  },

  'gif-mask': ({ duration = 800 }) => {
    return {
      css: BASE_NO_ANIMATION + `
::view-transition-new(root) {
  animation: mask-reveal ${duration}ms cubic-bezier(0.4, 0, 0.2) forwards;
}
@keyframes mask-reveal {
  0% { opacity: 0; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}`,
      animate: () => {
        setTimeout(() => {}, duration + 100);
      },
    };
  },

  none: () => ({
    css: `
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0s !important;
}`,
    animate: null,
  }),
};

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
      const { animation = 'wipe', direction = 'ltr', duration = 500 } = optsRef.current ?? {};
      const effectiveMode = mode ?? ctx.currentMode;

      const applyChanges = async () => {
        await ctx.setTheme(theme, mode);
        flushSync(() => {
          document.documentElement.classList.toggle('dark', resolveMode(effectiveMode) === 'dark');
        });
      };

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion || !document.startViewTransition) {
        await applyChanges();
        return;
      }

      const preset = presets[animation]({ direction, duration, event });
      const cleanupStyles = injectTransitionStyles(preset.css);

      const transition = document.startViewTransition(applyChanges);

      await transition.ready;
      const jsAnimation = preset.animate?.() as Animation | undefined;

      await Promise.all([
        transition.finished,
        jsAnimation?.finished ?? Promise.resolve(),
      ]);

      cleanupStyles();
    },
    [ctx],
  );

  return { ...ctx, setTheme: setThemeAnimated };
}

export const ANIMATION_PRESETS: readonly AnimationPreset[] = [
  'wipe',
  'circle-expand',
  'circle-shrink',
  'diamond',
  'crossfade',
  'slide',
  'gif-mask',
  'none',
] as const;

export const DIRECTIONAL_PRESETS = new Set<AnimationPreset>(['slide', 'wipe']);
export const DIRECTION_OPTIONS: readonly Direction[] = ['ltr', 'rtl', 'ttb', 'btt'] as const;
