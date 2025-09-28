import React, { memo, useCallback } from 'react';
import { useTheme } from '../index';
import { Button } from './ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeToggler } from './primitives/ThemeToggler';

// Helper para detectar tema del sistema
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ModeToggle: React.FC = memo(() => {
  const { themeManager, currentMode, setTheme, currentTheme } = useTheme();
  
  // Convertir currentMode a formato esperado por animate-ui
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (currentMode === 'auto') {
      return getSystemTheme();
    }
    return currentMode as 'light' | 'dark';
  };

  // Convertir modo a ThemeSelection para animate-ui
  const getThemeSelection = (): 'light' | 'dark' | 'system' => {
    if (currentMode === 'auto') return 'system';
    return currentMode as 'light' | 'dark';
  };

  const handleThemeChange = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    const mode = theme === 'system' ? 'auto' : theme;
    await setTheme(currentTheme, mode);
  }, [setTheme, currentTheme]);

  if (!themeManager) {
    return null;
  }

  return (
    <ThemeToggler
      theme={getThemeSelection()}
      resolvedTheme={getEffectiveTheme()}
      setTheme={handleThemeChange}
      direction="ltr"
    >
      {({ effective, resolved, toggleTheme }) => {
        const Icon = effective === 'light' ? Sun : effective === 'dark' ? Moon : Monitor;
        const modeLabels = {
          light: 'Light mode',
          dark: 'Dark mode',
          system: 'System mode'
        };

        const handleClick = () => {
          // Cycle through: light -> dark -> system -> light
          const nextTheme = effective === 'light' ? 'dark' : 
                           effective === 'dark' ? 'system' : 'light';
          toggleTheme(nextTheme);
        };

        return (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            aria-label={`Switch to next theme mode (current: ${modeLabels[effective]})`}
            title={`Current: ${modeLabels[effective]}. Click to cycle through modes.`}
            className="w-10 h-10 p-0"
          >
            {React.createElement(Icon as any, { className: "h-4 w-4" })}
          </Button>
        );
      }}
    </ThemeToggler>
  );
});

ModeToggle.displayName = 'ModeToggle';

export default ModeToggle;