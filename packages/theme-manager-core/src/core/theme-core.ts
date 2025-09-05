/**
 * Unified ThemeCore class - Single entry point for theme management
 * Provides simplified API and framework-specific helpers
 */
import { ThemeManager } from './theme-manager';
import { FontManager } from './font-manager';
import { StorageManager } from './storage-manager';
import { ThemeInstaller } from '../installers/theme-installer';
import { ThemeListFetcher } from '../installers/theme-list-fetcher';
import { getFontsByCategory } from '../catalogs/font-catalog';

export interface ThemeCoreConfig {
  registryPath?: string;
  themesPath?: string;
  autoFOUC?: boolean;
  debug?: boolean;
}

export interface ThemeCoreInstance {
  themeManager: ThemeManager;
  fontManager: FontManager;
  themeInstaller: ThemeInstaller;
  themeListFetcher: ThemeListFetcher;
  getThemeRegistry: () => any;
  getFontsByCategory: typeof getFontsByCategory;
}

export class ThemeCore {
  private static instance: ThemeCore | null = null;
  private static config: ThemeCoreConfig = {};
  private static coreInstance: ThemeCoreInstance | null = null;
  private static initPromise: Promise<ThemeCoreInstance> | null = null;

  /**
   * Initialize ThemeCore with configuration
   */
  static async init(config: ThemeCoreConfig = {}): Promise<ThemeCoreInstance> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return existing instance if already initialized
    if (this.coreInstance) {
      return this.coreInstance;
    }

    console.log('🎨 Initializing ThemeCore...', config);
    this.config = { ...this.config, ...config };

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private static async performInit(): Promise<ThemeCoreInstance> {
    try {
      // Create core instances
      const themeManager = new ThemeManager();
      const themeInstaller = new ThemeInstaller(themeManager);
      const themeListFetcher = new ThemeListFetcher();

      // Initialize in correct order with timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('ThemeCore initialization timeout')), 10000);
      });

      await Promise.race([themeManager.init(), timeoutPromise]);
      await themeInstaller.init();
      await themeListFetcher.init();

      // Create instance object
      this.coreInstance = {
        themeManager,
        fontManager: themeManager.getFontManager(),
        themeInstaller,
        themeListFetcher,
        getThemeRegistry: () => themeManager.getThemeRegistry(),
        getFontsByCategory
      };

      // Auto-setup for browser environment
      this.setupBrowserIntegration();

      console.log('✅ ThemeCore initialized successfully');
      return this.coreInstance;

    } catch (error) {
      console.error('❌ ThemeCore initialization failed:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Get initialized ThemeCore instance
   */
  static getInstance(): ThemeCoreInstance | null {
    return this.coreInstance;
  }

  /**
   * Get theme manager (shortcut)
   */
  static getManager(): ThemeManager | null {
    return this.coreInstance?.themeManager || null;
  }

  /**
   * Get font manager (shortcut)
   */
  static getFontManager(): FontManager | null {
    return this.coreInstance?.fontManager || null;
  }

  /**
   * Get theme installer (shortcut)
   */
  static getInstaller(): ThemeInstaller | null {
    return this.coreInstance?.themeInstaller || null;
  }

  /**
   * Wait for ThemeCore to be ready
   */
  static async waitForReady(): Promise<ThemeCoreInstance> {
    if (this.coreInstance) {
      return this.coreInstance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    // Auto-initialize if not started
    return this.init();
  }

  /**
   * Generate FOUC prevention script for frameworks
   */
  static getFOUCScript(): string {
    return `
(function() {
  // Apply saved theme immediately to prevent flash
  function applyThemeVariables() {
    try {
      const savedTheme = localStorage.getItem('theme') || 'default';
      const savedMode = localStorage.getItem('theme-mode') || 'auto';
      
      // Apply mode class
      const effectiveMode = savedMode === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedMode;
      
      document.documentElement.classList.add(effectiveMode);
      document.documentElement.setAttribute('data-theme', savedTheme);
      
    } catch (error) {
      console.warn('FOUC prevention failed:', error);
    }
  }

  // Apply immediately
  applyThemeVariables();
  
  // Reveal body after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.3s ease';
      }, 0);
    });
  } else {
    // Already loaded
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
  }
})();`.trim();
  }

  /**
   * Generate initialization script for browser environments
   */
  static getInitScript(): string {
    return `
<script>
  import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager';

  async function initializeThemeCore() {
    try {
      const themeCore = await ThemeCore.init();
      console.log('✅ ThemeCore initialized:', themeCore);
    } catch (error) {
      console.error('❌ Failed to initialize ThemeCore:', error);
    }
  }

  // Initialize immediately
  initializeThemeCore();
</script>`.trim();
  }


  /**
   * Setup browser environment integration (framework-agnostic)
   */
  private static setupBrowserIntegration(): void {
    // Auto-setup for any browser environment
    if (typeof window !== 'undefined') {
      (window as any).themeCore = this.coreInstance;
      
      // Dispatch ready event after next tick
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('theme-core-ready', {
          detail: { themeCore: this.coreInstance }
        }));
      }, 0);
    }
  }

  /**
   * Create local theme registry
   */
  static async initLocalRegistry(registryPath: string = '/themes/registry.json'): Promise<void> {
    try {
      const themeCore = await this.waitForReady();
      const registry = themeCore.getThemeRegistry();
      
      // Create default registry structure
      const defaultRegistry = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        themes: [
          {
            id: "default",
            name: "default",
            label: "Default",
            description: "Default shadcn/ui theme",
            author: "shadcn",
            version: "1.0.0",
            source: "local",
            category: "built-in",
            modes: {
              light: "/src/themes/default-light.css",
              dark: "/src/themes/default-dark.css"
            },
            fonts: {
              sans: "system-ui, sans-serif",
              serif: "Georgia, serif",
              mono: "ui-monospace, monospace"
            },
            preview: {
              primary: "hsl(221.2 83.2% 53.3%)",
              background: "hsl(0 0% 100%)",
              accent: "hsl(210 40% 96%)"
            },
            config: {
              radius: "0.5rem"
            }
          }
        ]
      };
      
      console.log(`✅ ThemeCore: Local registry structure created for ${registryPath}`);
      console.log('Registry structure:', defaultRegistry);
      
    } catch (error) {
      console.error('❌ ThemeCore: Failed to create local registry:', error);
      throw error;
    }
  }

  /**
   * Event helper - wait for ready with callback
   */
  static onReady(callback: (themeCore: ThemeCoreInstance) => void): void {
    if (this.coreInstance) {
      callback(this.coreInstance);
      return;
    }

    // Listen for ready event (for browser environments)
    if (typeof window !== 'undefined') {
      window.addEventListener('theme-core-ready', (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail.themeCore);
      });
    }

    // Also handle promise-based initialization
    this.waitForReady().then(callback).catch(console.error);
  }

  /**
   * Event helper - theme change listener
   */
  static onThemeChange(callback: (themeData: { theme: string; mode: 'light' | 'dark' | 'auto'; effectiveMode: 'light' | 'dark' }) => void): void {
    this.onReady((themeCore) => {
      themeCore.themeManager.onThemeChange(callback);
    });
  }

  /**
   * Event helper - theme installed listener
   */
  static onThemeInstalled(callback: (theme: any) => void): void {
    this.onReady((themeCore) => {
      themeCore.themeManager.addEventListener('theme-installed', callback);
    });
  }
}

// Export singleton instance
export default ThemeCore;