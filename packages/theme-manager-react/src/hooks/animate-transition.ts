/**
 * Framework-agnostic theme-change animation core.
 *
 * Extracted from `useAnimatedTheme` so the classic (`useTheme`) and SSR
 * (`useSSRTheme`) hooks share a single implementation. Pure DOM + View
 * Transitions API; no React context. The only framework piece is
 * `flushSync` from `react-dom`, required so the pending state update paints
 * synchronously inside the `startViewTransition` callback (otherwise the
 * transition captures a stale snapshot).
 *
 * @module hooks/animate-transition
 */

import { flushSync } from 'react-dom';
import type { MouseEvent as ReactMouseEvent } from 'react';

/** Direction of directional presets (`wipe`, `slide`). */
export type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';

/** Available animation presets for theme/mode transitions. */
export type AnimationPreset =
  | 'wipe'
  | 'circle-expand'
  | 'circle-shrink'
  | 'diamond'
  | 'crossfade'
  | 'slide'
  | 'gif-mask'
  | 'none';

/** Options for {@link animateThemeChange} / `useAnimatedTheme`. */
export interface IAnimatedThemeOptions {
  animation?: AnimationPreset;
  direction?: Direction;
  duration?: number;
}

/**
 * Minimal theme API the animator needs from any provider context.
 *
 * Both `ThemeContextValue` (classic) and `ISSRThemeContextValue` (SSR)
 * satisfy this shape — the animator only reads the current mode and calls
 * `setTheme`.
 */
export interface IThemeAnimationApi {
  /** Current mode preference (used to resolve `'auto'` + as fallback). */
  currentMode: 'light' | 'dark' | 'auto';
  /** Switch theme and/or mode. Provided by the active provider context. */
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
}

/** Resolve `'auto'` to a concrete light/dark using the OS preference. */
function resolveMode(mode: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Inject a `<style data-theme-transition>` with the preset CSS and return a
 * cleanup that removes it.
 */
function injectTransitionStyles(css: string): () => void {
  const style = document.createElement('style');
  style.setAttribute('data-theme-transition', '');
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}

/** Origin for radial presets: the click point if available, else viewport center. */
function getOrigin(event?: MouseEvent | ReactMouseEvent): { x: number; y: number } {
  if (event && 'clientX' in event) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Max radius from a point to any viewport corner (for circle presets). */
function maxRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
}

/** Shared CSS disabling the default cross-fade so presets own the animation. */
const BASE_NO_ANIMATION = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}`;

/** A preset produces the CSS to inject and an optional JS-driven animation. */
type PresetHandler = (opts: {
  direction: Direction;
  duration: number;
  event?: MouseEvent | ReactMouseEvent;
}) => {
  css: string;
  animate: (() => Animation | void) | null;
};

/** Map of preset id → CSS/animation factory. */
const presets: Record<AnimationPreset, PresetHandler> = {
  wipe: ({ direction, duration }) => {
    const fromClip: Record<Direction, string> = {
      ltr: 'inset(0 100% 0 0)',
      rtl: 'inset(0 0 0 100%)',
      ttb: 'inset(0 0 100% 0)',
      btt: 'inset(100% 0 0 0)',
    };
    return {
      css: `
::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
::view-transition-new(root) {
  animation: ${duration}ms ease-in-out both vt-wipe-${direction};
  mix-blend-mode: normal;
}
@keyframes vt-wipe-${direction} {
  from { clip-path: ${fromClip[direction]}; }
  to   { clip-path: inset(0 0 0 0); }
}`,
      animate: null,
    };
  },

  'circle-expand': ({ duration, event }) => {
    const { x, y } = getOrigin(event);
    const r = maxRadius(x, y);
    return {
      css: `
::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
::view-transition-new(root) {
  animation: ${duration}ms ease-in-out both vt-circle-expand;
  mix-blend-mode: normal;
}
@keyframes vt-circle-expand {
  from { clip-path: circle(0px at ${x}px ${y}px); }
  to   { clip-path: circle(${r}px at ${x}px ${y}px); }
}`,
      animate: null,
    };
  },

  'circle-shrink': ({ duration, event }) => {
    const { x, y } = getOrigin(event);
    const r = maxRadius(x, y);
    return {
      css: `
::view-transition-new(root) { animation: none; mix-blend-mode: normal; z-index: 9; }
::view-transition-old(root) {
  animation: ${duration}ms ease-in-out both vt-circle-shrink;
  mix-blend-mode: normal;
  z-index: 10;
}
@keyframes vt-circle-shrink {
  from { clip-path: circle(${r}px at ${x}px ${y}px); }
  to   { clip-path: circle(0px at ${x}px ${y}px); }
}`,
      animate: null,
    };
  },

  diamond: ({ duration }) => ({
    css: `
::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
::view-transition-new(root) {
  animation: ${duration}ms ease-in-out both vt-diamond;
  mix-blend-mode: normal;
}
@keyframes vt-diamond {
  from { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
  to   { clip-path: polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%); }
}`,
    animate: null,
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

/**
 * Apply a theme/mode change animated via the View Transitions API.
 *
 * Falls back to an instant swap when the user has `prefers-reduced-motion`
 * set or the API is unavailable. `api` is whatever the calling hook's
 * context exposes (classic or SSR).
 *
 * @param args.api - Theme context subset (currentMode + setTheme).
 * @param args.options - Preset/direction/duration overrides.
 * @param args.theme - Target theme id.
 * @param args.mode - Target mode (defaults to current).
 * @param args.event - Originating pointer event (for radial presets).
 * @returns Resolves once the transition has finished and styles are cleaned up.
 */
export async function animateThemeChange(args: {
  api: IThemeAnimationApi;
  options?: IAnimatedThemeOptions;
  theme: string;
  mode?: 'light' | 'dark' | 'auto';
  event?: MouseEvent | ReactMouseEvent;
}): Promise<void> {
  const { api, options, theme, mode, event } = args;
  const { animation = 'wipe', direction = 'ltr', duration = 500 } = options ?? {};
  const effectiveMode = mode ?? api.currentMode;

  const applyChanges = async () => {
    await api.setTheme(theme, mode);
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
}

/** All preset ids in display order. */
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

/** Presets that honour the `direction` option. */
export const DIRECTIONAL_PRESETS = new Set<AnimationPreset>(['slide', 'wipe']);

/** All direction options. */
export const DIRECTION_OPTIONS: readonly Direction[] = ['ltr', 'rtl', 'ttb', 'btt'] as const;
