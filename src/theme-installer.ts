import { StorageManager, CachedTheme } from './storage-manager';
import { ThemeManager } from './theme-manager';
import { FontLoader } from './font-loader';
import { ThemeListFetcher, ExternalThemeItem } from './theme-list-fetcher';

interface ThemeData {
  name: string;
  cssVars: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };
}

/**
 * Frontend theme installer with modal UI and validation
 */
export class ThemeInstaller {
  private storageManager: StorageManager;
  private themeManager: ThemeManager;
  private fontLoader: FontLoader;
  private themeListFetcher: ThemeListFetcher;
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private urlInput: HTMLInputElement | null = null;
  private previewContainer: HTMLElement | null = null;
  private installButton: HTMLButtonElement | null = null;
  private currentThemeData: ThemeData | null = null;
  private themeListContainer: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;

  constructor(themeManager: ThemeManager) {
    this.storageManager = new StorageManager();
    this.themeManager = themeManager;
    this.themeListFetcher = new ThemeListFetcher();
    this.fontLoader = new FontLoader();
  }

  /**
   * Initialize theme installer
   */
  async init(): Promise<void> {
    await this.storageManager.init();
    this.setupEventListeners();
    console.log('🎨 ThemeInstaller initialized');
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Install theme button
    const installBtn = document.getElementById('install-theme-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        console.log('🎯 [FOCUS-DEBUG] Install button clicked, opening modal');
        this.openModal();
      });
    }

    // Get modal elements
    this.modal = document.getElementById('theme-install-modal');
    this.form = document.getElementById('theme-install-form') as HTMLFormElement;
    this.urlInput = document.getElementById('theme-url-input') as HTMLInputElement;
    this.previewContainer = document.getElementById('theme-preview');
    this.installButton = document.getElementById('theme-install-submit') as HTMLButtonElement;
    
    // Get search themes button
    const searchThemesBtn = document.getElementById('search-themes-btn');
    if (searchThemesBtn) {
      searchThemesBtn.addEventListener('click', () => {
        this.searchAvailableThemes();
      });
    }

    if (!this.modal || !this.form || !this.urlInput || !this.previewContainer || !this.installButton) {
      console.error('🚨 ThemeInstaller: Required DOM elements not found');
      return;
    }

    // Add comprehensive focus tracking to URL input
    this.urlInput.addEventListener('focus', (e) => {
      console.log('🎯 [FOCUS-DEBUG] URL Input FOCUSED at', new Date().toISOString());
      console.log('🎯 [FOCUS-DEBUG] Focus event target:', e.target);
      console.log('🎯 [FOCUS-DEBUG] Active element:', document.activeElement);
    });

    this.urlInput.addEventListener('blur', (e) => {
      console.log('🚨 [FOCUS-DEBUG] URL Input LOST FOCUS at', new Date().toISOString());
      console.log('🚨 [FOCUS-DEBUG] Blur event target:', e.target);
      console.log('🚨 [FOCUS-DEBUG] New active element:', document.activeElement);
      console.log('🚨 [FOCUS-DEBUG] Related target (what stole focus):', e.relatedTarget);
      console.log('🚨 [FOCUS-DEBUG] Event type:', e.type);
      console.log('🚨 [FOCUS-DEBUG] Event bubbles:', e.bubbles);
      console.log('🚨 [FOCUS-DEBUG] Event cancelable:', e.cancelable);
      console.trace('🚨 [FOCUS-DEBUG] Focus loss stack trace:');
      
      // Check if this is caused by DOM manipulation
      setTimeout(() => {
        console.log('🚨 [FOCUS-DEBUG] 100ms later - Active element:', document.activeElement);
      }, 100);
    });

    // Add global focus tracking to detect any focus changes
    document.addEventListener('focusin', (e) => {
      if (e.target !== this.urlInput && this.urlInput && this.modal && !this.modal.classList.contains('hidden')) {
        console.log('🔍 [FOCUS-DEBUG] GLOBAL FOCUS CHANGE while modal open:');
        console.log('🔍 [FOCUS-DEBUG] New focused element:', e.target);
        console.log('🔍 [FOCUS-DEBUG] Previous active element was input:', document.activeElement === this.urlInput);
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target === this.urlInput && this.modal && !this.modal.classList.contains('hidden')) {
        console.log('🔍 [FOCUS-DEBUG] GLOBAL FOCUS OUT from input while modal open');
        console.log('🔍 [FOCUS-DEBUG] RelatedTarget:', e.relatedTarget);
      }
    });

    // URL input changes - debounced validation without losing focus
    let validationTimeout: NodeJS.Timeout;
    this.urlInput.addEventListener('input', (e) => {
      console.log('📝 [FOCUS-DEBUG] URL Input changed, value:', (e.target as HTMLInputElement).value);
      console.log('📝 [FOCUS-DEBUG] Active element before validation setup:', document.activeElement);
      
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => {
        console.log('⏰ [FOCUS-DEBUG] Validation timeout triggered, about to validate');
        this.validateAndPreview();
      }, 800); // Longer delay to let user finish typing
    });

    // Form submission
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📋 [FOCUS-DEBUG] Form submitted');
      await this.installTheme();
    });

    // Close modal listeners with focus debugging
    const closeBtn = document.getElementById('theme-modal-close');
    const cancelBtn = document.getElementById('theme-modal-cancel');
    const backdrop = document.getElementById('theme-modal-backdrop');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        console.log('❌ [FOCUS-DEBUG] Close button clicked');
        console.log('❌ [FOCUS-DEBUG] Active element before close:', document.activeElement);
        this.closeModal();
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        console.log('❌ [FOCUS-DEBUG] Cancel button clicked');
        console.log('❌ [FOCUS-DEBUG] Active element before close:', document.activeElement);
        this.closeModal();
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        console.log('❌ [FOCUS-DEBUG] Backdrop clicked');
        console.log('❌ [FOCUS-DEBUG] Click target:', e.target);
        console.log('❌ [FOCUS-DEBUG] Active element before close:', document.activeElement);
        this.closeModal();
      });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        console.log('⌨️ [FOCUS-DEBUG] Escape key pressed, closing modal');
        console.log('⌨️ [FOCUS-DEBUG] Active element before close:', document.activeElement);
        this.closeModal();
      }
    });
  }

  /**
   * Open installation modal
   */
  private openModal(): void {
    console.log('🚪 [FOCUS-DEBUG] Opening modal - START');
    console.log('🚪 [FOCUS-DEBUG] Active element before modal open:', document.activeElement);
    
    if (!this.modal) return;
    
    this.modal.classList.remove('hidden');
    this.resetForm();
    
    console.log('🚪 [FOCUS-DEBUG] Modal visible, about to focus input');
    console.log('🚪 [FOCUS-DEBUG] Active element after modal visible:', document.activeElement);
    
    // Focus input after DOM updates
    setTimeout(() => {
      console.log('🚪 [FOCUS-DEBUG] Timeout triggered, attempting to focus input');
      console.log('🚪 [FOCUS-DEBUG] URL input exists:', !!this.urlInput);
      console.log('🚪 [FOCUS-DEBUG] Active element before focus attempt:', document.activeElement);
      
      this.urlInput?.focus();
      
      console.log('🚪 [FOCUS-DEBUG] Active element after focus attempt:', document.activeElement);
      console.log('🚪 [FOCUS-DEBUG] Input is focused:', document.activeElement === this.urlInput);
    }, 100);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    console.log('🚪 [FOCUS-DEBUG] Opening modal - END');
  }

  /**
   * Close installation modal
   */
  private closeModal(): void {
    console.log('🚪 [FOCUS-DEBUG] Closing modal - START');
    console.log('🚪 [FOCUS-DEBUG] Active element before close:', document.activeElement);
    
    if (!this.modal) return;
    
    this.modal.classList.add('hidden');
    this.resetForm();
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('🚪 [FOCUS-DEBUG] Modal closed - END');
    console.log('🚪 [FOCUS-DEBUG] Active element after close:', document.activeElement);
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    console.log('🔄 [FOCUS-DEBUG] Resetting form - START');
    console.log('🔄 [FOCUS-DEBUG] Active element before reset:', document.activeElement);
    
    if (this.urlInput) {
      console.log('🔄 [FOCUS-DEBUG] Clearing URL input value');
      this.urlInput.value = '';
    }
    if (this.previewContainer) {
      console.log('🔄 [FOCUS-DEBUG] Clearing preview container');
      this.previewContainer.innerHTML = '';
    }
    if (this.installButton) {
      console.log('🔄 [FOCUS-DEBUG] Resetting install button');
      this.installButton.disabled = true;
      this.installButton.textContent = 'Install Theme';
    }
    this.currentThemeData = null;
    
    console.log('🔄 [FOCUS-DEBUG] Active element after reset:', document.activeElement);
    console.log('🔄 [FOCUS-DEBUG] Resetting form - END');
  }

  /**
   * Validate URL and fetch theme preview
   */
  private async validateAndPreview(): Promise<void> {
    console.log('🔍 [FOCUS-DEBUG] ===== VALIDATION START =====');
    console.log('🔍 [FOCUS-DEBUG] Active element at validation start:', document.activeElement);
    console.log('🔍 [FOCUS-DEBUG] Input is currently focused:', document.activeElement === this.urlInput);
    
    const url = this.urlInput?.value.trim();
    if (!url || !this.previewContainer || !this.installButton) {
      console.log('🔍 [FOCUS-DEBUG] Early return - missing elements or empty URL');
      return;
    }

    // Don't interfere with input focus during validation
    const activeElement = document.activeElement;
    console.log('🔍 [FOCUS-DEBUG] Captured active element:', activeElement);
    console.log('🔍 [FOCUS-DEBUG] Is active element the input?', activeElement === this.urlInput);
    
    // Clear previous preview
    console.log('🔍 [FOCUS-DEBUG] About to modify preview container innerHTML');
    console.log('🔍 [FOCUS-DEBUG] Active element before innerHTML change:', document.activeElement);
    this.previewContainer.innerHTML = '<div class="text-muted-foreground text-sm">Validating...</div>';
    console.log('🔍 [FOCUS-DEBUG] Active element after innerHTML change:', document.activeElement);
    
    this.installButton.disabled = true;

    try {
      // Basic URL validation
      console.log('🔍 [FOCUS-DEBUG] Starting URL validation');
      new URL(url);
      
      // Check if theme is already cached
      console.log('🔍 [FOCUS-DEBUG] Checking cached themes');
      const cached = await this.storageManager.themeExistsByUrl(url);
      if (cached) {
        console.log('🔍 [FOCUS-DEBUG] Found cached theme, showing preview');
        console.log('🔍 [FOCUS-DEBUG] Active element before cached preview:', document.activeElement);
        this.showCachedPreview(cached);
        console.log('🔍 [FOCUS-DEBUG] Active element after cached preview:', document.activeElement);
        return;
      }

      // Fetch theme data
      console.log(`🔍 Fetching theme from: ${url}`);
      console.log('🔍 [FOCUS-DEBUG] About to start fetch request');
      const response = await fetch(url);
      console.log('🔍 [FOCUS-DEBUG] Fetch completed, active element:', document.activeElement);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const themeData: ThemeData = await response.json();
      console.log('🔍 [FOCUS-DEBUG] JSON parsing completed, active element:', document.activeElement);
      
      // Validate theme structure
      if (!this.validateThemeData(themeData)) {
        throw new Error('Invalid theme format');
      }

      console.log('🔍 [FOCUS-DEBUG] About to show theme preview');
      console.log('🔍 [FOCUS-DEBUG] Active element before preview:', document.activeElement);
      this.currentThemeData = themeData;
      this.showThemePreview(themeData, url);
      this.installButton.disabled = false;
      console.log('🔍 [FOCUS-DEBUG] Theme preview shown, active element:', document.activeElement);

    } catch (error) {
      console.error('❌ Theme validation failed:', error);
      console.log('🔍 [FOCUS-DEBUG] Error occurred, active element:', document.activeElement);
      this.showPreviewError(error instanceof Error ? error.message : 'Unknown error');
      console.log('🔍 [FOCUS-DEBUG] Error preview shown, active element:', document.activeElement);
    }
    
    // Restore focus if it was on the input
    console.log('🔍 [FOCUS-DEBUG] Focus restoration check:');
    console.log('🔍 [FOCUS-DEBUG] Original active element was input:', activeElement === this.urlInput);
    console.log('🔍 [FOCUS-DEBUG] Current active element:', document.activeElement);
    console.log('🔍 [FOCUS-DEBUG] Input still exists:', !!this.urlInput);
    
    if (activeElement === this.urlInput) {
      console.log('🔍 [FOCUS-DEBUG] Attempting to restore focus to input');
      this.urlInput.focus();
      console.log('🔍 [FOCUS-DEBUG] Focus restoration attempted, current active element:', document.activeElement);
      console.log('🔍 [FOCUS-DEBUG] Focus restoration successful:', document.activeElement === this.urlInput);
    } else {
      console.log('🔍 [FOCUS-DEBUG] Not restoring focus (was not on input originally)');
    }
    
    console.log('🔍 [FOCUS-DEBUG] ===== VALIDATION END =====');
  }

  /**
   * Validate theme data structure
   */
  private validateThemeData(data: any): data is ThemeData {
    return (
      data &&
      typeof data.name === 'string' &&
      data.cssVars &&
      typeof data.cssVars === 'object' &&
      (data.cssVars.light || data.cssVars.dark || data.cssVars.theme)
    );
  }

  /**
   * Show theme preview
   */
  private showThemePreview(themeData: ThemeData, url: string): void {
    console.log('📱 [FOCUS-DEBUG] showThemePreview - START');
    console.log('📱 [FOCUS-DEBUG] Active element before preview:', document.activeElement);
    
    if (!this.previewContainer) return;

    const hasLight = !!themeData.cssVars.light;
    const hasDark = !!themeData.cssVars.dark;
    const hasTheme = !!themeData.cssVars.theme;
    
    // Extract some color variables for preview
    const lightColors = this.extractPreviewColors(themeData.cssVars.light);
    const darkColors = this.extractPreviewColors(themeData.cssVars.dark);
    const themeColors = this.extractPreviewColors(themeData.cssVars.theme);

    // Extract font information
    const fontInfo = this.extractFontInfo(themeData.cssVars);

    console.log('📱 [FOCUS-DEBUG] About to set innerHTML for theme preview');
    console.log('📱 [FOCUS-DEBUG] Active element before innerHTML:', document.activeElement);
    
    this.previewContainer.innerHTML = `
      <div class="border rounded-lg p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-foreground">${themeData.name}</h3>
          <div class="flex items-center space-x-2 text-xs text-muted-foreground">
            ${hasLight ? '<span class="px-2 py-1 bg-secondary rounded">Light</span>' : ''}
            ${hasDark ? '<span class="px-2 py-1 bg-secondary rounded">Dark</span>' : ''}
            ${hasTheme ? '<span class="px-2 py-1 bg-secondary rounded">Custom</span>' : ''}
          </div>
        </div>
        
        <div class="text-sm text-muted-foreground">
          <div>URL: <code class="text-xs bg-muted px-1 rounded">${url}</code></div>
        </div>
        
        ${fontInfo.length > 0 ? `
          <div>
            <div class="text-sm font-medium mb-2">Typography:</div>
            <div class="space-y-2">
              ${fontInfo.map(font => `
                <div class="flex items-center space-x-3">
                  <span class="text-xs px-2 py-1 bg-secondary rounded font-mono">${font.type}</span>
                  <span class="text-sm" style="font-family: ${font.value}">${font.family}</span>
                  ${font.isExternal ? '<span class="text-xs text-blue-600">•</span>' : ''}
                </div>
              `).join('')}
            </div>
            <div class="text-xs text-muted-foreground mt-2">
              <span class="text-blue-600">•</span> External font (will be loaded)
            </div>
          </div>
        ` : ''}

        ${this.generateTypographyPreview(fontInfo)}
        
        ${lightColors.length > 0 ? `
          <div>
            <div class="text-sm font-medium mb-2">Light Mode Colors:</div>
            <div class="flex space-x-2">
              ${lightColors.map(color => `
                <div class="w-6 h-6 rounded border" style="background-color: ${color.value}" title="${color.name}"></div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${darkColors.length > 0 ? `
          <div>
            <div class="text-sm font-medium mb-2">Dark Mode Colors:</div>
            <div class="flex space-x-2">
              ${darkColors.map(color => `
                <div class="w-6 h-6 rounded border" style="background-color: ${color.value}" title="${color.name}"></div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    console.log('📱 [FOCUS-DEBUG] Theme preview innerHTML set');
    console.log('📱 [FOCUS-DEBUG] Active element after innerHTML:', document.activeElement);
    console.log('📱 [FOCUS-DEBUG] showThemePreview - END');
  }

  /**
   * Show cached theme preview
   */
  private showCachedPreview(cached: CachedTheme): void {
    console.log('💾 [FOCUS-DEBUG] showCachedPreview - START');
    console.log('💾 [FOCUS-DEBUG] Active element before cached preview:', document.activeElement);
    
    if (!this.previewContainer || !this.installButton) return;

    this.currentThemeData = cached.data;
    this.showThemePreview(cached.data, cached.url);
    
    console.log('💾 [FOCUS-DEBUG] About to modify install button');
    console.log('💾 [FOCUS-DEBUG] Active element before button modification:', document.activeElement);
    
    if (cached.installed) {
      this.installButton.textContent = 'Already Installed';
      this.installButton.disabled = true;
    } else {
      this.installButton.textContent = 'Install Cached Theme';
      this.installButton.disabled = false;
    }
    
    console.log('💾 [FOCUS-DEBUG] Install button modified');
    console.log('💾 [FOCUS-DEBUG] Active element after button modification:', document.activeElement);
    console.log('💾 [FOCUS-DEBUG] showCachedPreview - END');
  }

  /**
   * Show preview error
   */
  private showPreviewError(message: string): void {
    console.log('❌ [FOCUS-DEBUG] showPreviewError - START');
    console.log('❌ [FOCUS-DEBUG] Active element before error preview:', document.activeElement);
    console.log('❌ [FOCUS-DEBUG] Error message:', message);
    
    if (!this.previewContainer) return;
    
    console.log('❌ [FOCUS-DEBUG] About to set error innerHTML');
    console.log('❌ [FOCUS-DEBUG] Active element before error innerHTML:', document.activeElement);
    
    this.previewContainer.innerHTML = `
      <div class="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
        <div class="flex items-center space-x-2 text-destructive">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm font-medium">Invalid Theme</span>
        </div>
        <p class="text-sm text-destructive/80 mt-1">${message}</p>
      </div>
    `;
    
    console.log('❌ [FOCUS-DEBUG] Error innerHTML set');
    console.log('❌ [FOCUS-DEBUG] Active element after error innerHTML:', document.activeElement);
    console.log('❌ [FOCUS-DEBUG] showPreviewError - END');
  }

  /**
   * Extract font information from CSS variables
   */
  private extractFontInfo(cssVars: Record<string, string>): Array<{type: string, family: string, value: string, isExternal: boolean}> {
    const fontInfo: Array<{type: string, family: string, value: string, isExternal: boolean}> = [];
    const fontVars = [
      { key: 'font-sans', type: 'sans' },
      { key: 'font-serif', type: 'serif' },
      { key: 'font-mono', type: 'mono' }
    ];

    // Check all possible sources for font variables
    const allVars = { ...cssVars.light, ...cssVars.dark, ...cssVars.theme };

    fontVars.forEach(({ key, type }) => {
      if (allVars[key]) {
        const fontStack = allVars[key];
        const primaryFont = fontStack.split(',')[0].trim().replace(/['"]/g, '');
        const isExternal = this.fontLoader.extractFontsFromTheme({ [key]: fontStack }).length > 0;
        
        fontInfo.push({
          type,
          family: primaryFont,
          value: fontStack,
          isExternal
        });
      }
    });

    return fontInfo;
  }

  /**
   * Generate typography preview with actual fonts
   */
  private generateTypographyPreview(fontInfo: Array<{type: string, family: string, value: string, isExternal: boolean}>): string {
    if (fontInfo.length === 0) return '';

    const sansFont = fontInfo.find(f => f.type === 'sans');
    const serifFont = fontInfo.find(f => f.type === 'serif');
    const monoFont = fontInfo.find(f => f.type === 'mono');

    return `
      <div>
        <div class="text-sm font-medium mb-3">Typography Preview:</div>
        <div class="space-y-2 p-3 bg-muted/20 rounded">
          ${sansFont ? `
            <div style="font-family: ${sansFont.value}">
              <div class="text-lg font-semibold">Heading Text</div>
              <div class="text-sm text-muted-foreground">Sans-serif • ${sansFont.family}</div>
            </div>
          ` : ''}
          
          ${serifFont ? `
            <div style="font-family: ${serifFont.value}" class="pt-2">
              <div class="text-base">Body text in serif font for reading</div>
              <div class="text-xs text-muted-foreground">Serif • ${serifFont.family}</div>
            </div>
          ` : ''}
          
          ${monoFont ? `
            <div style="font-family: ${monoFont.value}" class="pt-2">
              <div class="text-sm bg-muted px-2 py-1 rounded">const code = "example";</div>
              <div class="text-xs text-muted-foreground">Monospace • ${monoFont.family}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Extract colors for preview
   */
  private extractPreviewColors(cssVars?: Record<string, string>): Array<{name: string, value: string}> {
    if (!cssVars) return [];
    
    const colorKeys = ['background', 'primary', 'secondary', 'accent', 'destructive'];
    return colorKeys
      .filter(key => cssVars[key])
      .map(key => ({ name: key, value: cssVars[key] }))
      .slice(0, 5); // Limit to 5 colors for preview
  }

  /**
   * Install theme
   */
  private async installTheme(): Promise<void> {
    if (!this.currentThemeData || !this.urlInput || !this.installButton) return;

    const url = this.urlInput.value.trim();
    this.installButton.disabled = true;
    this.installButton.textContent = 'Installing...';

    try {
      // Cache the theme
      const cachedTheme: CachedTheme = {
        name: this.currentThemeData.name,
        url,
        data: this.currentThemeData,
        installed: false,
        timestamp: Date.now()
      };

      await this.storageManager.storeTheme(cachedTheme);
      console.log(`💾 Theme cached: ${this.currentThemeData.name}`);

      // Load fonts before installing theme
      console.log('🔤 Loading theme fonts...');
      const allVars = { ...this.currentThemeData.cssVars.light, ...this.currentThemeData.cssVars.dark, ...this.currentThemeData.cssVars.theme };
      await this.fontLoader.loadThemeFonts(allVars);
      
      // Install theme using theme manager with source URL
      await this.themeManager.installTheme(this.currentThemeData, url);
      
      // Mark as installed
      await this.storageManager.markThemeInstalled(this.currentThemeData.name);
      
      this.installButton.textContent = 'Installed!';
      
      // Close modal after short delay
      setTimeout(() => {
        this.closeModal();
      }, 1000);

      console.log(`✅ Theme installed successfully: ${this.currentThemeData.name}`);

    } catch (error) {
      console.error('❌ Theme installation failed:', error);
      this.installButton.textContent = 'Installation Failed';
      this.installButton.disabled = false;
      
      // Show error in preview
      this.showPreviewError(error instanceof Error ? error.message : 'Installation failed');
    }
  }

  /**
   * Search and display available themes from TweakCN registry
   */
  private async searchAvailableThemes(): Promise<void> {
    const previewContainer = this.previewContainer;
    if (!previewContainer) return;

    // Show loading state
    previewContainer.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
        <span class="text-muted-foreground text-sm">Searching available themes...</span>
      </div>
    `;

    try {
      // Check for cached themes first
      const cachedNames = this.themeListFetcher.getCachedThemeNames();
      if (cachedNames.length > 0) {
        console.log(`🎨 Found ${cachedNames.length} cached theme names`);
        this.renderThemeNamesList(cachedNames, false);
        return;
      }

      // Fetch and cache theme names (first time)
      const themeNames = await this.themeListFetcher.fetchAndCacheThemeNames();
      this.renderThemeNamesList(themeNames, true);
      
    } catch (error) {
      console.error('❌ Failed to search themes:', error);
      previewContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-destructive text-sm mb-2">Failed to load themes</p>
          <button 
            type="button"
            class="text-primary hover:underline text-xs"
            onclick="document.getElementById('search-themes-btn').click()"
          >
            Try again
          </button>
        </div>
      `;
    }
  }

  /**
   * Render themes list with names only (memory efficient)
   */
  private renderThemeNamesList(themeNames: string[], freshFetch: boolean): void {
    const previewContainer = this.previewContainer;
    if (!previewContainer) return;

    // Header with refresh option
    const headerHtml = `
      <div class="flex items-center justify-between mb-4 pb-2 border-b">
        <h4 class="text-sm font-medium text-foreground">
          Available Themes (${themeNames.length})
        </h4>
        <button 
          type="button"
          id="refresh-themes-btn"
          class="text-xs text-primary hover:underline"
          ${freshFetch ? 'style="opacity: 0.5; pointer-events: none;"' : ''}
        >
          ${freshFetch ? 'Updated' : 'Refresh'}
        </button>
      </div>
    `;

    // Search input for filtering
    const searchHtml = `
      <div class="mb-3">
        <input 
          type="text" 
          id="theme-search"
          placeholder="Filter themes..."
          class="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    `;

    // Themes grid - simple names only
    const themesHtml = themeNames.map(name => `
      <div class="theme-name-item flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors" data-theme-name="${name}">
        <span class="text-sm font-mono text-foreground">${name}</span>
        <button 
          class="install-theme-btn text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
          data-theme-name="${name}"
        >
          Install
        </button>
      </div>
    `).join('');

    previewContainer.innerHTML = `
      ${headerHtml}
      ${searchHtml}
      <div class="max-h-64 overflow-y-auto">
        <div id="themes-list" class="space-y-1">
          ${themesHtml}
        </div>
      </div>
      <p class="text-xs text-muted-foreground mt-3 pt-2 border-t">
        Themes from TweakCN registry • Cached for 24h
      </p>
    `;

    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-themes-btn');
    if (refreshBtn && !freshFetch) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.style.opacity = '0.5';
        try {
          const newNames = await this.themeListFetcher.fetchAndCacheThemeNames(true);
          this.renderThemeNamesList(newNames, true);
        } catch (error) {
          refreshBtn.textContent = 'Error';
          setTimeout(() => {
            refreshBtn.textContent = 'Refresh';
            refreshBtn.style.opacity = '1';
          }, 2000);
        }
      });
    }

    // Setup search functionality
    const searchInput = document.getElementById('theme-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        this.filterThemeNames(themeNames, query);
      });
    }

    // Setup install buttons
    const installButtons = previewContainer.querySelectorAll('.install-theme-btn');
    installButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeName = (e.target as HTMLElement).getAttribute('data-theme-name');
        if (themeName) {
          this.installThemeFromRegistry(themeName);
        }
      });
    });
  }

  /**
   * Filter theme names (memory efficient)
   */
  private filterThemeNames(themeNames: string[], query: string): void {
    const list = document.getElementById('themes-list');
    if (!list) return;

    const filteredNames = themeNames.filter(name => 
      name.toLowerCase().includes(query)
    );

    const themesHtml = filteredNames.map(name => `
      <div class="theme-name-item flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors" data-theme-name="${name}">
        <span class="text-sm font-mono text-foreground">${name}</span>
        <button 
          class="install-theme-btn text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
          data-theme-name="${name}"
        >
          Install
        </button>
      </div>
    `).join('');

    list.innerHTML = themesHtml;

    // Re-setup install buttons
    const installButtons = list.querySelectorAll('.install-theme-btn');
    installButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeName = (e.target as HTMLElement).getAttribute('data-theme-name');
        if (themeName) {
          this.installThemeFromRegistry(themeName);
        }
      });
    });
  }

  /**
   * Install theme directly from registry (memory optimized)
   */
  private async installThemeFromRegistry(themeName: string): Promise<void> {
    try {
      const themeUrl = this.themeListFetcher.getThemeInstallUrl(themeName);
      console.log(`🎨 Installing theme from registry: ${themeName}`);
      
      // Show installing state
      const button = document.querySelector(`[data-theme-name="${themeName}"]`) as HTMLElement;
      if (button) {
        button.textContent = 'Installing...';
        (button as HTMLButtonElement).disabled = true;
      }
      
      // Use existing validation and installation logic
      await this.validateAndPreviewTheme(themeUrl);
      
      if (this.currentThemeData) {
        await this.installCurrentTheme();
        this.closeModal();
      }
      
    } catch (error) {
      console.error(`❌ Failed to install theme ${themeName}:`, error);
      
      // Reset button state
      const button = document.querySelector(`[data-theme-name="${themeName}"]`) as HTMLElement;
      if (button) {
        button.textContent = 'Install';
        (button as HTMLButtonElement).disabled = false;
      }
      
      this.showError(`Failed to install ${themeName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}