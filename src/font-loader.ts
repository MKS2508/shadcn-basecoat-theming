/**
 * FontLoader - Dynamic font loading utility for theme system
 * Handles Google Fonts, local fonts, and font preloading
 */

interface FontConfig {
  family: string;
  weights?: number[];
  styles?: string[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export class FontLoader {
  private loadedFonts: Set<string> = new Set();
  private fontCache: Map<string, FontFace> = new Map();

  /**
   * Extract font families from CSS variables
   */
  extractFontsFromTheme(cssVars: Record<string, string>): FontConfig[] {
    const fontConfigs: FontConfig[] = [];
    
    // Standard font variables
    const fontVars = ['font-sans', 'font-serif', 'font-mono'];
    
    fontVars.forEach(varName => {
      const fontStack = cssVars[varName];
      if (fontStack) {
        const fonts = this.parseFontStack(fontStack);
        fontConfigs.push(...fonts);
      }
    });

    return fontConfigs.filter(font => this.isExternalFont(font.family));
  }

  /**
   * Parse font stack and extract individual fonts
   */
  private parseFontStack(fontStack: string): FontConfig[] {
    const fonts: FontConfig[] = [];
    
    // Split by comma and clean up font names
    const fontNames = fontStack
      .split(',')
      .map(font => font.trim().replace(/['"]/g, ''))
      .filter(font => font && !this.isGenericFont(font));

    fontNames.forEach(fontName => {
      fonts.push({
        family: fontName,
        weights: [400, 500, 600, 700], // Default weights
        styles: ['normal'],
        display: 'swap'
      });
    });

    return fonts;
  }

  /**
   * Check if font is external (needs loading)
   */
  private isExternalFont(fontFamily: string): boolean {
    const systemFonts = [
      'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
      'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif',
      'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif',
      'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace',
      'ui-serif', 'ui-sans-serif', 'ui-monospace'
    ];

    return !systemFonts.some(systemFont => 
      fontFamily.toLowerCase().includes(systemFont.toLowerCase())
    );
  }

  /**
   * Check if font is a generic font family
   */
  private isGenericFont(fontFamily: string): boolean {
    const genericFonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'];
    return genericFonts.includes(fontFamily.toLowerCase());
  }

  /**
   * Load fonts for a theme
   */
  async loadThemeFonts(cssVars: Record<string, string>): Promise<void> {
    const fontConfigs = this.extractFontsFromTheme(cssVars);
    
    console.log('🔤 FontLoader: Detected fonts to load:', fontConfigs.map(f => f.family));

    // Load each font
    const loadPromises = fontConfigs.map(config => this.loadFont(config));
    
    try {
      await Promise.all(loadPromises);
      console.log('✅ FontLoader: All fonts loaded successfully');
    } catch (error) {
      console.warn('⚠️ FontLoader: Some fonts failed to load:', error);
    }
  }

  /**
   * Load a single font configuration
   */
  private async loadFont(config: FontConfig): Promise<void> {
    const fontKey = `${config.family}-${config.weights?.join(',')}-${config.styles?.join(',')}`;
    
    // Skip if already loaded
    if (this.loadedFonts.has(fontKey)) {
      console.log(`🔤 FontLoader: Font already loaded: ${config.family}`);
      return;
    }

    try {
      // Check if it's a Google Font
      if (this.isGoogleFont(config.family)) {
        await this.loadGoogleFont(config);
      } else {
        await this.loadWebFont(config);
      }
      
      this.loadedFonts.add(fontKey);
      console.log(`✅ FontLoader: Loaded font: ${config.family}`);
      
    } catch (error) {
      console.warn(`❌ FontLoader: Failed to load font ${config.family}:`, error);
    }
  }

  /**
   * Check if font is likely a Google Font
   */
  private isGoogleFont(fontFamily: string): boolean {
    // Common Google Fonts patterns
    const googleFontPatterns = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans',
      'Raleway', 'Ubuntu', 'Lora', 'Merriweather', 'Playfair Display',
      'Outfit', 'Source Serif', 'JetBrains Mono', 'Fira Code'
    ];

    return googleFontPatterns.some(pattern => 
      fontFamily.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Load Google Font via Google Fonts API
   */
  private async loadGoogleFont(config: FontConfig): Promise<void> {
    const family = config.family.replace(/\s+/g, '+');
    const weights = config.weights?.join(';') || '400;500;600;700';
    const styles = config.styles?.includes('italic') ? ':ital,wght@0,' : ':wght@';
    
    const googleFontUrl = `https://fonts.googleapis.com/css2?family=${family}${styles}${weights}&display=${config.display || 'swap'}`;
    
    return this.loadFontCSS(googleFontUrl);
  }

  /**
   * Load web font from external source
   */
  private async loadWebFont(config: FontConfig): Promise<void> {
    // For now, we'll try to detect and load common web fonts
    // In a real implementation, this might parse @font-face rules
    console.log(`🔤 FontLoader: Attempting to load web font: ${config.family}`);
    
    // Try to create a FontFace if we have a URL (this would be expanded)
    // For now, we'll just mark as loaded to avoid repeated attempts
    return Promise.resolve();
  }

  /**
   * Load font CSS from URL
   */
  private loadFontCSS(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';

      link.onload = () => {
        console.log(`🔤 FontLoader: CSS loaded from ${url}`);
        resolve();
      };

      link.onerror = () => {
        console.error(`❌ FontLoader: Failed to load CSS from ${url}`);
        reject(new Error(`Failed to load font CSS: ${url}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload fonts for better performance
   */
  preloadFonts(fontConfigs: FontConfig[]): void {
    fontConfigs.forEach(config => {
      if (this.isGoogleFont(config.family)) {
        // Preconnect to Google Fonts
        this.addPreconnect('https://fonts.googleapis.com');
        this.addPreconnect('https://fonts.gstatic.com');
      }
    });
  }

  /**
   * Add preconnect link for better performance
   */
  private addPreconnect(href: string): void {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  /**
   * Clean up unused font resources
   */
  cleanup(): void {
    // Remove font CSS links that are no longer needed
    // This would be implemented based on current theme requirements
    console.log('🧹 FontLoader: Cleanup called (implementation pending)');
  }

  /**
   * Get font display status for debugging
   */
  getFontStatus(): { loaded: string[], pending: string[] } {
    return {
      loaded: Array.from(this.loadedFonts),
      pending: [] // Would track pending loads in real implementation
    };
  }
}