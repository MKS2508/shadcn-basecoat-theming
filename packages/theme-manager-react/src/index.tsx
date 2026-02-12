import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ThemeCore,
  ThemeManager,
  FontManager,
  ThemeInstaller,
  ThemeConfig,
  FontOverride
} from '@mks2508/shadcn-basecoat-theme-manager';
import { ThemeManagementModal as ThemeManagementModalComponent } from './components/ThemeManagementModal';
import { FontSettingsModal as FontSettingsModalComponent } from './components/FontSettingsModal';
import { SettingsModal as SettingsModalComponent } from './components/SettingsModal';
import { ThemeManagementContent as ThemeManagementContentComponent } from './components/ThemeManagementContent';
import { FontSettingsContent as FontSettingsContentComponent } from './components/FontSettingsContent';
export { useAnimatedTheme } from './hooks/useAnimatedTheme';
export type { AnimationPreset, Direction, IAnimatedThemeOptions } from './hooks/useAnimatedTheme';
export { ANIMATION_PRESETS, DIRECTIONAL_PRESETS, DIRECTION_OPTIONS } from './hooks/useAnimatedTheme';
export { AnimationSettings } from './components/AnimationSettings';
export type { IAnimationSettings, IAnimationSettingsProps } from './components/AnimationSettings';
export { SettingsModalComponent as SettingsModal }
export type { ISettingsModalProps } from './components/SettingsModal';
export { ThemeManagementContentComponent as ThemeManagementContent }
export type { IThemeManagementContentProps } from './components/ThemeManagementContent';
export { FontSettingsContentComponent as FontSettingsContent }
export type { IFontSettingsContentProps } from './components/FontSettingsContent';

/**
 * Context para el Theme Manager
 */
interface ThemeContextValue {
  // Direct access to managers (más flexible)
  themeManager: ThemeManager | null;
  fontManager: FontManager | null;
  installer: ThemeInstaller | null;

  // Estado reactivo
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  themes: ThemeConfig[];
  fontOverrides: FontOverride;
  initialized: boolean;
  isServer: boolean;
  loading: boolean;
  error: string | null;

  // Métodos de conveniencia
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  installTheme: (url: string) => Promise<void>;
  setFontOverride: (category: 'sans' | 'serif' | 'mono', fontId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Provider principal de temas para React
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultMode?: 'light' | 'dark' | 'auto';
  registryUrl?: string;
  storageKey?: string;
  enableTransitions?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
  registryUrl = '/themes/registry.json',
  storageKey = 'theme-preference',
  enableTransitions = true
}: ThemeProviderProps) {
  // Detect server-side environment
  const [isServer, setIsServer] = useState(true);

  // Usar ThemeCore global en lugar de instancias locales
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);
  const [fontManager, setFontManager] = useState<FontManager | null>(null);
  const [installer, setInstaller] = useState<ThemeInstaller | null>(null);

  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [fontOverrides, setFontOverrides] = useState<FontOverride>({ enabled: false, fonts: {} });
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Detect client-side environment
    setIsServer(typeof window === 'undefined');

    const initThemeManager = async () => {
      // Skip initialization on server-side - use mock data
      if (typeof window === 'undefined') {
        console.log('🎨 ThemeProvider: Server-side rendering detected, using mock data');
        setInitialized(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Auto-initialize with provided configuration
        await ThemeCore.init({
          registryPath: registryUrl,
          debug: false
        });

        const managers = ThemeCore.getInstance();
        if (!managers) {
          throw new Error('ThemeCore initialization returned null');
        }

        setThemeManager(managers.themeManager);
        setFontManager(managers.fontManager);
        setInstaller(managers.themeInstaller);

        // Sync reactive state
        setCurrentTheme(managers.themeManager.getCurrentTheme());
        setCurrentMode(managers.themeManager.getCurrentMode());
        setThemes(managers.themeManager.getAvailableThemes());
        setFontOverrides({ enabled: false, fonts: {} });

        setInitialized(true);

        // Subscribe to theme and registry events
        const tm = managers.themeManager;
        const handleThemeChange = () => {
          setCurrentTheme(tm.getCurrentTheme());
          setCurrentMode(tm.getCurrentMode());
        };
        tm.onThemeChange?.(handleThemeChange as any);

        const updateThemes = () => setThemes(tm.getAvailableThemes());
        // theme install/uninstall events are dispatched from ThemeManager
        ThemeCore.onThemeInstalled && ThemeCore.onThemeInstalled(updateThemes as any);
        ThemeCore.onThemeUninstalled && ThemeCore.onThemeUninstalled(updateThemes as any);

      } catch (error) {
        console.warn('⚠️ ThemeProvider: Auto-initialization failed, using fallback:', error);
        setError(error instanceof Error ? error.message : 'Initialization failed');

        // Fallback: minimal working state
        setCurrentTheme(defaultTheme);
        setCurrentMode(defaultMode);
        setThemes([
          {
            id: 'default',
            name: 'Default',
            label: 'Default Theme',
            description: 'Default theme configuration',
            version: '1.0.0',
            source: 'local' as const,
            category: 'built-in' as const,
            modes: {
              light: '',
              dark: ''
            },
            fonts: {
              sans: '',
              serif: '',
              mono: ''
            },
            preview: {
              primary: '#007bff',
              background: '#ffffff',
              accent: '#f8f9fa'
            },
            config: {
              radius: '0.5rem'
            }
          }
        ]);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initThemeManager();
  }, [defaultTheme, defaultMode, registryUrl]);

  const setTheme = useCallback(async (theme: string, mode?: 'light' | 'dark' | 'auto') => {
    if (!themeManager) return;
    await themeManager.setTheme(theme, mode);
    setCurrentTheme(theme);
    if (mode) setCurrentMode(mode);
  }, [themeManager]);

  const installTheme = useCallback(async (url: string) => {
    if (!installer || !themeManager) return;
    await installer.installFromUrl(url);
    setThemes(themeManager.getAvailableThemes());
  }, [installer, themeManager]);

  const setFontOverride = useCallback(async (category: 'sans' | 'serif' | 'mono', fontId: string) => {
    if (!fontManager) return;
    await fontManager.setFontOverride(category, fontId);
    setFontOverrides({ enabled: true, fonts: { [category]: fontId } });
  }, [fontManager]);

  const value: ThemeContextValue = {
    // Direct access to managers
    themeManager,
    fontManager,
    installer,

    // Estado reactivo
    currentTheme,
    currentMode,
    themes,
    fontOverrides,
    initialized,
    isServer,
    loading,
    error,

    // Métodos de conveniencia
    setTheme,
    installTheme,
    setFontOverride
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
 * Componente instalador de temas
 */
export function ThemeInstallerComponent() {
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


/**
 * Props para modales
 */
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Export all components and utilities
export { ThemeManagementModalComponent as ThemeManagementModal }
export { FontSettingsModalComponent as FontSettingsModal }
export type { ModalProps, ThemeContextValue, ThemeProviderProps }

// FOUC prevention re-exports from core
export { generateFOUCScript } from '@mks2508/shadcn-basecoat-theme-manager';
export type { IFOUCScriptConfig } from '@mks2508/shadcn-basecoat-theme-manager';

