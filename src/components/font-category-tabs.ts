import { BaseComponent } from '../utils/base-component';
import fontCategoryTabsTemplate from '../templates/components/font-category-tabs.html?raw';

export type FontCategory = 'sans' | 'serif' | 'mono';

interface FontCategoryData {
  name: FontCategory;
  label: string;
  isActive: boolean;
}

export class FontCategoryTabs extends BaseComponent {
  private currentCategory: FontCategory = 'sans';
  private onCategoryChange?: (category: FontCategory) => void;

  constructor(containerId: string) {
    super(fontCategoryTabsTemplate);
    this.element = document.getElementById(containerId);
  }

  protected bindEvents(): void {
    // Category tab clicks
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const categoryTab = target.closest('.font-category-tab');
        
        if (categoryTab) {
          const category = categoryTab.getAttribute('data-category') as FontCategory;
          if (category) {
            this.setActiveCategory(category);
          }
        }
      });
    }
  }

  setOnCategoryChange(callback: (category: FontCategory) => void): void {
    this.onCategoryChange = callback;
  }

  setActiveCategory(category: FontCategory): void {
    if (this.currentCategory === category) return;
    
    this.currentCategory = category;
    this.updateCategoryUI();
    
    if (this.onCategoryChange) {
      this.onCategoryChange(category);
    }
  }

  getCurrentCategory(): FontCategory {
    return this.currentCategory;
  }

  override async render(): Promise<void> {
    const categories: FontCategoryData[] = [
      { name: 'sans', label: 'Sans-serif', isActive: this.currentCategory === 'sans' },
      { name: 'serif', label: 'Serif', isActive: this.currentCategory === 'serif' },
      { name: 'mono', label: 'Monospace', isActive: this.currentCategory === 'mono' }
    ];

    this.setData({
      categories: categories,
      fontOptions: '' // Will be populated by parent component
    });

    await super.render();
  }

  private updateCategoryUI(): void {
    if (!this.element) return;

    // Update tab states
    const tabs = this.element.querySelectorAll('.font-category-tab');
    tabs.forEach(tab => {
      const category = tab.getAttribute('data-category');
      const isActive = category === this.currentCategory;
      
      tab.className = `font-category-tab px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        isActive 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`;
    });
  }
}