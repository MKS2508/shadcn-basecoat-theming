import { 
  ThemeManager, 
  ThemeConfig 
} from '@mks2508/shadcn-basecoat-theme-manager';

/**
 * Web Component para selector de temas
 */
export class ThemeSelectorElement extends HTMLElement {
  private themeManager: ThemeManager;
  private select: HTMLSelectElement | null = null;
  
  constructor() {
    super();
    this.themeManager = new ThemeManager();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.themeManager.init();
    this.render();
    this.bindEvents();
  }

  private render() {
    if (!this.shadowRoot) return;

    const themes = this.themeManager.getAvailableThemes();
    const currentTheme = this.themeManager.getCurrentTheme();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        select {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          color: var(--foreground);
          font-family: inherit;
        }
      </style>
      <select>
        ${themes.map((theme: ThemeConfig) => `
          <option value="${theme.name}" ${theme.name === currentTheme ? 'selected' : ''}>
            ${theme.label}
          </option>
        `).join('')}
      </select>
    `;

    this.select = this.shadowRoot.querySelector('select');
  }

  private bindEvents() {
    if (!this.select) return;

    this.select.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      await this.themeManager.setTheme(target.value);
      this.dispatchEvent(new CustomEvent('theme-change', {
        detail: { theme: target.value },
        bubbles: true,
        composed: true
      }));
    });
  }

  disconnectedCallback() {
    // Cleanup if needed
  }
}

/**
 * Web Component para toggle de modo oscuro
 */
export class DarkModeToggleElement extends HTMLElement {
  private themeManager: ThemeManager;
  private button: HTMLButtonElement | null = null;
  
  constructor() {
    super();
    this.themeManager = new ThemeManager();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.themeManager.init();
    this.render();
    this.bindEvents();
  }

  private render() {
    if (!this.shadowRoot) return;

    const mode = this.themeManager.getCurrentMode();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          color: var(--foreground);
          cursor: pointer;
        }
        button:hover {
          background: var(--accent);
        }
      </style>
      <button type="button">
        ${mode === 'dark' ? '☀️' : '🌙'}
      </button>
    `;

    this.button = this.shadowRoot.querySelector('button');
  }

  private bindEvents() {
    if (!this.button) return;

    this.button.addEventListener('click', async () => {
      const currentMode = this.themeManager.getCurrentMode();
      const newMode = currentMode === 'dark' ? 'light' : 'dark';
      
      await this.themeManager.setTheme(
        this.themeManager.getCurrentTheme(),
        newMode
      );

      this.render();
      this.bindEvents();

      this.dispatchEvent(new CustomEvent('mode-change', {
        detail: { mode: newMode },
        bubbles: true,
        composed: true
      }));
    });
  }
}

/**
 * Registrar los Web Components
 */
export function registerThemeComponents() {
  if (!customElements.get('theme-selector')) {
    customElements.define('theme-selector', ThemeSelectorElement);
  }
  
  if (!customElements.get('dark-mode-toggle')) {
    customElements.define('dark-mode-toggle', DarkModeToggleElement);
  }
}

// Auto-register si estamos en el navegador
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  registerThemeComponents();
}