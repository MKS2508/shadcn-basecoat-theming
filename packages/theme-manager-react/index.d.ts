import React from 'react';

export interface ThemeContextValue {
  themeManager: any;
  fontManager: any;
  installer: any;
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  themes: any[];
  fontOverrides: any;
  initialized: boolean;
  isServer: boolean;
  loading: boolean;
  error: string | null;
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto') => Promise<void>;
  installTheme: (url: string) => Promise<void>;
  setFontOverride: (category: 'sans' | 'serif' | 'mono', fontId: string) => Promise<void>;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultMode?: 'light' | 'dark' | 'auto';
  registryUrl?: string;
  storageKey?: string;
  enableTransitions?: boolean;
  enablePersistence?: boolean;
}

export declare function ThemeProvider(props: ThemeProviderProps): React.ReactElement;
export declare function useTheme(): ThemeContextValue;

// Components
export declare function ThemeSelector(props: any): React.ReactElement;
export declare function ThemeInstallerComponent(): React.ReactElement;
export declare function ThemeManagementModal(props: any): React.ReactElement;
export declare function FontSettingsModal(props: any): React.ReactElement;

// Next.js exports
export declare function NextJSThemeProvider(props: any): React.ReactElement;
export declare function useNextJSTheme(): ThemeContextValue;