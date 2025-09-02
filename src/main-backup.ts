import './style.css';
import { ThemeManager } from './theme-manager';
import { DropdownManager } from './dropdown-manager';
import { ThemeInstaller } from './theme-installer';
import { FontSelector } from './font-selector';
import { ThemeManagementModal } from './theme-management-modal';

/**
 * Application initialization and theme management
 */
class App {
  private themeManager: ThemeManager;
  private dropdownManager: DropdownManager;
  private themeInstaller: ThemeInstaller;
  private fontSelector: FontSelector;
  private themeManagementModal: ThemeManagementModal;

  constructor() {
    this.themeManager = new ThemeManager();
    this.dropdownManager = new DropdownManager();
    this.themeInstaller = new ThemeInstaller(this.themeManager);
    this.fontSelector = new FontSelector(this.themeManager.getFontManager());
    this.themeManagementModal = new ThemeManagementModal(this.themeManager);
  }

  /**
   * Initialize the application (optimized loading)
   */
  async init(): Promise<void> {
    try {
      // Initialize theme system
      await this.themeManager.init();
      
      // Set up callback for theme installation
      this.themeManager.setOnThemeInstalledCallback(() => {
        console.log('🔄 Theme installed, refreshing dropdown...');
        this.generateThemeOptions(); // Regenerate dropdown when theme installed
        // Event delegation handles the new options automatically
      });
      
      // Also set callback for theme installer directly
      this.themeInstaller.setOnThemeInstalledCallback(() => {
        console.log('🔄 Theme installer callback triggered, refreshing dropdown...');
        this.generateThemeOptions();
      });
      
      // Generate theme dropdown options dynamically
      this.generateThemeOptions();
      
      // Initialize dropdown functionality
      this.dropdownManager.init();
      
      // Set up theme switching event listeners
      this.setupThemeEventListeners();
      
      // Initialize theme installer
      await this.themeInstaller.init();
      
      // Initialize font selector
      this.fontSelector.init();
      
      // Initialize theme management modal
      await this.themeManagementModal.init();
      
      // Set callback for theme deletion to update dropdown
      this.themeManagementModal.setOnThemeDeletedCallback(() => {
        this.generateThemeOptions(); // Regenerate dropdown when theme deleted
      });
      
      // Hide loading overlay and show main content
      this.showMainContent();
      
      // Update UI labels to match current state
      this.updateThemeLabel(this.themeManager.getCurrentTheme());
      this.updateModeToggleIcon(this.themeManager.getCurrentMode());
      
      // Log successful initialization
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Generate theme dropdown options dynamically (only themes, not modes)
   */
  private generateThemeOptions(): void {
    const dropdownMenu = document.querySelector('[role="menu"]');
    if (!dropdownMenu) return;

    // Store current dropdown state
    const wasOpen = document.getElementById('theme-button')?.getAttribute('aria-expanded') === 'true';

    // Clear existing options
    dropdownMenu.innerHTML = '';

    // Add all available themes (no modes here)
    const themes = this.themeManager.getAvailableThemes();
    themes.forEach(theme => {
      const icon = this.getThemeIcon(theme.name);
      dropdownMenu.innerHTML += `
        <button 
          type="button"
          class="theme-option relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          data-theme="${theme.name}"
          role="menuitem"
        >
          ${icon}
          ${theme.label}
        </button>
      `;
    });

    // Add separator
    dropdownMenu.innerHTML += `<div class="h-px bg-border my-1"></div>`;

    // Add Browse More and Settings buttons in a flex row
    dropdownMenu.innerHTML += `
      <div class="flex">
        <button 
          type="button"
          id="browse-more-themes"
          class="relative flex flex-1 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-primary"
          role="menuitem"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Browse More...
        </button>
        <button 
          type="button"
          id="theme-settings-btn"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-muted-foreground hover:text-accent-foreground"
          role="menuitem"
          title="Manage installed themes"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    `;

    // Restore dropdown state if it was open
    if (wasOpen) {
      this.dropdownManager.closeAllDropdowns();
    }
  }

  /**
   * Get appropriate icon for a theme
   */
  private getThemeIcon(themeName: string): string {
    const icons: Record<string, string> = {
      default: `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>`,
      supabase: `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>`
    };

    // Return specific icon or default
    return icons[themeName] || icons['default'];
  }

  /**
   * Set up event listeners for theme switching and mode toggle
   */
  private setupThemeEventListeners(): void {
    // Use event delegation for theme options (survives DOM regeneration)
    const dropdownMenu = document.querySelector('[role="menu"]');
    if (dropdownMenu) {
      // Remove any existing listeners to avoid duplicates
      dropdownMenu.removeEventListener('click', this.handleThemeOptionClick);
      dropdownMenu.addEventListener('click', this.handleThemeOptionClick.bind(this));
    }

    // Mode toggle button (only setup once)
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle && !modeToggle.hasAttribute('data-listener-added')) {
      modeToggle.setAttribute('data-listener-added', 'true');
      modeToggle.addEventListener('click', async () => {
        const currentMode = this.themeManager.getCurrentMode();
        const currentTheme = this.themeManager.getCurrentTheme();
        
        // Cycle through modes: light -> dark -> auto -> light
        let newMode: 'light' | 'dark' | 'auto';
        switch (currentMode) {
          case 'light':
            newMode = 'dark';
            break;
          case 'dark':
            newMode = 'auto';
            break;
          case 'auto':
            newMode = 'light';
            break;
        }
        
        console.log(`🔄 Toggling mode: ${currentMode} -> ${newMode}`);
        
        try {
          await this.themeManager.setTheme(currentTheme, newMode);
          this.updateModeToggleIcon(newMode);
          console.log(`✅ Mode toggle completed: ${newMode}`);
        } catch (error) {
          console.error('❌ Failed to toggle mode:', error);
          this.showError('Failed to toggle mode');
        }
      });
    }

    // Listen for system theme changes (only setup once)
    if (!window.hasOwnProperty('themeSystemListenerAdded')) {
      (window as any).themeSystemListenerAdded = true;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
        const currentMode = this.themeManager.getCurrentMode();
        if (currentMode === 'auto') {
          // Reapply current theme with auto mode to pick up system change
          const currentTheme = this.themeManager.getCurrentTheme();
          await this.themeManager.setTheme(currentTheme, 'auto');
        }
      });
    }
  }

  /**
   * Handle theme option clicks with event delegation
   */
  private async handleThemeOptionClick(event: Event): Promise<void> {
    console.log('🖱️ [FOCUS-DEBUG] Theme dropdown clicked');
    console.log('🖱️ [FOCUS-DEBUG] Click event target:', event.target);
    console.log('🖱️ [FOCUS-DEBUG] Active element during dropdown click:', document.activeElement);
    
    const target = event.target as HTMLElement;
    
    // Check if Browse More button was clicked
    if (target.id === 'browse-more-themes' || target.closest('#browse-more-themes')) {
      console.log('🔍 Browse More button clicked, opening theme browser modal');
      this.dropdownManager.closeAllDropdowns();
      this.openThemeBrowserModal();
      return;
    }
    
    // Check if Settings button was clicked
    if (target.id === 'theme-settings-btn' || target.closest('#theme-settings-btn')) {
      console.log('⚙️ Theme Settings button clicked, opening theme management modal');
      this.dropdownManager.closeAllDropdowns();
      this.openThemeManagementModal();
      return;
    }
    
    // Check if clicked element is a theme option
    if (target.classList.contains('theme-option') || target.closest('.theme-option')) {
      const themeOption = target.classList.contains('theme-option') ? target : target.closest('.theme-option') as HTMLElement;
      const theme = themeOption?.getAttribute('data-theme');
      
      console.log(`🖱️ Theme option clicked: ${theme}`);
      console.log('🖱️ [FOCUS-DEBUG] About to switch theme, active element:', document.activeElement);
      
      if (theme) {
        try {
          console.log(`🔄 Switching to theme: ${theme}`);
          // Keep current mode, just change theme
          const currentMode = this.themeManager.getCurrentMode();
          await this.themeManager.setTheme(theme, currentMode);
          this.updateThemeLabel(theme);
          this.dropdownManager.closeAllDropdowns();
          console.log(`✅ Theme switch completed: ${theme}`);
          console.log('🖱️ [FOCUS-DEBUG] Theme switch completed, active element:', document.activeElement);
        } catch (error) {
          console.error('❌ Failed to switch theme:', error);
          this.showError('Failed to switch theme');
        }
      } else {
        console.error('❌ No theme found on clicked element');
      }
    }
  }

  /**
   * Open theme browser modal and trigger search
   */
  private openThemeBrowserModal(): void {
    console.log('🎨 Opening theme browser modal');
    
    // Open the install theme modal
    const modal = document.getElementById('theme-install-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Trigger the search themes functionality
      const searchBtn = document.getElementById('search-themes-btn');
      if (searchBtn) {
        searchBtn.click();
      }
      
      // Focus on the URL input for accessibility
      setTimeout(() => {
        const urlInput = document.getElementById('theme-url-input') as HTMLInputElement;
        if (urlInput) {
          urlInput.focus();
        }
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Open theme management modal
   */
  private openThemeManagementModal(): void {
    console.log('⚙️ Opening theme management modal');
    
    // Open the theme management modal
    const modal = document.getElementById('theme-management-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Load installed themes list
      this.loadInstalledThemesForManagement();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Load installed themes for management
   */
  private async loadInstalledThemesForManagement(): Promise<void> {
    await this.themeManagementModal.loadInstalledThemes();
  }

  /**
   * Update the theme label in the dropdown button
   */
  private updateThemeLabel(theme: string): void {
    const label = document.getElementById('current-theme-label');
    if (label) {
      const themes = this.themeManager.getAvailableThemes();
      const themeConfig = themes.find(t => t.name === theme);
      label.textContent = themeConfig?.label || 'Default';
    }
  }

  /**
   * Update the mode toggle button icon
   */
  private updateModeToggleIcon(mode: 'light' | 'dark' | 'auto'): void {
    const lightIcon = document.getElementById('light-icon');
    const darkIcon = document.getElementById('dark-icon');
    const autoIcon = document.getElementById('auto-icon');
    
    if (lightIcon && darkIcon && autoIcon) {
      // Hide all icons
      lightIcon.classList.add('hidden');
      darkIcon.classList.add('hidden');
      autoIcon.classList.add('hidden');
      
      // Show the appropriate icon
      switch (mode) {
        case 'light':
          lightIcon.classList.remove('hidden');
          break;
        case 'dark':
          darkIcon.classList.remove('hidden');
          break;
        case 'auto':
          autoIcon.classList.remove('hidden');
          break;
      }
    }
  }


  /**
   * Show main content and hide loading overlay
   */
  private showMainContent(): void {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (loadingOverlay) {
      // Remove theme loading class
      document.documentElement.classList.remove('theme-loading');
      
      // Hide subtle loading indicator
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div class="flex flex-col items-center space-y-4 text-destructive">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>${message}</p>
          <button onclick="location.reload()" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App().init();
  });
} else {
  new App().init();
}