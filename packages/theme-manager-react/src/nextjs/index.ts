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
  ThemeManagementModal,
  FontSettingsModal,
} from '../index'

// Export Next.js specific components
export { NextJSThemeProvider } from './NextJSThemeProvider'
export type { NextJSThemeProviderProps } from './NextJSThemeProvider'

// Export Next.js utilities
export { createNextJSConfig } from './utils'
export type { NextJSThemeConfig } from './utils'

// FOUC prevention re-exports from core
export { generateFOUCScript } from '@mks2508/shadcn-basecoat-theme-manager'
export type { IFOUCScriptConfig } from '@mks2508/shadcn-basecoat-theme-manager'