import { 
  ThemeManager, 
  FontManager,
  ThemeInstaller,
  ThemeConfig 
} from '@mks2508/shadcn-basecoat-theme-manager';

/**
 * Configuraci\u00f3n de inicializaci\u00f3n
 */
export interface ThemeManagerOptions {
  containerSelector?: string;
  autoInit?: boolean;
  themes?: ThemeConfig[];
}

/**
 * Implementaci\u00f3n Vanilla JS del Theme Manager
 * Optimizada para uso con Basecoat CSS
 */
export class VanillaThemeManager {
  private themeManager: ThemeManager;
  private fontManager: FontManager;
  private themeInstaller: ThemeInstaller;
  private initialized: boolean = false;

  constructor(options: ThemeManagerOptions = {}) {
    this.themeManager = new ThemeManager();
    this.fontManager = this.themeManager.getFontManager();
    this.themeInstaller = new ThemeInstaller(this.themeManager);

    if (options.autoInit) {
      this.init();
    }
  }

  /**
   * Inicializar el sistema de temas
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    await this.themeManager.init();
    this.initialized = true;
  }

  /**
   * Montar selector de temas en elemento
   */
  mountThemeSelector(selector: string): void {
    const container = document.querySelector(selector);
    if (!container) return;

    // Crear dropdown simple
    const select = document.createElement('select');
    select.className = 'theme-selector';
    
    const themes = this.themeManager.getAvailableThemes();
    themes.forEach((theme: ThemeConfig) => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = theme.label;
      select.appendChild(option);
    });

    select.value = this.themeManager.getCurrentTheme();
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.themeManager.setTheme(target.value);
    });

    container.appendChild(select);
  }

  /**
   * Montar selector de fuentes
   */
  mountFontSelector(selector: string): void {
    const container = document.querySelector(selector);
    if (!container) return;

    const button = document.createElement('button');
    button.className = 'font-selector-trigger';
    button.textContent = 'Configurar Fuentes';
    button.addEventListener('click', () => {
      // Trigger font selection modal
      this.openFontModal();
    });

    container.appendChild(button);
  }

  /**
   * API P\u00fablica
   */
  async setTheme(themeName: string, mode?: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.themeManager.setTheme(themeName, mode);
  }

  getCurrentTheme(): string {
    return this.themeManager.getCurrentTheme();
  }

  getAvailableThemes(): ThemeConfig[] {
    return this.themeManager.getAvailableThemes();
  }

  async installThemeFromUrl(url: string): Promise<void> {
    await this.themeInstaller.installFromUrl(url);
  }

  setFontOverride(category: 'sans' | 'serif' | 'mono', fontId: string): void {
    this.fontManager.setFontOverride(category, fontId);
  }

  private openFontModal(): void {
    // Simple modal implementation
    console.info('Font modal would open here');
  }
}

// Export convenience function
export function createThemeManager(options?: ThemeManagerOptions): VanillaThemeManager {
  return new VanillaThemeManager(options);
}