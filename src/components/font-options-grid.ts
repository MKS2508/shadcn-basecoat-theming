import { BaseComponent } from '../utils/base-component';
import { getFontsByCategory } from '../font-catalog';
import type { FontCategory } from './font-category-tabs';
import fontOptionsGridTemplate from '../templates/components/font-options-grid.html?raw';


export class FontOptionsGrid extends BaseComponent {
  private currentCategory: FontCategory = 'sans';
  private selectedFontIds: Record<FontCategory, string | null> = {
    sans: null,
    serif: null,
    mono: null
  };
  private onFontSelect?: (category: FontCategory, fontId: string) => void;

  constructor(containerId: string) {
    super(fontOptionsGridTemplate);
    this.element = document.getElementById(containerId);
  }

  protected bindEvents(): void {
    // Font option clicks
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const fontOption = target.closest('.font-option');
        
        if (fontOption) {
          const fontId = fontOption.getAttribute('data-font-id');
          const category = fontOption.getAttribute('data-category') as FontCategory;
          
          if (fontId && category) {
            this.selectFont(category, fontId);
          }
        }
      });
    }
  }

  setOnFontSelect(callback: (category: FontCategory, fontId: string) => void): void {
    this.onFontSelect = callback;
  }

  setCategory(category: FontCategory): void {
    this.currentCategory = category;
    this.render();
  }

  selectFont(category: FontCategory, fontId: string): void {
    this.selectedFontIds[category] = fontId;
    this.render(); // Re-render to update selection state
    
    if (this.onFontSelect) {
      this.onFontSelect(category, fontId);
    }
  }

  getSelectedFont(category: FontCategory): string | null {
    return this.selectedFontIds[category];
  }

  setSelectedFonts(selections: Record<FontCategory, string | null>): void {
    console.log('🔤 FontOptionsGrid: setSelectedFonts called with:', selections);
    this.selectedFontIds = { ...selections };
    console.log('🔤 FontOptionsGrid: selectedFontIds updated to:', this.selectedFontIds);
    // Trigger re-render to update UI
    this.render();
  }

  override async render(): Promise<void> {
    const fonts = getFontsByCategory(this.currentCategory);
    const selectedFontId = this.selectedFontIds[this.currentCategory];
    
    console.log(`🔤 FontOptionsGrid: Rendering category: ${this.currentCategory}`);
    console.log(`🔤 FontOptionsGrid: Selected font ID: ${selectedFontId}`);
    console.log(`🔤 FontOptionsGrid: Available fonts:`, fonts.map(f => f.id));
    
    // Separate system and Google fonts
    const systemFonts = fonts.filter(font => font.category === 'system');
    const googleFonts = fonts.filter(font => font.category === 'google-fonts');

    // Add selection state and preview text
    const enrichedSystemFonts = systemFonts.map(font => ({
      ...font,
      isSelected: font.id === selectedFontId,
      previewText: this.getPreviewText(this.currentCategory)
    }));

    const enrichedGoogleFonts = googleFonts.map(font => ({
      ...font,
      isSelected: font.id === selectedFontId,
      previewText: this.getPreviewText(this.currentCategory)
    }));

    console.log(`🔤 FontOptionsGrid: Enriched system fonts:`, enrichedSystemFonts.map(f => ({id: f.id, isSelected: f.isSelected})));
    console.log(`🔤 FontOptionsGrid: Enriched google fonts:`, enrichedGoogleFonts.map(f => ({id: f.id, isSelected: f.isSelected})));

    this.setData({
      categoryName: this.getCategoryDisplayName(this.currentCategory),
      currentCategory: this.currentCategory, // Add the actual category key for data attributes
      hasSystemFonts: systemFonts.length > 0,
      systemFonts: enrichedSystemFonts,
      hasGoogleFonts: googleFonts.length > 0,
      googleFonts: enrichedGoogleFonts
    });

    await super.render();
    console.log(`🔤 FontOptionsGrid: Render completed for ${this.currentCategory}`);
  }

  private getCategoryDisplayName(category: FontCategory): string {
    switch (category) {
      case 'sans': return 'sans-serif';
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      default: return category;
    }
  }

  private getPreviewText(category: FontCategory): string {
    switch (category) {
      case 'sans':
        return 'The quick brown fox jumps over the lazy dog';
      case 'serif':
        return 'Typography is the art of arranging type';
      case 'mono':
        return 'const code = "example"; // 123';
      default:
        return 'Sample text preview';
    }
  }

  reset(): void {
    this.selectedFontIds = {
      sans: null,
      serif: null,
      mono: null
    };
    this.render();
  }
}