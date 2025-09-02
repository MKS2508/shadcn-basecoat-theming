import { StorageManager, CachedTheme } from './storage-manager';
import { ThemeManager } from './theme-manager';
import { FontLoader } from './font-loader';
import { ThemeListFetcher } from './theme-list-fetcher';
import { ThemeInstallerModal } from './components/theme-installer-modal';

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
  private themeManager: ThemeManager;
  private fontLoader: FontLoader;
  private themeListFetcher: ThemeListFetcher;
  private installerModal: ThemeInstallerModal | null = null;
  private onThemeInstalled?: () => void;

  constructor(themeManager: ThemeManager) {
    this.storageManager = new StorageManager();
    this.themeManager = themeManager;
    this.themeListFetcher = new ThemeListFetcher();
    this.fontLoader = new FontLoader();
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
    
    // Initialize modal component
    this.installerModal = new ThemeInstallerModal();
    await this.installerModal.init();
    
    // Set up callbacks
    this.installerModal.setOnThemeInstalledCallback(() => {
      if (this.onThemeInstalled) {
        this.onThemeInstalled();
      }
    });

    this.setupEventListeners();
    console.log('🎨 ThemeInstaller initialized with modular components');
  }

  /**
   * Set up main event listeners
   */
  private setupEventListeners(): void {
    // Install theme button
    const installBtn = document.getElementById('install-theme-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        console.log('🎯 Install button clicked, opening modal');
        this.openModal();
      });
    }
  }

  /**
   * Open installation modal
   */
  private openModal(): void {
    if (this.installerModal) {
      this.installerModal.openModal();
    }
  }

  /**
   * Install theme from URL
   */
  async installThemeFromUrl(url: string): Promise<void> {
    try {
      console.log(`🎨 Installing theme from URL: ${url}`);
      
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
      console.error('❌ Theme installation failed:', error);
      throw error;
    }
  }

  /**
   * Install theme from registry by name
   */
  async installThemeFromRegistry(themeName: string): Promise<void> {
    try {
      console.log(`🎨 Installing theme from registry: ${themeName}`);
      
      const registryUrl = 'https://tweakcn.com/r/registry.json';
      const response = await fetch(registryUrl);
      const registry = await response.json();
      
      if (!registry[themeName]) {
        throw new Error(`Theme ${themeName} not found in registry`);
      }

      const themeUrl = registry[themeName];
      await this.installThemeFromUrl(themeUrl);
      
    } catch (error) {
      console.error('❌ Registry theme installation failed:', error);
      throw error;
    }
  }

  /**
   * Process and install theme data
   */
  private async processAndInstallTheme(themeData: ThemeData, url: string): Promise<void> {
    // Load external fonts
    const allCssVars = { ...themeData.cssVars.light, ...themeData.cssVars.dark, ...themeData.cssVars.theme };
    await this.fontLoader.loadFontsFromCSSVars(allCssVars);

    // Create CSS content
    const cssContent = this.generateThemeCSSContent(themeData);
    const cssBlob = new Blob([cssContent], { type: 'text/css' });
    const cssUrl = URL.createObjectURL(cssBlob);

    // Add to theme manager
    await this.themeManager.addTheme(themeData.name, themeData.name, cssUrl);

    // Cache theme data
    const cachedTheme: CachedTheme = {
      name: themeData.name,
      url,
      data: themeData,
      installed: true,
      timestamp: Date.now()
    };

    await this.storageManager.cacheTheme(cachedTheme);
    
    console.log(`✅ Theme ${themeData.name} installed successfully`);
  }

  /**
   * Generate CSS content from theme data
   */
  private generateThemeCSSContent(themeData: ThemeData): string {
    let css = '';

    // Light mode variables
    if (themeData.cssVars.light) {
      css += `.${themeData.name} {\n`;
      for (const [key, value] of Object.entries(themeData.cssVars.light)) {
        css += `  ${key}: ${value};\n`;
      }
      css += '}\n\n';
    }

    // Dark mode variables
    if (themeData.cssVars.dark) {
      css += `.${themeData.name}.dark {\n`;
      for (const [key, value] of Object.entries(themeData.cssVars.dark)) {
        css += `  ${key}: ${value};\n`;
      }
      css += '}\n\n';
    }

    // Custom theme variables
    if (themeData.cssVars.theme) {
      css += `.${themeData.name}-theme {\n`;
      for (const [key, value] of Object.entries(themeData.cssVars.theme)) {
        css += `  ${key}: ${value};\n`;
      }
      css += '}\n\n';
    }

    return css;
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
    const cached = await this.storageManager.getCachedTheme(url);
    return cached;
  }

  /**
   * Check if theme is already installed
   */
  async isThemeInstalled(themeName: string): Promise<boolean> {
    const installedThemes = await this.storageManager.getInstalledThemes();
    return installedThemes.some(theme => theme.name === themeName);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.installerModal) {
      this.installerModal.unmount();
    }
    console.log('🗑️ ThemeInstaller destroyed');
  }
}