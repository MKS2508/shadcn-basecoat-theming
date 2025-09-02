import { BaseComponent } from '../utils/base-component';
import { ThemeListFetcher } from '../theme-list-fetcher';

export class ThemeRegistryList extends BaseComponent {
  private themeListFetcher: ThemeListFetcher;
  private searchInput: HTMLInputElement | null = null;
  private themesGrid: HTMLElement | null = null;
  private allThemes: string[] = [];
  private onThemePreview?: (themeName: string) => void;
  private onThemeInstall?: (themeName: string) => void;

  constructor() {
    super('/templates/components/theme-registry-list.html');
    this.themeListFetcher = new ThemeListFetcher();
  }

  async init(): Promise<void> {
    await this.themeListFetcher.init();
    await super.init();
  }

  protected bindEvents(): void {
    // Search input
    this.searchInput = this.query('#theme-search-input') as HTMLInputElement;
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value;
        this.filterThemes(query);
      });
    }

    // Refresh button
    this.on('#refresh-theme-list-btn', 'click', async () => {
      await this.loadThemes(true);
    });

    // Delegate events for theme buttons (since they're dynamically created)
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        if (target.classList.contains('preview-theme-btn')) {
          const themeName = target.getAttribute('data-theme-name');
          if (themeName && this.onThemePreview) {
            this.onThemePreview(themeName);
          }
        }
        
        if (target.classList.contains('install-theme-btn')) {
          const themeName = target.getAttribute('data-theme-name');
          if (themeName && this.onThemeInstall) {
            this.onThemeInstall(themeName);
          }
        }
      });
    }
  }

  setOnThemePreview(callback: (themeName: string) => void): void {
    this.onThemePreview = callback;
  }

  setOnThemeInstall(callback: (themeName: string) => void): void {
    this.onThemeInstall = callback;
  }

  async loadThemes(forceRefresh: boolean = false): Promise<void> {
    try {
      const themeNames = await this.themeListFetcher.getThemeNames(forceRefresh);
      this.allThemes = themeNames;
      
      const templateData = {
        themes: themeNames.map(name => ({
          name: name,
          displayName: this.formatThemeName(name)
        })),
        totalCount: themeNames.length,
        isFresh: !this.themeListFetcher.isUsingCache()
      };

      this.setData(templateData);
      await this.render();

      // Re-bind events after render
      this.bindEvents();

    } catch (error) {
      console.error('Failed to load themes:', error);
      throw error;
    }
  }

  private filterThemes(query: string): void {
    if (!this.allThemes.length) return;

    const filtered = query.trim() === '' 
      ? this.allThemes 
      : this.allThemes.filter(name => 
          name.toLowerCase().includes(query.toLowerCase())
        );

    this.renderFilteredThemes(filtered);
  }

  private renderFilteredThemes(themes: string[]): void {
    this.themesGrid = this.query('#themes-grid');
    if (!this.themesGrid) return;

    const html = themes.map(name => `
      <div class="theme-name-item border rounded-md p-2 hover:bg-accent/5 hover:border-accent transition-all" data-theme-name="${name}">
        <div class="flex flex-col">
          <div class="text-sm font-medium text-foreground truncate" title="${name}">${this.formatThemeName(name)}</div>
          <div class="text-xs text-muted-foreground font-mono truncate">${name}</div>
          <div class="flex gap-1 mt-2">
            <button
              class="preview-theme-btn flex-1 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground px-1 py-1 rounded transition-colors"
              data-theme-name="${name}"
              type="button"
            >
              Preview
            </button>
            <button
              class="install-theme-btn flex-1 text-xs bg-primary text-primary-foreground px-1 py-1 rounded hover:bg-primary/90 transition-colors"
              data-theme-name="${name}"
              type="button"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    `).join('');

    this.themesGrid.innerHTML = html;
  }

  private formatThemeName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}