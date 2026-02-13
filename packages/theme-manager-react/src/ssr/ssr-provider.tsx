"use client"

/**
 * SSR Theme Provider - Framework-agnostic SSR-optimized theme provider.
 *
 * Uses {@link CookieStorageAdapter} for cookie-based persistence so the
 * server can read theme preferences on the first request.
 * Works with any React SSR framework (Next.js, TanStack Start, Remix, etc.).
 *
 * @module ssr/ssr-provider
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ThemeCore,
  ThemeManager,
  StorageManager,
  CookieStorageAdapter,
  type ThemeConfig,
} from '@mks2508/shadcn-basecoat-theme-manager';

/** Value exposed by {@link SSRThemeProvider} via React context. */
export interface ISSRThemeContextValue {
  /** The underlying ThemeManager instance (null until initialized). */
  themeManager: ThemeManager | null;
  /** Current theme id (e.g. `'synthwave84'`). */
  currentTheme: string;
  /** Current mode preference. */
  currentMode: 'light' | 'dark' | 'auto';
  /** All registered themes. */
  themes: ThemeConfig[];
  /** `true` once ThemeCore has finished initializing. */
  initialized: boolean;
  /** `true` while initialization is in progress. */
  loading: boolean;
  /** Error message if initialization failed, otherwise `null`. */
  error: string | null;
  /** Switch to a different theme and/or mode. */
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  /** Cycle to the next theme in the registry. */
  toggleTheme: () => void;
  /** Cycle through light → dark → auto. */
  toggleMode: () => void;
}

const SSRThemeContext = createContext<ISSRThemeContextValue | null>(null);

/** Props for {@link SSRThemeProvider}. */
export interface ISSRThemeProviderProps {
  children: ReactNode;
  /** Fallback theme id when nothing is persisted. @default 'default' */
  defaultTheme?: string;
  /** Fallback mode when nothing is persisted. @default 'auto' */
  defaultMode?: 'light' | 'dark' | 'auto';
  /** URL to the theme registry JSON. @default '/themes/registry.json' */
  registryUrl?: string;
}

/**
 * SSR-optimized theme provider with cookie persistence.
 *
 * Wraps your app and provides theme state + methods via context.
 * Uses a mount guard to prevent hydration mismatches.
 *
 * @example
 * ```tsx
 * // TanStack Start __root.tsx or Next.js layout.tsx
 * <SSRThemeProvider defaultTheme="synthwave84">
 *   {children}
 * </SSRThemeProvider>
 * ```
 */
export function SSRThemeProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
  registryUrl = '/themes/registry.json',
}: ISSRThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [themeManager, setThemeManager] = useState<ThemeManager | null>(null);
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const cookieAdapter = new CookieStorageAdapter();

        await ThemeCore.init({ registryPath: registryUrl, debug: false });
        StorageManager.getInstanceWithAdapter(cookieAdapter);

        const mgr = ThemeCore.getManager()!;
        setThemeManager(mgr);
        setCurrentTheme(mgr.getCurrentTheme());
        setCurrentMode(mgr.getCurrentMode());
        setThemes(mgr.getAvailableThemes());
        setInitialized(true);

        const syncState = () => {
          setCurrentTheme(mgr.getCurrentTheme());
          setCurrentMode(mgr.getCurrentMode());
          try { cookieAdapter.setThemePreference(mgr.getCurrentTheme(), mgr.getCurrentMode()); } catch (_) {}
        };
        mgr.onThemeChange?.(syncState as any);

        const updateThemes = () => setThemes(mgr.getAvailableThemes());
        ThemeCore.onThemeInstalled?.(updateThemes as any);
        ThemeCore.onThemeUninstalled?.(updateThemes as any);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Initialization failed');
        setCurrentTheme(defaultTheme);
        setCurrentMode(defaultMode);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mounted, registryUrl, defaultTheme, defaultMode]);

  const setTheme = async (theme: string, mode?: 'light' | 'dark' | 'auto') => {
    if (!themeManager) return;
    try { await themeManager.setTheme(theme, mode || currentMode); } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set theme');
    }
  };

  const toggleTheme = () => {
    if (!themeManager || themes.length === 0) return;
    const ids = themes.map(t => t.id);
    const next = ids[(ids.indexOf(currentTheme) + 1) % ids.length];
    setTheme(next, currentMode);
  };

  const toggleMode = () => {
    const modes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    setTheme(currentTheme, modes[(modes.indexOf(currentMode) + 1) % modes.length]);
  };

  const value: ISSRThemeContextValue = {
    themeManager, currentTheme, currentMode, themes,
    initialized, loading, error, setTheme, toggleTheme, toggleMode,
  };

  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  return (
    <SSRThemeContext.Provider value={value}>
      {children}
    </SSRThemeContext.Provider>
  );
}

/**
 * Access the SSR theme context.
 *
 * @throws If called outside an {@link SSRThemeProvider}.
 * @returns The current theme state and methods.
 */
export function useSSRTheme(): ISSRThemeContextValue {
  const ctx = useContext(SSRThemeContext);
  if (!ctx) throw new Error('useSSRTheme must be used within an SSRThemeProvider');
  return ctx;
}
