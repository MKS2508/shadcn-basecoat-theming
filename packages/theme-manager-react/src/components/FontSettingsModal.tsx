import React, { useState, useEffect } from 'react';
import { useTheme } from '../index';
import { Button, Label, AlertDialog as Dialog, AlertDialogPopup as DialogPopup, AlertDialogTitle as DialogTitle, AlertDialogClose as DialogClose, SettingsIcon, Trash2 } from '@mks2508/mks-ui';
import {
  type FontOverride,
  type FontOption,
  getFontsByCategory,
  FONT_CATEGORIES
} from '@mks2508/shadcn-basecoat-theme-manager';
import { cn } from '../lib/utils';

interface FontSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { fontManager, initialized, setFontOverride } = useTheme();
  const [currentOverrides, setCurrentOverrides] = useState<FontOverride>({ enabled: false, fonts: {} });
  const [availableFonts, setAvailableFonts] = useState<Record<string, FontOption[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load current font overrides and available fonts
  useEffect(() => {
    if (!fontManager || !initialized) return;

    try {
      setIsLoading(true);

      const overrides = fontManager.getOverrideConfiguration();
      const fontsByCategory: Record<string, FontOption[]> = {};
      for (const cat of Object.keys(FONT_CATEGORIES) as Array<'sans' | 'serif' | 'mono'>) {
        fontsByCategory[cat] = getFontsByCategory(cat);
      }

      setCurrentOverrides(overrides);
      setAvailableFonts(fontsByCategory);
    } catch (error) {
      console.error('Failed to load font configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fontManager, initialized]);

  const handleFontChange = (category: 'sans' | 'serif' | 'mono', fontId: string) => {
    if (!fontManager) return;

    console.log(`🔤 [FontSettings] Changing ${category} to ${fontId}`);

    const newOverrides: FontOverride = {
      enabled: true,
      fonts: {
        ...currentOverrides.fonts,
        [category]: fontId
      }
    };

    setCurrentOverrides(newOverrides);
    setFontOverride(category, fontId);
  };

  const handleReset = async () => {
    if (!fontManager) return;

    await fontManager.resetOverrides();
    setCurrentOverrides({ enabled: false, fonts: {} });
  };

  const getCurrentFontId = (category: 'sans' | 'serif' | 'mono'): string => {
    return currentOverrides.fonts[category] || '';
  };

  const getFontName = (category: 'sans' | 'serif' | 'mono', fontId: string): string => {
    const fonts = availableFonts[category];
    const font = fonts?.find(f => f.id === fontId);
    return font?.name || fontId;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogTitle>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-none">Font Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Customize fonts for different text categories
                </p>
              </div>
            </div>
          </DialogTitle>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-primary" />
              <span className="ml-2">Loading fonts...</span>
            </div>
          ) : (
            <>
              {Object.entries(availableFonts).map(([category, fonts]) => {
                const cat = category as 'sans' | 'serif' | 'mono';
                const currentFontId = getCurrentFontId(cat);

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`font-${category}`} className="text-base font-medium capitalize">
                        {category === 'sans' ? 'Sans Serif' : category === 'serif' ? 'Serif' : 'Monospace'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <select
                          id={`font-${category}`}
                          value={currentFontId}
                          onChange={e => handleFontChange(cat, e.target.value)}
                          className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                        >
                          <option value="">Use theme default</option>
                          {fonts.map(font => (
                            <option key={font.id} value={font.id}>
                              {font.name}
                            </option>
                          ))}
                        </select>
                        {currentFontId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFontChange(cat, '')}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {currentFontId && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Current selection:</span>{' '}
                          <span className="text-foreground">
                            {getFontName(cat, currentFontId)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <SettingsIcon className="h-4 w-4" />
              <div>
                <div className="font-medium">Font overrides are</div>
                <div className={cn(
                  "ml-1",
                  currentOverrides.enabled ? "text-primary" : "text-muted-foreground"
                )}>
                  {currentOverrides.enabled ? 'enabled' : 'disabled'}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={!currentOverrides.enabled}
            >
              Reset All
            </Button>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose render={<Button variant="outline" />}>
            Close
          </DialogClose>
        </div>
      </DialogPopup>
    </Dialog>
  );
};

FontSettingsModal.displayName = 'FontSettingsModal';

export default FontSettingsModal;
