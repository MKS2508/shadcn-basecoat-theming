import { getFontById, buildFontFamily, needsGoogleFontsLoad, FontOption } from '../catalogs/font-catalog';
import { StorageManager, CachedFont } from './storage-manager';

/**
 * Font override configuration
 */
export interface FontOverride {
  enabled: boolean;
  fonts: {
    sans?: string;   // Font ID from catalog
    serif?: string;  // Font ID from catalog  
    mono?: string;   // Font ID from catalog
  };
}

/**
 * FontManager - Manages font overrides independent of themes
 */
export class FontManager {
  private currentOverride: FontOverride;
  private readonly STORAGE_KEY = 'font-override';
  private styleElement: HTMLStyleElement | null = null;
  private storageManager: StorageManager;
  
  // Performance optimizations with persistent cache
  private loadedGoogleFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<void>> = new Map();
  private readonly BATCH_DELAY = 50; // ms to batch font loads
  private pendingFontLoads: Set<string> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  
  // Storage optimization
  private readonly SAVE_DEBOUNCE_MS = 100; // Reduced for better responsiveness
  private saveTimer: NodeJS.Timeout | null = null;
  private pendingConfig: FontOverride | null = null;

  constructor() {
    this.currentOverride = {
      enabled: false,
      fonts: {}
    };
    this.storageManager = StorageManager.getInstance();
  }


  /**
   * Inicializa el gestor de fuentes con configuración guardada
   * NO carga fonts automáticamente - solo configuración
   * @returns Promise que se resuelve cuando la inicialización está completa
   */
  async init(): Promise<void> {
    
    // Initialize StorageManager for font cache persistence
    console.log('🔄 [FontManager] Initializing StorageManager...');
    await this.storageManager.init();
    console.log('✅ [FontManager] StorageManager initialized');
    
    // Load saved font override configuration (now with StorageManager ready)
    await this.loadOverrideConfiguration();
    
    // Do NOT apply overrides here - only load them on demand
    // This prevents automatic Google Fonts loading during init
    
    // Clean up any debug test containers
    this.cleanupDebugElements();
    
    console.log('✅ [FontManager] Initialized without loading fonts - fonts will load on demand');
  }

  /**
   * Load font override configuration from localStorage
   */
  private async loadOverrideConfiguration(): Promise<void> {
    try {
      const saved = await this.storageManager.getFontConfig();
      if (saved) {
        // Remove timestamp from loaded config
        const { timestamp, ...config } = saved;
        this.currentOverride = config;
        console.log('✅ FontManager: Loaded configuration from storage');
      } else {
        this.currentOverride = { enabled: false, fonts: {} };
        console.log('ℹ️ FontManager: No saved configuration found, using defaults');
      }
    } catch (error) {
      console.error('❌ FontManager: Failed to load configuration, using defaults:', error);
      this.currentOverride = { enabled: false, fonts: {} };
    }
  }

  /**
   * Save font override configuration with debouncing (optimized)
   */
  private saveOverrideConfiguration(): void {
    const wasTimerActive = this.saveTimer !== null;
    
    // Store pending configuration
    this.pendingConfig = { ...this.currentOverride };
    console.log(`🔄 FontManager: Saving config scheduled${wasTimerActive ? ' (previous timer cancelled)' : ''}:`, this.pendingConfig);
    
    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    // Debounced save to avoid UI blocking
    this.saveTimer = setTimeout(() => {
      console.log('⏰ FontManager: Debounce timer fired, performing save...');
      this.performSave();
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Perform actual save operation (async to avoid blocking)
   */
  private performSave(): void {
    if (!this.pendingConfig) return;
    
    // Use requestIdleCallback for non-blocking save
    if (window.requestIdleCallback) {
      window.requestIdleCallback(async () => {
        await this.saveToStorage();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(async () => {
        await this.saveToStorage();
      }, 0);
    }
  }

  /**
   * Save to localStorage and IndexedDB (async)
   */
  private async saveToStorage(): Promise<void> {
    if (!this.pendingConfig) {
      console.warn('⚠️ FontManager: No pending config to save');
      return;
    }
    
    try {
      const configWithTimestamp = {
        ...this.pendingConfig,
        timestamp: Date.now()
      };
      
      console.log('💾 FontManager: About to save config:', configWithTimestamp);
      
      // Save to both localStorage and IndexedDB via StorageManager
      await this.storageManager.storeFontConfig(configWithTimestamp);
      console.log('✅ FontManager: Configuration saved to storage successfully');
      
      this.pendingConfig = null;
      this.saveTimer = null;
    } catch (error) {
      console.error('❌ FontManager: Failed to save configuration', error);
      this.saveTimer = null;
    }
  }

  /**
   * Get current font override configuration
   */
  getOverrideConfiguration(): FontOverride {
    return { ...this.currentOverride };
  }

  /**
   * Check if font overrides are enabled
   */
  isOverrideEnabled(): boolean {
    return this.currentOverride.enabled;
  }

  /**
   * Enable font overrides
   */
  async enableOverride(): Promise<void> {
    
    this.currentOverride.enabled = true;
    this.saveOverrideConfiguration();
    
    await this.applyFontOverrides();
  }

  /**
   * Disable font overrides (revert to theme fonts)
   */
  async disableOverride(): Promise<void> {
    
    this.currentOverride.enabled = false;
    this.saveOverrideConfiguration();
    
    this.removeFontOverrides();
  }

  /**
   * Establece una fuente personalizada para una categor\u00eda espec\u00edfica
   * @param category - Categor\u00eda de fuente: 'sans', 'serif' o 'mono'
   * @param fontId - ID de la fuente del cat\u00e1logo
   * @returns Promise que se resuelve cuando la fuente se ha aplicado
   */
  async setFontOverride(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    
    // Validate font exists
    const font = getFontById(fontId);
    if (!font) {
      throw new Error(`Font not found: ${fontId}`);
    }

    // Update configuration
    this.currentOverride.fonts[category] = fontId;
    this.saveOverrideConfiguration();

    // Load font if it's from Google Fonts
    if (needsGoogleFontsLoad(font)) {
      await this.loadFontIfNeeded(font);
    }

    // Apply overrides if enabled
    if (this.currentOverride.enabled) {
      await this.applyFontOverrides();
    }
  }

  /**
   * Remove font override for specific category
   */
  async removeFontOverride(category: 'sans' | 'serif' | 'mono'): Promise<void> {
    
    delete this.currentOverride.fonts[category];
    this.saveOverrideConfiguration();

    // Re-apply overrides if enabled
    if (this.currentOverride.enabled) {
      await this.applyFontOverrides();
    }
  }

  /**
   * Get current font for category (considering overrides)
   */
  getCurrentFont(category: 'sans' | 'serif' | 'mono'): FontOption | null {
    if (this.currentOverride.enabled && this.currentOverride.fonts[category]) {
      return getFontById(this.currentOverride.fonts[category]!);
    }
    return null; // Will use theme font
  }

  /**
   * Apply font overrides by injecting CSS
   */
  private async applyFontOverrides(): Promise<void> {
    
    // Load all required Google Fonts
    await this.loadRequiredFonts();
    
    // Generate and inject CSS
    this.injectOverrideCSS();
  }

  /**
   * Load all Google Fonts that are needed for overrides
   */
  private async loadRequiredFonts(): Promise<void> {
    const fontsToLoad: FontOption[] = [];
    
    // Check each category for Google Fonts
    Object.values(this.currentOverride.fonts).forEach(fontId => {
      if (fontId) {
        const font = getFontById(fontId);
        if (font && needsGoogleFontsLoad(font)) {
          fontsToLoad.push(font);
        }
      }
    });

    // Load all fonts in parallel with timeout
    const loadPromises = fontsToLoad.map(font => this.loadFontIfNeeded(font));
    
    try {
      // Add 8-second timeout to font loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Font loading timeout after 8 seconds')), 8000);
      });
      
      await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn('⚠️ [FontManager] Font loading failed or timed out, continuing without Google Fonts:', error);
      console.info('💡 [FontManager] The system will use system fonts as fallbacks');
    }
  }

  /**
   * Load a single font if it's from Google Fonts
   */
  private async loadFontIfNeeded(font: FontOption): Promise<void> {
    if (needsGoogleFontsLoad(font)) {
      await this.loadGoogleFontDirectly(font);
    }
  }

  /**
   * Load Google Font with batching optimization
   */
  private async loadGoogleFontDirectly(font: FontOption): Promise<void> {
    const fontKey = `${font.family}-${font.weights?.join(',') || '400'}`;
    
    // Return existing promise if already loading
    if (this.fontLoadPromises.has(fontKey)) {
      return this.fontLoadPromises.get(fontKey);
    }
    
    // Return immediately if already loaded
    if (this.loadedGoogleFonts.has(fontKey)) {
      return Promise.resolve();
    }

    // Add to batch loading queue
    this.pendingFontLoads.add(fontKey);
    
    const promise = new Promise<void>((resolve, reject) => {
      // Clear existing batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      // Start new batch timer
      this.batchTimer = setTimeout(async () => {
        try {
          await this.processFontBatch();
          this.loadedGoogleFonts.add(fontKey);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.BATCH_DELAY);
    });
    
    this.fontLoadPromises.set(fontKey, promise);
    return promise;
  }

  /**
   * Process batched font loads in single request
   */
  private async processFontBatch(): Promise<void> {
    if (this.pendingFontLoads.size === 0) return;

    const fontsToLoad = Array.from(this.pendingFontLoads);
    this.pendingFontLoads.clear();
    

    // Build combined Google Fonts URL
    const families: string[] = [];
    
    fontsToLoad.forEach(fontKey => {
      const [family, weights] = fontKey.split('-');
      const encodedFamily = family.replace(/\s+/g, '+');
      // Fix: Use semicolons instead of commas for weights
      const formattedWeights = weights.replace(/,/g, ';');
      families.push(`family=${encodedFamily}:wght@${formattedWeights}`);
    });

    const batchUrl = `https://fonts.googleapis.com/css2?${families.join('&')}&display=optional`;
    
    console.log('🔍 [FontManager] Testing Google Fonts request:');
    console.log('🔍 [FontManager] Fonts to load:', fontsToLoad);
    console.log('🔍 [FontManager] Generated URL:', batchUrl);
    console.log('🔍 [FontManager] Families array:', families);
    
    return new Promise((resolve, reject) => {
      // Check if similar batch already loaded
      const existingLink = document.querySelector(`link[href*="fonts.googleapis.com"][data-batch="true"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = batchUrl;
      link.crossOrigin = 'anonymous';
      link.setAttribute('data-batch', 'true');
      link.id = `font-batch-${Date.now()}`;

      console.log('🔍 [FontManager] Created link element:', {
        rel: link.rel,
        href: link.href,
        crossOrigin: link.crossOrigin,
        id: link.id
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn(`⚠️ [FontManager] Font batch loading timed out after 8 seconds: ${batchUrl}`);
        console.warn(`⚠️ [FontManager] Link element state:`, link.sheet?.href || 'no sheet');
        reject(new Error(`Font batch loading timeout: ${batchUrl}`));
      }, 8000);

      link.onload = () => {
        clearTimeout(timeout);
        console.log('✅ [FontManager] Google Fonts loaded successfully:', batchUrl);
        console.log('✅ [FontManager] Fonts marked as loaded:', fontsToLoad);
        
        // Mark all fonts as loaded
        fontsToLoad.forEach(fontKey => {
          this.loadedGoogleFonts.add(fontKey);
          this.fontLoadPromises.delete(fontKey);
        });
        resolve();
      };

      link.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`❌ FontManager: Batch load FAILED for URL: ${batchUrl}`);
        console.error(`❌ FontManager: Failed fonts: ${fontsToLoad.join(', ')}`);
        console.error(`❌ FontManager: Error details:`, error);
        console.error(`❌ FontManager: Link element:`, link);
        reject(new Error(`Failed to load font batch: ${batchUrl}`));
      };

      console.log('🔍 [FontManager] Appending link to document.head...');
      document.head.appendChild(link);
      console.log('✅ [FontManager] Link element appended, waiting for load/error...');
    });
  }

  /**
   * Inject CSS for font overrides using optimized approach
   */
  private injectOverrideCSS(): void {
    // Initialize base styles if not present
    if (!this.styleElement) {
      this.initializeFontOverrideStyles();
    }

    // Update only the CSS variables (much faster than full re-injection)
    this.updateFontVariables();
  }

  /**
   * Initialize base font override styles (only once)
   */
  private initializeFontOverrideStyles(): void {
    // Create base style element with selectors
    const baseCSS = `
/* Font Override System - Base Styles */
:root {
  --font-sans-override: var(--font-sans-selected, var(--font-sans));
  --font-serif-override: var(--font-serif-selected, var(--font-serif));
  --font-mono-override: var(--font-mono-selected, var(--font-mono));
}

/* Font display optimization: prevent FOUT/FOIT */
@font-face {
  font-family: 'InterOptional';
  font-display: optional;
  src: local('Inter');
}

@font-face {
  font-family: 'RobotoOptional'; 
  font-display: optional;
  src: local('Roboto');
}

/* Apply font overrides with high specificity */
body, .font-sans { 
  font-family: var(--font-sans-override) !important; 
}
.font-serif { 
  font-family: var(--font-serif-override) !important; 
}
.font-mono, code, pre { 
  font-family: var(--font-mono-override) !important; 
}
`;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'font-overrides';
    this.styleElement.textContent = baseCSS;
    document.head.appendChild(this.styleElement);
    
  }

  /**
   * Update only CSS variables (fast, no DOM manipulation)
   */
  private updateFontVariables(): void {
    const root = document.documentElement;
    
    // Clear existing override variables
    root.style.removeProperty('--font-sans-selected');
    root.style.removeProperty('--font-serif-selected');
    root.style.removeProperty('--font-mono-selected');
    
    // Set new override variables only if overrides are active
    if (this.currentOverride.enabled) {
      Object.entries(this.currentOverride.fonts).forEach(([category, fontId]) => {
        if (fontId) {
          const font = getFontById(fontId);
          if (font) {
            const fontFamily = buildFontFamily(font);
            root.style.setProperty(`--font-${category}-selected`, fontFamily);
          }
        }
      });
    }
    
  }

  /**
   * Clean up debug elements that might have been created
   */
  private cleanupDebugElements(): void {
    const testContainer = document.getElementById('font-test-container');
    if (testContainer) {
      testContainer.remove();
    }
  }

  /**
   * Remove font override CSS (optimized)
   */
  private removeFontOverrides(): void {
    // Instead of removing the style element, just clear the override variables
    const root = document.documentElement;
    root.style.removeProperty('--font-sans-selected');
    root.style.removeProperty('--font-serif-selected'); 
    root.style.removeProperty('--font-mono-selected');
    
  }

  /**
   * Completely remove font override system (for cleanup)
   */

  /**
   * Preview font temporarily without saving
   */
  async previewFont(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    
    const font = getFontById(fontId);
    if (!font) {
      throw new Error(`Font not found: ${fontId}`);
    }

    // Load font if needed
    if (needsGoogleFontsLoad(font)) {
      await this.loadGoogleFontDirectly(font);
    }

    // Create temporary override
    const tempOverride = { ...this.currentOverride };
    tempOverride.fonts[category] = fontId;
    tempOverride.enabled = true;

    // Apply temporary CSS
    this.applyTemporaryOverride(tempOverride);
  }

  /**
   * Stop font preview (revert to current configuration)
   */
  stopPreview(): void {
    
    // Reapply current configuration
    if (this.currentOverride.enabled) {
      this.applyFontOverrides();
    } else {
      this.removeFontOverrides();
    }
  }

  /**
   * Apply temporary font override for preview
   */
  private applyTemporaryOverride(tempOverride: FontOverride): void {
    // Remove existing styles
    this.removeFontOverrides();

    // Generate CSS for temporary override
    let css = '/* Font Preview */\n:root {\n';
    
    Object.entries(tempOverride.fonts).forEach(([category, fontId]) => {
      if (fontId) {
        const font = getFontById(fontId);
        if (font) {
          const fontFamily = buildFontFamily(font);
          css += `  --font-${category}: ${fontFamily};\n`;
        }
      }
    });
    
    css += '}\n';

    // Create and inject style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'font-preview';
    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Reset all font overrides
   */
  async resetOverrides(): Promise<void> {
    
    this.currentOverride = {
      enabled: false,
      fonts: {}
    };
    
    this.saveOverrideConfiguration();
    this.removeFontOverrides();
  }

  /**
   * Get font override statistics for debugging
   */
  getStats(): { enabled: boolean; overrides: number; categories: string[] } {
    return {
      enabled: this.currentOverride.enabled,
      overrides: Object.keys(this.currentOverride.fonts).length,
      categories: Object.keys(this.currentOverride.fonts)
    };
  }

  /**
   * Test method to load a single Google Font for debugging
   */
  async testSingleFont(fontFamily: string = 'Inter', weights: string = '400'): Promise<void> {
    console.log('🧪 [FontManager] Testing single Google Font...');
    console.log('🧪 [FontManager] Font:', fontFamily, 'Weights:', weights);
    
    const testUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weights}&display=optional`;
    console.log('🧪 [FontManager] Test URL:', testUrl);
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = testUrl;
      link.crossOrigin = 'anonymous';
      link.id = `font-test-${Date.now()}`;
      
      const timeout = setTimeout(() => {
        console.error('🧪 [FontManager] Single font test TIMEOUT after 8 seconds');
        reject(new Error('Single font test timeout'));
      }, 8000);
      
      link.onload = () => {
        clearTimeout(timeout);
        console.log('🧪 ✅ [FontManager] Single font test SUCCESS!');
        resolve();
      };
      
      link.onerror = (error) => {
        clearTimeout(timeout);
        console.error('🧪 ❌ [FontManager] Single font test FAILED:', error);
        reject(error);
      };
      
      console.log('🧪 [FontManager] Appending test link...');
      document.head.appendChild(link);
    });
  }
}