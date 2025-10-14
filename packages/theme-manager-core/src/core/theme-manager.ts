import { FontLoader } from './font-loader';
import { ThemeRegistry, ThemeConfig } from './theme-registry';
import { FontManager } from './font-manager';
import { StorageManager, ThemeModeConfig } from './storage-manager';
import { PerformanceTracker } from '../utils/performance-tracker';
import {
  isClient,
  isServer,
  safeGetDocument,
  safeGetWindow,
  safeDOMManipulation,
  safeSetTimeout,
  safeClearTimeout,
  safeRequestAnimationFrame,
  safeCancelAnimationFrame,
  ssrSafeStorage,
  safeMatchMedia,
  safeAddEventListener
} from '../utils/ssr-utils';


/**
 * Manages theme loading, caching, and application
 */
export class ThemeManager {
  private themeRegistry: ThemeRegistry;
  private fontManager: FontManager;
  private storageManager: StorageManager;
  private currentTheme: string = 'default';
  private currentMode: 'light' | 'dark' | 'auto' = 'auto';
  private currentStyleElement: HTMLLinkElement | null = null;
  private fontLoader: FontLoader;
  
  // Event system
  private eventListeners: Map<string, Function[]> = new Map();
  
  // Performance optimizations  
  private prefetchedThemes: Set<string> = new Set(); // Single-request prefetch tracking
  private readonly BUILTIN_THEMES = ['default', 'supabase']; // Built-in themes for preloading
  private prefetchPromises: Map<string, Promise<void>> = new Map();
  
  // Storage optimization
  private readonly SAVE_DEBOUNCE_MS = 200;
  private themeStorage: {timer: ReturnType<typeof setTimeout> | null, pending: {theme?: string, mode?: string}} = {
    timer: null,
    pending: {}
  };
  
  constructor(registryPath: string = '/themes/registry.json') {
    this.themeRegistry = new ThemeRegistry(registryPath);
    this.fontManager = new FontManager();
    this.fontLoader = new FontLoader();
    this.storageManager = StorageManager.getInstance();
  }



  /**
   * Inicializa el gestor de temas con configuración persistente
   * Carga la configuración guardada y aplica el tema inicial
   * @returns Promise que se resuelve cuando la inicialización está completa
   */
  async init(): Promise<void> {
    // Skip initialization on server-side
    if (isServer()) {
      console.log('🔄 [ThemeManager] Server-side environment detected, skipping initialization');
      this.currentTheme = 'default';
      this.currentMode = 'auto';
      return;
    }

    try {
      console.log('🔄 [ThemeManager] Starting initialization...');

      // Initialize storage manager first
      console.log('🔄 [ThemeManager] Initializing StorageManager...');
      await this.storageManager.init();
      console.log('✅ [ThemeManager] StorageManager initialized');

      // Initialize theme registry
      console.log('🔄 [ThemeManager] Initializing ThemeRegistry...');
      await this.themeRegistry.init();
      console.log('✅ [ThemeManager] ThemeRegistry initialized');

      // Initialize font manager with timeout fallback
      console.log('🔄 [ThemeManager] Initializing FontManager...');
      try {
        // Add timeout to prevent FontManager from blocking the entire initialization
        const fontManagerPromise = this.fontManager.init();
        const timeoutPromise = new Promise((_, reject) => {
          safeSetTimeout(() => reject(new Error('FontManager.init() timeout after 5 seconds')), 5000);
        });

        await Promise.race([fontManagerPromise, timeoutPromise]);
        console.log('✅ [ThemeManager] FontManager initialized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ [ThemeManager] FontManager initialization failed, continuing without font management:', errorMessage);
        // Continue without font manager - it's not critical for basic theme functionality
      }

      // Get saved theme and mode from StorageManager
      console.log('🔄 [ThemeManager] Getting saved theme from StorageManager...');
      const savedConfig = await PerformanceTracker.measureStorageOperationAsync('indexedDB', 'read', async () => {
        return await this.storageManager.getThemeModeConfig();
      });
      const savedTheme = savedConfig?.currentTheme || 'default';
      const savedMode = savedConfig?.currentMode || 'auto';
      console.log('✅ [ThemeManager] Saved theme:', savedTheme, 'mode:', savedMode);

      // Validate saved theme exists in registry
      console.log('🔄 [ThemeManager] Validating saved theme exists...');
      const themeExists = this.themeRegistry.getTheme(savedTheme);
      this.currentTheme = themeExists ? savedTheme : 'default';
      this.currentMode = savedMode;
      console.log('✅ [ThemeManager] Current theme set to:', this.currentTheme);

      // Apply initial theme
      console.log('🔄 [ThemeManager] Applying initial theme...');
      await this.applyTheme(this.currentTheme, this.currentMode);
      console.log('✅ [ThemeManager] Initial theme applied');

      // Preload built-in themes in background (non-blocking)
      console.log('🔄 [ThemeManager] Starting theme preloading...');
      this.preloadBuiltinThemes();
      console.log('✅ [ThemeManager] Theme preloading started');

      console.log('✅ [ThemeManager] Initialization completed successfully');

    } catch (error) {
      console.error('❌ ThemeManager: Failed to initialize:', error);

      // Fallback to basic initialization
      this.currentTheme = 'default';
      this.currentMode = 'auto';

      // Try to apply default theme without registry
    }
  }

  /**
   * Establece un tema específico con modo opcional
   * @param theme - Nombre del tema a aplicar
   * @param mode - Modo del tema: 'light', 'dark' o 'auto'
   * @returns Promise que se resuelve cuando el tema se ha aplicado
   */
  async setTheme(theme: string, mode?: 'light' | 'dark' | 'auto'): Promise<void> {
    const newMode = mode || this.currentMode;
    
    // Check if this is a real theme change
    const isThemeChange = theme !== this.currentTheme || newMode !== this.currentMode;
    if (!isThemeChange) return;

    return PerformanceTracker.measureAsync('Theme Switch Total', async () => {
      this.currentTheme = theme;
      this.currentMode = newMode;
      
      // Debounced storage save (non-blocking)
      this.saveThemeSettings(theme, newMode);

      await this.applyTheme(theme, newMode, true); // Pass true to indicate real theme change
      
      // Dispatch theme change event
      this.dispatchEvent('theme-changed', {
        theme: this.currentTheme,
        mode: this.currentMode,
        effectiveMode: this.getEffectiveMode()
      });
    });
  }

  /**
   * Prefetch built-in themes for instant switching
   */
  private preloadBuiltinThemes(): void {
    this.BUILTIN_THEMES.forEach(themeName => {
      if (themeName !== this.currentTheme) {
        // Prefetch both light and dark modes (background, single request each)
        this.prefetchTheme(themeName, 'light');
        this.prefetchTheme(themeName, 'dark');
      }
    });
    
  }

  /**
   * Prefetch a specific theme (single-request optimization)
   */
  private prefetchTheme(themeName: string, mode: 'light' | 'dark'): void {
    // Skip prefetching on server
    if (!isClient()) return;

    const themeConfig = this.themeRegistry.getTheme(themeName);
    if (!themeConfig) return;

    const cssPath = themeConfig.modes[mode];
    const prefetchKey = `${themeName}-${mode}`;

    // Skip if already prefetching or prefetched
    if (this.prefetchedThemes.has(prefetchKey) || this.prefetchPromises.has(prefetchKey)) {
      return;
    }

    const prefetchPromise = new Promise<void>((resolve) => {
      safeDOMManipulation(() => {
        const document = safeGetDocument();
        if (!document?.head) {
          resolve();
          return;
        }

        // Single request: use prefetch for background loading
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = cssPath;
        link.crossOrigin = 'anonymous';
        link.id = `theme-prefetch-${prefetchKey}`;

        link.onload = () => {
          this.prefetchedThemes.add(prefetchKey);
          resolve();
        };

        link.onerror = () => {
          resolve();
        };

        document.head.appendChild(link);
      });
    });

    this.prefetchPromises.set(prefetchKey, prefetchPromise);
  }

  /**
   * Aplica un tema al documento con monitoreo de rendimiento
   * Carga las variables CSS y las aplica al elemento root
   * @param themeName - Nombre del tema
   * @param mode - Modo del tema
   * @param enableTransition - Whether to enable theme transition animation
   * @returns Promise que se resuelve cuando el tema se ha aplicado
   */
  private async applyTheme(themeName: string, mode: 'light' | 'dark' | 'auto', enableTransition: boolean = false): Promise<void> {
    // Skip theme application on server-side
    if (!isClient()) {
      console.log(`🎨 [ThemeManager] Skipping theme application on server: ${themeName} (${mode})`);
      return;
    }

    // Get theme config from registry
    const themeConfig = this.themeRegistry.getTheme(themeName);
    if (!themeConfig) {
      themeName = 'default';
      const fallbackTheme = this.themeRegistry.getTheme('default');
      if (!fallbackTheme) {
        throw new Error('Default theme not found in registry');
      }
    }

    // Resolve mode
    let resolvedMode: 'light' | 'dark';
    if (mode === 'auto') {
      const mediaQuery = safeMatchMedia('(prefers-color-scheme: dark)');
      resolvedMode = mediaQuery && mediaQuery.matches ? 'dark' : 'light';
    } else {
      resolvedMode = mode;
    }

    try {
      safeDOMManipulation(() => {
        const document = safeGetDocument();
        if (!document?.documentElement) return;

        // Add loading class for smooth transition
        document.documentElement.classList.add('theme-switching');
      });

      // Get final theme config
      const finalThemeConfig = this.themeRegistry.getTheme(themeName)!;
      const cssPath = finalThemeConfig.modes[resolvedMode];

      // Fetch CSS content and extract variables
      let cssVariables: Record<string, string> = {};

      if (cssPath.startsWith('blob:')) {
        // Handle blob URLs (installed themes) - always cache miss
        PerformanceTracker.trackCacheMiss('CSS Theme Data');
        cssVariables = await PerformanceTracker.measureAsync('CSS Fetch (Cold)', async () => {
          const response = await fetch(cssPath);
          const cssContent = await response.text();
          return this.extractCSSVariables(cssContent);
        });
      } else {
        // Handle static file themes - check for cache hit/miss
        const isCached = this.prefetchedThemes.has(`${themeName}-${resolvedMode}`);

        if (isCached) {
          PerformanceTracker.trackCacheHit('CSS Theme Data');
          cssVariables = await PerformanceTracker.measureAsync('CSS Fetch (Cached)', async () => {
            const response = await fetch(cssPath);
            if (!response.ok) {
              throw new Error(`Failed to fetch CSS: ${response.status}`);
            }
            const cssContent = await response.text();
            return this.extractCSSVariables(cssContent);
          });
        } else {
          PerformanceTracker.trackCacheMiss('CSS Theme Data');
          cssVariables = await PerformanceTracker.measureAsync('CSS Fetch (Cold)', async () => {
            const response = await fetch(cssPath);
            if (!response.ok) {
              throw new Error(`Failed to fetch CSS: ${response.status}`);
            }
            const cssContent = await response.text();
            this.prefetchedThemes.add(`${themeName}-${resolvedMode}`); // Mark as cached
            return this.extractCSSVariables(cssContent);
          });
        }
      }

      // Apply CSS variables directly to document root
      PerformanceTracker.measure('CSS Variables Apply', () => {
        this.applyCSSVariables(cssVariables, enableTransition);
      });

      // Remove any previous theme CSS link
      if (this.currentStyleElement) {
        this.currentStyleElement.remove();
        this.currentStyleElement = null;
      }

      // Set data attributes for debugging
      safeDOMManipulation(() => {
        const document = safeGetDocument();
        if (!document?.documentElement) return;

        document.documentElement.setAttribute('data-theme', themeName);
        document.documentElement.setAttribute('data-mode', resolvedMode);
      });

      // Load fonts for this theme if available
      try {
        const themeConfig = this.themeRegistry.getTheme(themeName);
        if (themeConfig && themeConfig.fonts) {

          // Load external fonts if defined
          if (themeConfig.externalFonts && themeConfig.externalFonts.length > 0) {
            const fontFamilyNames = themeConfig.externalFonts.map(font => font.family);
            const fontLoadType = this.areFontsAlreadyLoaded(fontFamilyNames) ? 'Font Loading (Cached)' : 'Font Loading (Cold)';
            const isCached = fontLoadType.includes('Cached');

            if (isCached) {
              PerformanceTracker.trackCacheHit('Font Data');
            } else {
              PerformanceTracker.trackCacheMiss('Font Data');
            }

            await PerformanceTracker.measureAsync(fontLoadType, async () => {
              // Convert to CSS vars format for font loader
              const fontVars = {
                'font-sans': themeConfig.fonts.sans,
                'font-serif': themeConfig.fonts.serif,
                'font-mono': themeConfig.fonts.mono
              };
              await this.fontLoader.loadThemeFonts(fontVars);
            });
          }
        }
      } catch (fontError) {
        console.warn('Font loading failed:', fontError);
      }

      // Trigger transition animation
      safeSetTimeout(() => {
        safeDOMManipulation(() => {
          const document = safeGetDocument();
          if (!document?.documentElement) return;

          document.documentElement.classList.remove('theme-switching');
          document.documentElement.classList.add('theme-switch');

          safeSetTimeout(() => {
            document.documentElement.classList.remove('theme-switch');
          }, 200);
        });
      }, 50);

    } catch (error) {
      console.error(`Failed to load theme "${themeName}" (${resolvedMode}):`, error);
      safeDOMManipulation(() => {
        const document = safeGetDocument();
        document?.documentElement.classList.remove('theme-switching');
      });
      throw error;
    }
  }

  /**
   * Extract CSS variables from CSS content
   */
  private extractCSSVariables(cssContent: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Match :root { ... } block
    const rootMatch = cssContent.match(/:root\s*{([^}]+)}/);
    if (!rootMatch) {
      return variables;
    }
    
    const rootContent = rootMatch[1];
    
    // Extract CSS variable declarations
    const variableMatches = rootContent.match(/--[\w-]+:\s*[^;]+/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const [property, value] = match.split(':').map(s => s.trim());
        if (property && value) {
          variables[property] = value;
        }
      });
    }
    
    return variables;
  }

  /**
   * Apply CSS variables directly to document root
   */
  private applyCSSVariables(variables: Record<string, string>, enableTransition: boolean = false, useImportant: boolean = false): void {
    safeDOMManipulation(() => {
      const document = safeGetDocument();
      const root = document?.documentElement;
      const body = document?.body;

      if (!root) return;

      // Apply transition class only when theme actually changes
      if (enableTransition && body) {
        body.classList.add('theme-transition');
        // Remove transition class after animation completes
        safeSetTimeout(() => {
          body?.classList.remove('theme-transition');
        }, 200);
      }

      // Apply each variable
      Object.entries(variables).forEach(([property, value]) => {
        if (useImportant) {
          root.style.setProperty(property, value, 'important');
          console.log(`🎨 Applied with !important: ${property} = ${value}`);
        } else {
          root.style.setProperty(property, value);
        }
      });
    });
  }

  /**
   * Apply theme variables temporarily for preview (no storage save)
   * @param themeData - Theme data containing CSS variables
   * @param mode - Theme mode to apply
   */
  applyThemeVariablesTemporary(themeData: any, mode: 'light' | 'dark'): void {
    console.log('🎨 applyThemeVariablesTemporary called with mode:', mode);
    console.log('🔍 themeData structure:', {
      name: themeData.name,
      availableModes: Object.keys(themeData.cssVars || {}),
      cssVars: themeData.cssVars
    });
    
    const variables = themeData.cssVars[mode] || themeData.cssVars.theme || themeData.cssVars.light;
    
    if (!variables) {
      console.warn('❌ No variables found for mode:', mode, 'Available:', Object.keys(themeData.cssVars || {}));
      return;
    }
    
    console.log('✅ Using variables for mode:', mode, 'Variables count:', Object.keys(variables).length);
    
    if (variables) {
      // Clear any existing inline styles first to ensure clean application
      const root = document.documentElement;
      
      // Get all CSS custom properties currently set
      const computedStyle = getComputedStyle(root);
      const existingVars = Array.from(root.style).filter(prop => prop.startsWith('--'));
      
      // Remove existing inline custom properties
      existingVars.forEach(prop => {
        root.style.removeProperty(prop);
      });
      
      // Apply new variables with !important for preview (higher specificity)
      this.applyCSSVariables(variables, false, true);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get current mode
   */
  getCurrentMode(): 'light' | 'dark' | 'auto' {
    return this.currentMode;
  }

  /**
   * Get the resolved effective mode (converts 'auto' to 'light' or 'dark')
   * @returns The resolved mode based on current mode and system preferences
   */
  getEffectiveMode(): 'light' | 'dark' {
    if (this.currentMode === 'auto') {
      const mediaQuery = safeMatchMedia('(prefers-color-scheme: dark)');
      return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentMode;
  }

  /**
   * Toggle mode between light, dark, and auto
   * @returns Promise que se resuelve cuando el modo se ha cambiado
   */
  async toggleMode(): Promise<void> {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    await this.setTheme(this.currentTheme, nextMode);
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    try {
      return this.themeRegistry.getAvailableThemes();
    } catch (error) {
      return [];
    }
  }

  /**
   * Install a new theme dynamically
   */
  async installTheme(themeData: { name: string; cssVars: any }, sourceUrl?: string): Promise<ThemeConfig> {
    try {
      
      // Use theme registry to install and manage the theme
      const installedTheme = await this.themeRegistry.installTheme(themeData, sourceUrl || '');
      
      
      // Dispatch theme installed event
      this.dispatchEvent('theme-installed', installedTheme);
      
      return installedTheme;
      
    } catch (error) {
      console.error(`❌ Failed to install theme ${themeData.name}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a theme
   */
  async uninstallTheme(themeId: string): Promise<void> {
    try {
      // Get theme info before uninstalling for event
      const theme = this.themeRegistry.getTheme(themeId);
      
      // Uninstall theme through registry
      await this.themeRegistry.uninstallTheme(themeId);
      
      // Dispatch theme uninstalled event
      this.dispatchEvent('theme-uninstalled', { themeId, theme });
      
    } catch (error) {
      console.error(`❌ Failed to uninstall theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Get theme registry for advanced operations
   */
  getThemeRegistry(): ThemeRegistry {
    return this.themeRegistry;
  }

  /**
   * Get font manager for font operations
   */
  getFontManager(): FontManager {
    return this.fontManager;
  }

  /**
   * Check if fonts are already loaded in browser cache
   */
  private areFontsAlreadyLoaded(fontFamilies: string[]): boolean {
    if (!isClient()) return false;

    const document = safeGetDocument();
    if (!document?.fonts) return false;

    return fontFamilies.every(fontFamily => {
      // Check if font is already loaded in document.fonts
      for (const font of document.fonts) {
        if (font.family.includes(fontFamily) && font.status === 'loaded') {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Save theme settings with debouncing (optimized)
   */
  private saveThemeSettings(theme: string, mode: 'light' | 'dark' | 'auto'): void {
    // Store pending values
    this.themeStorage.pending.theme = theme;
    this.themeStorage.pending.mode = mode;

    // Clear existing timer
    if (this.themeStorage.timer) {
      safeClearTimeout(this.themeStorage.timer);
    }

    // Debounced save
    this.themeStorage.timer = safeSetTimeout(() => {
      this.performThemeStorageSave();
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Perform actual theme storage save (async)
   */
  private performThemeStorageSave(): void {
    if (!this.themeStorage.pending.theme && !this.themeStorage.pending.mode) return;

    // Use requestIdleCallback for non-blocking save
    if (isClient()) {
      const window = safeGetWindow();
      if (window?.requestIdleCallback) {
        window.requestIdleCallback(() => {
          this.saveThemeToStorage();
        });
      } else {
        safeSetTimeout(() => {
          this.saveThemeToStorage();
        }, 0);
      }
    }
  }

  /**
   * Save theme to StorageManager (async)
   */
  private async saveThemeToStorage(): Promise<void> {
    const { theme, mode } = this.themeStorage.pending;
    
    try {
      if (theme && mode) {
        const config: ThemeModeConfig = {
          currentTheme: theme,
          currentMode: mode as 'light' | 'dark' | 'auto',
          timestamp: Date.now()
        };
        
        await PerformanceTracker.measureStorageOperationAsync('indexedDB', 'write', async () => {
          await this.storageManager.storeThemeModeConfig(config);
        });
        
        // Also update FOUC-critical localStorage keys so SSR FOUC script can pick them synchronously
        try {
          this.storageManager.setCurrentTheme(config.currentTheme);
          this.storageManager.setCurrentMode(config.currentMode);
        } catch (e) {
          // Non-fatal if localStorage is unavailable
        }
      }
      
      // Clear pending saves
      this.themeStorage.pending = {};
    } catch (error) {
      console.error('❌ ThemeManager: Failed to save settings', error);
    }
  }

  /**
   * Event system methods
   */
  
  /**
   * Add event listener
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ ThemeManager: Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Add theme change listener (convenience method)
   */
  onThemeChange(callback: (themeData: { theme: string; mode: 'light' | 'dark' | 'auto'; effectiveMode: 'light' | 'dark' }) => void): void {
    this.addEventListener('theme-changed', callback);
  }

  /**
   * Remove theme change listener
   */
  offThemeChange(callback: Function): void {
    this.removeEventListener('theme-changed', callback);
  }
}