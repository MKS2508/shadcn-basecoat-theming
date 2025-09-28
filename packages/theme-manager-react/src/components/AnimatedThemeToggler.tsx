import React, { memo, useCallback, useState, useEffect } from 'react';
import { useTheme } from '../index';
import { ThemeToggler } from './primitives/ThemeToggler';
import type { ThemeSelection, Resolved, Direction } from './primitives/ThemeToggler';

// Helper para detectar tema del sistema
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface AnimatedThemeTogglerProps {
  direction?: Direction;
  onImmediateChange?: (theme: ThemeSelection) => void;
  children?: (state: {
    effective: ThemeSelection;
    resolved: Resolved;
    toggleTheme: (theme: ThemeSelection) => void;
    isAnimating: boolean;
  }) => React.ReactNode;
}

/**
 * Wrapper que integra animate-ui ThemeToggler con el sistema de theme management
 * Maneja tanto cambios de modo (light/dark/system) como animaciones de transición
 */
export const AnimatedThemeToggler: React.FC<AnimatedThemeTogglerProps> = memo(({
  direction = 'ltr',
  onImmediateChange,
  children
}) => {
  const { themeManager, currentMode, setTheme, currentTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Convertir currentMode a formato esperado por animate-ui
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (currentMode === 'auto') {
      return getSystemTheme();
    }
    return currentMode as 'light' | 'dark';
  };

  // Convertir modo a ThemeSelection para animate-ui
  const getThemeSelection = (): ThemeSelection => {
    if (currentMode === 'auto') return 'system';
    return currentMode as 'light' | 'dark';
  };

  const handleThemeChange = useCallback(async (theme: ThemeSelection) => {
    if (!themeManager) return;
    
    setIsAnimating(true);
    
    try {
      // Llamar el callback inmediato si está proporcionado
      onImmediateChange?.(theme);
      
      // Convertir theme selection a modo interno
      const mode = theme === 'system' ? 'auto' : theme;
      
      // Aplicar el cambio de tema
      await setTheme(currentTheme, mode);
      
    } catch (error) {
      console.error('Error changing theme:', error);
    } finally {
      // Dar tiempo para que las animaciones terminen
      setTimeout(() => setIsAnimating(false), 750);
    }
  }, [themeManager, setTheme, currentTheme, onImmediateChange]);

  if (!themeManager) {
    return null;
  }

  return (
    <ThemeToggler
      theme={getThemeSelection()}
      resolvedTheme={getEffectiveTheme()}
      setTheme={handleThemeChange}
      direction={direction}
      onImmediateChange={onImmediateChange}
    >
      {(state) => {
        if (children) {
          return children({
            ...state,
            isAnimating
          });
        }
        
        // Componente por defecto si no se proporcionan children
        return (
          <button
            onClick={() => state.toggleTheme(state.effective === 'light' ? 'dark' : 'light')}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background w-10 h-10 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Current theme: ${state.effective}. Click to toggle theme.`}
            title={`Current theme: ${state.effective}`}
            disabled={isAnimating}
          >
            <span className="text-base">
              {state.resolved === 'light' ? '☀️' : '🌙'}
            </span>
          </button>
        );
      }}
    </ThemeToggler>
  );
});

AnimatedThemeToggler.displayName = 'AnimatedThemeToggler';

export default AnimatedThemeToggler;