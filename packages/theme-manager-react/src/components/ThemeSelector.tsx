import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTheme } from '../index';
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';
import { Button, Check, SearchIcon, SettingsIcon, Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverPopup } from '@mks2508/mks-ui';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeSelectorProps {
  onThemeManagement?: () => void;
  onFontSettings?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = memo(({
  onThemeManagement,
  onFontSettings,
}) => {
  const { themeManager, initialized, currentTheme, themes } = useTheme();
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentThemeLabel, setCurrentThemeLabel] = useState<string>('Default');

  useEffect(() => {
    if (!themeManager || !initialized) return;

    const loadThemes = () => {
      try {
        const themesList = themes || [];
        const currentThemeId = currentTheme;

        setAvailableThemes(themesList);

        const currentThemeData = themesList.find((theme: any) => theme.id === currentThemeId || theme.name === currentThemeId);
        if (currentThemeData) {
          setCurrentThemeLabel(currentThemeData.label || currentThemeData.name || currentThemeData.id);
        }
      } catch (error) {
        console.error('Failed to load available themes:', error);
        setAvailableThemes([]);
      }
    };

    loadThemes();

    const handleThemeChange = () => loadThemes();
    const handleThemeInstalled = () => loadThemes();
    const handleThemeUninstalled = () => loadThemes();

    ThemeCore.onThemeChange && ThemeCore.onThemeChange(handleThemeChange);
    ThemeCore.onThemeInstalled && ThemeCore.onThemeInstalled(handleThemeInstalled);
    ThemeCore.onThemeUninstalled && ThemeCore.onThemeUninstalled(handleThemeUninstalled);

  }, [themeManager]);

  const selectTheme = useCallback((themeId: string) => {
    if (!themeManager) return;

    try {
      themeManager.setTheme(themeId);

      const selectedTheme = availableThemes.find(theme => theme.id === themeId);
      if (selectedTheme) {
        setCurrentThemeLabel(selectedTheme.label || selectedTheme.name || selectedTheme.id);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [themeManager, availableThemes]);

  if (!themeManager) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={<Button variant="outline" className="justify-between min-w-40" />}>
          <span className="flex items-center gap-2">
            <span>{currentThemeLabel}</span>
            <div className="w-px h-4 border" />
            <ChevronDown className="h-4 w-4" />
          </span>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverPositioner side="bottom" align="end">
            <PopoverPopup className="w-80 p-0 bg-background border rounded-md shadow-md z-50">
              {/* Header */}
              <div className="grid gap-1.5 p-4 pb-2 border-b">
                <h4 className="leading-none font-medium">Select Theme</h4>
                <p className="text-muted-foreground text-sm">Choose your preferred theme</p>
              </div>

              {/* Theme List */}
              <div className="p-2 max-h-80 overflow-y-auto">
                {availableThemes.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No themes available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableThemes.map((theme) => {
                      const isActive = theme.id === themeManager?.getCurrentTheme?.();
                      const isBuiltIn = theme.category === 'built-in' || theme.source === 'local';

                      return (
                        <button
                          key={theme.id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => selectTheme(theme.id)}
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <span>{theme.label || theme.name || theme.id}</span>
                            {!isBuiltIn && (
                              <span className="text-xs text-muted-foreground ml-1">(Installed)</span>
                            )}
                          </div>
                          {isActive && <Check className="ml-auto h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      onThemeManagement?.();
                    }}
                  >
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Browse More...
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => {
                      setIsOpen(false);
                      onFontSettings?.();
                    }}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PopoverPopup>
          </PopoverPositioner>
        </PopoverPortal>
      </Popover>
    </div>
  );
});

ThemeSelector.displayName = 'ThemeSelector';

export default ThemeSelector;
