import { useState, type JSX } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { Button } from '@mks2508/mks-ui/react';
import type { AnimationPreset, Direction } from '@/hooks/use-animated-theme';

/* ─── Preset metadata ─── */

interface IPresetMeta {
  icon: JSX.Element;
  background: string;
}

const PRESET_META: Record<AnimationPreset, IPresetMeta> = {
  wipe:            { icon: <Palette  className="size-4 text-muted-foreground" />, background: 'hsl(var(--primary) / 50%)' },
  'circle-expand': { icon: <Sparkles className="size-4 text-yellow-500" />,      background: 'radial-gradient(circle, hsl(var(--primary) / 30%), transparent)' },
  'circle-shrink': { icon: <Sparkles className="size-4 text-blue-500" />,        background: 'radial-gradient(circle, hsl(var(--primary) / 30%), transparent)' },
  diamond:         { icon: <Sparkles className="size-4 text-purple-500" />,       background: 'conic-gradient(from 45deg, hsl(var(--primary) / 20%), transparent)' },
  crossfade:       { icon: <Sparkles className="size-4 text-gray-500" />,         background: 'hsl(0 0% 0% / 80%)' },
  'gif-mask':      { icon: <Palette  className="size-4 text-pink-500" />,         background: 'radial-gradient(circle, rgba(100,200,255,0.3) 25%, transparent)' },
  slide:           { icon: <Palette  className="size-4 text-muted-foreground" />, background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 30%))' },
  none:            { icon: <Palette  className="size-4 text-muted-foreground" />, background: 'hsl(var(--primary) / 50%)' },
};

const ANIMATION_PRESETS = Object.keys(PRESET_META) as AnimationPreset[];

const DIRECTIONAL_PRESETS = new Set<AnimationPreset>(['slide', 'wipe']);

const DIRECTION_OPTIONS: readonly Direction[] = ['ltr', 'rtl', 'ttb', 'btt'] as const;

const DIRECTION_POSITION: Record<Direction, string> = {
  ltr: 'absolute right-2 top-1/2',
  rtl: 'absolute left-2 top-1/2',
  ttb: 'absolute bottom-2 left-1/2',
  btt: 'absolute top-2 left-1/2',
};

/* ─── Components ─── */

interface IAnimationPickerProps {
  onSettingsClick?: () => void;
}

/**
 * Simple preview component for animation effect.
 */
function AnimationDemo({ preset, direction = 'ltr' }: { preset: AnimationPreset; direction?: Direction }) {
  const meta = PRESET_META[preset];

  return (
    <div className="relative inline-flex items-center justify-center gap-4">
      <div
        className="size-12 shrink-0 rounded-full border-2 border-border bg-muted/30"
        style={{ width: '144px', height: '144px' }}
      >
        <div
          className="size-full rounded-full border-2 border-primary/20"
          style={{ background: meta.background }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {meta.icon}
        </div>

        {DIRECTIONAL_PRESETS.has(preset) && (
          <div className={`flex gap-0.5 ${DIRECTION_POSITION[direction]}`}>
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-foreground rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Animation picker dialog with live preview and all available options.
 */
function AnimationPicker({ onSettingsClick: _onSettingsClick }: IAnimationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<AnimationPreset>('wipe');
  const [direction, setDirection] = useState<Direction>('ltr');
  const [duration, setDuration] = useState(500);

  const close = () => setIsOpen(false);

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setIsOpen(true)}>
        <Palette className="size-4" />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="bg-card border shadow-lg rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Animation Presets</h2>
              <Button variant="ghost" size="sm" onClick={close}>
                Close
              </Button>
            </div>

            {/* Two-column layout: presets on left, options on right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Presets column */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ANIMATION_PRESETS.map((p) => {
                    const isSelected = preset === p;
                    const meta = PRESET_META[p];
                    return (
                      <button
                        key={p}
                        onClick={() => { setPreset(p); setDirection('ltr'); setDuration(500); }}
                        className={`flex flex-col gap-3 p-3 rounded-lg border transition-colors hover:bg-accent text-left ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted border-border hover:bg-accent/50'
                        }`}
                      >
                        <div className="mb-2">
                          <AnimationDemo preset={p} direction={direction} />
                        </div>
                        <div className="flex items-center gap-2">
                          {meta.icon}
                          <span className="capitalize text-sm">{p}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options column */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Options</h3>

                {/* Direction selector */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Direction</label>
                  <div className="flex gap-2">
                    {DIRECTION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDirection(d)}
                        className={`flex-1 p-2 rounded-lg border transition-colors ${
                          direction === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted border-border'
                        }`}
                      >
                        <div className="text-xs uppercase font-medium">{d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration slider */}
                <div>
                  <label className="text-sm text-muted-foreground">
                    Duration: {duration}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent"
                  />
                </div>

                {/* Test button */}
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      if (preset === 'circle-expand' || preset === 'circle-shrink') {
                        alert('Click anywhere on the page to see circle animation!');
                      }
                    }}
                    className="w-full"
                  >
                    Test Animation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { AnimationPicker };
