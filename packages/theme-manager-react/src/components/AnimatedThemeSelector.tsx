import React, { memo, useCallback, useState, useEffect } from 'react';
import { useTheme } from '../index';
import { ThemeToggler } from './primitives/ThemeToggler';
import type { ThemeSelection, Resolved, Direction } from './primitives/ThemeToggler';

// Helper para detectar tema del sistema
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface AnimatedThemeSelectorProps {
  targetTheme: string;
  direction?: Direction;
  onThemeChange?: (theme: string) => void;
  children?: (state: {
    effective: ThemeSelection;
    resolved: Resolved;
    switchToTheme: () => void;
    isAnimating: boolean;
    isCurrentTheme: boolean;
  }) => React.ReactNode;
}

/**
 * Selector animado para cambio completo de temas (no solo light/dark)
 * Combina animate-ui para animaciones con theme manager para lógica de negocio
 */
export const AnimatedThemeSelector: React.FC<AnimatedThemeSelectorProps> = memo(({
  targetTheme,
  direction = 'ltr',
  onThemeChange,
  children
}) => {
  const { themeManager, currentMode, currentTheme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Verificar si este es el tema actual
  const isCurrentTheme = currentTheme === targetTheme;
  
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

  const handleThemeSwitch = useCallback(async () => {
    if (!themeManager || isCurrentTheme || isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      // Llamar el callback si está proporcionado
      onThemeChange?.(targetTheme);
      
      // Aplicar el cambio de tema completo (mantener el modo actual)
      await setTheme(targetTheme, currentMode);
      
    } catch (error) {
      console.error('Error switching theme:', error);
    } finally {
      // Dar tiempo para que las animaciones terminen
      setTimeout(() => setIsAnimating(false), 750);
    }
  }, [themeManager, targetTheme, currentTheme, currentMode, setTheme, isCurrentTheme, isAnimating, onThemeChange]);

  // Handler interno para coordinar con animate-ui
  const handleAnimatedChange = useCallback(async (theme: ThemeSelection) => {
    // Para theme switching completo, ignoramos el cambio de modo
    // Solo queremos las animaciones pero mantenemos la lógica de theme switching
    await handleThemeSwitch();
  }, [handleThemeSwitch]);

  if (!themeManager) {
    return null;
  }

  return (
    <ThemeToggler
      theme={getThemeSelection()}
      resolvedTheme={getEffectiveTheme()}
      setTheme={handleAnimatedChange}
      direction={direction}
      onImmediateChange={() => {
        // Solo activamos el estado de animación inmediatamente
        setIsAnimating(true);
      }}
    >
      {(state) => {
        if (children) {
          return children({
            ...state,
            switchToTheme: handleThemeSwitch,
            isAnimating,
            isCurrentTheme
          });
        }
        
        // Componente por defecto si no se proporcionan children
        return (
          <button
            onClick={handleThemeSwitch}
            className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isCurrentTheme 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'border-input bg-background'
            }`}
            aria-label={`Switch to ${targetTheme} theme`}
            title={`Switch to ${targetTheme} theme`}
            disabled={isAnimating || isCurrentTheme}
          >
            {targetTheme}
            {isCurrentTheme && <span className="ml-2">✓</span>}
          </button>
        );
      }}
    </ThemeToggler>
  );
});

AnimatedThemeSelector.displayName = 'AnimatedThemeSelector';

export default AnimatedThemeSelector;