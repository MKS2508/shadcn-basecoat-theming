import { FontManager } from './font-manager';
import { getFontsByCategory, getFontById, FONT_CATEGORIES, FontOption } from './font-catalog';

/**
 * FontSelector - UI component for selecting font overrides
 */
export class FontSelector {
  private fontManager: FontManager;
  private modal: HTMLElement | null = null;
  private currentCategory: 'sans' | 'serif' | 'mono' = 'sans';
  private previewTimeout: NodeJS.Timeout | null = null;

  constructor(fontManager: FontManager) {
    this.fontManager = fontManager;
  }

  /**
   * Initialize font selector
   */
  init(): void {
    this.setupEventListeners();
    console.log('🔤 FontSelector: Initialized');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Font selector button
    const fontButton = document.getElementById('font-selector-btn');
    if (fontButton) {
      fontButton.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Get modal elements
    this.modal = document.getElementById('font-selector-modal');
    if (!this.modal) {
      console.error('🚨 FontSelector: Modal element not found');
      return;
    }

    // Close modal listeners
    const closeBtn = document.getElementById('font-modal-close');
    const cancelBtn = document.getElementById('font-modal-cancel');
    const backdrop = document.getElementById('font-modal-backdrop');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeModal());
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });

    // Override toggle
    const overrideToggle = document.getElementById('font-override-toggle') as HTMLInputElement;
    if (overrideToggle) {
      overrideToggle.addEventListener('change', async () => {
        if (overrideToggle.checked) {
          await this.fontManager.enableOverride();
        } else {
          await this.fontManager.disableOverride();
        }
        this.updateUI();
      });
    }

    // Category tabs
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('font-category-tab')) {
        const category = target.getAttribute('data-category') as 'sans' | 'serif' | 'mono';
        if (category) {
          this.switchCategory(category);
        }
      }
    });

    // Font option selection with event delegation
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('font-option') || target.closest('.font-option')) {
        const fontOption = target.classList.contains('font-option') ? target : target.closest('.font-option') as HTMLElement;
        const fontId = fontOption?.getAttribute('data-font-id');
        
        if (fontId) {
          await this.selectFont(this.currentCategory, fontId);
        }
      }
    });

    // Reset button
    const resetBtn = document.getElementById('font-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        await this.resetFonts();
      });
    }
  }

  /**
   * Open font selector modal
   */
  private openModal(): void {
    if (!this.modal) return;
    
    console.log('🚪 FontSelector: Opening modal');
    
    this.modal.classList.remove('hidden');
    this.generateFontUI();
    this.updateUI();
    
    // Focus first tab
    setTimeout(() => {
      const firstTab = document.querySelector('.font-category-tab') as HTMLElement;
      firstTab?.focus();
    }, 100);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close font selector modal
   */
  private closeModal(): void {
    if (!this.modal) return;
    
    console.log('🚪 FontSelector: Closing modal');
    
    // Stop any preview
    this.fontManager.stopPreview();
    
    this.modal.classList.add('hidden');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Generate font selection UI
   */
  private generateFontUI(): void {
    const container = document.getElementById('font-categories-content');
    if (!container) return;

    const categories: Array<'sans' | 'serif' | 'mono'> = ['sans', 'serif', 'mono'];
    
    container.innerHTML = `
      <!-- Category tabs -->
      <div class="flex space-x-1 border-b border-border mb-4">
        ${categories.map(category => `
          <button 
            type="button"
            class="font-category-tab px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${category === this.currentCategory ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
            data-category="${category}"
          >
            ${FONT_CATEGORIES[category].label}
          </button>
        `).join('')}
      </div>

      <!-- Font options for current category -->
      <div id="font-options-container" class="max-h-[350px] overflow-y-auto pr-2">
        ${this.generateFontOptions(this.currentCategory)}
      </div>
    `;
  }

  /**
   * Generate font options for a category
   */
  private generateFontOptions(category: 'sans' | 'serif' | 'mono'): string {
    const fonts = getFontsByCategory(category);
    const currentOverride = this.fontManager.getOverrideConfiguration();
    const selectedFontId = currentOverride.fonts[category];

    return `
      <div class="space-y-3">
        <div class="text-sm text-muted-foreground mb-3">
          ${FONT_CATEGORIES[category].description}
        </div>
        
        <!-- System fonts section -->
        <div>
          <h4 class="text-sm font-medium mb-2 text-foreground">System Fonts</h4>
          <div class="grid gap-2">
            ${fonts.filter(font => font.category === 'system').map(font => `
              <div 
                class="font-option p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent hover:border-accent-foreground ${selectedFontId === font.id ? 'bg-primary/10 border-primary' : ''}"
                data-font-id="${font.id}"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm" style="font-family: ${font.family}, ${font.fallback}">${font.name}</div>
                    <div class="text-xs text-muted-foreground font-mono">${font.family}</div>
                  </div>
                  ${selectedFontId === font.id ? '<div class="w-2 h-2 bg-primary rounded-full"></div>' : ''}
                </div>
                <div class="text-sm mt-2" style="font-family: ${font.family}, ${font.fallback}">
                  ${font.preview}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Google Fonts section -->
        <div>
          <h4 class="text-sm font-medium mb-2 text-foreground">Google Fonts</h4>
          <div class="grid gap-2">
            ${fonts.filter(font => font.category === 'google-fonts').map(font => `
              <div 
                class="font-option p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent hover:border-accent-foreground ${selectedFontId === font.id ? 'bg-primary/10 border-primary' : ''}"
                data-font-id="${font.id}"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm" style="font-family: ${font.family}, ${font.fallback}">${font.name}</div>
                    <div class="text-xs text-muted-foreground font-mono">${font.family}</div>
                  </div>
                  ${selectedFontId === font.id ? '<div class="w-2 h-2 bg-primary rounded-full"></div>' : ''}
                </div>
                <div class="text-sm mt-2" style="font-family: ${font.family}, ${font.fallback}">
                  ${font.preview}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Switch font category
   */
  private switchCategory(category: 'sans' | 'serif' | 'mono'): void {
    this.currentCategory = category;
    
    // Update tab states
    document.querySelectorAll('.font-category-tab').forEach(tab => {
      const tabCategory = tab.getAttribute('data-category');
      if (tabCategory === category) {
        tab.classList.add('border-primary', 'text-primary');
        tab.classList.remove('border-transparent', 'text-muted-foreground');
      } else {
        tab.classList.remove('border-primary', 'text-primary');
        tab.classList.add('border-transparent', 'text-muted-foreground');
      }
    });

    // Update font options
    const container = document.getElementById('font-options-container');
    if (container) {
      container.innerHTML = this.generateFontOptions(category);
    }
  }

  /**
   * Select a font for current category
   */
  private async selectFont(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    try {
      console.log(`🔤 FontSelector: Selecting ${category} font: ${fontId}`);
      
      // Show loading state
      const fontOption = document.querySelector(`[data-font-id="${fontId}"]`);
      if (fontOption) {
        fontOption.classList.add('opacity-50');
      }

      // Set font override
      await this.fontManager.setFontOverride(category, fontId);
      
      // Update UI to reflect selection
      this.updateFontOptions();
      
      // Remove loading state
      if (fontOption) {
        fontOption.classList.remove('opacity-50');
      }

      console.log(`✅ FontSelector: Font selected: ${category} → ${fontId}`);
      
    } catch (error) {
      console.error('❌ FontSelector: Failed to select font:', error);
      
      // Show error state briefly
      const fontOption = document.querySelector(`[data-font-id="${fontId}"]`);
      if (fontOption) {
        fontOption.classList.remove('opacity-50');
        fontOption.classList.add('bg-destructive/10', 'border-destructive');
        setTimeout(() => {
          fontOption.classList.remove('bg-destructive/10', 'border-destructive');
        }, 2000);
      }
    }
  }

  /**
   * Update font options to reflect current selections
   */
  private updateFontOptions(): void {
    const currentOverride = this.fontManager.getOverrideConfiguration();
    const selectedFontId = currentOverride.fonts[this.currentCategory];

    document.querySelectorAll('.font-option').forEach(option => {
      const fontId = option.getAttribute('data-font-id');
      const isSelected = fontId === selectedFontId;
      
      if (isSelected) {
        option.classList.add('bg-primary/10', 'border-primary');
        // Add selection indicator if not present
        if (!option.querySelector('.w-2.h-2.bg-primary')) {
          const indicator = document.createElement('div');
          indicator.className = 'w-2 h-2 bg-primary rounded-full';
          option.querySelector('.flex.items-center.justify-between')?.appendChild(indicator);
        }
      } else {
        option.classList.remove('bg-primary/10', 'border-primary');
        // Remove selection indicator
        option.querySelector('.w-2.h-2.bg-primary')?.remove();
      }
    });
  }

  /**
   * Update UI based on current state
   */
  private updateUI(): void {
    const currentOverride = this.fontManager.getOverrideConfiguration();
    
    // Update override toggle
    const overrideToggle = document.getElementById('font-override-toggle') as HTMLInputElement;
    if (overrideToggle) {
      overrideToggle.checked = currentOverride.enabled;
    }

    // Update font options if modal is open
    if (this.modal && !this.modal.classList.contains('hidden')) {
      this.updateFontOptions();
    }

    // Update font selector button state
    this.updateFontSelectorButton();
  }

  /**
   * Update font selector button to show current state
   */
  private updateFontSelectorButton(): void {
    const fontButton = document.getElementById('font-selector-btn');
    if (!fontButton) return;

    const isEnabled = this.fontManager.isOverrideEnabled();
    const stats = this.fontManager.getStats();

    // Update button appearance
    if (isEnabled && stats.overrides > 0) {
      fontButton.classList.add('bg-primary', 'text-primary-foreground');
      fontButton.classList.remove('bg-background');
      fontButton.setAttribute('title', `Font overrides active (${stats.overrides} fonts)`);
    } else {
      fontButton.classList.remove('bg-primary', 'text-primary-foreground');
      fontButton.classList.add('bg-background');
      fontButton.setAttribute('title', 'Configure fonts');
    }
  }

  /**
   * Reset all font overrides
   */
  private async resetFonts(): Promise<void> {
    try {
      console.log('🔄 FontSelector: Resetting fonts');
      
      await this.fontManager.resetOverrides();
      this.updateUI();
      
      // Regenerate UI to clear selections
      const container = document.getElementById('font-options-container');
      if (container) {
        container.innerHTML = this.generateFontOptions(this.currentCategory);
      }
      
      console.log('✅ FontSelector: Fonts reset');
      
    } catch (error) {
      console.error('❌ FontSelector: Failed to reset fonts:', error);
    }
  }

  /**
   * Preview a font temporarily
   */
  async previewFont(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    // Clear existing preview timeout
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
    }

    // Start preview
    await this.fontManager.previewFont(category, fontId);

    // Auto-stop preview after 3 seconds
    this.previewTimeout = setTimeout(() => {
      this.fontManager.stopPreview();
      this.previewTimeout = null;
    }, 3000);
  }
}