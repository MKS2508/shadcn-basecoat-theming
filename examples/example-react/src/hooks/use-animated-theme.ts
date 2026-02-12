import { useCallback, useRef } from 'react';
import { useTheme } from '@mks2508/theme-manager-react';
import { flushSync } from 'react-dom';

type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';

type AnimationPreset =
  | 'wipe'
  | 'circle-expand'
  | 'circle-shrink'
  | 'diamond'
  | 'crossfade'
  | 'slide'
  | 'gif-mask'
  | 'none';

interface IAnimatedThemeOptions {
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

const BASE_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}`;

type PresetHandler = (opts: {
  direction: Direction;
  duration: number;
  event?: MouseEvent | React.MouseEvent;
}) => {
  css: string;
  animate: (() => void) | null;
};

const presets: Record<AnimationPreset, PresetHandler> = {
  wipe: ({ direction, duration }) => {
    const keyframes: Record<Direction, [string, string]> = {
      ltr: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'],
      rtl: ['inset(0 0 0 100%)', 'inset(0 0 0 0)'],
      ttb: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'],
      btt: ['inset(100% 0 0 0)', 'inset(100% 0 0 0)'],
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

  circleExpand: ({ duration, event }) => {
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

  circleShrink: ({ duration, event }) => {
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
  }),

  gifMask: ({ url, duration = 800 }) => {
    const maskId = `liquid-mask-${Math.random().toString(36).slice(2, 9)}`;

    return {
      css: BASE_CSS + `
::view-transition-new(root) {
  mask-image: url('${url}');
  mask-size: 0;
  mask-repeat: no-repeat;
  mask-position: center;
  animation: mask-reveal ${duration}ms cubic-bezier(0.4, 0, 0.2) forwards,
}
@keyframes mask-reveal {
  0% { mask-size: 0; }
  25% { mask-size: 50vmax 50vmax; }
  50% { mask-size: 100vmax 100vmax; }
  75% { mask-size: 150vmax 150vmax; }
  90% { mask-size: 200vmax 200vmax; }
  100% { mask-size: 250vmax 250vmax; }
}
@keyframes mask-dissolve {
  to { mask-size: 0; }
}`,
      animate: () => {
        const root = document.documentElement;

        // Create SVG filter for liquid blur effect
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg') as SVGElement;
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.cssText = `
          #${maskId} { filter: url('data:image/svg+xml;utf8,') }
          #blur { filter: url('data:image/svg+xml;utf8,') }
          rect { fill: white; }
          #mask { mask: url(#${maskId}); }
        `;

        const defs = document.createElementNS(svgNS, 'defs');
        const filter = document.createElementNS(svgNS, 'filter');
        filter.setAttribute('id', maskId);
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');

        const blur = document.createElementNS(svgNS, 'feGaussianBlur');
        blur.setAttribute('stdDeviation', '2');
        blur.setAttribute('x', '50%');
        blur.setAttribute('y', '50%');
        blur.setAttribute('width', '200%');
        blur.setAttribute('height', '200%');

        const mask = document.createElementNS(svgNS, 'mask');
        mask.setAttribute('id', maskId);
        mask.setAttribute('x', '-50%');
        mask.setAttribute('y', '-50%');
        mask.setAttribute('width', '200%');
        mask.setAttribute('height', '200%');
        mask.setAttribute('mask', 'url(#blur)');

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', '-50%');
        rect.setAttribute('y', '-50%');
        rect.setAttribute('width', '200%');
        rect.setAttribute('height', '200%');

        defs.appendChild(filter);
        defs.appendChild(blur);
        defs.appendChild(mask);
        svg.appendChild(defs);
        svg.appendChild(filter);
        svg.appendChild(mask);
        svg.appendChild(rect);

        // Inject SVG as data URI for mask-image
        root.appendChild(svg);

        // Remove SVG after animation completes
        setTimeout(() => {
          svg.remove();
        }, duration + 100);
      },
    };
  }),

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

      // Apply theme + toggle .dark class
      const applyChanges = async () => {
        await ctx.setTheme(theme, mode);
        flushSync(() => {
          document.documentElement.classList.toggle('dark', resolveMode(effectiveMode) === 'dark');
        });
      };

      // Respect prefers-reduced-motion
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion || !document.startViewTransition) {
        await applyChanges();
        return;
      }

      // Build preset CSS + optional JS animation
      const preset = presets[animation]({ direction, duration, event });
      const cleanupStyles = injectTransitionStyles(preset.css);

      const transition = document.startViewTransition(applyChanges);

      await transition.ready;
      preset.animate?.();

      // Clean up injected styles after transition finishes
      transition.finished.then(cleanupStyles, cleanupStyles);
    },
    [ctx],
  );

  return { ...ctx, setTheme: setThemeAnimated };
}

export type { AnimationPreset, Direction, IAnimatedThemeOptions };
