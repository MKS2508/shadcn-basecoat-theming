import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeManager } from '@mks2508/shadcn-basecoat-theme-manager';

interface ThemeContextType {
  themeManager: ThemeManager | null;
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  availableThemes: Array<{ name: string; label: string }>;
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  isInitialized: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeManager: null,
  currentTheme: 'default',
  currentMode: 'auto',
  availableThemes: [],
  setTheme: async () => {},
  isInitialized: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const [availableThemes, setAvailableThemes] = useState<Array<{ name: string; label: string }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initThemeManager = async () => {
      try {
        console.log('🚀 Initializing ThemeManager...');
        
        // Remove theme loading class to prevent FOUC
        document.body.classList.add('theme-loading');
        
        const manager = new ThemeManager();
        await manager.init();
        
        setThemeManager(manager);
        setCurrentTheme(manager.getCurrentTheme());
        setCurrentMode(manager.getCurrentMode());
        setAvailableThemes(manager.getAvailableThemes());
        setIsInitialized(true);
        
        // Remove loading state
        document.body.classList.remove('theme-loading');
        
        console.log('✅ ThemeManager initialized');
        console.log('Current theme:', manager.getCurrentTheme());
        console.log('Current mode:', manager.getCurrentMode());
        console.log('Available themes:', manager.getAvailableThemes());
        
      } catch (error) {
        console.error('❌ Failed to initialize ThemeManager:', error);
        document.body.classList.remove('theme-loading');
      }
    };

    initThemeManager();
  }, []);

  const handleSetTheme = async (theme: string, mode?: 'light' | 'dark' | 'auto') => {
    if (!themeManager) return;
    
    try {
      await themeManager.setTheme(theme, mode);
      setCurrentTheme(themeManager.getCurrentTheme());
      setCurrentMode(themeManager.getCurrentMode());
      
      console.log(`🎨 Theme changed to: ${theme} (${themeManager.getCurrentMode()})`);
    } catch (error) {
      console.error('❌ Failed to set theme:', error);
    }
  };

  const contextValue: ThemeContextType = {
    themeManager,
    currentTheme,
    currentMode,
    availableThemes,
    setTheme: handleSetTheme,
    isInitialized,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}