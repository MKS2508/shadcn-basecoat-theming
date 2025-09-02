import { FontManager } from './font-manager';
import { FontSelectorModal } from './components/font-selector-modal';

/**
 * Refactored FontSelector using modular components
 */
export class FontSelector {
  private fontManager: FontManager;
  private selectorModal: FontSelectorModal | null = null;

  constructor(fontManager: FontManager) {
    this.fontManager = fontManager;
  }

  /**
   * Initialize font selector
   */
  async init(): Promise<void> {
    // Initialize modal component
    this.selectorModal = new FontSelectorModal(this.fontManager);
    await this.selectorModal.init();

    this.setupEventListeners();
    this.updateFontSelectorButton();
    
    console.log('🔤 FontSelector: Initialized with modular components');
  }

  /**
   * Setup main event listeners
   */
  private setupEventListeners(): void {
    // Font selector button
    const fontButton = document.getElementById('font-selector-btn');
    if (fontButton) {
      fontButton.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Font manager doesn't have onFontChange event, we'll update manually after operations
  }

  /**
   * Open font selector modal
   */
  private openModal(): void {
    if (this.selectorModal) {
      this.selectorModal.openModal();
    }
  }

  /**
   * Update font selector button text and state
   */
  private updateFontSelectorButton(): void {
    const fontButton = document.getElementById('font-selector-btn');
    if (!fontButton) return;

    // Check if font override is enabled (simplified check)
    const hasOverrides = this.fontManager.isOverrideEnabled();
    
    // Visual indication of active overrides
    if (hasOverrides) {
      fontButton.classList.add('text-primary', 'font-medium');
      fontButton.setAttribute('title', 'Font overrides active - Click to configure');
    } else {
      fontButton.classList.remove('text-primary', 'font-medium');
      fontButton.setAttribute('title', 'Configure fonts');
    }
  }

  /**
   * Preview font temporarily (used for hover effects)
   */
  async previewFont(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    try {
      // Apply temporary font preview
      await this.fontManager.previewFont(category, fontId);
      console.log(`🔤 Previewing ${category} font: ${fontId}`);
    } catch (error) {
      console.error('❌ Font preview error:', error);
    }
  }

  /**
   * Get current font selection state
   */
  async getCurrentSelections(): Promise<{
    sans: string | null;
    serif: string | null;
    mono: string | null;
  }> {
    const config = this.fontManager.getOverrideConfiguration();
    return {
      sans: config.fonts.sans || null,
      serif: config.fonts.serif || null,
      mono: config.fonts.mono || null
    };
  }

  /**
   * Check if font overrides are enabled
   */
  isOverrideEnabled(): boolean {
    return this.fontManager.isOverrideEnabled();
  }

  /**
   * Enable/disable font overrides
   */
  async setOverrideEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.fontManager.enableOverride();
    } else {
      await this.fontManager.disableOverride();
    }
    this.updateFontSelectorButton();
  }

  /**
   * Reset all font overrides
   */
  async resetAllFonts(): Promise<void> {
    // Remove individual font overrides
    await this.fontManager.removeFontOverride('sans');
    await this.fontManager.removeFontOverride('serif');
    await this.fontManager.removeFontOverride('mono');
    this.updateFontSelectorButton();
    console.log('🔤 All fonts reset to theme defaults');
  }

  /**
   * Set font override for specific category
   */
  async setFontOverride(category: 'sans' | 'serif' | 'mono', fontId: string): Promise<void> {
    await this.fontManager.setFontOverride(category, fontId);
    this.updateFontSelectorButton();
  }

  /**
   * Remove font override for specific category
   */
  async removeFontOverride(category: 'sans' | 'serif' | 'mono'): Promise<void> {
    await this.fontManager.removeFontOverride(category);
    this.updateFontSelectorButton();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.selectorModal) {
      this.selectorModal.unmount();
    }
    console.log('🗑️ FontSelector destroyed');
  }
}