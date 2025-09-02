import { ModalComponent } from '../utils/base-component';
import { StorageManager, CachedTheme } from '../storage-manager';
import { ThemeManager } from '../theme-manager';
import themeManagementTemplate from '../templates/modals/theme-management-modal.html?raw';

/**
 * Theme Management Modal - Handle installed themes CRUD operations
 */
export class ThemeManagementModal extends ModalComponent {
  private storageManager: StorageManager;
  private themeManager: ThemeManager;
  private themesList: HTMLElement | null = null;
  private installedCount: HTMLElement | null = null;
  private storageUsed: HTMLElement | null = null;
  private onThemeDeleted?: () => void;

  constructor(themeManager: ThemeManager) {
    super(themeManagementTemplate);
    this.storageManager = new StorageManager();
    this.themeManager = themeManager;
  }

  /**
   * Initialize the theme management modal
   */
  override async init(): Promise<void> {
    await super.init();
    
    // Initialize modal elements
    this.modal = this.element; // The element IS the modal itself!
    this.backdrop = this.query('#theme-mgmt-modal-backdrop');
    this.themesList = this.query('#installed-themes-list');
    this.installedCount = this.query('#installed-themes-count');
    this.storageUsed = this.query('#storage-used');

    // Force append modal to body (remove from any existing parent)
    if (this.modal) {
      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
      document.body.appendChild(this.modal);
    }
    
    await this.storageManager.init();
    this.setupModalEvents();
  }

  /**
   * Set callback for when a theme is deleted
   */
  setOnThemeDeletedCallback(callback: () => void): void {
    this.onThemeDeleted = callback;
  }

  protected bindEvents(): void {
    // Close buttons - use bindEvent for cleanup tracking
    const closeButton = this.query('#theme-mgmt-modal-close');
    if (closeButton) {
      this.bindEvent(closeButton, 'click', () => this.close());
    }
    
    const closeButton2 = this.query('#theme-mgmt-close');
    if (closeButton2) {
      this.bindEvent(closeButton2, 'click', () => this.close());
    }

    // Refresh button
    const refreshBtn = this.query('#theme-mgmt-refresh-btn');
    if (refreshBtn) {
      this.bindEvent(refreshBtn, 'click', () => this.loadInstalledThemes());
    }

    // Clear all button
    const clearAllBtn = this.query('#clear-all-themes-btn');
    if (clearAllBtn) {
      this.bindEvent(clearAllBtn, 'click', () => this.clearAllThemes());
    }
  }

  /**
   * Open modal and load themes
   */
  async openModal(): Promise<void> {
    this.open();
    await this.loadInstalledThemes();
  }

  /**
   * Load and display installed themes
   */
  async loadInstalledThemes(): Promise<void> {
    
    if (!this.themesList || !this.installedCount || !this.storageUsed) return;

    try {
      // Get all cached themes
      const allThemes = await this.storageManager.getAllThemes();
      const installedThemes = allThemes.filter(theme => theme.installed);


      // Update stats
      this.installedCount.textContent = installedThemes.length.toString();
      this.storageUsed.textContent = this.calculateStorageUsed(installedThemes);

      // Clear existing list
      this.themesList.innerHTML = '';

      if (installedThemes.length === 0) {
        // Show empty state
        this.themesList.innerHTML = `
          <div class="flex items-center justify-center py-12 text-muted-foreground">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <p class="text-sm">No themes installed</p>
              <p class="text-xs mt-1">Install themes from the theme selector dropdown</p>
            </div>
          </div>
        `;
        return;
      }

      // Create theme cards
      const themeCards = installedThemes.map(theme => this.createThemeCard(theme)).join('');
      this.themesList.innerHTML = themeCards;

      // Setup event listeners for theme cards
      this.setupThemeCardListeners();

    } catch (error) {
      console.error('❌ Failed to load installed themes:', error);
      this.themesList.innerHTML = `
        <div class="flex items-center justify-center py-12 text-destructive">
          <div class="text-center">
            <p class="text-sm">Failed to load themes</p>
            <p class="text-xs mt-1">Check console for details</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Create HTML for a theme card
   */
  private createThemeCard(theme: CachedTheme): string {
    const installDate = new Date(theme.timestamp).toLocaleDateString();
    const hostname = new URL(theme.url).hostname;
    const size = this.calculateThemeSize(theme);

    return `
      <div class="theme-card border rounded-lg p-4 hover:bg-accent/5 transition-colors" data-theme-name="${theme.name}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <h3 class="font-medium text-foreground">${theme.name}</h3>
              <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Installed
              </span>
            </div>
            
            <div class="space-y-1 text-sm text-muted-foreground">
              <div class="flex items-center space-x-4">
                <span>📅 ${installDate}</span>
                <span>🌐 ${hostname}</span>
                <span>💾 ${size}</span>
              </div>
            </div>

            <!-- Theme variants -->
            <div class="flex items-center space-x-2 mt-3">
              ${theme.data.cssVars.light ? '<span class="text-xs px-2 py-1 bg-secondary rounded">Light</span>' : ''}
              ${theme.data.cssVars.dark ? '<span class="text-xs px-2 py-1 bg-secondary rounded">Dark</span>' : ''}
              ${theme.data.cssVars.theme ? '<span class="text-xs px-2 py-1 bg-secondary rounded">Custom</span>' : ''}
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Apply button -->
            <button 
              type="button"
              class="apply-theme-btn inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              data-theme-name="${theme.name}"
              title="Apply this theme"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              Apply
            </button>

            <!-- Delete button -->
            <button 
              type="button"
              class="delete-theme-btn inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
              data-theme-name="${theme.name}"
              title="Delete this theme"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for theme cards
   */
  private setupThemeCardListeners(): void {
    // Apply theme buttons
    const applyButtons = this.queryAll('.apply-theme-btn');
    applyButtons.forEach(button => {
      this.bindEvent(button, 'click', async (e) => {
        const themeName = (e.target as HTMLElement).getAttribute('data-theme-name') || 
                         (e.target as HTMLElement).closest('.apply-theme-btn')?.getAttribute('data-theme-name');
        if (themeName) {
          await this.applyTheme(themeName);
        }
      });
    });

    // Delete theme buttons
    const deleteButtons = this.queryAll('.delete-theme-btn');
    deleteButtons.forEach(button => {
      this.bindEvent(button, 'click', async (e) => {
        const themeName = (e.target as HTMLElement).getAttribute('data-theme-name') || 
                         (e.target as HTMLElement).closest('.delete-theme-btn')?.getAttribute('data-theme-name');
        if (themeName) {
          await this.deleteTheme(themeName);
        }
      });
    });
  }

  /**
   * Apply a theme
   */
  private async applyTheme(themeName: string): Promise<void> {
    
    try {
      const button = document.querySelector(`[data-theme-name="${themeName}"].apply-theme-btn`) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Applying...';
      }

      // Apply theme using theme manager
      const currentMode = this.themeManager.getCurrentMode();
      await this.themeManager.setTheme(themeName, currentMode);
      
      if (button) {
        button.textContent = 'Applied!';
        setTimeout(() => {
          button.textContent = 'Apply';
          button.disabled = false;
        }, 2000);
      }


    } catch (error) {
      console.error(`❌ Failed to apply theme: ${themeName}`, error);
      
      const button = document.querySelector(`[data-theme-name="${themeName}"].apply-theme-btn`) as HTMLButtonElement;
      if (button) {
        button.textContent = 'Error';
        button.disabled = false;
        setTimeout(() => {
          button.textContent = 'Apply';
        }, 2000);
      }
    }
  }

  /**
   * Delete a theme with confirmation
   */
  private async deleteTheme(themeName: string): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete the theme "${themeName}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;


    try {
      
      // Delete from storage first
      await this.storageManager.deleteTheme(themeName);
      
      // Remove from theme registry
      try {
        await this.themeManager.getThemeRegistry().uninstallTheme(themeName);
      } catch (registryError) {
      }


      // Reload the themes list
      await this.loadInstalledThemes();

      // Trigger callback to update dropdown
      if (this.onThemeDeleted) {
        this.onThemeDeleted();
      }

    } catch (error) {
      console.error(`❌ ThemeManagementModal: Failed to delete theme: ${themeName}`, error);
      alert(`Failed to delete theme "${themeName}". Check console for details.`);
    }
  }

  /**
   * Clear all installed themes
   */
  private async clearAllThemes(): Promise<void> {
    const allThemes = await this.storageManager.getAllThemes();
    const installedThemes = allThemes.filter(theme => theme.installed);

    if (installedThemes.length === 0) {
      alert('No installed themes to clear.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ALL ${installedThemes.length} installed themes?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;


    try {
      // Delete all installed themes
      for (const theme of installedThemes) {
        await this.storageManager.deleteTheme(theme.name);
        try {
          await this.themeManager.getThemeRegistry().uninstallTheme(theme.name);
        } catch (registryError) {
        }
      }


      // Reload the themes list
      await this.loadInstalledThemes();

      // Trigger callback to update dropdown
      if (this.onThemeDeleted) {
        this.onThemeDeleted();
      }

    } catch (error) {
      console.error(`❌ Failed to clear all themes:`, error);
      alert('Failed to clear all themes. Check console for details.');
    }
  }

  /**
   * Calculate storage used by themes
   */
  private calculateStorageUsed(themes: CachedTheme[]): string {
    const totalBytes = themes.reduce((total, theme) => {
      return total + this.getThemeBytes(theme);
    }, 0);

    if (totalBytes < 1024) {
      return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Calculate size of a single theme
   */
  private calculateThemeSize(theme: CachedTheme): string {
    const bytes = this.getThemeBytes(theme);
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
  }

  /**
   * Get theme size in bytes (approximation)
   */
  private getThemeBytes(theme: CachedTheme): number {
    return JSON.stringify(theme).length * 2; // Rough estimation
  }
}