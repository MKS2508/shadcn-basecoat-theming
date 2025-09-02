import { ThemeManager } from '../theme-manager';
import { templateEngine } from '../utils/template-engine';

interface ThemeOption {
  name: string;
  displayName: string;
  icon: string;
  isActive: boolean;
}

/**
 * Theme dropdown content generator
 * Works with existing DropdownManager instead of replacing it
 */
export class ThemeDropdown {
  private themeManager: ThemeManager;
  private dropdownMenu: HTMLElement | null = null;
  private onThemeSelect?: (themeName: string) => void;
  private onBrowseMore?: () => void;
  private onSettings?: () => void;

  constructor(dropdownMenuSelector: string, themeManager: ThemeManager) {
    this.dropdownMenu = document.querySelector(dropdownMenuSelector);
    this.themeManager = themeManager;
  }

  /**
   * Initialize event listeners for dropdown content
   */
  init(): void {
    if (!this.dropdownMenu) {
      console.warn('Theme dropdown menu not found');
      return;
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.dropdownMenu) return;

    // Use event delegation for dynamically generated content
    this.dropdownMenu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const themeOption = target.closest('.theme-option');
      
      if (themeOption) {
        const themeName = themeOption.getAttribute('data-theme');
        if (themeName && this.onThemeSelect) {
          this.onThemeSelect(themeName);
        }
        return;
      }

      // Browse more button
      if (target.closest('#browse-more-themes')) {
        if (this.onBrowseMore) {
          this.onBrowseMore();
        }
        return;
      }

      // Settings button
      if (target.closest('#theme-settings-btn')) {
        if (this.onSettings) {
          this.onSettings();
        }
        return;
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

  /**
   * Generate and render dropdown content
   */
  async render(): Promise<void> {
    if (!this.dropdownMenu) return;

    try {
      const themes = this.themeManager.getAvailableThemes();
      const currentTheme = this.themeManager.getCurrentTheme();

      const themeOptions: ThemeOption[] = themes.map((config) => ({
        name: config.name,
        displayName: config.label,
        icon: this.getThemeIcon(config.name),
        isActive: currentTheme === config.name
      }));

      // Render using template engine
      const html = await templateEngine.renderTemplate('/templates/components/theme-dropdown-menu.html', {
        themes: themeOptions
      });

      this.dropdownMenu.innerHTML = html;
      
    } catch (error) {
      console.error('Failed to render theme dropdown:', error);
      
      // Fallback to direct HTML generation
      this.renderFallback();
    }
  }

  /**
   * Fallback rendering without templates
   */
  private renderFallback(): void {
    if (!this.dropdownMenu) return;

    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme();

    let html = '';

    // Add theme options
    themes.forEach(theme => {
      const icon = this.getThemeIcon(theme.name);
      const isActive = currentTheme === theme.name;
      
      html += `
        <button 
          type="button"
          class="theme-option relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          data-theme="${theme.name}"
          role="menuitem"
          ${isActive ? 'aria-selected="true"' : ''}
        >
          ${icon}
          <span>${theme.label}</span>
          ${isActive ? '<svg class="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
        </button>
      `;
    });

    // Add separator and action buttons
    html += `
      <div class="h-px bg-border my-1"></div>
      <div class="flex">
        <button 
          type="button"
          id="browse-more-themes"
          class="relative flex flex-1 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-primary"
          role="menuitem"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Browse More...
        </button>
        <button 
          type="button"
          id="theme-settings-btn"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-muted-foreground hover:text-accent-foreground"
          role="menuitem"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    `;

    this.dropdownMenu.innerHTML = html;
  }

  /**
   * Refresh dropdown content
   */
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