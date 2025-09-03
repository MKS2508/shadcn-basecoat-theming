import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  ThemeManager, 
  FontManager,
  ThemeInstaller,
  ThemeConfig,
  FontOverride
} from '@mks2508/shadcn-basecoat-theme-manager';

/**
 * Context para el Theme Manager
 */
interface ThemeContextValue {
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  themes: ThemeConfig[];
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  installTheme: (url: string) => Promise<void>;
  setFontOverride: (category: 'sans' | 'serif' | 'mono', fontId: string) => void;
  fontOverrides: FontOverride;
  initialized: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Provider principal de temas para React
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultMode?: 'light' | 'dark' | 'auto';
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'default',
  defaultMode = 'auto' 
}: ThemeProviderProps) {
  const [themeManager] = useState(() => new ThemeManager());
  const [fontManager] = useState(() => themeManager.getFontManager());
  const [installer] = useState(() => new ThemeInstaller(themeManager));
  
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [fontOverrides, setFontOverrides] = useState<FontOverride>({ enabled: false, fonts: {} });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await themeManager.init();
      setCurrentTheme(themeManager.getCurrentTheme());
      setCurrentMode(themeManager.getCurrentMode());
      setThemes(themeManager.getAvailableThemes());
      setFontOverrides(fontManager.getCurrentOverride());
      setInitialized(true);
    };
    init();
  }, [themeManager, fontManager]);

  const setTheme = useCallback(async (theme: string, mode?: 'light' | 'dark' | 'auto') => {
    await themeManager.setTheme(theme, mode);
    setCurrentTheme(theme);
    if (mode) setCurrentMode(mode);
  }, [themeManager]);

  const installTheme = useCallback(async (url: string) => {
    await installer.installFromUrl(url);
    setThemes(themeManager.getAvailableThemes());
  }, [installer, themeManager]);

  const setFontOverride = useCallback((category: 'sans' | 'serif' | 'mono', fontId: string) => {
    fontManager.setFontOverride(category, fontId);
    setFontOverrides(fontManager.getCurrentOverride());
  }, [fontManager]);

  const value: ThemeContextValue = {
    currentTheme,
    currentMode,
    themes,
    setTheme,
    installTheme,
    setFontOverride,
    fontOverrides,
    initialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para usar el Theme Manager
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}

/**
 * Componente selector de temas
 */
export function ThemeSelector() {
  const { currentTheme, themes, setTheme, initialized } = useTheme();

  if (!initialized) {
    return <div>Cargando...</div>;
  }

  return (
    <select 
      value={currentTheme}
      onChange={(e) => setTheme(e.target.value)}
      className="theme-selector"
    >
      {themes.map(theme => (
        <option key={theme.id} value={theme.name}>
          {theme.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Componente instalador de temas
 */
export function ThemeInstaller() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { installTheme } = useTheme();

  const handleInstall = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      await installTheme(url);
      setUrl('');
    } catch (error) {
      console.error('Error instalando tema:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-installer">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL del tema (ej: tweakcn.com/r/themes/...)"
        disabled={loading}
      />
      <button onClick={handleInstall} disabled={loading || !url}>
        {loading ? 'Instalando...' : 'Instalar Tema'}
      </button>
    </div>
  );
}