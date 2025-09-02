import { ModalComponent } from '../utils/base-component';
import { FontManager } from '../font-manager';
import { FontOptionsGrid } from './font-options-grid';
import { fontLogger } from '../utils/logger';
import fontSelectorTemplate from '../templates/modals/font-selector-modal.html?raw';

export class FontSelectorModal extends ModalComponent {
  private fontManager: FontManager;
  // private categoryTabs: FontCategoryTabs | null = null;
  private optionsGrid: FontOptionsGrid | null = null;
  private overrideToggle: HTMLInputElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private applyButton: HTMLButtonElement | null = null;
  private isOverrideEnabled: boolean = false;

  constructor(fontManager: FontManager) {
    fontLogger.debug('Constructor - template length:', fontSelectorTemplate?.length);
    super(fontSelectorTemplate);
    this.fontManager = fontManager;
  }

  override async init(): Promise<void> {
    fontLogger.info('Init starting');
    
    try {
      await super.init();
      fontLogger.info('Element created:', !!this.element);
    } catch (error) {
      fontLogger.error('Init failed:', error);
      throw error;
    }
    
    // Initialize modal elements from template
    this.modal = this.element; // The element IS the modal itself!
    this.backdrop = this.query('#font-modal-backdrop');
    this.overrideToggle = this.query('#font-override-toggle') as HTMLInputElement;
    this.contentContainer = this.query('#font-selector-content');
    this.resetButton = this.query('#font-reset-btn') as HTMLButtonElement;
    this.applyButton = this.query('#font-modal-apply') as HTMLButtonElement;

    fontLogger.info('Modal found:', !!this.modal);
    fontLogger.debug('Modal elements:', {
      backdrop: !!this.backdrop,
      toggle: !!this.overrideToggle,
      content: !!this.contentContainer,
      reset: !!this.resetButton,
      apply: !!this.applyButton
    });

    // Force append modal to body (remove from any existing parent)
    if (this.modal) {
      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
      document.body.appendChild(this.modal);
      fontLogger.info('Modal appended to body with z-index management');
    }

    this.setupModalEvents();
    
    // Initialize components after modal setup
    await this.initializeComponents();
    
    // Load initial state
    this.isOverrideEnabled = this.fontManager.isOverrideEnabled();
    this.updateUI();
  }

  protected bindEvents(): void {
    // Override toggle - use bindEvent for cleanup tracking
    if (this.overrideToggle) {
      this.bindEvent(this.overrideToggle, 'change', async () => {
        this.isOverrideEnabled = this.overrideToggle!.checked;
        if (this.isOverrideEnabled) {
          await this.fontManager.enableOverride();
        } else {
          await this.fontManager.disableOverride();
        }
        this.updateUI();
      });
    }

    // Reset button - use bindEvent for cleanup tracking
    if (this.resetButton) {
      this.bindEvent(this.resetButton, 'click', async () => {
        await this.resetFonts();
      });
    }

    // Apply button (close modal) - use bindEvent for cleanup tracking
    if (this.applyButton) {
      this.bindEvent(this.applyButton, 'click', () => {
        this.close();
      });
    }
    
    // Close button - fix missing event binding
    const closeButton = this.query('#font-modal-close');
    if (closeButton) {
      this.bindEvent(closeButton, 'click', () => {
        this.close();
      });
    }
    
    // Cancel button - fix missing event binding
    const cancelButton = this.query('#font-modal-cancel');
    if (cancelButton) {
      this.bindEvent(cancelButton, 'click', () => {
        this.close();
      });
    }
  }

  async openModal(): Promise<void> {
    fontLogger.info('Opening modal, element exists:', !!this.modal);
    
    if (!this.modal) {
      fontLogger.error('FAILED - modal element is null!');
      return;
    }
    
    // Refresh state before opening
    this.isOverrideEnabled = this.fontManager.isOverrideEnabled();
    await this.updateUI();
    
    fontLogger.debug('Modal z-index will be:', this.getZIndex() || 'calculated on open');
    this.open();
    fontLogger.success('Modal opened successfully');
  }

  private async initializeComponents(): Promise<void> {
    // FontOptionsGrid will be initialized in updateUI() when needed
    fontLogger.debug('Components initialization ready');
  }

  private async updateUI(): Promise<void> {
    if (!this.overrideToggle || !this.contentContainer) return;

    // Update toggle state
    this.overrideToggle.checked = this.isOverrideEnabled;
    
    // Update reset button state
    if (this.resetButton) {
      this.resetButton.disabled = !this.isOverrideEnabled;
    }

    if (this.isOverrideEnabled) {
      // Initialize and use FontOptionsGrid component with proper grids system
      await this.setupFontOptionsGrid();
    } else {
      // Show disabled state
      this.contentContainer.innerHTML = `
        <div class="flex items-center justify-center py-12 text-muted-foreground">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-sm">Enable font override to customize fonts</p>
          </div>
        </div>
      `;
      // Clean up existing FontOptionsGrid
      if (this.optionsGrid) {
        this.optionsGrid.unmount();
        this.optionsGrid = null;
      }
    }
  }

  private async setupFontOptionsGrid(): Promise<void> {
    if (!this.contentContainer) return;

    // Set up container for the FontOptionsGrid with tabs
    this.contentContainer.innerHTML = `
      <div class="space-y-4">
        <div class="border-b border-border">
          <div class="flex space-x-1" role="tablist">
            <button class="tab-button active px-3 py-2 text-sm font-medium rounded-t-md border-b-2 border-primary text-primary" data-category="sans">Sans Serif</button>
            <button class="tab-button px-3 py-2 text-sm font-medium rounded-t-md border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border" data-category="serif">Serif</button>
            <button class="tab-button px-3 py-2 text-sm font-medium rounded-t-md border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border" data-category="mono">Monospace</button>
          </div>
        </div>
        <div id="font-options-container" class="min-h-[300px]"></div>
      </div>
    `;

    // Initialize FontOptionsGrid AFTER container is created
    this.optionsGrid = new FontOptionsGrid('font-options-container');
    await this.optionsGrid.init();
    
    // Set up font selection callback
    this.optionsGrid.setOnFontSelect((category, fontId) => {
      fontLogger.debug(`Font selected: ${category} -> ${fontId}`);
      // Apply the font selection through FontManager
      this.fontManager.setFontOverride(category, fontId);
      
      // CRITICAL: Update the FontOptionsGrid internal state to match FontManager
      // This ensures visual selection state stays in sync
      const updatedConfig = this.fontManager.getOverrideConfiguration();
      
      if (this.optionsGrid) {
        const fontsForGrid = {
          sans: updatedConfig.fonts.sans || null,
          serif: updatedConfig.fonts.serif || null,
          mono: updatedConfig.fonts.mono || null
        };
        this.optionsGrid.setSelectedFonts(fontsForGrid);
      }
      
      // Update UI to reflect changes
      this.updateFontSelectorButton();
    });
    
    // Set up tab switching AFTER FontOptionsGrid is initialized
    const tabButtons = this.contentContainer.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const category = target.getAttribute('data-category');
        
        // Update tab appearance
        tabButtons.forEach(btn => {
          btn.classList.remove('active', 'border-primary', 'text-primary');
          btn.classList.add('border-transparent', 'text-muted-foreground');
        });
        target.classList.add('active', 'border-primary', 'text-primary');
        target.classList.remove('border-transparent', 'text-muted-foreground');
        
        // Update FontOptionsGrid category
        if (category && this.optionsGrid) {
          this.optionsGrid.setCategory(category as any);
        }
      });
    });
    
    // Load current font selections
    const config = this.fontManager.getOverrideConfiguration();
    const fonts = {
      sans: config.fonts.sans || null,
      serif: config.fonts.serif || null,
      mono: config.fonts.mono || null
    };
    this.optionsGrid.setSelectedFonts(fonts);
    
    // Start with sans category and render the grid
    this.optionsGrid.setCategory('sans');
    
    fontLogger.debug('✅ FontOptionsGrid setup completed with grids system');
  }


  private async resetFonts(): Promise<void> {
    if (!this.isOverrideEnabled) return;

    // Reset all font overrides
    await this.fontManager.removeFontOverride('sans');
    await this.fontManager.removeFontOverride('serif');
    await this.fontManager.removeFontOverride('mono');
    
    if (this.optionsGrid) {
      this.optionsGrid.reset();
    }
    
    this.updateFontSelectorButton();
    fontLogger.success('All fonts reset to theme defaults');
  }

  private updateFontSelectorButton(): void {
    const fontButton = document.getElementById('font-selector-btn');
    if (!fontButton) return;

    // Update button to show current state
    const config = this.fontManager.getOverrideConfiguration();
    const hasOverrides = config.enabled && (!!config.fonts.sans || !!config.fonts.serif || !!config.fonts.mono);
    const buttonText = hasOverrides ? 'Fonts*' : 'Fonts';
    
    fontButton.textContent = buttonText;
    
    if (hasOverrides) {
      fontButton.classList.add('text-primary');
    } else {
      fontButton.classList.remove('text-primary');
    }
  }
}