import { ThemeManager } from '../theme-manager';
import { DropdownManager } from '../dropdown-manager';
import { ThemeInstaller } from '../theme-installer';
import { FontSelector } from '../font-selector';
import { ThemeManagementModal } from './theme-management-modal';
import { ThemeDropdown } from './theme-dropdown';
import { componentLogger, logSuccess, logError } from '../utils/logger';

/**
 * Main application controller
 * Coordinates all components and manages application state
 */
export class AppController {
  private themeManager: ThemeManager;
  private dropdownManager: DropdownManager;
  private themeInstaller: ThemeInstaller;
  private fontSelector: FontSelector;
  private themeManagementModal: ThemeManagementModal;
  private themeDropdown: ThemeDropdown | null = null;

  constructor() {
    this.themeManager = new ThemeManager();
    this.dropdownManager = new DropdownManager();
    this.themeInstaller = new ThemeInstaller(this.themeManager);
    this.fontSelector = new FontSelector(this.themeManager.getFontManager());
    this.themeManagementModal = new ThemeManagementModal(this.themeManager);
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    try {

      // Initialize core theme system first
      await this.themeManager.init();
      
      // Set up theme installation callbacks
      this.setupThemeCallbacks();
      
      // Initialize dropdown component
      await this.initializeThemeDropdown();
      
      // Initialize all UI components
      await this.initializeComponents();
      
      // Set up global event listeners
      this.setupGlobalEventListeners();
      
      // Show main content
      this.showMainContent();
      
      logSuccess('App Controller initialized successfully');
      
    } catch (error) {
      logError('App initialization failed', error as Error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Set up callbacks for theme system
   */
  private setupThemeCallbacks(): void {
    // Theme manager callback
    this.themeManager.setOnThemeInstalledCallback(() => {
      this.refreshThemeDropdown();
    });
    
    // Theme installer callback
    this.themeInstaller.setOnThemeInstalledCallback(() => {
      this.refreshThemeDropdown();
    });
  }

  /**
   * Initialize theme dropdown component
   */
  private async initializeThemeDropdown(): Promise<void> {
    // Find the dropdown menu using the specific ID
    const dropdownMenu = document.getElementById('theme-menu');
    if (!dropdownMenu) {
      throw new Error('Theme dropdown menu element not found');
    }

    this.themeDropdown = new ThemeDropdown('#theme-menu', this.themeManager);
    
    // Set up dropdown callbacks
    this.themeDropdown.setOnThemeSelect(async (themeName) => {
      await this.handleThemeSelection(themeName);
    });
    
    this.themeDropdown.setOnBrowseMore(() => {
      this.openThemeBrowserModal();
    });
    
    this.themeDropdown.setOnSettings(() => {
      this.openThemeManagementModal();
    });

    this.themeDropdown.init();
    await this.themeDropdown.render();
  }

  /**
   * Initialize all UI components
   */
  private async initializeComponents(): Promise<void> {
    // Initialize dropdown manager
    this.dropdownManager.init();
    
    // Initialize theme installer
    await this.themeInstaller.init();
    
    // Initialize font selector
    await this.fontSelector.init();
    
    // Initialize theme management modal
    await this.themeManagementModal.init();
  }

  /**
   * Set up global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Mode toggle functionality
    this.setupModeToggle();
    
    // System theme preference changes
    this.setupSystemThemeListener();
    
    // Update UI elements
    this.updateThemeLabel(this.themeManager.getCurrentTheme());
    this.updateModeToggleIcon(this.themeManager.getCurrentMode());
  }

  /**
   * Set up mode toggle (light/dark/auto)
   */
  private setupModeToggle(): void {
    const modeToggle = document.getElementById('mode-toggle');
    
    if (!modeToggle) {
      componentLogger.error('setupModeToggle: mode-toggle button not found!');
      return;
    }

    // Add pointer-events to ensure SVG children don't block clicks
    modeToggle.style.pointerEvents = 'auto';
    const svgs = modeToggle.querySelectorAll('svg');
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
        this.updateModeToggleIcon(newMode);
      } catch (error) {
        logError('Failed to switch mode', error as Error);
      }
    };

    modeToggle.addEventListener('click', clickHandler);
  }

  /**
   * Set up system theme preference listener
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

  /**
   * Handle theme selection
   */
  private async handleThemeSelection(themeName: string): Promise<void> {
    try {
      
      const currentMode = this.themeManager.getCurrentMode();
      await this.themeManager.setTheme(themeName, currentMode);
      this.updateThemeLabel(themeName);
      
      // Refresh dropdown to update active state
      if (this.themeDropdown) {
        await this.themeDropdown.refresh();
      }
      
    } catch (error) {
      logError('Failed to switch theme', error as Error);
    }
  }

  /**
   * Refresh theme dropdown
   */
  private async refreshThemeDropdown(): Promise<void> {
    if (this.themeDropdown) {
      await this.themeDropdown.refresh();
    }
  }

  /**
   * Open theme browser modal
   */
  private openThemeBrowserModal(): void {
    
    // Close dropdown by clicking outside or using existing method
    const dropdownButton = document.getElementById('theme-button');
    if (dropdownButton) {
      dropdownButton.click(); // This will close the dropdown
    }
    
    // Open theme installer modal directly (no button needed)
    if (this.themeInstaller) {
      // Use a small delay to ensure dropdown closes first
      setTimeout(() => {
        // Access the installer modal using the proper method
        this.themeInstaller.openModal();
      }, 100);
    } else {
      componentLogger.error('AppController: themeInstaller is null');
    }
  }

  /**
   * Open theme management modal
   */
  private openThemeManagementModal(): void {
    
    // Close dropdown by clicking the button again
    const dropdownButton = document.getElementById('theme-button');
    if (dropdownButton) {
      dropdownButton.click(); // This will close the dropdown
    }
    
    // Load and show installed themes
    this.loadInstalledThemesForManagement();
  }

  /**
   * Load installed themes for management
   */
  private async loadInstalledThemesForManagement(): Promise<void> {
    try {
      // Open the modal first, then load themes
      await this.themeManagementModal.openModal();
    } catch (error) {
      logError('Failed to load installed themes', error as Error);
    }
  }

  /**
   * Update theme label in UI
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
   * Update mode toggle icon
   */
  private updateModeToggleIcon(mode: 'light' | 'dark' | 'auto'): void {
    const modeToggle = document.getElementById('mode-toggle');
    if (!modeToggle) return;

    const icons = {
      light: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>`,
      dark: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>`,
      auto: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
      </svg>`
    };

    modeToggle.innerHTML = icons[mode];
    modeToggle.setAttribute('aria-label', `Current mode: ${mode}`);
  }

  /**
   * Show main application content
   */
  private showMainContent(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.classList.remove('hidden');
      // Remove theme loading class if present
      document.body.classList.remove('theme-loading');
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="flex flex-col items-center space-y-4 text-destructive p-8">
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

  /**
   * Clean up resources
   */
  destroy(): void {
    this.themeInstaller.destroy();
    this.fontSelector.destroy();
    if (this.themeDropdown) {
      this.themeDropdown.destroy();
    }
  }
}