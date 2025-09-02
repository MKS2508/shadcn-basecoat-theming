import { BaseComponent } from '../utils/base-component';
import { ThemeManager } from '../theme-manager';

interface ThemeOption {
  name: string;
  displayName: string;
  icon: string;
  isActive: boolean;
}

export class ThemeDropdown extends BaseComponent {
  private themeManager: ThemeManager;
  private onThemeSelect?: (themeName: string) => void;
  private onBrowseMore?: () => void;
  private onSettings?: () => void;

  constructor(containerId: string, themeManager: ThemeManager) {
    super('/templates/components/theme-dropdown-menu.html');
    this.element = document.getElementById(containerId);
    this.themeManager = themeManager;
  }

  protected bindEvents(): void {
    if (!this.element) return;

    // Theme option clicks
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const themeOption = target.closest('.theme-option');
      
      if (themeOption) {
        const themeName = themeOption.getAttribute('data-theme');
        if (themeName && this.onThemeSelect) {
          this.onThemeSelect(themeName);
        }
      }

      // Browse more button
      if (target.closest('#browse-more-themes')) {
        if (this.onBrowseMore) {
          this.onBrowseMore();
        }
      }

      // Settings button
      if (target.closest('#theme-settings-btn')) {
        if (this.onSettings) {
          this.onSettings();
        }
      }
    });
  }

  setOnThemeSelect(callback: (themeName: string) => void): void {
    this.onThemeSelect = callback;
  }

  setOnBrowseMore(callback: () => void): void {
    this.onBrowseMore = callback;
  }

  setOnSettings(callback: () => void): void {
    this.onSettings = callback;
  }

  async render(): Promise<void> {
    const themes = this.themeManager.getThemes();
    const currentTheme = this.themeManager.getCurrentTheme();

    const themeOptions: ThemeOption[] = Object.entries(themes).map(([key, config]) => ({
      name: key,
      displayName: config.label,
      icon: this.getThemeIcon(key),
      isActive: currentTheme === key
    }));

    this.setData({
      themes: themeOptions
    });

    await super.render();
  }

  async refresh(): Promise<void> {
    await this.render();
  }

  private getThemeIcon(themeName: string): string {
    const iconMap: Record<string, string> = {
      default: `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z"></path>
      </svg>`,
      supabase: `<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>`
    };

    return iconMap[themeName] || iconMap.default;
  }
}