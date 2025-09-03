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

    // Add data-dropdown attribute to container if not present
    if (!container.hasAttribute('data-dropdown')) {
      container.setAttribute('data-dropdown', '');
    }
    if (!container.classList.contains('relative')) {
      container.classList.add('relative');
    }

    // Create dropdown HTML structure and insert into container
    const dropdownHTML = this.generateThemeDropdownHTML(options);
    container.innerHTML = dropdownHTML;

    // Find the rendered elements within the container
    const dropdownMenu = container.querySelector('#theme-menu') as HTMLElement;
    const dropdownButton = container.querySelector('#theme-button') as HTMLElement;

    if (!dropdownMenu || !dropdownButton) {
      this.logError('Failed to find dropdown elements after rendering');
      return null;
    }

    // Setup dropdown functionality
    this.setupThemeDropdownEvents(dropdownButton, dropdownMenu, options);
    
    // Populate with current themes
    this.refreshThemeDropdownContent(dropdownMenu, options);

    // Track rendered component (container with dropdown inside)
    this.renderedComponents.set(`theme-dropdown-${selector}`, container as HTMLElement);

    this.log(`✅ Theme dropdown rendered in ${selector}`);
    return container as HTMLElement;
  }

  /**
   * Render mode toggle button in specified selector (configure existing element like @src)
   * @param selector CSS selector where to find the existing toggle button
   */
  renderModeToggle(selector: string, options?: {
    customClasses?: string;
    initialMode?: 'light' | 'dark' | 'auto';
  }): HTMLElement | null {
    this.ensureInitialized();
    
    // Find existing mode toggle button (like @src AppController)
    const modeToggle = document.querySelector(selector) as HTMLElement;
    if (!modeToggle) {
      this.logError(`Mode toggle button not found: ${selector}`);
      return null;
    }

    this.log(`🌙 Configuring mode toggle at ${selector}`);

    // Apply complete CSS classes to button (essential for styling)
    const baseClasses = "btn-icon";
    const customClasses = options?.customClasses || '';
    modeToggle.className = baseClasses + (customClasses ? ` ${customClasses}` : '');
    
    // Set proper attributes
    modeToggle.setAttribute('aria-label', 'Toggle light/dark mode');
    modeToggle.setAttribute('title', 'Toggle light/dark mode');

    // Setup toggle functionality (like @src)
    this.setupModeToggleEvents(modeToggle);

    // Set initial mode and render icon
    const currentMode = options?.initialMode || this.themeManager.getCurrentMode();
    this.updateModeToggleIcon(modeToggle, currentMode);

    // Track rendered component
    this.renderedComponents.set(`mode-toggle-${selector}`, modeToggle);

    this.log(`✅ Mode toggle configured at ${selector}`);
    return modeToggle;
  }

  /**
   * Render font selector button in specified selector (configure existing element like @src)
   * @param selector CSS selector where to find the existing font selector button
   */
  renderFontSelector(selector: string, options?: {
    customClasses?: string;
    buttonText?: string;
  }): HTMLElement | null {
    this.ensureInitialized();
    
    // Find existing font selector button (like @src FontSelector)
    const fontButton = document.querySelector(selector) as HTMLElement;
    if (!fontButton) {
      this.logError(`Font selector button not found: ${selector}`);
      return null;
    }

    this.log(`🔤 Configuring font selector at ${selector}`);

    // Apply complete CSS classes to button (essential for styling)
    const baseClasses = "btn-icon";
    const customClasses = options?.customClasses || '';
    fontButton.className = baseClasses + (customClasses ? ` ${customClasses}` : '');
    
    // Set proper attributes
    fontButton.setAttribute('aria-label', 'Configure fonts');
    fontButton.setAttribute('title', 'Configure fonts');

    // Generate and set font icon content using template engine
    const iconHTML = this.generateFontSelectorIcon();
    fontButton.innerHTML = iconHTML;

    // Setup font selector functionality (like @src)
    this.setupFontSelectorEvents(fontButton);

    // Track rendered component
    this.renderedComponents.set(`font-selector-${selector}`, fontButton);

    this.log(`✅ Font selector configured at ${selector}`);
    return fontButton;
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
    return `<button 
          type="button"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label="Select theme"
        >
          <span id="current-theme-label">Default</span>
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          id="theme-menu"
          class="absolute right-0 z-50 mt-2 w-40 rounded-md border bg-popover p-1 shadow-lg animate-fade-in hidden"
          role="menu"
          aria-orientation="vertical"
        >
          <!-- Theme options will be generated by JavaScript -->
        </div>`;
  }

  /**
   * Generate SVG icon content for mode toggle (template engine approach)
   */
  private generateModeToggleIcon(mode: 'light' | 'dark' | 'auto'): string {
    const icons = {
      light: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>`,
      dark: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 7 18.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>`,
      auto: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
      </svg>`
    };
    
    return icons[mode];
  }

  /**
   * Generate font selector icon content (template engine approach)
   */
  private generateFontSelectorIcon(): string {
    return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M16 21v-7a1 1 0 00-1-1H9a1 1 0 00-1 1v7"></path>
    </svg>`;
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
    // Add pointer-events to ensure SVG children don't block clicks (matching @src)
    button.style.pointerEvents = 'auto';
    const svgs = button.querySelectorAll('svg');
    svgs.forEach(svg => {
      svg.style.pointerEvents = 'none';
    });
    
    const clickHandler = async (event: Event) => {
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
    };

    button.addEventListener('click', clickHandler);
  }

  private setupFontSelectorEvents(button: HTMLElement): void {
    // Add pointer-events to ensure SVG children don't block clicks (matching @src)
    button.style.pointerEvents = 'auto';
    const svgs = button.querySelectorAll('svg');
    svgs.forEach(svg => {
      svg.style.pointerEvents = 'none';
    });
    
    const clickHandler = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openFontSelectorModal();
    };
    
    button.addEventListener('click', clickHandler);
    
    // Update button state based on font overrides (matching @src)
    this.updateFontButtonState(button);
  }

  // ===========================================
  // CONTENT UPDATE METHODS
  // ===========================================

  private refreshThemeDropdownContent(menu: HTMLElement, options?: any): void {
    // Get available themes
    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme();
    
    // Theme-specific icons (matching original structure)
    const getThemeIcon = (themeName: string): string => {
      switch (themeName) {
        case 'supabase':
          return `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>`;
        default:
          return `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z"></path>
                                </svg>`;
      }
    };
    
    const checkIcon = `<svg class="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    
    // Generate complete HTML structure exactly like original
    let htmlContent = '';
    
    themes.forEach(theme => {
      htmlContent += `
        <button 
          type="button"
          class="theme-option relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          data-theme="${theme.name}"
          role="menuitem"
          ${theme.name === currentTheme ? 'aria-selected="true"' : ''}
        >
          ${getThemeIcon(theme.name)}
          <span>${theme.label}</span>
          ${theme.name === currentTheme ? checkIcon : ''}
        </button>
      `;
    });
    
    // Add separator and bottom section
    if (themes.length > 0) {
      htmlContent += `<div class="h-px bg-border my-1"></div>
                            <div class="flex">
                                <button type="button" id="browse-more-themes" class="relative flex flex-1 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-primary" role="menuitem">
                                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    Browse More...
                                </button>
                                <button type="button" id="theme-settings-btn" class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-muted-foreground hover:text-accent-foreground" role="menuitem">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </button>
                            </div>`;
    }
    
    // Set the complete HTML at once
    menu.innerHTML = htmlContent;
    
    // Setup event listeners for all theme options
    themes.forEach(theme => {
      const menuItem = menu.querySelector(`[data-theme="${theme.name}"]`);
      menuItem?.addEventListener('click', async () => {
        await this.handleThemeSelection(theme.name);
        menu.classList.add('hidden');
        
        // Update button state
        const button = menu.parentElement?.querySelector('#theme-button');
        button?.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Setup event listeners for bottom buttons
    const browseButton = menu.querySelector('#browse-more-themes');
    browseButton?.addEventListener('click', () => {
      this.openThemeInstallerModal();
      menu.classList.add('hidden');
      menu.parentElement?.querySelector('#theme-button')?.setAttribute('aria-expanded', 'false');
    });
    
    const settingsButton = menu.querySelector('#theme-settings-btn');
    settingsButton?.addEventListener('click', () => {
      this.openThemeManagementModal();
      menu.classList.add('hidden');
      menu.parentElement?.querySelector('#theme-button')?.setAttribute('aria-expanded', 'false');
    });
    
    // Update current theme label in button
    const currentThemeConfig = themes.find(t => t.name === currentTheme);
    const buttonLabel = menu.parentElement?.querySelector('#current-theme-label');
    if (buttonLabel && currentThemeConfig) {
      buttonLabel.textContent = currentThemeConfig.label;
    }
  }

  private updateModeToggleIcon(button: HTMLElement, mode: 'light' | 'dark' | 'auto'): void {
    // Use template engine to generate icon content
    const iconHTML = this.generateModeToggleIcon(mode);
    
    // Update button content (like @src AppController)
    button.innerHTML = iconHTML;
    button.setAttribute('aria-label', `Current mode: ${mode}`);
  }

  /**
   * Update theme label in UI (matching @src)
   */
  private updateThemeLabel(theme: string): void {
    const themeLabel = document.getElementById('current-theme-label');
    if (themeLabel) {
      const themes = this.themeManager.getAvailableThemes();
      const themeConfig = themes.find(t => t.name === theme);
      themeLabel.textContent = themeConfig?.label || theme;
    }
  }

  /**
   * Update font button state based on overrides (matching @src behavior)
   */
  private updateFontButtonState(button: HTMLElement): void {
    // Check if font override is enabled via core manager
    const hasOverrides = this.fontManager.isOverrideEnabled();
    
    // Visual indication of active overrides (matching @src)
    if (hasOverrides) {
      button.classList.add('text-primary', 'font-medium');
      button.setAttribute('title', 'Font overrides active - Click to configure');
    } else {
      button.classList.remove('text-primary', 'font-medium');
      button.setAttribute('title', 'Configure fonts');
    }
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
      
      // Update theme label (matching @src)
      this.updateThemeLabel(themeName);
      
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
    this.setupSystemThemeListener();
  }

  /**
   * Set up system theme preference listener (matching @src exactly)
   */
  private setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', async () => {
      if (this.themeManager.getCurrentMode() === 'auto') {
        // Re-apply current theme with auto mode to pick up system change
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