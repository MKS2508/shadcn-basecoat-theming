"use client"

/**
 * TanStack Start Theme Provider
 * SSR-optimized theme management for TanStack Start applications
 *
 * This component uses the "use client" directive to ensure it only runs on the client.
 * It prevents hydration mismatches by rendering a simple shell during SSR.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ThemeCore,
  ThemeManager,
  StorageManager,
  type ThemeConfig,
  CookieStorageAdapter
} from '@mks2508/shadcn-basecoat-theme-manager';

interface ThemeContextValue {
  // Core managers
  themeManager: ThemeManager | null;

  // Current state
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  themes: ThemeConfig[];
  initialized: boolean;
  loading: boolean;
  error: string | null;

  // Methods
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  toggleTheme: () => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface TanStackStartProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  defaultMode?: 'light' | 'dark' | 'auto';
  registryUrl?: string;
}

export function TanStackStartProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
  registryUrl = '/themes/registry.json'
}: TanStackStartProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Core managers
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme manager (only after component is mounted on client)
  useEffect(() => {
    if (!mounted) return;

    const initializeThemeManager = async () => {
      setLoading(true);
      setError(null);

      try {
        // Create storage manager with cookie adapter for SSR compatibility
        const cookieStorageAdapter = new CookieStorageAdapter();

        // Initialize ThemeCore normally (storage adapter handled at StorageManager level)
        await ThemeCore.init({
          registryPath: registryUrl,
          debug: false
        });

        // Replace storage manager with cookie-based one
        StorageManager.getInstanceWithAdapter(cookieStorageAdapter);

        // Get theme manager instance
        const themeManagerInstance = ThemeCore.getManager()!;
        setThemeManager(themeManagerInstance);

        // Sync state with ThemeManager
        setCurrentTheme(themeManagerInstance.getCurrentTheme());
        setCurrentMode(themeManagerInstance.getCurrentMode());
        setThemes(themeManagerInstance.getAvailableThemes());
        setInitialized(true);

        // Subscribe to theme changes
        const handleThemeChange = () => {
          const newTheme = themeManagerInstance.getCurrentTheme();
          const newMode = themeManagerInstance.getCurrentMode();
          setCurrentTheme(newTheme);
          setCurrentMode(newMode);

          // Sync cookies for SSR using client-safe method
          try {
            cookieStorageAdapter.setThemePreference(newTheme, newMode);
          } catch (e) {
            console.warn('Failed to sync theme to cookies:', e);
          }
        };

        themeManagerInstance.onThemeChange?.(handleThemeChange as any);

        // Listen for theme installations
        const updateThemes = () => setThemes(themeManagerInstance.getAvailableThemes());
        ThemeCore.onThemeInstalled?.(updateThemes as any);
        ThemeCore.onThemeUninstalled?.(updateThemes as any);

      } catch (error) {
        console.error('❌ TanStackStartProvider: Initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Initialization failed');

        // Fallback to minimal state
        setCurrentTheme(defaultTheme);
        setCurrentMode(defaultMode);
        setThemes([
          {
            id: 'default',
            name: 'default',
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
              primary: '#000000',
              background: '#ffffff',
              accent: '#000000'
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

    initializeThemeManager();
  }, [mounted, registryUrl, defaultTheme, defaultMode]);

  // Theme switching methods
  const setTheme = async (theme: string, mode?: 'light' | 'dark' | 'auto') => {
    if (!themeManager) return;

    try {
      await themeManager.setTheme(theme, mode || currentMode);
    } catch (error) {
      console.error('❌ TanStackStartProvider: Failed to set theme:', error);
      setError(error instanceof Error ? error.message : 'Failed to set theme');
    }
  };

  const toggleTheme = () => {
    if (!themeManager || themes.length === 0) return;

    const themeIds = themes.map(t => t.id);
    const currentIndex = themeIds.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const nextTheme = themeIds[nextIndex];

    setTheme(nextTheme, currentMode);
  };

  const toggleMode = () => {
    const modes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    setTheme(currentTheme, nextMode);
  };

  const contextValue: ThemeContextValue = {
    themeManager,
    currentTheme,
    currentMode,
    themes,
    initialized,
    loading,
    error,
    setTheme,
    toggleTheme,
    toggleMode
  };

  // During SSR and initial render, provide a basic shell to prevent hydration mismatch
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  // After hydration, render the full theme provider
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTanStackStartTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTanStackStartTheme must be used within a TanStackStartProvider');
  }
  return context;
}

/**
 * Hook to get theme preferences on server
 */
export function useServerThemePreferences() {
  // This would be used in server components
  // For now, return default values - in real implementation this would use the server function
  return {
    theme: 'default',
    mode: 'auto'
  };
}