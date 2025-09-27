"use client"

import React, { useEffect, useState } from 'react'
import { ThemeProvider } from '../index'
import type { ThemeProviderProps } from '../index'

/**
 * Next.js optimized ThemeProvider that handles SSR/hydration correctly
 * 
 * Features:
 * - Automatic hydration mismatch prevention
 * - SSR-safe initialization
 * - Automatic system theme detection
 * - Compatible with App Router and Pages Router
 */
export interface NextJSThemeProviderProps extends ThemeProviderProps {
  /**
   * Disable theme transition animations on change
   * @default true - prevents flash during hydration
   */
  disableTransitionOnChange?: boolean
  /**
   * Enable system theme detection
   * @default true
   */
  enableSystem?: boolean
  /**
   * CSS attribute to use for theme switching
   * @default 'class'
   */
  attribute?: 'class' | 'data-theme'
}

export function NextJSThemeProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
  registryUrl = '/themes/registry.json',
  storageKey = 'theme-preference',
  enableTransitions = true,
  disableTransitionOnChange = true,
  enableSystem = true,
  attribute = 'class',
  ...props
}: NextJSThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
    
    // Disable transitions during hydration to prevent flash
    if (disableTransitionOnChange) {
      const style = document.createElement('style')
      style.innerHTML = `
        *,
        *::before,
        *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }
      `
      document.head.appendChild(style)
      
      // Re-enable transitions after hydration
      const timer = setTimeout(() => {
        document.head.removeChild(style)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [disableTransitionOnChange])

  // During SSR and initial render, provide a basic shell
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    )
  }

  // After hydration, render the full theme provider
  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      defaultMode={defaultMode}
      registryUrl={registryUrl}
      storageKey={storageKey}
      enableTransitions={enableTransitions}
      {...props}
    >
      {children}
    </ThemeProvider>
  )
}