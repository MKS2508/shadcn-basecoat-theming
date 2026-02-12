import React, { type JSX } from 'react';
import { Palette, Sparkles, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AnimationPreset, Direction } from '../hooks/useAnimatedTheme';
import { ANIMATION_PRESETS, DIRECTIONAL_PRESETS, DIRECTION_OPTIONS } from '../hooks/useAnimatedTheme';

export interface IAnimationSettings {
  preset: AnimationPreset;
  direction: Direction;
  duration: number;
}

export interface IAnimationSettingsProps {
  settings: IAnimationSettings;
  onSettingsChange: (settings: IAnimationSettings) => void;
}

interface IPresetMeta {
  icon: JSX.Element;
  background: string;
}

const PRESET_META: Record<AnimationPreset, IPresetMeta> = {
  wipe:            { icon: <Palette  className="size-3.5 text-muted-foreground" />, background: 'hsl(var(--primary) / 50%)' },
  'circle-expand': { icon: <Sparkles className="size-3.5 text-yellow-500" />,      background: 'radial-gradient(circle, hsl(var(--primary) / 30%), transparent)' },
  'circle-shrink': { icon: <Sparkles className="size-3.5 text-blue-500" />,        background: 'radial-gradient(circle, hsl(var(--primary) / 30%), transparent)' },
  diamond:         { icon: <Sparkles className="size-3.5 text-purple-500" />,       background: 'conic-gradient(from 45deg, hsl(var(--primary) / 20%), transparent)' },
  crossfade:       { icon: <Sparkles className="size-3.5 text-gray-500" />,         background: 'hsl(0 0% 0% / 80%)' },
  'gif-mask':      { icon: <Palette  className="size-3.5 text-pink-500" />,         background: 'radial-gradient(circle, rgba(100,200,255,0.3) 25%, transparent)' },
  slide:           { icon: <Palette  className="size-3.5 text-muted-foreground" />, background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 30%))' },
  none:            { icon: <Palette  className="size-3.5 text-muted-foreground" />, background: 'hsl(var(--primary) / 50%)' },
};

function AnimationDemo({ preset }: { preset: AnimationPreset }) {
  const meta = PRESET_META[preset];

  return (
    <div className="size-7 shrink-0 rounded-full border border-border bg-muted/30 relative">
      <div
        className="size-full rounded-full border border-primary/20"
        style={{ background: meta.background }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {meta.icon}
      </div>
    </div>
  );
}

export const AnimationSettings: React.FC<IAnimationSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { preset, direction, duration } = settings;

  const update = (partial: Partial<IAnimationSettings>) =>
    onSettingsChange({ ...settings, ...partial });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="size-4" />
          Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ANIMATION_PRESETS.map((p) => {
            const isSelected = preset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update({ preset: p, direction: 'ltr', duration: 500 })}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:bg-accent/50"
                )}
              >
                <AnimationDemo preset={p} />
                <span className="capitalize leading-tight">{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 sm:w-48">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Options</h3>

        {DIRECTIONAL_PRESETS.has(preset) && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Direction</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DIRECTION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ direction: d })}
                  className={cn(
                    "p-1.5 rounded-md border text-xs uppercase font-medium transition-colors",
                    direction === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-border hover:bg-accent/50"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Duration: {duration}ms
          </label>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={duration}
            onChange={(e) => update({ duration: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
};

AnimationSettings.displayName = 'AnimationSettings';
