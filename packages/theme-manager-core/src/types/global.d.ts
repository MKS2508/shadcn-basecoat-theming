import type { ThemeCoreInstance } from '../core/theme-core';

export interface ThemeGlobalWindow extends Window {
  themeCore?: ThemeCoreInstance;
  openFontSettingsModal?: () => void;
  openThemeManagementModal?: () => void;
}

export interface ThemeHTMLDialogElement extends HTMLDialogElement {
  showModal(): void;
  close(): void;
}

// Augment global types when imported
declare global {
  interface Window {
    themeCore?: ThemeCoreInstance;
    openFontSettingsModal?: () => void;
    openThemeManagementModal?: () => void;
  }

  interface HTMLDialogElement {
    showModal(): void;
    close(): void;
  }
}

export {};