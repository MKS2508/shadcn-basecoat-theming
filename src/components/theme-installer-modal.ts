import { ModalComponent } from '../utils/base-component';
import { ThemePreview } from './theme-preview';
import { ThemeRegistryList } from './theme-registry-list';
import { ThemeManager } from '../theme-manager';
import themeInstallerTemplate from '../templates/modals/theme-installer-modal.html?raw';
import { uiLogger } from '../utils/logger';

export class ThemeInstallerModal extends ModalComponent {
  private form: HTMLFormElement | null = null;
  private urlInput: HTMLInputElement | null = null;
  private installButton: HTMLButtonElement | null = null;
  private themePreview: ThemePreview | null = null;
  private registryList: ThemeRegistryList | null = null;
  private validationTimeout: NodeJS.Timeout | null = null;
  private onThemeInstalled?: () => void;
  private themeManager: ThemeManager;

  constructor(themeManager: ThemeManager) {
    super(themeInstallerTemplate);
    this.themeManager = themeManager;
  }

  override async init(): Promise<void> {
    // STEP 1: Render the template first
    await this.render();
    
    // STEP 2: Find modal elements AFTER template is rendered, BEFORE bindEvents
    this.modal = this.element; // The element IS the modal itself!
    this.backdrop = this.query('#theme-modal-backdrop');
    this.form = this.query('#theme-install-form') as HTMLFormElement;
    this.urlInput = this.query('#theme-url-input') as HTMLInputElement;
    this.installButton = this.query('#theme-install-submit') as HTMLButtonElement;
    
    // Debug: check if elements were found
    
    // STEP 3: NOW call bindEvents (urlInput exists!)
    this.bindEvents();
    this.isRendered = true;

    // Force append modal to body (remove from any existing parent)
    if (this.modal) {
      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
      document.body.appendChild(this.modal);
    }

    // Initialize components
    this.themePreview = new ThemePreview('theme-preview', this.themeManager);
    await this.themePreview.init();

    this.registryList = new ThemeRegistryList();
    await this.registryList.init();

    // Move setupModalEvents AFTER finding elements, not in bindEvents
    this.setupModalEvents();
  }

  protected bindEvents(): void {
    // URL input validation - use bindEvent for cleanup tracking
    if (this.urlInput) {
      this.bindEvent(this.urlInput, 'input', (_e) => {
        if (this.validationTimeout) {
          clearTimeout(this.validationTimeout);
        }
        
        this.validationTimeout = setTimeout(() => {
          this.validateAndPreview();
        }, 800);
      });
    } else {
      uiLogger.error('URL input not found during event binding');
    }

    // Form submission - use bindEvent for cleanup tracking
    if (this.form) {
      this.bindEvent(this.form, 'submit', async (e) => {
        e.preventDefault();
        await this.installTheme();
      });
    }

    // Search themes button
    this.on('#search-themes-btn', 'click', () => {
      this.showRegistryList();
    });
    
    // Close button
    const closeButton = this.query('#theme-modal-close');
    if (closeButton) {
      this.bindEvent(closeButton, 'click', () => {
        this.close();
      });
    }
    
    // Cancel button  
    const cancelButton = this.query('#theme-modal-cancel');
    if (cancelButton) {
      this.bindEvent(cancelButton, 'click', () => {
        this.close();
      });
    }
  }

  setOnThemeInstalledCallback(callback: () => void): void {
    this.onThemeInstalled = callback;
  }

  async openModal(): Promise<void> {
    this.open();
    this.resetForm();
    
    // Focus the input after a brief delay to ensure modal is fully rendered
    setTimeout(() => {
      if (this.urlInput) {
        this.urlInput.focus();
      }
    }, 100);
  }

  private resetForm(): void {
    if (this.urlInput) {
      this.urlInput.value = '';
    }
    
    if (this.installButton) {
      this.installButton.disabled = true;
    }

    if (this.themePreview) {
      this.themePreview.showEmpty();
    }
  }

  private async validateAndPreview(): Promise<void> {
    if (!this.urlInput || !this.themePreview || !this.installButton) return;

    const url = this.urlInput.value.trim();
    if (!url) {
      this.themePreview.showEmpty();
      this.installButton.disabled = true;
      return;
    }

    this.themePreview.showLoading('Validating...');
    this.installButton.disabled = true;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!this.validateThemeData(data)) {
        throw new Error('Invalid theme format. Must contain name and cssVars properties.');
      }

      await this.themePreview.showTheme(data, url);
      this.installButton.disabled = false;

    } catch (error: any) {
      uiLogger.error('Theme validation error:', error);
      let message = 'Failed to load theme';
      
      if (error.message.includes('HTTP 404')) {
        message = 'Theme not found (404)';
      } else if (error.message.includes('Invalid theme format')) {
        message = error.message;
      } else if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        message = 'Network error or CORS issue';
      }

      await this.themePreview.showError(message, 'Please check the URL and try again.');
    }
  }

  private validateThemeData(data: any): boolean {
    return data && 
           typeof data.name === 'string' && 
           data.name.length > 0 &&
           typeof data.cssVars === 'object' &&
           data.cssVars !== null &&
           (data.cssVars.light || data.cssVars.dark || data.cssVars.theme);
  }

  private async installTheme(): Promise<void> {
    if (!this.urlInput || !this.installButton) return;
    
    const url = this.urlInput.value.trim();
    if (!url) return;

    try {
      this.installButton.disabled = true;
      this.installButton.textContent = 'Installing...';

      const response = await fetch(url);
      const themeData = await response.json();

      // Install theme using theme manager (NOW CONNECTED!)
      await this.themeManager.installTheme(themeData, url);
      
      // Close modal and notify parent
      this.close();
      if (this.onThemeInstalled) {
        this.onThemeInstalled();
      }

    } catch (error) {
      uiLogger.error('Installation error:', error);
      alert('Failed to install theme. Please try again.');
    } finally {
      this.installButton.disabled = false;
      this.installButton.textContent = 'Install Theme';
    }
  }

  private async showRegistryList(): Promise<void> {
    if (!this.themePreview || !this.registryList) {
      uiLogger.error('showRegistryList: Missing components', { themePreview: !!this.themePreview, registryList: !!this.registryList });
      return;
    }

    // Replace preview with registry list
    const previewContainer = this.query('#theme-preview');
    if (previewContainer) {
      previewContainer.innerHTML = '<div class="text-muted-foreground text-sm">Loading themes...</div>';
      
      try {
        // Set up event handlers before loading
        this.registryList.setOnThemePreview((themeName: string) => {
          this.previewThemeFromRegistry(themeName);
        });
        
        this.registryList.setOnThemeInstall((themeName: string) => {
          this.installThemeFromRegistry(themeName);
        });

        await this.registryList.loadThemes();
        const registryElement = this.registryList.getElement();
        if (registryElement) {
          previewContainer.innerHTML = '';
          previewContainer.appendChild(registryElement);
        } else {
          uiLogger.error('ThemeRegistryList element not found after loadThemes()');
        }
      } catch (error) {
        uiLogger.error('Failed to load theme registry:', error);
        previewContainer.innerHTML = `
          <div class="text-center py-8">
            <p class="text-destructive text-sm mb-2">Failed to load themes</p>
            <button 
              onclick="this.parentElement.parentElement.innerHTML = 'Enter a theme URL to see preview'"
              class="text-primary hover:underline text-xs"
            >
              Go back
            </button>
          </div>
        `;
      }
    }
  }

  private async previewThemeFromRegistry(themeName: string): Promise<void> {
    if (!this.themePreview) return;
    
    try {
      this.themePreview.showLoading('Loading theme preview...');
      
      // Construct TweakCN URL for the theme
      const themeUrl = `https://tweakcn.com/r/themes/${themeName}.json`;
      
      // Fetch and validate theme
      const response = await fetch(themeUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const themeData = await response.json();
      if (!this.validateThemeData(themeData)) {
        throw new Error('Invalid theme format');
      }

      await this.themePreview.showTheme(themeData, themeUrl);
      
      // Fill URL input for potential installation
      if (this.urlInput) {
        this.urlInput.value = themeUrl;
        this.installButton!.disabled = false;
      }

    } catch (error: any) {
      uiLogger.error('Registry theme preview error:', error);
      await this.themePreview.showError('Failed to preview theme', error.message);
    }
  }

  private async installThemeFromRegistry(themeName: string): Promise<void> {
    if (!this.installButton) return;
    
    try {
      this.installButton.disabled = true;
      this.installButton.textContent = 'Installing...';

      // Construct TweakCN URL for the theme
      const themeUrl = `https://tweakcn.com/r/themes/${themeName}.json`;
      
      const response = await fetch(themeUrl);
      const themeData = await response.json();

      // Install theme using theme manager (NOW CONNECTED!)
      await this.themeManager.installTheme(themeData, themeUrl);
      
      // Close modal and notify parent
      this.close();
      if (this.onThemeInstalled) {
        this.onThemeInstalled();
      }

    } catch (error) {
      uiLogger.error('Registry installation error:', error);
      alert('Failed to install theme. Please try again.');
    } finally {
      this.installButton.disabled = false;
      this.installButton.textContent = 'Install Theme';
    }
  }
}