/**
 * Next.js utilities for automatic theme configuration
 */

/**
 * Configuration interface for Next.js theme setup
 */
export interface NextJSThemeConfig {
  /** Default theme to use */
  defaultTheme?: string
  /** Default mode (light/dark/auto) */
  defaultMode?: 'light' | 'dark' | 'auto'
  /** Registry path for themes */
  registryPath?: string
  /** Storage key for persistence */
  storageKey?: string
  /** Enable debug mode */
  debug?: boolean
  /** Custom themes registry URL */
  registryUrl?: string
  /** Enable system theme detection */
  enableSystem?: boolean
  /** Disable transition on change */
  disableTransitionOnChange?: boolean
}

/**
 * Create an optimized configuration for Next.js projects
 * 
 * @param config - Optional configuration overrides
 * @returns Optimized configuration for Next.js
 */
export function createNextJSConfig(config: NextJSThemeConfig = {}): NextJSThemeConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    // Defaults optimized for Next.js
    defaultTheme: 'default',
    defaultMode: 'auto', // Auto-detect system preference
    registryPath: '/themes/registry.json',
    storageKey: 'theme-preference',
    debug: isDevelopment,
    enableSystem: true,
    disableTransitionOnChange: true, // Prevent hydration flash
    
    // User overrides
    ...config,
  }
}

/**
 * Utility to check if we're in a Next.js environment
 */
export function isNextJS(): boolean {
  return (
    typeof window !== 'undefined' &&
    // @ts-ignore
    (window.next !== undefined || window.__NEXT_DATA__ !== undefined)
  )
}

/**
 * Utility to check if we're using App Router
 */
export function isAppRouter(): boolean {
  return (
    typeof window !== 'undefined' &&
    // @ts-ignore
    window.__NEXT_DATA__?.page?.startsWith('/app') === true
  )
}

/**
 * Get the optimal theme registry path for Next.js
 */
export function getOptimalRegistryPath(customPath?: string): string {
  if (customPath) return customPath
  
  // In Next.js, static files are served from /public
  return '/themes/registry.json'
}

/**
 * Create theme registry configuration for Next.js
 */
export function createThemeRegistry() {
  return {
    version: '1.0.0',
    name: 'Next.js App Themes',
    description: 'Theme registry for Next.js application',
    themes: [
      {
        id: 'default',
        name: 'Default',
        label: 'Default Theme',
        description: 'Default application theme',
        category: 'built-in' as const,
        author: 'App',
        version: '1.0.0',
        preview: {
          primary: '#0066cc',
          secondary: '#666666',
          background: '#ffffff',
          foreground: '#000000'
        },
        cssVars: {
          light: {
            background: 'oklch(1 0 0)',
            foreground: 'oklch(0.145 0 0)',
            primary: 'oklch(0.6 0.2 240)',
            'primary-foreground': 'oklch(1 0 0)',
          },
          dark: {
            background: 'oklch(0.145 0 0)',
            foreground: 'oklch(0.985 0 0)',
            primary: 'oklch(0.6 0.2 240)',
            'primary-foreground': 'oklch(1 0 0)',
          }
        }
      }
    ]
  }
}