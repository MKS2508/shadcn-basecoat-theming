import { getFontById, buildFontFamily, needsGoogleFontsLoad, FontOption } from './font-catalog';
import { fontLogger } from './utils/logger';

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
  
  // Performance optimizations
  private loadedGoogleFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<void>> = new Map();
  private readonly BATCH_DELAY = 50; // ms to batch font loads
  private pendingFontLoads: Set<string> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  
  // Storage optimization
  private readonly SAVE_DEBOUNCE_MS = 300;
  private saveTimer: NodeJS.Timeout | null = null;
  private pendingConfig: FontOverride | null = null;

  constructor() {
    this.currentOverride = {
      enabled: false,
      fonts: {}
    };
  }


  /**
   * Initialize font manager
   */
  async init(): Promise<void> {
    
    // Load saved font override configuration
    this.loadOverrideConfiguration();
    
    // Apply saved overrides if enabled
    if (this.currentOverride.enabled) {
      await this.applyFontOverrides();
    }
    
    
    // Clean up any debug test containers
    this.cleanupDebugElements();
  }

  /**
   * Load font override configuration from localStorage
   */
  private loadOverrideConfiguration(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.currentOverride = JSON.parse(saved);
      }
    } catch (error) {
      this.currentOverride = { enabled: false, fonts: {} };
    }
  }

  /**
   * Save font override configuration with debouncing (optimized)
   */
  private saveOverrideConfiguration(): void {
    // Store pending configuration
    this.pendingConfig = { ...this.currentOverride };
    
    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    // Debounced save to avoid UI blocking
    this.saveTimer = setTimeout(() => {
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
      window.requestIdleCallback(() => {
        this.saveToStorage();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.saveToStorage();
      }, 0);
    }
  }

  /**
   * Save to localStorage (async)
   */
  private saveToStorage(): void {
    if (!this.pendingConfig) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingConfig));
      this.pendingConfig = null;
    } catch (error) {
      fontLogger.error('Failed to save configuration:', error);
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
   * Set font override for specific category
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

    // Load all fonts in parallel
    const loadPromises = fontsToLoad.map(font => this.loadFontIfNeeded(font));
    
    try {
      await Promise.all(loadPromises);
    } catch (error) {
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

      link.onload = () => {
        // Mark all fonts as loaded
        fontsToLoad.forEach(fontKey => {
          this.loadedGoogleFonts.add(fontKey);
          this.fontLoadPromises.delete(fontKey);
        });
        resolve();
      };

      link.onerror = () => {
        fontLogger.error(`Batch load failed for URL: ${batchUrl}`);
        fontLogger.error(`Failed fonts: ${fontsToLoad.join(', ')}`);
        reject(new Error(`Failed to load font batch: ${batchUrl}`));
      };

      document.head.appendChild(link);
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
}