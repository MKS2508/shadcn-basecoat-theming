import { StorageManager, CachedTheme } from '../core/storage-manager';
import { ThemeManager } from '../core/theme-manager';
import { ThemeListFetcher } from './theme-list-fetcher';

interface ThemeData {
  name: string;
  cssVars: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };
}

/**
 * Refactored Theme Installer using modular components
 */
export class ThemeInstaller {
  private storageManager: StorageManager;
  private themeListFetcher: ThemeListFetcher;
  private onThemeInstalled?: () => void;
  private themeManager: ThemeManager;

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
    this.storageManager = new StorageManager();
    this.themeListFetcher = new ThemeListFetcher();
  }

  /**
   * Set callback for when a theme is installed
   */
  setOnThemeInstalledCallback(callback: () => void): void {
    this.onThemeInstalled = callback;
  }

  /**
   * Initialize theme installer
   */
  async init(): Promise<void> {
    await this.storageManager.init();
    await this.themeListFetcher.init();
  }


  /**
   * Install theme from URL
   */
  async installFromUrl(url: string): Promise<void> {
    try {
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const themeData = await response.json();
      if (!this.validateThemeData(themeData)) {
        throw new Error('Invalid theme format');
      }

      await this.processAndInstallTheme(themeData, url);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Install theme from registry by name
   */
  async installThemeFromRegistry(themeName: string): Promise<void> {
    try {
      
      const registryUrl = 'https://tweakcn.com/r/registry.json';
      const response = await fetch(registryUrl);
      const registry = await response.json();
      
      if (!registry[themeName]) {
        throw new Error(`Theme ${themeName} not found in registry`);
      }

      const themeUrl = registry[themeName];
      await this.installFromUrl(themeUrl);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process and install theme data
   */
  private async processAndInstallTheme(themeData: ThemeData, url: string): Promise<void> {
    await this.storageManager.storeTheme({
      name: themeData.name,
      url: url,
      data: {
        name: themeData.name,
        cssVars: themeData.cssVars
      },
      installed: true,
      timestamp: Date.now()
    });
  }


  /**
   * Validate theme data structure
   */
  private validateThemeData(data: any): data is ThemeData {
    return data && 
           typeof data.name === 'string' && 
           data.name.length > 0 &&
           typeof data.cssVars === 'object' &&
           data.cssVars !== null &&
           (data.cssVars.light || data.cssVars.dark || data.cssVars.theme);
  }

  /**
   * Get cached theme data
   */
  async getCachedTheme(url: string): Promise<CachedTheme | null> {
    const allThemes = await this.storageManager.getAllThemes();
    return allThemes.find((theme: any) => theme.url === url) || null;
  }

  /**
   * Check if theme is already installed
   */
  async isThemeInstalled(themeName: string): Promise<boolean> {
    const installedThemes = await this.storageManager.getAllThemes();
    return installedThemes.some((theme: any) => theme.name === themeName);
  }

}