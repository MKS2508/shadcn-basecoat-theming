/**
 * Clean useTheme hook - direct access to ThemeCore
 * No context, no state, just clean API access
 */
import { 
  ThemeCore, 
  type ThemeManager, 
  type FontManager, 
  type ThemeInstaller 
} from '@mks2508/shadcn-basecoat-theme-manager';

interface UseThemeReturn {
  themeManager: ThemeManager | null;
  fontManager: FontManager | null;
  installer: ThemeInstaller | null;
  isLoaded: boolean;
}

export function useTheme(): UseThemeReturn {
  // Direct access to ThemeCore managers - always ready since initialized in main.tsx
  const themeManager = ThemeCore.getManager();
  const fontManager = ThemeCore.getFontManager();
  const installer = ThemeCore.getInstaller();
  
  return {
    themeManager,
    fontManager,
    installer,
    isLoaded: !!themeManager && !!fontManager && !!installer,
  };
}

export default useTheme;