import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

interface ThemeContextType {
  themeCore: any | null;
  themeManager: any | null;
  fontManager: any | null;
  isLoaded: boolean;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  themeCore: null,
  themeManager: null,
  fontManager: null,
  isLoaded: false,
  error: null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeCore, setThemeCore] = useState<any>(null);
  const [themeManager, setThemeManager] = useState<any>(null);
  const [fontManager, setFontManager] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeThemeCore = async () => {
      try {
        console.log('🎨 Initializing ThemeCore (React)...');
        
        // Single line initialization - all complexity handled by ThemeCore
        const core = await ThemeCore.init();
        
        console.log('✅ ThemeCore initialized successfully:', core);
        console.log('📊 Available managers:', {
          themeManager: !!core.themeManager,
          fontManager: !!core.fontManager,
          themeInstaller: !!core.themeInstaller,
          themeListFetcher: !!core.themeListFetcher
        });

        // Get some stats for debugging
        const availableThemes = core.themeManager.getAvailableThemes();
        console.log('🎨 Available themes:', availableThemes.length);
        
        // Update state
        setThemeCore(core);
        setThemeManager(core.themeManager);
        setFontManager(core.fontManager);
        setIsLoaded(true);
        
      } catch (err: any) {
        console.error('❌ Failed to initialize ThemeCore:', err);
        setError(err.message || 'Failed to initialize ThemeCore');
        setIsLoaded(true);
      }
    };

    initializeThemeCore();
  }, []);

  const contextValue: ThemeContextType = {
    themeCore,
    themeManager,
    fontManager,
    isLoaded,
    error,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;