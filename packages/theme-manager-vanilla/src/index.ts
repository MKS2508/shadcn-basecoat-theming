import { 
  ThemeManager, 
  FontManager,
  ThemeInstaller,
  ThemeConfig 
} from '@mks2508/shadcn-basecoat-theme-manager';

/**
 * Configuración de inicialización para el Theme Manager Vanilla
 */
export interface VanillaThemeManagerOptions {
  enableLogging?: boolean;
  autoSetupEventListeners?: boolean;
}

/**
 * VanillaThemeManager - Motor de renderizado modular para Theme Management
 * 
 * Esta clase proporciona métodos granulares para renderizar componentes específicos
 * en selectores específicos, usando el template engine interno.
 * 
 * El usuario tiene control total sobre qué renderizar y dónde.
 */
export class VanillaThemeManager {
  private themeManager: ThemeManager;
  private themeInstaller: ThemeInstaller;
  private fontManager: FontManager;
  private initialized: boolean = false;
  private options: VanillaThemeManagerOptions;

  // Rendered components tracking
  private renderedComponents: Map<string, HTMLElement> = new Map();

  constructor(options: VanillaThemeManagerOptions = {}) {
    this.options = { 
      enableLogging: true, 
      autoSetupEventListeners: true,
      ...options 
    };
    
    // Initialize core managers
    this.themeManager = new ThemeManager();
    this.fontManager = this.themeManager.getFontManager();
    this.themeInstaller = new ThemeInstaller(this.themeManager);
  }

  /**
   * Initialize the core theme management system
   * This must be called before using any render methods
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.log('🚀 Initializing Vanilla Theme Manager');

      // Initialize core theme system
      await this.themeManager.init();
      
      // Set up theme installation callbacks
      this.setupThemeCallbacks();
      
      // Set up global event listeners if enabled
      if (this.options.autoSetupEventListeners) {
        this.setupGlobalEventListeners();
      }
      
      this.initialized = true;
      this.log('✅ Vanilla Theme Manager initialized');
      
      // Expose for debugging in development
      if (typeof window !== 'undefined' && this.options.enableLogging) {
        (window as any).__vanillaThemeManager = this;
        this.log('🔧 Available at window.__vanillaThemeManager');
      }

    } catch (error) {
      this.logError('Failed to initialize Vanilla Theme Manager', error as Error);
      throw error;
    }
  }

  // ===========================================
  // MODULAR RENDERING METHODS
  // ===========================================

  /**
   * Render theme dropdown in specified selector
   * @param selector CSS selector where to render the dropdown
   * @param options Rendering options
   */
  renderThemeDropdown(selector: string, options?: {
    showInstallOption?: boolean;
    showManageOption?: boolean;
    customClasses?: string;
  }): HTMLElement | null {
    this.ensureInitialized();
    
    const container = document.querySelector(selector);
    if (!container) {
      this.logError(`Theme dropdown container not found: ${selector}`);
      return null;
    }

    this.log(`🎨 Rendering theme dropdown in ${selector}`);

    // Create dropdown HTML structure
    const dropdownHTML = this.generateThemeDropdownHTML(options);
    container.innerHTML = dropdownHTML;

    // Find the rendered elements
    const dropdownMenu = container.querySelector('.theme-dropdown-menu') as HTMLElement;
    const dropdownButton = container.querySelector('.theme-dropdown-button') as HTMLElement;

    if (!dropdownMenu || !dropdownButton) {
      this.logError('Failed to find dropdown elements after rendering');
      return null;
    }

    // Setup dropdown functionality
    this.setupThemeDropdownEvents(dropdownButton, dropdownMenu, options);
    
    // Populate with current themes
    this.refreshThemeDropdownContent(dropdownMenu, options);

    // Track rendered component
    this.renderedComponents.set(`theme-dropdown-${selector}`, container as HTMLElement);

    this.log(`✅ Theme dropdown rendered in ${selector}`);
    return container as HTMLElement;
  }

  /**
   * Render mode toggle button in specified selector
   * @param selector CSS selector where to render the toggle
   */
  renderModeToggle(selector: string, options?: {
    customClasses?: string;
    initialMode?: 'light' | 'dark' | 'auto';
  }): HTMLElement | null {
    this.ensureInitialized();
    
    const container = document.querySelector(selector);
    if (!container) {
      this.logError(`Mode toggle container not found: ${selector}`);
      return null;
    }

    this.log(`🌙 Rendering mode toggle in ${selector}`);

    // Generate mode toggle HTML
    const toggleHTML = this.generateModeToggleHTML(options);
    container.innerHTML = toggleHTML;

    // Find the rendered button
    const toggleButton = container.querySelector('.mode-toggle-button') as HTMLElement;
    if (!toggleButton) {
      this.logError('Failed to find toggle button after rendering');
      return null;
    }

    // Setup toggle functionality
    this.setupModeToggleEvents(toggleButton);

    // Set initial mode
    const currentMode = options?.initialMode || this.themeManager.getCurrentMode();
    this.updateModeToggleIcon(toggleButton, currentMode);

    // Track rendered component
    this.renderedComponents.set(`mode-toggle-${selector}`, container as HTMLElement);

    this.log(`✅ Mode toggle rendered in ${selector}`);
    return container as HTMLElement;
  }

  /**
   * Render font selector button in specified selector
   * @param selector CSS selector where to render the button
   */
  renderFontSelector(selector: string, options?: {
    customClasses?: string;
    buttonText?: string;
  }): HTMLElement | null {
    this.ensureInitialized();
    
    const container = document.querySelector(selector);
    if (!container) {
      this.logError(`Font selector container not found: ${selector}`);
      return null;
    }

    this.log(`🔤 Rendering font selector in ${selector}`);

    // Generate font selector HTML
    const selectorHTML = this.generateFontSelectorHTML(options);
    container.innerHTML = selectorHTML;

    // Find the rendered button
    const selectorButton = container.querySelector('.font-selector-button') as HTMLElement;
    if (!selectorButton) {
      this.logError('Failed to find font selector button after rendering');
      return null;
    }

    // Setup font selector functionality
    this.setupFontSelectorEvents(selectorButton);

    // Track rendered component
    this.renderedComponents.set(`font-selector-${selector}`, container as HTMLElement);

    this.log(`✅ Font selector rendered in ${selector}`);
    return container as HTMLElement;
  }

  // ===========================================
  // MODAL SETUP METHODS
  // ===========================================

  /**
   * Setup theme installer modal (renders on demand)
   * @param triggerSelector Optional custom trigger selector
   */
  setupThemeInstaller(triggerSelector?: string): void {
    this.ensureInitialized();
    this.log('🌐 Setting up theme installer modal');

    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('theme-installer-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'theme-installer-modal';
      modalContainer.className = 'fixed inset-0 z-60 hidden';
      document.body.appendChild(modalContainer);
    }

    // Setup trigger if provided
    if (triggerSelector) {
      const trigger = document.querySelector(triggerSelector);
      if (trigger) {
        trigger.addEventListener('click', () => this.openThemeInstallerModal());
      }
    }

    this.log('✅ Theme installer modal setup complete');
  }

  /**
   * Setup font selector modal (renders on demand)
   * @param triggerSelector Optional custom trigger selector
   */
  setupFontModal(triggerSelector?: string): void {
    this.ensureInitialized();
    this.log('🎨 Setting up font selector modal');

    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('font-selector-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'font-selector-modal';
      modalContainer.className = 'fixed inset-0 z-60 hidden';
      document.body.appendChild(modalContainer);
    }

    // Setup trigger if provided
    if (triggerSelector) {
      const trigger = document.querySelector(triggerSelector);
      if (trigger) {
        trigger.addEventListener('click', () => this.openFontSelectorModal());
      }
    }

    this.log('✅ Font selector modal setup complete');
  }

  /**
   * Setup theme management modal (renders on demand)
   * @param triggerSelector Optional custom trigger selector
   */
  setupThemeManagement(triggerSelector?: string): void {
    this.ensureInitialized();
    this.log('⚙️ Setting up theme management modal');

    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('theme-management-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'theme-management-modal';
      modalContainer.className = 'fixed inset-0 z-60 hidden';
      document.body.appendChild(modalContainer);
    }

    // Setup trigger if provided
    if (triggerSelector) {
      const trigger = document.querySelector(triggerSelector);
      if (trigger) {
        trigger.addEventListener('click', () => this.openThemeManagementModal());
      }
    }

    this.log('✅ Theme management modal setup complete');
  }

  // ===========================================
  // HTML GENERATION METHODS (Templates)
  // ===========================================

  private generateThemeDropdownHTML(options?: any): string {
    const customClasses = options?.customClasses || '';
    
    return `
      <div class="relative theme-dropdown ${customClasses}" data-dropdown>
        <button 
          type="button"
          class="theme-dropdown-button inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label="Select theme"
        >
          <span class="theme-current-label">Loading...</span>
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          class="theme-dropdown-menu absolute right-0 z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-lg animate-fade-in hidden"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-button"
        >
          <!-- Theme options will be populated by JavaScript -->
        </div>
      </div>
    `;
  }

  private generateModeToggleHTML(options?: any): string {
    const customClasses = options?.customClasses || '';
    
    return `
      <button 
        type="button"
        class="mode-toggle-button inline-flex items-center justify-center rounded-md border border-input bg-background w-10 h-10 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer ${customClasses}"
        aria-label="Toggle light/dark mode"
        title="Toggle light/dark mode"
      >
        <svg class="mode-icon h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      </button>
    `;
  }

  private generateFontSelectorHTML(options?: any): string {
    const customClasses = options?.customClasses || '';
    const buttonText = options?.buttonText || 'Configure Fonts';
    
    return `
      <button 
        type="button"
        class="font-selector-button inline-flex items-center justify-center rounded-md border border-input bg-background w-10 h-10 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer ${customClasses}"
        aria-label="${buttonText}"
        title="${buttonText}"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M16 21v-7a1 1 0 00-1-1H9a1 1 0 00-1 1v7"></path>
        </svg>
      </button>
    `;
  }

  // ===========================================
  // EVENT SETUP METHODS
  // ===========================================

  private setupThemeDropdownEvents(button: HTMLElement, menu: HTMLElement, options?: any): void {
    // Toggle dropdown
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', (!isExpanded).toString());
      menu.classList.toggle('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target as Node) && !menu.contains(e.target as Node)) {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  private setupModeToggleEvents(button: HTMLElement): void {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const currentMode = this.themeManager.getCurrentMode();
      let newMode: 'light' | 'dark' | 'auto';

      switch (currentMode) {
        case 'light':
          newMode = 'dark';
          break;
        case 'dark':
          newMode = 'auto';
          break;
        case 'auto':
        default:
          newMode = 'light';
          break;
      }
      
      try {
        const currentTheme = this.themeManager.getCurrentTheme();
        await this.themeManager.setTheme(currentTheme, newMode);
        this.updateModeToggleIcon(button, newMode);
      } catch (error) {
        this.logError('Failed to switch mode', error as Error);
      }
    });
  }

  private setupFontSelectorEvents(button: HTMLElement): void {
    button.addEventListener('click', () => {
      this.openFontSelectorModal();
    });
  }

  // ===========================================
  // CONTENT UPDATE METHODS
  // ===========================================

  private refreshThemeDropdownContent(menu: HTMLElement, options?: any): void {
    // Clear existing content
    menu.innerHTML = '';
    
    // Get available themes
    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme();
    
    // Add theme options
    themes.forEach(theme => {
      const menuItem = document.createElement('button');
      menuItem.className = 'block w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground';
      menuItem.textContent = theme.label;
      
      if (theme.name === currentTheme) {
        menuItem.classList.add('bg-accent', 'text-accent-foreground');
      }
      
      menuItem.addEventListener('click', async () => {
        await this.handleThemeSelection(theme.name);
        menu.classList.add('hidden');
        
        // Update button state
        const button = menu.parentElement?.querySelector('.theme-dropdown-button');
        button?.setAttribute('aria-expanded', 'false');
      });
      
      menu.appendChild(menuItem);
    });
    
    // Add separator and special options if enabled
    if (themes.length > 0 && (options?.showInstallOption !== false || options?.showManageOption !== false)) {
      const separator = document.createElement('div');
      separator.className = 'h-px bg-border my-1';
      menu.appendChild(separator);
      
      if (options?.showInstallOption !== false) {
        const installOption = document.createElement('button');
        installOption.className = 'block w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground';
        installOption.textContent = '🌐 Install New Theme...';
        installOption.addEventListener('click', () => {
          this.openThemeInstallerModal();
          menu.classList.add('hidden');
          menu.parentElement?.querySelector('.theme-dropdown-button')?.setAttribute('aria-expanded', 'false');
        });
        menu.appendChild(installOption);
      }
      
      if (options?.showManageOption !== false) {
        const manageOption = document.createElement('button');
        manageOption.className = 'block w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground';
        manageOption.textContent = '⚙️ Manage Themes';
        manageOption.addEventListener('click', () => {
          this.openThemeManagementModal();
          menu.classList.add('hidden');
          menu.parentElement?.querySelector('.theme-dropdown-button')?.setAttribute('aria-expanded', 'false');
        });
        menu.appendChild(manageOption);
      }
    }
    
    // Update current theme label in button
    const currentThemeConfig = themes.find(t => t.name === currentTheme);
    const buttonLabel = menu.parentElement?.querySelector('.theme-current-label');
    if (buttonLabel && currentThemeConfig) {
      buttonLabel.textContent = currentThemeConfig.label;
    }
  }

  private updateModeToggleIcon(button: HTMLElement, mode: 'light' | 'dark' | 'auto'): void {
    const icon = button.querySelector('.mode-icon');
    if (!icon) return;

    const icons = {
      light: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
      dark: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`,
      auto: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>`
    };

    icon.innerHTML = icons[mode];
    button.setAttribute('aria-label', `Current mode: ${mode}`);
  }

  // ===========================================
  // MODAL METHODS (Placeholders for now)
  // ===========================================

  private openThemeInstallerModal(): void {
    this.log('🌐 Opening theme installer modal');
    // TODO: Implement with template engine when components are migrated
  }

  private openFontSelectorModal(): void {
    this.log('🔤 Opening font selector modal');
    // TODO: Implement with template engine when components are migrated
  }

  private openThemeManagementModal(): void {
    this.log('⚙️ Opening theme management modal');
    // TODO: Implement with template engine when components are migrated
  }

  // ===========================================
  // CORE FUNCTIONALITY
  // ===========================================

  private async handleThemeSelection(themeName: string): Promise<void> {
    try {
      const currentMode = this.themeManager.getCurrentMode();
      await this.themeManager.setTheme(themeName, currentMode);
      
      // Refresh all rendered theme dropdowns
      this.refreshAllThemeDropdowns();
      
    } catch (error) {
      this.logError('Failed to switch theme', error as Error);
    }
  }

  private refreshAllThemeDropdowns(): void {
    // Find all rendered theme dropdowns and refresh them
    this.renderedComponents.forEach((element, key) => {
      if (key.includes('theme-dropdown')) {
        const menu = element.querySelector('.theme-dropdown-menu') as HTMLElement;
        if (menu) {
          this.refreshThemeDropdownContent(menu);
        }
      }
    });
  }

  private setupThemeCallbacks(): void {
    // Theme manager callback
    this.themeManager.setOnThemeInstalledCallback(() => {
      this.refreshAllThemeDropdowns();
    });
    
    // Theme installer callback  
    this.themeInstaller.setOnThemeInstalledCallback(() => {
      this.refreshAllThemeDropdowns();
    });
  }

  private setupGlobalEventListeners(): void {
    // System theme preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', async () => {
      if (this.themeManager.getCurrentMode() === 'auto') {
        const currentTheme = this.themeManager.getCurrentTheme();
        await this.themeManager.setTheme(currentTheme, 'auto');
      }
    });
  }

  // ===========================================
  // PUBLIC API METHODS
  // ===========================================

  /**
   * Set theme programmatically
   */
  async setTheme(themeName: string, mode?: 'light' | 'dark' | 'auto'): Promise<void> {
    this.ensureInitialized();
    await this.themeManager.setTheme(themeName, mode);
    this.refreshAllThemeDropdowns();
  }

  /**
   * Get current theme name
   */
  getCurrentTheme(): string {
    this.ensureInitialized();
    return this.themeManager.getCurrentTheme();
  }

  /**
   * Get current mode
   */
  getCurrentMode(): 'light' | 'dark' | 'auto' {
    this.ensureInitialized();
    return this.themeManager.getCurrentMode();
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    this.ensureInitialized();
    return this.themeManager.getAvailableThemes();
  }

  /**
   * Install theme from URL
   */
  async installThemeFromUrl(url: string): Promise<void> {
    this.ensureInitialized();
    await this.themeInstaller.installFromUrl(url);
    this.refreshAllThemeDropdowns();
  }

  /**
   * Set font override
   */
  setFontOverride(category: 'sans' | 'serif' | 'mono', fontId: string): void {
    this.ensureInitialized();
    this.fontManager.setFontOverride(category, fontId);
  }

  /**
   * Get rendered components map (for debugging)
   */
  getRenderedComponents(): Map<string, HTMLElement> {
    return this.renderedComponents;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('VanillaThemeManager must be initialized before use. Call init() first.');
    }
  }

  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[VanillaThemeManager] ${message}`);
    }
  }

  private logError(message: string, error?: Error): void {
    if (this.options.enableLogging) {
      console.error(`[VanillaThemeManager] ${message}`, error);
    }
  }

  /**
   * Clean up all rendered components and event listeners
   */
  destroy(): void {
    this.renderedComponents.clear();
    this.initialized = false;
    this.log('🗑️ VanillaThemeManager destroyed');
  }
}

// Export convenience function
export function createThemeManager(options?: VanillaThemeManagerOptions): VanillaThemeManager {
  return new VanillaThemeManager(options);
}

// Re-export types from core package
export type { ThemeConfig } from '@mks2508/shadcn-basecoat-theme-manager';