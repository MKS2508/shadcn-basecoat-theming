import { FontLoader } from './font-loader';
import { ThemeRegistry, ThemeConfig } from './theme-registry';
import { FontManager } from './font-manager';

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  
  static startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }
  
  static endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`📊 Performance [${label}]: ${duration.toFixed(1)}ms`);
      this.metrics.delete(label);
      return duration;
    }
    return 0;
  }
  
  static measureThemeSwitch(themeName: string, mode: string, duration: number): void {
    const target = duration < 16 ? '🚀' : duration < 50 ? '⚡' : '📈';
    console.log(`${target} Theme Switch [${themeName}-${mode}]: ${duration.toFixed(1)}ms`);
    
    if (duration > 50) {
      console.warn(`⚠️ Theme switch exceeded 50ms target: ${duration.toFixed(1)}ms`);
    }
  }
}

/**
 * Manages theme loading, caching, and application
 */
export class ThemeManager {
  private themeRegistry: ThemeRegistry;
  private fontManager: FontManager;
  private currentTheme: string = 'default';
  private currentMode: 'light' | 'dark' | 'auto' = 'auto';
  private loadedThemes: Set<string> = new Set();
  private themeCache: Map<string, string> = new Map();
  private readonly THEME_STORAGE_KEY = 'theme';
  private readonly MODE_STORAGE_KEY = 'theme-mode';
  private currentStyleElement: HTMLLinkElement | null = null;
  private fontLoader: FontLoader;
  
  // Performance optimizations  
  private prefetchedThemes: Set<string> = new Set(); // Single-request prefetch tracking
  private readonly POPULAR_THEMES = ['default', 'supabase']; // Themes to preload
  private readonly MAX_CACHED_THEMES = 3; // LRU cache limit
  private prefetchPromises: Map<string, Promise<void>> = new Map();
  
  // Storage optimization
  private readonly SAVE_DEBOUNCE_MS = 200;
  private themeStorage: {timer: NodeJS.Timeout | null, pending: {theme?: string, mode?: string}} = {
    timer: null, 
    pending: {}
  };
  
  constructor() {
    this.themeRegistry = new ThemeRegistry();
    this.fontManager = new FontManager();
    this.fontLoader = new FontLoader();
  }


  /**
   * Get critical CSS for specific theme (legacy function kept for compatibility)
   */
  private injectCriticalCSS(): void {
    const criticalCSS = `
/* Critical CSS - Inline for 0ms cold start */
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.3527 0.1722 263.94);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5486 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --radius: 0.5rem;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: "Fira Code", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

/* Critical selectors for immediate render */
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  margin: 0;
  padding: 0;
}

* {
  border-color: var(--border);
}
`.trim();

    const style = document.createElement('style');
    style.id = 'critical-css';
    style.textContent = criticalCSS;
    
    // Insert at the very beginning for maximum priority
    const firstChild = document.head.firstChild;
    if (firstChild) {
      document.head.insertBefore(style, firstChild);
    } else {
      document.head.appendChild(style);
    }
    
    console.log('⚡ ThemeManager: Critical CSS injected (0ms cold start)');
  }


  /**
   * Initialize the theme manager (with performance monitoring)
   */
  async init(): Promise<void> {
    try {
      PerformanceMonitor.startTimer('theme-manager-init');
      console.log('🎨 ThemeManager: Initializing...');
      
      // Initialize theme registry first
      await this.themeRegistry.init();
      
      // Initialize font manager
      await this.fontManager.init();
      
      // Get saved theme and mode
      const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) || 'default';
      const savedMode = localStorage.getItem(this.MODE_STORAGE_KEY) as 'light' | 'dark' | 'auto' || 'auto';
      
      // Validate saved theme exists in registry
      const themeExists = this.themeRegistry.getTheme(savedTheme);
      this.currentTheme = themeExists ? savedTheme : 'default';
      this.currentMode = savedMode;
      
      console.log(`🎨 ThemeManager: Applying theme: ${this.currentTheme}, mode: ${this.currentMode}`);
      
      // Apply initial theme
      await this.applyTheme(this.currentTheme, this.currentMode);
      
      // Preload popular themes in background (non-blocking)
      this.preloadPopularThemes();
      
      // End initialization timer
      PerformanceMonitor.endTimer('theme-manager-init');
      console.log('✅ ThemeManager: Initialized successfully');
      
    } catch (error) {
      console.error('❌ ThemeManager: Failed to initialize:', error);
      
      // Fallback to basic initialization
      this.currentTheme = 'default';
      this.currentMode = 'auto';
      
      // Try to apply default theme without registry
      console.log('🔄 ThemeManager: Attempting fallback initialization...');
    }
  }

  /**
   * Set a new theme (with performance monitoring)
   */
  async setTheme(theme: string, mode?: 'light' | 'dark' | 'auto'): Promise<void> {
    const newMode = mode || this.currentMode;
    
    if (theme === this.currentTheme && newMode === this.currentMode) return;

    // Start performance timer
    const timerLabel = `theme-switch-${theme}-${newMode}`;
    PerformanceMonitor.startTimer(timerLabel);

    this.currentTheme = theme;
    this.currentMode = newMode;
    
    // Debounced storage save (non-blocking)
    this.saveThemeSettings(theme, newMode);

    console.log(`🔄 Setting theme: ${theme}, mode: ${newMode}`);
    await this.applyTheme(theme, newMode);
    
    // End performance timer and log metrics
    const duration = PerformanceMonitor.endTimer(timerLabel);
    PerformanceMonitor.measureThemeSwitch(theme, newMode, duration);
  }

  /**
   * Prefetch popular themes for instant switching (single-request)
   */
  private preloadPopularThemes(): void {
    this.POPULAR_THEMES.forEach(themeName => {
      if (themeName !== this.currentTheme) {
        // Prefetch both light and dark modes (background, single request each)
        this.prefetchTheme(themeName, 'light');
        this.prefetchTheme(themeName, 'dark');
      }
    });
    
    console.log(`🚀 ThemeManager: Prefetching ${this.POPULAR_THEMES.length} popular themes`);
  }

  /**
   * Prefetch a specific theme (single-request optimization)
   */
  private prefetchTheme(themeName: string, mode: 'light' | 'dark'): void {
    const themeConfig = this.themeRegistry.getTheme(themeName);
    if (!themeConfig) return;

    const cssPath = themeConfig.modes[mode];
    const prefetchKey = `${themeName}-${mode}`;
    
    // Skip if already prefetching or prefetched
    if (this.prefetchedThemes.has(prefetchKey) || this.prefetchPromises.has(prefetchKey)) {
      return;
    }

    const prefetchPromise = new Promise<void>((resolve) => {
      // Single request: use prefetch for background loading
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = cssPath;
      link.crossOrigin = 'anonymous';
      link.id = `theme-prefetch-${prefetchKey}`;
      
      link.onload = () => {
        this.prefetchedThemes.add(prefetchKey);
        console.log(`⚡ ThemeManager: Prefetched ${prefetchKey}`);
        resolve();
      };
      
      link.onerror = () => {
        console.warn(`⚠️ ThemeManager: Failed to prefetch ${prefetchKey}`);
        resolve();
      };
      
      document.head.appendChild(link);
    });

    this.prefetchPromises.set(prefetchKey, prefetchPromise);
  }

  /**
   * Apply a specific theme using CSS file loading (optimized)
   */
  private async applyTheme(themeName: string, mode: 'light' | 'dark' | 'auto'): Promise<void> {
    console.log(`🎨 Applying theme: ${themeName}, mode: ${mode}`);
    
    // Get theme config from registry
    const themeConfig = this.themeRegistry.getTheme(themeName);
    if (!themeConfig) {
      console.warn(`Theme "${themeName}" not found in registry, falling back to default`);
      themeName = 'default';
      const fallbackTheme = this.themeRegistry.getTheme('default');
      if (!fallbackTheme) {
        throw new Error('Default theme not found in registry');
      }
    }

    // Resolve mode
    let resolvedMode: 'light' | 'dark';
    if (mode === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedMode = systemPrefersDark ? 'dark' : 'light';
      console.log(`🔍 Auto mode resolved to: ${resolvedMode}`);
    } else {
      resolvedMode = mode;
    }

    try {
      // Add loading class for smooth transition
      document.documentElement.classList.add('theme-switching');
      
      // Get CSS file path from theme config
      const finalThemeConfig = this.themeRegistry.getTheme(themeName)!;
      const cssPath = finalThemeConfig.modes[resolvedMode];
      const preloadKey = `${themeName}-${resolvedMode}`;
      
      // Remove previous theme CSS
      if (this.currentStyleElement) {
        console.log(`🗑️ Removing previous theme CSS`);
        this.currentStyleElement.remove();
      }
      
      // Check if theme is prefetched for fast switching
      const prefetchKey = `${themeName}-${resolvedMode}`;
      const isPrefetched = this.prefetchedThemes.has(prefetchKey);
      
      if (isPrefetched) {
        // Fast theme switch: browser cache hit from prefetch
        console.log(`⚡ Using prefetched theme: ${prefetchKey}`);
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet'; 
        linkElement.href = cssPath;
        linkElement.id = 'theme-css';
        
        // Should be near-instant due to prefetch cache
        await new Promise((resolve, reject) => {
          const startTime = performance.now();
          linkElement.onload = () => {
            const loadTime = performance.now() - startTime;
            console.log(`⚡ Prefetched theme loaded: ${loadTime.toFixed(1)}ms`);
            resolve(void 0);
          };
          linkElement.onerror = () => {
            console.error(`❌ Failed to load prefetched CSS: ${cssPath}`);
            reject(new Error(`Failed to load theme CSS: ${cssPath}`));
          };
          document.head.appendChild(linkElement);
        });
        
        this.currentStyleElement = linkElement;
      } else {
        // Cold load: Direct theme loading + prefetch for next time
        console.log(`📁 Loading theme CSS (cold): ${cssPath}`);
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = cssPath;
        linkElement.id = 'theme-css';
        
        // Wait for CSS to load
        await new Promise((resolve, reject) => {
          const startTime = performance.now();
          linkElement.onload = () => {
            const loadTime = performance.now() - startTime;
            console.log(`✅ Theme loaded (cold): ${loadTime.toFixed(1)}ms`);
            resolve(void 0);
          };
          linkElement.onerror = () => {
            // Special handling for blob URLs (installed themes)
            if (cssPath.startsWith('blob:')) {
              console.warn(`⚠️ Blob theme fallback for: ${themeName}`);
              // Use critical CSS as fallback for blob themes
              resolve(void 0);
            } else {
              console.error(`❌ Failed to load CSS: ${cssPath}`);
              reject(new Error(`Failed to load theme CSS: ${cssPath}`));
            }
          };
          document.head.appendChild(linkElement);
        });
        
        this.currentStyleElement = linkElement;
        
        // Prefetch for next time
        setTimeout(() => this.prefetchTheme(themeName, resolvedMode), 100);
      }
      
      // Set data attributes for debugging
      document.documentElement.setAttribute('data-theme', themeName);
      document.documentElement.setAttribute('data-mode', resolvedMode);
      console.log(`📝 Set data-theme: ${themeName}, data-mode: ${resolvedMode}`);
      
      // Load fonts for this theme if available
      try {
        const themeConfig = this.themeRegistry.getTheme(themeName);
        if (themeConfig && themeConfig.fonts) {
          console.log(`🔤 Loading fonts for theme: ${themeName}`);
          
          // Load external fonts if defined
          if (themeConfig.externalFonts && themeConfig.externalFonts.length > 0) {
            // Convert to CSS vars format for font loader
            const fontVars = {
              'font-sans': themeConfig.fonts.sans,
              'font-serif': themeConfig.fonts.serif,
              'font-mono': themeConfig.fonts.mono
            };
            await this.fontLoader.loadThemeFonts(fontVars);
          }
        }
      } catch (fontError) {
        console.warn('⚠️ Font loading failed, but theme applied successfully:', fontError);
      }
      
      // Trigger transition animation
      setTimeout(() => {
        document.documentElement.classList.remove('theme-switching');
        document.documentElement.classList.add('theme-switch');
        
        setTimeout(() => {
          document.documentElement.classList.remove('theme-switch');
        }, 200);
      }, 50);
      
    } catch (error) {
      console.error(`Failed to load theme "${themeName}" (${resolvedMode}):`, error);
      document.documentElement.classList.remove('theme-switching');
      throw error;
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
   * Get available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    try {
      return this.themeRegistry.getAvailableThemes();
    } catch (error) {
      console.warn('⚠️ ThemeRegistry not initialized, returning empty themes list');
      return [];
    }
  }

  /**
   * Install a new theme dynamically
   */
  async installTheme(themeData: { name: string; cssVars: any }, sourceUrl?: string): Promise<void> {
    try {
      console.log(`🎨 Installing theme: ${themeData.name}`);
      
      // Use theme registry to install and manage the theme
      const installedTheme = await this.themeRegistry.installTheme(themeData, sourceUrl || '');
      
      console.log(`✅ Theme installed via registry: ${themeData.name}`);
      
      // Trigger regeneration of theme dropdown
      this.onThemeInstalled?.(installedTheme);
      
    } catch (error) {
      console.error(`❌ Failed to install theme ${themeData.name}:`, error);
      throw error;
    }
  }

  /**
   * Callback for when a theme is installed (for UI updates)
   */
  private onThemeInstalled?: (theme: ThemeConfig) => void;

  /**
   * Set callback for theme installation
   */
  setOnThemeInstalledCallback(callback: (theme: ThemeConfig) => void): void {
    this.onThemeInstalled = callback;
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
   * Save theme settings with debouncing (optimized)
   */
  private saveThemeSettings(theme: string, mode: 'light' | 'dark' | 'auto'): void {
    // Store pending values
    this.themeStorage.pending.theme = theme;
    this.themeStorage.pending.mode = mode;
    
    // Clear existing timer
    if (this.themeStorage.timer) {
      clearTimeout(this.themeStorage.timer);
    }
    
    // Debounced save
    this.themeStorage.timer = setTimeout(() => {
      this.performThemeStorageSave();
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Perform actual theme storage save (async)
   */
  private performThemeStorageSave(): void {
    if (!this.themeStorage.pending.theme && !this.themeStorage.pending.mode) return;
    
    // Use requestIdleCallback for non-blocking save
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.saveThemeToStorage();
      });
    } else {
      setTimeout(() => {
        this.saveThemeToStorage();
      }, 0);
    }
  }

  /**
   * Save theme to localStorage (async)
   */
  private saveThemeToStorage(): void {
    const { theme, mode } = this.themeStorage.pending;
    
    try {
      if (theme) {
        localStorage.setItem(this.THEME_STORAGE_KEY, theme);
      }
      if (mode) {
        localStorage.setItem(this.MODE_STORAGE_KEY, mode);
      }
      
      console.log(`💾 ThemeManager: Settings saved (optimized): ${theme || 'current'}, ${mode || 'current'}`);
      
      // Clear pending saves
      this.themeStorage.pending = {};
    } catch (error) {
      console.error('❌ ThemeManager: Failed to save settings', error);
    }
  }
}