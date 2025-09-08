import { 
  ThemeCore,
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
    
    // Managers will be initialized from ThemeCore in init()
    this.themeManager = null as any;
    this.fontManager = null as any;
    this.themeInstaller = null as any;
  }

  /**
   * Initialize the core theme management system
   * This must be called before using any render methods
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.log('🚀 Initializing Vanilla Theme Manager');

      // Use ThemeCore global instance instead of creating local instances
      const managers = await ThemeCore.waitForReady();
      
      this.themeManager = managers.themeManager;
      this.fontManager = managers.fontManager;
      this.themeInstaller = managers.themeInstaller;
      
      // Set up theme installation callbacks
      this.setupThemeCallbacks();
      
      // Set up global event listeners if enabled
      if (this.options.autoSetupEventListeners) {
        this.setupGlobalEventListeners();
      }
      
      this.initialized = true;
      this.log('✅ Vanilla Theme Manager initialized with ThemeCore');
      
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

    // Apply Basecoat CSS classes to button
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

    // Apply Basecoat CSS classes to button
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
          id="theme-button"
          class="btn-outline flex items-center justify-center"
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
          class="dropdown-menu absolute right-0 z-50 mt-2 w-48 hidden"
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
          class="dropdown-item ${theme.name === currentTheme ? 'dropdown-item-active' : ''}"
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
      htmlContent += `<div class="dropdown-separator"></div>
                            <div class="flex">
                                <button type="button" id="browse-more-themes" class="dropdown-item flex-1 text-primary" role="menuitem">
                                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    Browse More...
                                </button>
                                <button type="button" id="theme-settings-btn" class="dropdown-item text-muted-foreground" role="menuitem">
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
    
    // Update button content and classes for Basecoat
    button.innerHTML = iconHTML;
    button.className = 'btn-icon';
    button.setAttribute('aria-label', `Current mode: ${mode}`);
    button.setAttribute('title', `Current mode: ${mode}`);
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
    
    // Visual indication of active overrides using Basecoat classes
    if (hasOverrides) {
      button.classList.add('btn-icon-active');
      button.setAttribute('title', 'Font overrides active - Click to configure');
    } else {
      button.classList.remove('btn-icon-active');
      button.setAttribute('title', 'Configure fonts');
    }
  }

  // ===========================================
  // MODAL METHODS (Placeholders for now)
  // ===========================================

  private openThemeInstallerModal(): void {
    this.log('🌐 Opening theme installer modal');
    
    let modalContainer = document.getElementById('theme-installer-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'theme-installer-modal';
      modalContainer.className = 'fixed inset-0 z-60 bg-background/80 backdrop-blur-sm';
      document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = `
      <div class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2">
        <div class="modal">
          <header>
            <h2 class="text-lg font-semibold">Install Theme</h2>
            <p class="text-sm text-muted-foreground">Install themes from TweakCN or shadcn/ui compatible URLs</p>
            <button type="button" id="installer-modal-close" class="btn-icon absolute right-4 top-4" aria-label="Close">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </header>
          <section class="space-y-4">
            <div class="space-y-2">
              <label for="theme-url" class="text-sm font-medium">Theme URL</label>
              <input id="theme-url" type="url" placeholder="https://tweakcn.com/r/themes/..." class="input w-full" />
            </div>
            <div class="text-xs text-muted-foreground">
              <p>Supported sources:</p>
              <ul class="list-disc list-inside ml-2 space-y-1">
                <li>TweakCN themes (tweakcn.com/r/themes/...)</li>
                <li>Direct JSON URLs</li>
                <li>shadcn/ui compatible themes</li>
              </ul>
            </div>
          </section>
          <footer class="flex justify-end space-x-2">
            <button type="button" id="installer-cancel" class="btn-outline">Cancel</button>
            <button type="button" id="installer-install" class="btn" disabled>Install Theme</button>
          </footer>
        </div>
      </div>
    `;
    
    this.setupThemeInstallerEvents(modalContainer);
    modalContainer.classList.remove('hidden');
  }

  private openFontSelectorModal(): void {
    this.log('🔤 Opening font selector modal');
    
    let modalContainer = document.getElementById('font-selector-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'font-selector-modal';
      modalContainer.className = 'fixed inset-0 z-60 bg-background/80 backdrop-blur-sm';
      document.body.appendChild(modalContainer);
    }
    
    // Get current font overrides from manager
    const fontConfig = this.fontManager.getOverrideConfiguration();
    
    modalContainer.innerHTML = `
      <div class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div class="modal">
          <header>
            <h2 class="text-lg font-semibold">Font Settings</h2>
            <p class="text-sm text-muted-foreground">Customize fonts for your interface</p>
            <button type="button" id="font-modal-close" class="btn-icon absolute right-4 top-4" aria-label="Close">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </header>
          <section class="space-y-6">
            ${this.generateFontCategorySelector('sans', 'Sans Serif', fontConfig.fonts.sans)}
            ${this.generateFontCategorySelector('serif', 'Serif', fontConfig.fonts.serif)}
            ${this.generateFontCategorySelector('mono', 'Monospace', fontConfig.fonts.mono)}
          </section>
          <footer class="flex justify-end space-x-2">
            <button type="button" id="font-reset" class="btn-outline">Reset to Theme Defaults</button>
            <button type="button" id="font-close" class="btn">Close</button>
          </footer>
        </div>
      </div>
    `;
    
    this.setupFontSelectorModalEvents(modalContainer);
    modalContainer.classList.remove('hidden');
  }

  private openThemeManagementModal(): void {
    this.log('⚙️ Opening theme management modal');
    
    let modalContainer = document.getElementById('theme-management-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'theme-management-modal';
      modalContainer.className = 'fixed inset-0 z-60 bg-background/80 backdrop-blur-sm';
      document.body.appendChild(modalContainer);
    }
    
    const themes = this.themeManager.getAvailableThemes();
    const installedCount = themes.filter(t => t.category !== 'built-in').length;
    
    modalContainer.innerHTML = `
      <div class="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2">
        <div class="modal flex flex-col">
          <header class="border-b pb-4">
            <h2 class="text-lg font-semibold">Theme Management</h2>
            <p class="text-sm text-muted-foreground">Manage your installed themes</p>
            <button type="button" id="mgmt-modal-close" class="btn-icon absolute right-4 top-4" aria-label="Close">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </header>
          
          <div class="flex items-center justify-between py-4 border-b">
            <div class="flex items-center space-x-4">
              <div class="text-sm">
                <span class="font-medium">${themes.length}</span>
                <span class="text-muted-foreground">total themes</span>
              </div>
              <div class="text-sm">
                <span class="font-medium">${installedCount}</span>
                <span class="text-muted-foreground">installed</span>
              </div>
            </div>
            <button type="button" id="refresh-themes" class="btn-outline btn-sm">Refresh</button>
          </div>
          
          <section class="flex-1 overflow-auto py-4">
            <div class="grid gap-4">
              ${themes.map(theme => `
                <div class="card card-compact border-l-4 border-l-${theme.name === this.themeManager.getCurrentTheme() ? 'primary' : 'transparent'}">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-medium">${theme.label}</h3>
                      <p class="text-sm text-muted-foreground">${theme.name}</p>
                      <div class="flex items-center space-x-2 mt-1">
                        <span class="badge ${theme.category === 'built-in' ? 'badge-secondary' : 'badge-outline'}">
                          ${theme.category}
                        </span>
                        ${theme.name === this.themeManager.getCurrentTheme() ? '<span class="badge">Active</span>' : ''}
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      ${theme.name !== this.themeManager.getCurrentTheme() ? 
                        `<button type="button" class="btn-sm btn-outline" data-action="apply" data-theme="${theme.name}">Apply</button>` : ''}
                      ${theme.category !== 'built-in' ? 
                        `<button type="button" class="btn-sm btn-destructive-outline" data-action="remove" data-theme="${theme.name}">Remove</button>` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
          
          <footer class="flex justify-between pt-4 border-t">
            <button type="button" id="install-more-themes" class="btn-outline">Install More Themes</button>
            <button type="button" id="mgmt-close" class="btn">Close</button>
          </footer>
        </div>
      </div>
    `;
    
    this.setupThemeManagementModalEvents(modalContainer);
    modalContainer.classList.remove('hidden');
  }

  // ===========================================
  // MODAL EVENT HANDLERS
  // ===========================================
  
  private generateFontCategorySelector(category: 'sans' | 'serif' | 'mono', label: string, currentFont?: string): string {
    // Get available fonts for this category (simplified catalog)
    const fontsByCategory = {
      sans: [
        { id: 'inter', name: 'Inter' },
        { id: 'roboto', name: 'Roboto' },
        { id: 'open-sans', name: 'Open Sans' },
        { id: 'lato', name: 'Lato' }
      ],
      serif: [
        { id: 'playfair', name: 'Playfair Display' },
        { id: 'merriweather', name: 'Merriweather' },
        { id: 'georgia', name: 'Georgia' }
      ],
      mono: [
        { id: 'jetbrains-mono', name: 'JetBrains Mono' },
        { id: 'fira-code', name: 'Fira Code' },
        { id: 'source-code-pro', name: 'Source Code Pro' }
      ]
    };
    
    const fonts = fontsByCategory[category] || [];
    
    return `
      <div class="space-y-2">
        <label class="text-sm font-medium">${label}</label>
        <select class="select w-full" data-category="${category}">
          <option value="">Use theme default</option>
          ${fonts.map(font => `
            <option value="${font.id}" ${currentFont === font.id ? 'selected' : ''}>
              ${font.name}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }
  
  private setupThemeInstallerEvents(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#installer-modal-close, #installer-cancel');
    const installBtn = modal.querySelector('#installer-install') as HTMLButtonElement;
    const urlInput = modal.querySelector('#theme-url') as HTMLInputElement;
    
    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    // Enable/disable install button based on URL input
    urlInput?.addEventListener('input', () => {
      installBtn.disabled = !urlInput.value.trim();
    });
    
    // Install theme
    installBtn?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      
      installBtn.disabled = true;
      installBtn.textContent = 'Installing...';
      
      try {
        await this.themeInstaller.installFromUrl(url);
        this.log('✅ Theme installed successfully');
        modal.classList.add('hidden');
        this.refreshAllThemeDropdowns();
      } catch (error) {
        this.logError('Failed to install theme', error as Error);
        // Show error in UI
        const errorDiv = modal.querySelector('.error-message') || document.createElement('div');
        errorDiv.className = 'error-message text-destructive text-sm mt-2';
        errorDiv.textContent = 'Failed to install theme. Please check the URL.';
        urlInput.parentNode?.appendChild(errorDiv);
      } finally {
        installBtn.disabled = false;
        installBtn.textContent = 'Install Theme';
      }
    });
  }
  
  private setupFontSelectorModalEvents(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#font-modal-close, #font-close');
    const resetBtn = modal.querySelector('#font-reset');
    const selects = modal.querySelectorAll('select[data-category]');
    
    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    // Handle font selection changes
    selects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        const category = target.dataset.category as 'sans' | 'serif' | 'mono';
        const fontId = target.value;
        
        if (fontId) {
          await this.fontManager.setFontOverride(category, fontId);
        } else {
          await this.fontManager.removeFontOverride(category);
        }
        
        // Update font button states
        this.updateAllFontButtonStates();
      });
    });
    
    // Reset to theme defaults
    resetBtn?.addEventListener('click', async () => {
      await this.fontManager.disableOverride();
      
      // Update selects to show no selection
      selects.forEach(select => {
        (select as HTMLSelectElement).value = '';
      });
      
      this.updateAllFontButtonStates();
    });
  }
  
  private setupThemeManagementModalEvents(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#mgmt-modal-close, #mgmt-close');
    const refreshBtn = modal.querySelector('#refresh-themes');
    const installMoreBtn = modal.querySelector('#install-more-themes');
    
    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    // Refresh themes
    refreshBtn?.addEventListener('click', () => {
      this.refreshAllThemeDropdowns();
      // Re-open modal with updated data
      modal.classList.add('hidden');
      setTimeout(() => this.openThemeManagementModal(), 100);
    });
    
    // Install more themes
    installMoreBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.openThemeInstallerModal();
    });
    
    // Handle theme actions
    modal.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const themeName = target.dataset.theme;
      
      if (!action || !themeName) return;
      
      if (action === 'apply') {
        try {
          const currentMode = this.themeManager.getCurrentMode();
          await this.themeManager.setTheme(themeName, currentMode);
          this.refreshAllThemeDropdowns();
          // Re-open modal with updated data
          modal.classList.add('hidden');
          setTimeout(() => this.openThemeManagementModal(), 100);
        } catch (error) {
          this.logError('Failed to apply theme', error as Error);
        }
      } else if (action === 'remove') {
        if (confirm(`Remove theme "${themeName}"? This cannot be undone.`)) {
          try {
            // Note: removeTheme method may not exist, using placeholder
            console.warn('Theme removal not yet implemented in ThemeInstaller');
            // await this.themeInstaller.removeTheme(themeName);
            this.refreshAllThemeDropdowns();
            // Re-open modal with updated data
            modal.classList.add('hidden');
            setTimeout(() => this.openThemeManagementModal(), 100);
          } catch (error) {
            this.logError('Failed to remove theme', error as Error);
          }
        }
      }
    });
  }
  
  private updateAllFontButtonStates(): void {
    // Update all rendered font selector buttons
    this.renderedComponents.forEach((element, key) => {
      if (key.includes('font-selector')) {
        this.updateFontButtonState(element);
      }
    });
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
    // Listen for theme events directly from the managers
    document.addEventListener('theme-installed', () => {
      this.refreshAllThemeDropdowns();
    });
    
    document.addEventListener('theme-uninstalled', () => {
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
   * Remove font override for category
   */
  removeFontOverride(category: 'sans' | 'serif' | 'mono'): Promise<void> {
    this.ensureInitialized();
    return this.fontManager.removeFontOverride(category);
  }
  
  /**
   * Disable all font overrides
   */
  disableFontOverrides(): Promise<void> {
    this.ensureInitialized();
    return this.fontManager.disableOverride();
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