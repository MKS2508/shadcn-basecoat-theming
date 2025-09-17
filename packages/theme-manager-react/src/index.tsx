import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  ThemeCore,
  ThemeManager,
  FontManager,
  ThemeInstaller,
  ThemeConfig,
  FontOverride
} from '@mks2508/shadcn-basecoat-theme-manager';
import { ThemeSelector as ThemeSelectorComponent } from './components/ThemeSelector';

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
  
  // Métodos de conveniencia
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  installTheme: (url: string) => Promise<void>;
  setFontOverride: (category: 'sans' | 'serif' | 'mono', fontId: string) => Promise<void>;
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
  // Usar ThemeCore global en lugar de instancias locales
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);
  const [fontManager, setFontManager] = useState<FontManager | null>(null);
  const [installer, setInstaller] = useState<ThemeInstaller | null>(null);
  
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [fontOverrides, setFontOverrides] = useState<FontOverride>({ enabled: false, fonts: {} });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initFromThemeCore = async () => {
      try {
        // Usar ThemeCore ya inicializado globalmente
        const managers = await ThemeCore.waitForReady();
        
        setThemeManager(managers.themeManager);
        setFontManager(managers.fontManager);
        setInstaller(managers.themeInstaller);
        
        // Sincronizar estado reactivo
        setCurrentTheme(managers.themeManager.getCurrentTheme());
        setCurrentMode(managers.themeManager.getCurrentMode());
        setThemes(managers.themeManager.getAvailableThemes());
        // TODO: Obtener font overrides actuales del fontManager
        setFontOverrides({ enabled: false, fonts: {} });
        
        setInitialized(true);
      } catch (error) {
        console.error('❌ ThemeProvider: Failed to connect to ThemeCore:', error);
      }
    };
    
    initFromThemeCore();
  }, []);

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
 * Componente ModeToggle para alternar entre modos light/dark/auto
 */
export function ModeToggle() {
  const { currentMode, setTheme, currentTheme } = useTheme();

  const handleModeToggle = async () => {
    const modes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    await setTheme(currentTheme, nextMode);
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🖥️';
      default:
        return '🖥️';
    }
  };

  return (
    <button
      onClick={handleModeToggle}
      className="inline-flex items-center justify-center rounded-md border border-input bg-background w-10 h-10 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`Current mode: ${currentMode}. Click to change mode.`}
      title={`Current mode: ${currentMode}`}
    >
      <span className="text-base">{getModeIcon()}</span>
    </button>
  );
}

/**
 * Props para modales
 */
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal para gestión de temas - instalación, desinstalación, etc.
 */
export function ThemeManagementModal({ open, onOpenChange }: ModalProps) {
  const { themes, installTheme } = useTheme();
  const [installUrl, setInstallUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!installUrl.trim()) return;
    
    setIsInstalling(true);
    try {
      await installTheme(installUrl.trim());
      setInstallUrl('');
    } catch (error) {
      console.error('Error instalando tema:', error);
      alert('Error instalando tema. Por favor verifica la URL.');
    } finally {
      setIsInstalling(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Gestión de Temas
          </h2>
          <p className="text-sm text-muted-foreground">
            Instala nuevos temas desde URLs externas
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="theme-url" className="text-sm font-medium leading-none">
              URL del tema
            </label>
            <input
              id="theme-url"
              type="url"
              value={installUrl}
              onChange={(e) => setInstallUrl(e.target.value)}
              placeholder="https://tweakcn.com/r/themes/..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isInstalling}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Temas Instalados ({themes.length})
            </label>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {themes.map(theme => (
                <div key={theme.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{theme.label || theme.name || theme.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {theme.category === 'built-in' ? 'Predefinido' : 'Instalado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={!installUrl.trim() || isInstalling}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInstalling ? 'Instalando...' : 'Instalar Tema'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal para configuración de fuentes
 */
export function FontSettingsModal({ open, onOpenChange }: ModalProps) {
  const { fontOverrides, setFontOverride } = useTheme();
  
  // Catálogo básico de fuentes comunes
  const fontCatalog = {
    sans: [
      { id: 'inter', name: 'Inter', family: 'Inter, sans-serif' },
      { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' },
      { id: 'open-sans', name: 'Open Sans', family: '"Open Sans", sans-serif' },
      { id: 'lato', name: 'Lato', family: 'Lato, sans-serif' },
      { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif' }
    ],
    serif: [
      { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif' },
      { id: 'merriweather', name: 'Merriweather', family: 'Merriweather, serif' },
      { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
      { id: 'times', name: 'Times New Roman', family: '"Times New Roman", serif' }
    ],
    mono: [
      { id: 'jetbrains', name: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
      { id: 'fira-code', name: 'Fira Code', family: '"Fira Code", monospace' },
      { id: 'source-code', name: 'Source Code Pro', family: '"Source Code Pro", monospace' },
      { id: 'inconsolata', name: 'Inconsolata', family: 'Inconsolata, monospace' }
    ]
  };

  const handleFontChange = (category: 'sans' | 'serif' | 'mono', fontId: string) => {
    setFontOverride(category, fontId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Configuración de Fuentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Personaliza las fuentes de tu interfaz
          </p>
        </div>
        
        <div className="space-y-6">
          {Object.entries(fontCatalog).map(([category, fonts]) => (
            <div key={category} className="space-y-2">
              <label className="text-sm font-medium leading-none capitalize">
                {category === 'sans' ? 'Sans Serif' : category === 'serif' ? 'Serif' : 'Monospace'}
              </label>
              <select
                value={fontOverrides.fonts[category as keyof typeof fontOverrides.fonts] || ''}
                onChange={(e) => handleFontChange(category as 'sans' | 'serif' | 'mono', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Usar fuente del tema</option>
                {fonts.map(font => (
                  <option key={font.id} value={font.id}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

