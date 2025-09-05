import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Check, Search, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeSelectorProps {
  onThemeManagement?: () => void;
  onFontSettings?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  onThemeManagement,
  onFontSettings,
}) => {
  const { themeManager, isLoaded } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>('Default');
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!themeManager || !isLoaded) return;

    const loadThemes = () => {
      try {
        console.log('🔍 [ThemeSelector] Loading available themes...');
        
        const themes = themeManager.getAvailableThemes();
        const currentThemeId = themeManager.getCurrentTheme();
        
        console.log('🔍 [ThemeSelector] Found themes:', themes.length);
        console.log('🔍 [ThemeSelector] Current theme:', currentThemeId);
        
        setAvailableThemes(themes);
        
        // Update current theme label
        const currentThemeData = themes.find((theme: any) => theme.id === currentThemeId);
        if (currentThemeData) {
          setCurrentTheme(currentThemeData.label || currentThemeData.name || currentThemeData.id);
        }
        
      } catch (error) {
        console.error('Failed to load available themes:', error);
        setAvailableThemes([]);
      }
    };

    loadThemes();
    
    // Listen for theme changes (if ThemeCore supports it)
    const handleThemeChange = (themeData: any) => {
      console.log('🎯 [ThemeSelector] Theme changed:', themeData);
      loadThemes(); // Reload themes and update current
    };

    // Try to set up theme change listener if available
    if (window.ThemeCore?.onThemeChange) {
      window.ThemeCore.onThemeChange(handleThemeChange);
    }

    // Listen for theme installations
    const handleThemeInstalled = () => {
      console.log('🎯 [ThemeSelector] Theme installed, reloading...');
      loadThemes();
    };

    window.addEventListener('theme-installed', handleThemeInstalled);
    
    return () => {
      window.removeEventListener('theme-installed', handleThemeInstalled);
    };
    
  }, [themeManager, isLoaded]);

  const selectTheme = (themeId: string) => {
    if (!themeManager) return;
    
    console.log('🎯 [ThemeSelector] Selecting theme:', themeId);
    
    try {
      // Apply theme
      themeManager.setTheme(themeId);
      
      // Update UI
      const selectedTheme = availableThemes.find(theme => theme.id === themeId);
      if (selectedTheme) {
        setCurrentTheme(selectedTheme.label || selectedTheme.name || selectedTheme.id);
      }
      
      // Close popover
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  if (!isLoaded) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <div className="relative">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            className="justify-between min-w-40"
          >
            <span className="flex items-center gap-2">
              <span>{currentTheme}</span>
              <div className="w-px h-4 bg-border" />
              <ChevronDown className="h-4 w-4" />
            </span>
          </Button>
        </Popover.Trigger>

        <Popover.Content 
          className="w-80 p-0 bg-popover border border-border rounded-md shadow-md z-50"
          align="end"
        >
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
                      {isActive && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
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
                <Search className="mr-2 h-4 w-4" />
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
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default ThemeSelector;