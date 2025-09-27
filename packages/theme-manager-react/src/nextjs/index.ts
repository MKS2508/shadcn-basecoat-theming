/**
 * Next.js specific exports for @mks2508/theme-manager-react
 * 
 * This module provides Next.js optimized components and utilities
 * that handle SSR, hydration, and App Router compatibility.
 */

// Re-export main functionality
export {
  ThemeProvider,
  useTheme,
  ThemeInstallerComponent,
  ModeToggle,
  ThemeManagementModal,
  FontSettingsModal,
  ThemeSelector
} from '../index'

// Export Next.js specific components
export { NextJSThemeProvider } from './NextJSThemeProvider'
export type { NextJSThemeProviderProps } from './NextJSThemeProvider'

// Export Next.js utilities
export { createNextJSConfig } from './utils'
export type { NextJSThemeConfig } from './utils'