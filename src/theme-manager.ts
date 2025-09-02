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
  private readonly THEME_STORAGE_KEY = 'theme';
  private readonly MODE_STORAGE_KEY = 'theme-mode';
  private currentStyleElement: HTMLLinkElement | null = null;
  private fontLoader: FontLoader;
  
  // Performance optimizations  
  private prefetchedThemes: Set<string> = new Set(); // Single-request prefetch tracking
  private readonly BUILTIN_THEMES = ['default', 'supabase']; // Built-in themes for preloading
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
      
      // Preload built-in themes in background (non-blocking)
      this.preloadBuiltinThemes();
      
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
    
    console.log(`🚀 ThemeManager: Prefetching ${this.BUILTIN_THEMES.length} built-in themes`);
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
   * Apply a specific theme using direct CSS variable updates (optimized)
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
      
      // Get final theme config
      const finalThemeConfig = this.themeRegistry.getTheme(themeName)!;
      const cssPath = finalThemeConfig.modes[resolvedMode];
      
      console.log(`🔄 Loading CSS variables from: ${cssPath}`);
      
      // Fetch CSS content and extract variables
      let cssVariables: Record<string, string> = {};
      
      if (cssPath.startsWith('blob:')) {
        // Handle blob URLs (installed themes)
        console.log(`💫 Loading blob theme: ${themeName}`);
        const response = await fetch(cssPath);
        const cssContent = await response.text();
        cssVariables = this.extractCSSVariables(cssContent);
      } else {
        // Handle static file themes
        console.log(`📁 Loading static theme: ${cssPath}`);
        const response = await fetch(cssPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSS: ${response.status}`);
        }
        const cssContent = await response.text();
        cssVariables = this.extractCSSVariables(cssContent);
      }
      
      // Apply CSS variables directly to document root
      const startTime = performance.now();
      this.applyCSSVariables(cssVariables);
      const applyTime = performance.now() - startTime;
      console.log(`⚡ CSS variables applied: ${applyTime.toFixed(1)}ms`);
      
      // Remove any previous theme CSS link
      if (this.currentStyleElement) {
        this.currentStyleElement.remove();
        this.currentStyleElement = null;
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
   * Extract CSS variables from CSS content
   */
  private extractCSSVariables(cssContent: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Match :root { ... } block
    const rootMatch = cssContent.match(/:root\s*{([^}]+)}/);
    if (!rootMatch) {
      console.warn('No :root block found in CSS content');
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
    
    console.log(`🔍 Extracted ${Object.keys(variables).length} CSS variables`);
    return variables;
  }

  /**
   * Apply CSS variables directly to document root
   */
  private applyCSSVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    
    // Apply each variable
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    console.log(`✅ Applied ${Object.keys(variables).length} CSS variables to document root`);
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