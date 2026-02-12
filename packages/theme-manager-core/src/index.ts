// Core exports
export { ThemeCore } from './core/theme-core';
export { ThemeManager } from './core/theme-manager';
export { FontManager } from './core/font-manager';
export { FontLoader } from './core/font-loader';
export { ThemeRegistry } from './core/theme-registry';
export { StorageManager } from './core/storage-manager';

// Utilities
export { PerformanceTracker } from './utils/performance-tracker';
export { generateFOUCScript } from './utils/fouc-script';
export type { IFOUCScriptConfig } from './utils/fouc-script';

// Make PerformanceTracker available globally for examples
import { PerformanceTracker } from './utils/performance-tracker';
if (typeof window !== 'undefined') {
  (window as any).PerformanceTracker = PerformanceTracker;
}

// Installers
export { ThemeInstaller } from './installers/theme-installer';
export { ThemeListFetcher } from './installers/theme-list-fetcher';

// Catalogs
export * from './catalogs/font-catalog';

// Storage Adapters
export { CookieStorageAdapter } from './adapters/cookie-storage-adapter';
export { LocalStorageAdapter } from './adapters/local-storage-adapter';
export type { StorageAdapter, CookieOptions } from './types/storage-adapter';

// Framework Adapters
export { FumadocsAdapter, fumadocsAdapter } from './adapters/fumadocs-adapter';
export type { IFumadocsAdapterConfig } from './adapters/fumadocs-adapter';

// Types
export type { ThemeCoreConfig, ThemeCoreInstance } from './core/theme-core';
export type { ThemeConfig } from './core/theme-registry';
export type { FontOverride } from './core/font-manager';
export type { CachedTheme, FontOverrideConfig, ThemeModeConfig } from './core/storage-manager';
export type { ThemeGlobalWindow, ThemeHTMLDialogElement } from './types/global';

// Font-related types
export type FontCategory = 'sans' | 'serif' | 'mono';

// Theme registry types
export interface RegistryTheme {
  id: string;
  name: string;
  label: string;
  description: string;
  source: string;
  category: string;
  fetcher?: any; // ThemeListFetcher reference
}