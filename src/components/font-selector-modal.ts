import { ModalComponent } from '../utils/base-component';
import { FontManager } from '../font-manager';
import { FontCategoryTabs, FontCategory } from './font-category-tabs';
import { FontOptionsGrid } from './font-options-grid';

export class FontSelectorModal extends ModalComponent {
  private fontManager: FontManager;
  private categoryTabs: FontCategoryTabs | null = null;
  private optionsGrid: FontOptionsGrid | null = null;
  private overrideToggle: HTMLInputElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private applyButton: HTMLButtonElement | null = null;
  private isOverrideEnabled: boolean = false;

  constructor(fontManager: FontManager) {
    super('/templates/modals/font-selector-modal.html');
    this.fontManager = fontManager;
  }

  async init(): Promise<void> {
    await super.init();
    
    // Initialize modal elements
    this.modal = this.query('#font-selector-modal');
    this.backdrop = this.query('#font-modal-backdrop');
    this.overrideToggle = this.query('#font-override-toggle') as HTMLInputElement;
    this.contentContainer = this.query('#font-selector-content');
    this.resetButton = this.query('#font-reset-btn') as HTMLButtonElement;
    this.applyButton = this.query('#font-modal-apply') as HTMLButtonElement;

    if (this.modal) {
      document.body.appendChild(this.modal);
    }

    // Initialize components
    await this.initializeComponents();
    this.setupModalEvents();
    
    // Load initial state
    this.isOverrideEnabled = this.fontManager.isOverrideEnabled();
    this.updateUI();
  }

  protected bindEvents(): void {
    // Override toggle
    if (this.overrideToggle) {
      this.overrideToggle.addEventListener('change', async () => {
        this.isOverrideEnabled = this.overrideToggle!.checked;
        await this.fontManager.setOverrideEnabled(this.isOverrideEnabled);
        this.updateUI();
      });
    }

    // Reset button
    if (this.resetButton) {
      this.resetButton.addEventListener('click', async () => {
        await this.resetFonts();
      });
    }

    // Apply button (close modal)
    if (this.applyButton) {
      this.applyButton.addEventListener('click', () => {
        this.close();
      });
    }
  }

  async openModal(): Promise<void> {
    // Refresh state before opening
    this.isOverrideEnabled = this.fontManager.isOverrideEnabled();
    await this.updateUI();
    this.open();
  }

  private async initializeComponents(): Promise<void> {
    if (!this.contentContainer) return;

    // Create temporary containers for components
    const tabsContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    
    this.contentContainer.appendChild(tabsContainer);
    this.contentContainer.appendChild(gridContainer);

    // Initialize category tabs
    this.categoryTabs = new FontCategoryTabs(tabsContainer.id || 'font-category-tabs');
    this.categoryTabs.setOnCategoryChange((category) => {
      if (this.optionsGrid) {
        this.optionsGrid.setCategory(category);
      }
    });

    // Initialize options grid
    this.optionsGrid = new FontOptionsGrid(gridContainer.id || 'font-options-grid');
    this.optionsGrid.setOnFontSelect(async (category, fontId) => {
      await this.fontManager.setFontOverride(category, fontId);
      this.updateFontSelectorButton();
    });

    // Don't call init yet - wait for proper rendering
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
      // Show font selector components
      await this.renderFontSelector();
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
    }
  }

  private async renderFontSelector(): Promise<void> {
    if (!this.contentContainer || !this.categoryTabs || !this.optionsGrid) return;

    // Clear content
    this.contentContainer.innerHTML = '';

    // Create containers
    const tabsContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    
    this.contentContainer.appendChild(tabsContainer);
    this.contentContainer.appendChild(gridContainer);

    // Re-initialize components with proper containers
    this.categoryTabs.element = tabsContainer;
    this.optionsGrid.element = gridContainer;

    // Load current selections
    const currentSelections = await this.loadCurrentSelections();
    this.optionsGrid.setSelectedFonts(currentSelections);

    // Render components
    await this.categoryTabs.render();
    await this.optionsGrid.render();

    // Re-bind events
    this.categoryTabs.bindEvents();
    this.optionsGrid.bindEvents();
  }

  private async loadCurrentSelections(): Promise<Record<FontCategory, string | null>> {
    return {
      sans: await this.fontManager.getCurrentFontOverride('sans'),
      serif: await this.fontManager.getCurrentFontOverride('serif'),
      mono: await this.fontManager.getCurrentFontOverride('mono')
    };
  }

  private async resetFonts(): Promise<void> {
    if (!this.isOverrideEnabled) return;

    await this.fontManager.resetAllFonts();
    
    if (this.optionsGrid) {
      this.optionsGrid.reset();
    }
    
    this.updateFontSelectorButton();
    console.log('🔤 All fonts reset to theme defaults');
  }

  private updateFontSelectorButton(): void {
    const fontButton = document.getElementById('font-selector-btn');
    if (!fontButton) return;

    // Update button to show current state
    const hasOverrides = this.fontManager.hasAnyOverrides();
    const buttonText = hasOverrides ? 'Fonts*' : 'Fonts';
    
    fontButton.textContent = buttonText;
    
    if (hasOverrides) {
      fontButton.classList.add('text-primary');
    } else {
      fontButton.classList.remove('text-primary');
    }
  }
}