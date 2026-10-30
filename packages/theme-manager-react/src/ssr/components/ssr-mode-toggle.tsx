'use client';

import * as React from 'react';
import { Button } from '@mks2508/mks-ui/react';
import {
  useAnimatedSSRTheme,
  type AnimationPreset,
  type Direction,
} from '../useAnimatedSSRTheme';
import type { SSRThemeIconType } from './types';

/** Display mode shown in the toggle (maps core `'auto'` → `'system'`). */
type Mode = 'light' | 'dark' | 'system';

/** Icons rendered by {@link SSRModeToggle} for each mode. All optional. */
export interface ISSRModeToggleIcons {
  /** Shown for `'light'` (also the fallback when others are absent). */
  Sun?: SSRThemeIconType;
  /** Shown for `'dark'`. */
  Moon?: SSRThemeIconType;
  /** Shown for `'system'`/`'auto'`. */
  Monitor?: SSRThemeIconType;
}

/** Pick the icon for a display mode from the injected `icons`. */
function getIcon(mode: Mode, modes: Mode[], icons: ISSRModeToggleIcons): React.ReactNode {
  if (modes.includes('system') && mode === 'system') {
    const { Monitor } = icons;
    return Monitor ? <Monitor className="size-4" /> : null;
  }
  if (mode === 'dark') {
    const { Moon } = icons;
    return Moon ? <Moon className="size-4" /> : null;
  }
  const { Sun } = icons;
  return Sun ? <Sun className="size-4" /> : null;
}

export interface ISSRModeToggleProps {
  /** Modes cycled on click. @default ['light','dark'] */
  modes?: Mode[];
  /** Transition preset applied when toggling. @default 'wipe' */
  animation?: AnimationPreset;
  /** Direction for directional presets. @default 'ltr' */
  direction?: Direction;
  /** Transition duration in ms. @default 500 */
  duration?: number;
  /** Extra class on the toggle button. */
  className?: string;
  /**
   * Icons rendered for each mode. Inject your own (e.g. `lucide-animated`) so
   * the package has no hard `lucide-react` dependency; absent icons render as
   * nothing and the button keeps working (it cycles modes regardless).
   */
  icons?: ISSRModeToggleIcons;
}

/**
 * Pre-built animated mode toggle for the SSR stack.
 *
 * SSR twin of the classic starter's `ThemeTogglerButton`: a single icon
 * button that cycles through `modes` (light/dark/system) with a View
 * Transitions animation via {@link useAnimatedSSRTheme}. Safe under
 * `SSRThemeProvider`.
 *
 * Icons are injected via {@link ISSRModeToggleProps.icons} (no hard
 * `lucide-react` import) — pass `lucide-animated`/`lucide-react`/custom SVGs
 * from the consumer.
 *
 * @param props - See {@link ISSRModeToggleProps}.
 * @example
 * ```tsx
 * <SSRModeToggle
 *   modes={['light', 'dark', 'system']}
 *   animation="circle-expand"
 *   icons={{ Sun, Moon, Monitor }}
 * />
 * ```
 */
export function SSRModeToggle({
  modes = ['light', 'dark'],
  animation = 'wipe',
  direction = 'ltr',
  duration = 500,
  className,
  icons,
}: ISSRModeToggleProps) {
  const { currentTheme, currentMode, setTheme } = useAnimatedSSRTheme({ animation, direction, duration });

  const displayMode: Mode = currentMode === 'auto' ? 'system' : currentMode;
  const [mode, setMode] = React.useState<Mode>(displayMode);
  React.useEffect(() => {
    setMode(currentMode === 'auto' ? 'system' : currentMode);
  }, [currentMode]);

  const handleToggle = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const idx = modes.indexOf(mode);
      const next = modes[(idx + 1) % modes.length];
      const nextCoreMode: 'light' | 'dark' | 'auto' = next === 'system' ? 'auto' : next;
      setMode(next);
      void setTheme(currentTheme, nextCoreMode, e);
    },
    [modes, mode, currentTheme, setTheme],
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleToggle}
      title={`Mode: ${displayMode} (click to cycle)`}
    >
      {getIcon(mode, modes, icons ?? {})}
    </Button>
  );
}
