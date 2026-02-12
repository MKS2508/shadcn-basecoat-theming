import { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimatedTheme, type AnimationPreset } from '@/hooks/use-animated-theme';

interface IAnimationPickerProps {
  onSettingsClick?: () => void;
}

type AnimationDemoProps = {
  preset: AnimationPreset;
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
  duration?: number;
};

/**
 * Simple preview component for animation effect.
 */
function AnimationDemo({ preset, direction = 'ltr', duration = 500 }: AnimationDemoProps) {
  const size = 48;

  return (
    <div className="relative inline-flex items-center justify-center gap-4">
      {/* Background preview circle */}
      <div
        className="size-12 shrink-0 rounded-full border-2 border-border bg-muted/30"
        style={{ width: `${size * 3}px`, height: `${size * 3}px` }}
      >
        <div
          className="size-full rounded-full border-2 border-primary/20"
          style={{
            background: preset === 'crossfade'
              ? 'hsl(0 0% 0% / 80%)'
              : preset === 'diamond'
                ? 'conic-gradient(from_top, transparent, from_bottom, transparent)'
                : preset === 'circle-expand' || preset === 'circle-shrink'
                  ? 'conic-gradient(circle, transparent, circle, transparent)'
                  : preset === 'gif-mask'
                    ? 'conic-gradient(circle, rgba(100,200,255,0.3) 25%, transparent)'
                    : preset === 'slide'
                      ? 'linear-gradient(to_right, transparent, to_left, transparent)'
                      : 'hsl(var(--primary) / 50%)',
          }}
        />

        {/* Icon representing the preset */}
        <div className="absolute inset-0 flex items-center justify-center">
          {preset === 'wipe' && <Palette className="size-4 text-muted-foreground" />}
          {preset === 'circle-expand' && <Sparkles className="size-4 text-yellow-500" />}
          {preset === 'circle-shrink' && <Sparkles className="size-4 text-blue-500" />}
          {preset === 'diamond' && <Sparkles className="size-4 text-purple-500" />}
          {preset === 'crossfade' && <Sparkles className="size-4 text-gray-500" />}
          {preset === 'slide' && <Palette className="size-4 text-muted-foreground" />}
          {preset === 'gif-mask' && <Palette className="size-4 text-pink-500" />}
          {preset === 'none' && <Palette className="size-4 text-muted-foreground" />}
        </div>

        {/* Directional indicators for slide */}
        {(preset === 'slide' || preset === 'wipe') && direction === 'ltr' && (
          <div className="absolute right-2 top-1/2 flex gap-0.5">
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-foreground rounded-full" />
          </div>
        )}
        {(preset === 'slide' || preset === 'wipe') && direction === 'rtl' && (
          <div className="absolute left-2 top-1/2 flex gap-0.5">
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-foreground rounded-full" />
          </div>
        )}
        {(preset === 'slide' || preset === 'wipe') && direction === 'ttb' && (
          <div className="absolute bottom-2 left-1/2 flex gap-0.5">
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-border rounded-full" />
            <div className="w-1.5 h-0.5 bg-foreground rounded-full" />
          </div>
        )}
        {(preset === 'slide' || preset === 'wipe') && direction === 'btt' && (
          <div className="absolute top-2 left-1/2 flex gap-0.5">
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
function AnimationPicker({ onSettingsClick }: IAnimationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<AnimationPreset>('wipe');
  const [direction, setDirection] = useState<'ltr' | 'rtl' | 'ttb' | 'btt'>('ltr');
  const [duration, setDuration] = useState(500);

  const close = () => setIsOpen(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Palette className="size-4" />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={close}
        >
          <div className="bg-card border shadow-lg rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Animation Presets</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={close}
                >
                  Close
                </Button>
              </h2>

            {/* Two-column layout: presets on left, options on right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Presets column */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Presets
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['wipe', 'circle-expand', 'circle-shrink', 'diamond', 'crossfade', 'gif-mask', 'slide', 'none'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPreset(p);
                        setDirection('ltr');
                        setDuration(500);
                      }}
                      className={`flex flex-col gap-3 p-3 rounded-lg border transition-colors hover:bg-accent text-left ${
                        preset === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border hover:bg-accent/50'
                      }`}
                    >
                      <div className="mb-2">
                        <AnimationDemo preset={p} direction={direction} duration={duration} />
                      </div>

                      <div className="flex items-center gap-2">
                        {p === 'wipe' && <Palette className="size-4 shrink-0" />}
                        {p === 'circle-expand' && <Sparkles className="size-4 shrink-0" />}
                        {p === 'circle-shrink' && <Sparkles className="size-4 shrink-0" />}
                        {p === 'diamond' && <Sparkles className="size-4 shrink-0" />}
                        {p === 'crossfade' && <Sparkles className="size-4 shrink-0" />}
                        {p === 'gif-mask' && <Palette className="size-4 shrink-0 text-pink-500" />}
                        {p === 'slide' && <Palette className="size-4 shrink-0" />}
                        {p === 'none' && <Palette className="size-4 shrink-0" />}
                        <span className="capitalize text-sm">{p}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options column */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Options
                </h3>

                {/* Direction selector */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Direction</label>
                  <div className="flex gap-2">
                    {(['ltr', 'rtl'].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDirection(d as any)}
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
