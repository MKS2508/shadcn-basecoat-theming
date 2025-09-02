/**
 * Template paths registry for easy access
 */
export const TEMPLATES = {
  // Modals
  THEME_INSTALLER_MODAL: '/templates/modals/theme-installer-modal.html',
  FONT_SELECTOR_MODAL: '/templates/modals/font-selector-modal.html',

  // Components
  THEME_DROPDOWN_MENU: '/templates/components/theme-dropdown-menu.html',
  THEME_PREVIEW_CONTENT: '/templates/components/theme-preview-content.html',
  THEME_PREVIEW_ERROR: '/templates/components/theme-preview-error.html',
  THEME_REGISTRY_LIST: '/templates/components/theme-registry-list.html',
  FONT_CATEGORY_TABS: '/templates/components/font-category-tabs.html',
  FONT_OPTIONS_GRID: '/templates/components/font-options-grid.html',
  TYPOGRAPHY_PREVIEW: '/templates/components/typography-preview.html',

  // Widgets
  LOADING_OVERLAY: '/templates/widgets/loading-overlay.html',
  EMPTY_STATE: '/templates/widgets/empty-state.html'
} as const;

export type TemplatePath = typeof TEMPLATES[keyof typeof TEMPLATES];