import { StorageManager, CachedTheme } from './storage-manager';


/**
 * Theme configuration interface matching registry.json schema
 */
export interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  description?: string;
  author?: string;
  version: string;
  source: 'local' | 'url' | 'custom';
  category: 'built-in' | 'installed' | 'custom';
  modes: {
    light: string;
    dark: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
  config: {
    radius: string;
  };
  externalFonts?: Array<{
    family: string;
    source: 'google-fonts' | 'url';
    weights: number[];
    styles: string[];
  }>;
  // For installed themes
  installedAt?: number;
  sourceUrl?: string;
  enabled?: boolean;
}

/**
 * Registry schema for built-in themes
 */
interface ThemeRegistryData {
  version: string;
  lastUpdated: string;
  themes: ThemeConfig[];
}

/**
 * ThemeRegistry - Manages both built-in and user-installed themes
 */
export class ThemeRegistry {
  private storageManager: StorageManager;
  private builtInThemes: ThemeConfig[] = [];
  private installedThemes: ThemeConfig[] = [];
  private allThemes: Map<string, ThemeConfig> = new Map();
  private isInitialized = false;

  constructor() {
    this.storageManager = StorageManager.getInstance();
  }

  /**
   * FAST synchronous initialization with built-in themes available immediately
   * @returns Promise que se resuelve con built-in themes y installed themes
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 [ThemeRegistry] Fast initialization (built-in + installed themes)...');
      
      // Load built-in themes immediately (await to make them available before proceeding)
      await this.loadBuiltInThemes();
      console.log('✅ [ThemeRegistry] Built-in themes loaded synchronously');
      
      // Initialize storage (typically fast IndexedDB connection)
      await this.storageManager.init();
      
      // Load user-installed themes from IndexedDB (fast, local)
      await this.loadInstalledThemes();
      
      // Build registry with both built-in and installed themes
      this.buildUnifiedRegistry();
      
      this.isInitialized = true;
      console.log('✅ [ThemeRegistry] Initialization completed - all themes available immediately');
      
    } catch (error) {
      console.error('❌ ThemeRegistry: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load built-in themes from registry.json
   */
  private async loadBuiltInThemes(): Promise<void> {
    try {
      console.log('🔄 [ThemeRegistry] Fetching /shadcn-basecoat-theming/registry.json...');
      const response = await fetch('/shadcn-basecoat-theming/registry.json');
      console.log('✅ [ThemeRegistry] Fetch response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch registry.json: ${response.status}`);
      }

      console.log('🔄 [ThemeRegistry] Parsing JSON response...');
      const registryData: ThemeRegistryData = await response.json();
      console.log('✅ [ThemeRegistry] JSON parsed successfully');
      
      // Validate registry data
      if (!registryData.themes || !Array.isArray(registryData.themes)) {
        throw new Error('Invalid registry.json format');
      }

      this.builtInThemes = registryData.themes.map(theme => ({
        ...theme,
        category: 'built-in' as const,
        source: 'local' as const
      }));

      
    } catch (error) {
      console.error('❌ ThemeRegistry: Failed to load built-in themes:', error);
      // Continue with empty built-in themes rather than failing completely
      this.builtInThemes = [];
    }
  }

  /**
   * Load user-installed themes from IndexedDB
   */
  private async loadInstalledThemes(): Promise<void> {
    try {
      
      const cachedThemes = await this.storageManager.getAllThemes();
      
      // Debug: Log all cached themes
      cachedThemes.forEach(cached => {
      });

      // Convert cached themes to theme config format
      // Filter out internal config records
      this.installedThemes = cachedThemes
        .filter(cached => cached.installed && !cached.name.startsWith('__'))
        .map(cached => this.convertCachedToThemeConfig(cached));

      
    } catch (error) {
      console.error('❌ ThemeRegistry: Failed to load installed themes:', error);
      this.installedThemes = [];
    }
  }

  /**
   * Convert cached theme to theme config format
   */
  private convertCachedToThemeConfig(cached: CachedTheme): ThemeConfig {
    const allVars = { 
      ...cached.data.cssVars.light, 
      ...cached.data.cssVars.dark, 
      ...cached.data.cssVars.theme 
    };

    return {
      id: cached.name,
      name: cached.name,
      label: cached.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `Installed theme from ${new URL(cached.url).hostname}`,
      author: 'External',
      version: '1.0.0',
      source: 'url',
      category: 'installed',
      modes: this.generateBlobURLs(cached),
      fonts: {
        sans: allVars['font-sans'] || 'system-ui, sans-serif',
        serif: allVars['font-serif'] || 'Georgia, serif', 
        mono: allVars['font-mono'] || 'monospace'
      },
      preview: {
        primary: allVars['primary'] || '#000',
        background: allVars['background'] || '#fff',
        accent: allVars['accent'] || '#f0f0f0'
      },
      config: {
        radius: allVars['radius'] || '0.5rem'
      },
      installedAt: cached.timestamp,
      sourceUrl: cached.url,
      enabled: true
    };
  }

  /**
   * Build unified registry combining built-in and installed themes
   */
  private buildUnifiedRegistry(): void {
    this.allThemes.clear();

    // Add built-in themes
    this.builtInThemes.forEach(theme => {
      this.allThemes.set(theme.id, theme);
    });

    // Add installed themes (they can override built-in if same ID)
    this.installedThemes.forEach(theme => {
      this.allThemes.set(theme.id, theme);
    });

  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    this.ensureInitialized();
    return Array.from(this.allThemes.values());
  }

  /**
   * Get theme by ID
   */
  getTheme(id: string): ThemeConfig | null {
    this.ensureInitialized();
    return this.allThemes.get(id) || null;
  }

  /**
   * Generate real blob URLs from cached CSS content
   */
  private generateBlobURLs(cached: CachedTheme): { light: string; dark: string } {
    const cssData = cached.data.cssVars;
    
    // Generate CSS content for light and dark modes
    const lightCSS = this.generateCSSFromVars(cssData.light || cssData.theme || {});
    const darkCSS = this.generateCSSFromVars(cssData.dark || cssData.theme || {});
    
    // Create real blob URLs
    const lightBlob = new Blob([lightCSS], { type: 'text/css' });
    const darkBlob = new Blob([darkCSS], { type: 'text/css' });
    
    const lightURL = URL.createObjectURL(lightBlob);
    const darkURL = URL.createObjectURL(darkBlob);
    
    
    return {
      light: lightURL,
      dark: darkURL
    };
  }

  /**
   * Generate CSS content from variables
   */
  private generateCSSFromVars(vars: Record<string, string>): string {
    let css = '/* Generated CSS from theme variables */\n:root {\n';
    
    Object.entries(vars).forEach(([key, value]) => {
      // Ensure CSS variable format
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      css += `  ${cssVar}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }

  /**
   * Get only built-in themes
   */
  getBuiltInThemes(): ThemeConfig[] {
    this.ensureInitialized();
    return this.builtInThemes;
  }

  /**
   * Get only installed themes  
   */
  getInstalledThemes(): ThemeConfig[] {
    this.ensureInitialized();
    return this.installedThemes;
  }

  /**
   * Install a new theme
   */
  async installTheme(themeData: { name: string; cssVars: any }, sourceUrl: string): Promise<ThemeConfig> {
    this.ensureInitialized();
    
    try {
      
      // Cache in storage manager
      const cachedTheme: CachedTheme = {
        name: themeData.name,
        url: sourceUrl,
        data: themeData,
        installed: true,
        timestamp: Date.now()
      };

      await this.storageManager.storeTheme(cachedTheme);
      
      // Convert to theme config and add to registry
      const themeConfig = this.convertCachedToThemeConfig(cachedTheme);
      
      // Add to installed themes and unified registry
      const existingIndex = this.installedThemes.findIndex(t => t.id === themeConfig.id);
      if (existingIndex >= 0) {
        this.installedThemes[existingIndex] = themeConfig;
      } else {
        this.installedThemes.push(themeConfig);
      }
      
      this.allThemes.set(themeConfig.id, themeConfig);
      
      return themeConfig;
      
    } catch (error) {
      console.error(`❌ ThemeRegistry: Failed to install theme ${themeData.name}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a theme
   */
  async uninstallTheme(themeId: string): Promise<void> {
    this.ensureInitialized();
    
    const theme = this.getTheme(themeId);
    if (!theme || theme.category !== 'installed') {
      throw new Error(`Cannot uninstall theme: ${themeId}`);
    }

    try {
      
      // Remove from storage
      await this.storageManager.deleteTheme(themeId);
      
      // Remove from installed themes
      this.installedThemes = this.installedThemes.filter(t => t.id !== themeId);
      
      // Remove from unified registry
      this.allThemes.delete(themeId);
      
      console.log(`✅ ThemeRegistry: Theme ${themeId} uninstalled successfully`);
      
    } catch (error) {
      console.error(`❌ ThemeRegistry: Failed to uninstall theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Check if registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ThemeRegistry not initialized. Call init() first.');
    }
  }

  /**
   * Get registry statistics for debugging
   */
  getStats(): { total: number, builtIn: number, installed: number } {
    return {
      total: this.allThemes.size,
      builtIn: this.builtInThemes.length,
      installed: this.installedThemes.length
    };
  }

  /**
   * Refresh registry (reload from sources)
   */
  async refresh(): Promise<void> {
    this.isInitialized = false;
    this.allThemes.clear();
    this.builtInThemes = [];
    this.installedThemes = [];
    
    await this.init();
  }

}