'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import type { ThemeSelection } from '@/components/animate-ui/primitives/effects/theme-toggler';
import { buttonVariants } from '@/components/animate-ui/components/buttons/icon';
import { cn } from '@mks2508/mks-ui/react';
import {
  useAnimatedTheme,
  type AnimationPreset,
  type Direction,
} from '@mks2508/theme-manager-react';

/**
 * Resolve display mode to icon shown in button.
 */
function getIcon(mode: ThemeSelection, modes: ThemeSelection[]) {
  if (modes.includes('system') && mode === 'system') return <Monitor />;
  if (mode === 'dark') return <Moon />;
  return <Sun />;
}

type ThemeTogglerButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    modes?: ThemeSelection[];
    animation?: AnimationPreset;
    direction?: Direction;
    duration?: number;
  };

/**
 * Animated theme-mode toggle button with configurable animation presets.
 *
 * Animation options include:
 * - `'wipe'`          — Directional curtain reveal (default)
 * - `'circle-expand'` — Circle grows from click point
 * - `'circle-shrink'`   — Old state shrinks in circle
 * - `'diamond'`        — Diamond polygon wipe from center
 * - `'crossfade'`      — Simple opacity fade
 * - `'slide'`          — Directional slide + fade
 * - `'none'`           — Instant swap, no animation
 */
function ThemeTogglerButton({
  variant = 'default',
  size = 'default',
  modes = ['light', 'dark'],
  animation = 'wipe',
  direction = 'ltr',
  duration = 500,
  onClick,
  className,
  ...props
}: ThemeTogglerButtonProps) {
  const { currentTheme, currentMode, setTheme } = useAnimatedTheme({ animation, direction, duration });

  const [displayMode, setDisplayMode] = React.useState<ThemeSelection>(() =>
    currentMode === 'auto' ? 'system' : currentMode,
  );

  React.useEffect(() => {
    setDisplayMode(currentMode === 'auto' ? 'system' : currentMode);
  }, [currentMode]);

  const handleToggle = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);

      const idx = modes.indexOf(displayMode);
      const next = modes[(idx + 1) % modes.length];
      const nextCoreMode = next === 'system' ? 'auto' : next;

      setDisplayMode(next);
      setTheme(currentTheme, nextCoreMode, e);
    },
    [onClick, modes, displayMode, currentTheme, setTheme, animation, direction, duration],
  );

  return (
    <button
      data-slot="theme-toggler-button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleToggle}
      {...props}
    >
      {getIcon(displayMode, modes)}
    </button>
  );
}

export { ThemeTogglerButton, type ThemeTogglerButtonProps };
