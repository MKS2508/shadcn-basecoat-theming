import React, { useState, useEffect, memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';
import { Button } from './ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ModeToggle: React.FC = memo(() => {
  const { themeManager } = useTheme();
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    if (!themeManager) return;

    // Get initial mode
    const mode = themeManager.getCurrentMode?.() || 'auto';
    setCurrentMode(mode);

    // Listen for mode changes using ThemeCore events
    const handleModeChange = (data: any) => {
      console.log('🌓 [ModeToggle] Mode changed:', data);
      setCurrentMode(data.mode || data.effectiveMode || 'auto');
    };

    // Use ThemeCore event system when available
    ThemeCore.onThemeChange && ThemeCore.onThemeChange(handleModeChange);

    return () => {
      // Cleanup if needed
    };
  }, [themeManager]);

  const toggleMode = async () => {
    if (!themeManager?.toggleMode) return;

    try {
      console.log('🔄 [ModeToggle] Toggling mode...');
      await themeManager.toggleMode();
      
      const newMode = themeManager.getCurrentMode?.() || 'auto';
      setCurrentMode(newMode);
      
      console.log(`✅ [ModeToggle] Switched to mode: ${newMode}`);
    } catch (error) {
      console.error('❌ [ModeToggle] Error toggling mode:', error);
    }
  };

  if (!themeManager) {
    return null; // Don't render if ThemeCore isn't ready
  }

  const Icon = currentMode === 'light' ? Sun : currentMode === 'dark' ? Moon : Monitor;
  const modeLabels = {
    light: 'Light mode',
    dark: 'Dark mode', 
    auto: 'System mode'
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleMode}
      aria-label={`Switch to next theme mode (current: ${modeLabels[currentMode]})`}
      title={`Current: ${modeLabels[currentMode]}. Click to cycle through modes.`}
      className="w-10 h-10 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
});

ModeToggle.displayName = 'ModeToggle';

export default ModeToggle;