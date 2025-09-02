import { ModalComponent } from '../utils/base-component';
import { ThemePreview } from './theme-preview';
import { ThemeRegistryList } from './theme-registry-list';

export class ThemeInstallerModal extends ModalComponent {
  private form: HTMLFormElement | null = null;
  private urlInput: HTMLInputElement | null = null;
  private installButton: HTMLButtonElement | null = null;
  private themePreview: ThemePreview | null = null;
  private registryList: ThemeRegistryList | null = null;
  private validationTimeout: NodeJS.Timeout | null = null;
  private onThemeInstalled?: () => void;

  constructor() {
    super('/templates/modals/theme-installer-modal.html');
  }

  async init(): Promise<void> {
    await super.init();
    
    // Initialize modal elements
    this.modal = this.query('#theme-install-modal');
    this.backdrop = this.query('#theme-modal-backdrop');
    this.form = this.query('#theme-install-form') as HTMLFormElement;
    this.urlInput = this.query('#theme-url-input') as HTMLInputElement;
    this.installButton = this.query('#theme-install-submit') as HTMLButtonElement;

    if (this.modal) {
      document.body.appendChild(this.modal);
    }

    // Initialize components
    this.themePreview = new ThemePreview('theme-preview');
    await this.themePreview.init();

    this.registryList = new ThemeRegistryList();
    await this.registryList.init();

    this.setupModalEvents();
  }

  protected bindEvents(): void {
    // URL input validation
    if (this.urlInput) {
      this.urlInput.addEventListener('input', (e) => {
        if (this.validationTimeout) {
          clearTimeout(this.validationTimeout);
        }
        
        this.validationTimeout = setTimeout(() => {
          this.validateAndPreview();
        }, 800);
      });
    }

    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.installTheme();
      });
    }

    // Search themes button
    this.on('#search-themes-btn', 'click', () => {
      this.showRegistryList();
    });
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
      console.error('Theme validation error:', error);
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

      // Install theme using theme manager
      // This would need to be injected or accessed from the parent
      console.log('Installing theme:', themeData.name, 'from URL:', url);
      
      // Close modal and notify parent
      this.close();
      if (this.onThemeInstalled) {
        this.onThemeInstalled();
      }

    } catch (error) {
      console.error('Installation error:', error);
      alert('Failed to install theme. Please try again.');
    } finally {
      this.installButton.disabled = false;
      this.installButton.textContent = 'Install Theme';
    }
  }

  private async showRegistryList(): Promise<void> {
    if (!this.themePreview || !this.registryList) return;

    // Replace preview with registry list
    const previewContainer = this.query('#theme-preview');
    if (previewContainer) {
      previewContainer.innerHTML = '<div class="text-muted-foreground text-sm">Loading themes...</div>';
      
      try {
        await this.registryList.loadThemes();
        const registryElement = this.registryList.getElement();
        if (registryElement) {
          previewContainer.innerHTML = '';
          previewContainer.appendChild(registryElement);
        }
      } catch (error) {
        console.error('Failed to load theme registry:', error);
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
}