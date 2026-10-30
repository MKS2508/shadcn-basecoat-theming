'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@mks2508/mks-ui/react';
import {
  useAnimatedSSRTheme,
  type AnimationPreset,
  type Direction,
} from '../useAnimatedSSRTheme';
import type { SSRThemeIconType } from './types';

/** Icons rendered by {@link SSRThemeSelect}. */
export interface ISSRThemeSelectIcons {
  /** Trigger (dropdown opener) icon. */
  palette?: SSRThemeIconType;
}

export interface ISSRThemeSelectProps {
  /** Transition preset applied when switching themes. @default 'wipe' */
  animation?: AnimationPreset;
  /** Direction for directional presets. @default 'ltr' */
  direction?: Direction;
  /** Transition duration in ms. @default 500 */
  duration?: number;
  /** Extra class on the trigger button. */
  className?: string;
  /**
   * Icons rendered in the selector. Inject your own (e.g. `lucide-animated`)
   * so the package has no hard `lucide-react` dependency; an absent trigger
   * icon is omitted (the `sr-only` label keeps the button accessible).
   */
  icons?: ISSRThemeSelectIcons;
}

/**
 * Pre-built animated theme selector for the SSR stack.
 *
 * SSR twin of the classic starter's `ThemeSelector`: a dropdown
 * (`@mks2508/mks-ui` DropdownMenu) that swaps themes with a View Transitions
 * animation via {@link useAnimatedSSRTheme}. Safe under `SSRThemeProvider`
 * (uses `useSSRTheme`, not `useTheme`).
 *
 * The trigger icon is injected via {@link ISSRThemeSelectProps.icons} (no hard
 * `lucide-react` import) — pass a `lucide-animated`/`lucide-react`/custom SVG
 * `Palette` from the consumer.
 *
 * @param props - See {@link ISSRThemeSelectProps}.
 * @example
 * ```tsx
 * <SSRThemeSelect
 *   animation="circle-expand"
 *   duration={700}
 *   icons={{ palette: PaletteIcon }}
 * />
 * ```
 */
export function SSRThemeSelect({
  animation = 'wipe',
  direction = 'ltr',
  duration = 500,
  className,
  icons,
}: ISSRThemeSelectProps) {
  const { currentTheme, themes, setTheme } = useAnimatedSSRTheme({ animation, direction, duration });
  const Palette = icons?.palette;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className={className} />}>
        {Palette ? <Palette className="size-4" /> : null}
        <span className="sr-only">Select theme</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Themes</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentTheme}
            onValueChange={(value) => void setTheme(value)}
          >
            {themes.map((t) => (
              <DropdownMenuRadioItem key={t.id} value={t.id}>
                <span
                  className="size-3 shrink-0 rounded-full border border-foreground/15"
                  style={{ backgroundColor: t.preview?.primary ?? 'currentColor' }}
                />
                {t.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
