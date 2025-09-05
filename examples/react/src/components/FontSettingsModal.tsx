import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FontSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FontCategory = 'sans' | 'serif' | 'mono';

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { fontManager, isLoaded } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<FontCategory>('sans');
  const [fontsByCategory, setFontsByCategory] = useState<{
    sans: any[];
    serif: any[];
    mono: any[];
  }>({ sans: [], serif: [], mono: [] });
  const [selectedFonts, setSelectedFonts] = useState<{
    sans: string | null;
    serif: string | null;
    mono: string | null;
  }>({ sans: null, serif: null, mono: null });

  // Load fonts and configuration
  useEffect(() => {
    if (!fontManager || !isLoaded) return;

    const loadFonts = async () => {
      try {
        // Import font catalog functions
        const { getFontsByCategory } = await import('@mks2508/shadcn-basecoat-theme-manager');
        
        // Load fonts by category
        const sansFonts = getFontsByCategory('sans');
        const serifFonts = getFontsByCategory('serif');
        const monoFonts = getFontsByCategory('mono');
        
        setFontsByCategory({
          sans: sansFonts || [],
          serif: serifFonts || [],
          mono: monoFonts || [],
        });
        
        // Load current configuration
        const config = fontManager.getOverrideConfiguration();
        setIsEnabled(fontManager.isOverrideEnabled());
        setSelectedFonts(config.fonts);
        
      } catch (error) {
        console.error('Failed to load fonts:', error);
      }
    };

    if (open) {
      loadFonts();
    }
  }, [fontManager, isLoaded, open]);

  const handleToggleOverride = async (enabled: boolean) => {
    if (!fontManager) return;

    try {
      if (enabled) {
        await fontManager.enableOverride();
      } else {
        await fontManager.disableOverride();
      }
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Failed to toggle font override:', error);
    }
  };

  const handleFontSelect = (fontId: string, category: FontCategory) => {
    if (!fontManager) return;

    try {
      fontManager.setFontOverride(category, fontId);
      setSelectedFonts(prev => ({
        ...prev,
        [category]: fontId,
      }));
    } catch (error) {
      console.error('Failed to set font override:', error);
    }
  };

  const handleReset = async () => {
    if (!fontManager) return;

    try {
      await fontManager.resetOverrides();
      const config = fontManager.getOverrideConfiguration();
      setSelectedFonts(config.fonts);
    } catch (error) {
      console.error('Failed to reset font overrides:', error);
    }
  };

  const getPreviewText = (category: FontCategory) => {
    return category === 'mono' 
      ? 'const code = "example";' 
      : 'The quick brown fox jumps over the lazy dog';
  };

  const separateFontsByType = (fonts: any[]) => {
    const systemFonts = fonts.filter(f => f.category === 'system');
    const googleFonts = fonts.filter(f => f.category === 'google-fonts');
    return { systemFonts, googleFonts };
  };

  const renderFontCategory = (category: FontCategory) => {
    const fonts = fontsByCategory[category];
    const { systemFonts, googleFonts } = separateFontsByType(fonts);
    
    return (
      <div className={cn("space-y-6", currentCategory !== category && "hidden")}>
        {systemFonts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              System Fonts
            </h3>
            <div className="space-y-2">
              {systemFonts.map((font) => {
                const isSelected = selectedFonts[category] === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    className={cn(
                      "text-left w-full p-3 rounded-md border transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleFontSelect(font.id, category)}
                    style={{ fontFamily: `${font.family}, ${font.fallback}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{font.name}</span>
                      {isSelected && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-75">
                      {getPreviewText(category)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {googleFonts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Google Fonts
            </h3>
            <div className="space-y-2">
              {googleFonts.map((font) => {
                const isSelected = selectedFonts[category] === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    className={cn(
                      "text-left w-full p-3 rounded-md border transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleFontSelect(font.id, category)}
                    style={{ fontFamily: `${font.family}, ${font.fallback}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{font.name}</span>
                      {isSelected && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-75">
                      {getPreviewText(category)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-lg font-semibold text-foreground">Font Settings</h2>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggleOverride}
                />
                <Label>Override fonts</Label>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            {!isEnabled ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm">Enable font override to customize fonts</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 h-full">
                {/* Category tabs */}
                <div className="border-b border-border">
                  <div className="flex space-x-1" role="tablist">
                    {(['sans', 'serif', 'mono'] as FontCategory[]).map((category) => (
                      <button
                        key={category}
                        className={cn(
                          "px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors",
                          currentCategory === category
                            ? "border-primary text-primary bg-background"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setCurrentCategory(category)}
                      >
                        {category === 'sans' && 'Sans Serif'}
                        {category === 'serif' && 'Serif'}
                        {category === 'mono' && 'Monospace'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font options */}
                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                  {renderFontCategory('sans')}
                  {renderFontCategory('serif')}
                  {renderFontCategory('mono')}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/5">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={!isEnabled}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset All
            </Button>
            <div className="flex items-center space-x-3">
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button size="sm">
                  Apply
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default FontSettingsModal;