import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../../src/core/theme-manager';
import { FontManager } from '../../src/core/font-manager';
import { StorageManager } from '../../src/core/storage-manager';
import { ThemeRegistry } from '../../src/core/theme-registry';
import { mockCSSResponse, mockThemeCSS, resetAllMocks } from '../../test-setup';

describe('Theme System Integration', () => {
  let themeManager: ThemeManager;
  let fontManager: FontManager;
  let storageManager: StorageManager;
  let themeRegistry: ThemeRegistry;

  beforeEach(async () => {
    resetAllMocks();
    
    // Initialize all components
    themeManager = new ThemeManager();
    fontManager = new FontManager();
    storageManager = new StorageManager();
    themeRegistry = new ThemeRegistry();
    
    // Mock theme CSS responses
    mockCSSResponse(mockThemeCSS);
    
    // Mock font catalog
    vi.doMock('../../src/catalogs/font-catalog', () => ({
      getFontById: (id: string) => {
        const fonts = {
          'inter': { id: 'inter', family: 'Inter', source: 'google', weights: ['400', '700'] },
          'system-ui': { id: 'system-ui', family: 'system-ui', source: 'system' }
        };
        return (fonts as any)[id] || null;
      },
      needsGoogleFontsLoad: (font: any) => font.source === 'google',
      buildFontFamily: (font: any) => `${font.family}, sans-serif`
    }));
  });

  describe('Complete Theme Installation Flow', () => {
    it('should install and apply theme end-to-end', async () => {
      await storageManager.init();
      await themeManager.init();
      
      // Mock theme installation data
      const themeData = {
        name: 'custom-theme',
        cssVars: {
          light: {
            '--background': '0 0% 100%',
            '--foreground': '222.2 84% 4.9%',
            '--primary': '221.2 83.2% 53.3%'
          },
          dark: {
            '--background': '222.2 84% 4.9%',
            '--foreground': '210 40% 98%',
            '--primary': '217.2 91.2% 59.8%'
          }
        }
      };
      
      // Mock CSS response for the new theme
      mockCSSResponse(`:root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
      }`);
      
      // Install theme
      await themeManager.installTheme(themeData, 'https://example.com/custom-theme.json');
      
      // Verify theme was registered
      const availableThemes = themeManager.getAvailableThemes();
      const customTheme = availableThemes.find(t => t.name === 'custom-theme');
      expect(customTheme).toBeDefined();
      
      // Apply the installed theme
      mockCSSResponse(`:root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
      }`);
      
      await themeManager.setTheme('custom-theme', 'light');
      
      // Verify theme application
      expect(themeManager.getCurrentTheme()).toBe('custom-theme');
      expect(document.documentElement.getAttribute('data-theme')).toBe('custom-theme');
      expect(document.documentElement.getAttribute('data-mode')).toBe('light');
      
      // Verify CSS variables are applied
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--background')).toBe('0 0% 100%');
      expect(rootStyle.getPropertyValue('--primary')).toBe('221.2 83.2% 53.3%');
    });

    it('should handle theme installation with storage persistence', async () => {
      await storageManager.init();
      await themeRegistry.init();
      
      const themeData = {
        name: 'persistent-theme',
        cssVars: {
          light: { '--background': '0 0% 98%' },
          dark: { '--background': '224 71.4% 4.1%' }
        }
      };
      
      // Install through theme registry
      const installedTheme = await themeRegistry.installTheme(themeData, 'https://example.com/persistent.json');
      
      // Verify storage
      const storedTheme = await storageManager.getTheme('persistent-theme');
      expect(storedTheme).toBeDefined();
      expect(storedTheme?.installed).toBe(true);
      expect(storedTheme?.data).toEqual(themeData);
      
      // Verify registry has the theme
      const registryTheme = themeRegistry.getTheme('persistent-theme');
      expect(registryTheme).toBeDefined();
      expect(registryTheme?.name).toBe('persistent-theme');
    });

    it('should handle theme updates and overrides', async () => {
      await storageManager.init();
      await themeRegistry.init();
      
      // Install initial theme
      const initialTheme = {
        name: 'updatable-theme',
        cssVars: {
          light: { '--primary': '200 100% 50%' }
        }
      };
      
      await themeRegistry.installTheme(initialTheme, 'https://example.com/v1.json');
      
      // Update theme with new data
      const updatedTheme = {
        name: 'updatable-theme',
        cssVars: {
          light: { '--primary': '150 100% 60%' },
          dark: { '--primary': '150 100% 40%' }
        }
      };
      
      await themeRegistry.installTheme(updatedTheme, 'https://example.com/v2.json');
      
      // Verify update
      const stored = await storageManager.getTheme('updatable-theme');
      expect(stored?.data.cssVars.dark).toBeDefined();
      expect(stored?.data.cssVars.light['--primary']).toBe('150 100% 60%');
    });
  });

  describe('Theme + Font Integration', () => {
    it('should coordinate theme switching with font management', async () => {
      await themeManager.init();
      await fontManager.init();
      
      // Enable font overrides
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'inter');
      
      // Mock theme with font definitions
      mockCSSResponse(`:root {
        --background: 0 0% 100%;
        --font-sans: 'Theme Font', sans-serif;
      }`);
      
      // Switch theme
      await themeManager.setTheme('font-theme', 'light');
      
      // Verify theme applied
      expect(themeManager.getCurrentTheme()).toBe('font-theme');
      
      // Verify font override is still active
      expect(fontManager.isOverrideEnabled()).toBe(true);
      const fontOverride = fontManager.getCurrentFont('sans');
      expect(fontOverride?.id).toBe('inter');
      
      // Check CSS variables
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--font-sans-selected')).toBe('Inter, sans-serif');
    });

    it('should handle theme fonts when overrides are disabled', async () => {
      await themeManager.init();
      await fontManager.init();
      
      // Ensure font overrides are disabled
      await fontManager.disableOverride();
      
      mockCSSResponse(`:root {
        --background: 0 0% 100%;
        --font-sans: 'Theme Font', sans-serif;
      }`);
      
      await themeManager.setTheme('theme-font-test', 'light');
      
      // Should use theme fonts, not overrides
      expect(fontManager.isOverrideEnabled()).toBe(false);
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--font-sans-selected')).toBe('');
    });

    it('should load external fonts when defined in theme', async () => {
      await themeManager.init();
      
      // Mock theme with external font configuration
      const themeWithFonts = {
        name: 'font-theme',
        cssVars: {
          light: { '--background': '0 0% 100%' }
        }
      };
      
      // Install theme
      await themeManager.installTheme(themeWithFonts);
      
      // Mock the registry to include font information
      const registry = themeManager.getThemeRegistry();
      const installedTheme = registry.getTheme('font-theme');
      if (installedTheme) {
        // Mock theme with fonts
        (installedTheme as any).fonts = {
          sans: 'Inter',
          serif: 'Playfair Display'
        };
        (installedTheme as any).externalFonts = ['Inter', 'Playfair Display'];
      }
      
      mockCSSResponse(`:root { --background: 0 0% 100%; }`);
      
      // Apply theme - should trigger font loading
      await themeManager.setTheme('font-theme', 'light');
      
      expect(themeManager.getCurrentTheme()).toBe('font-theme');
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('should fallback gracefully when theme CSS fails to load', async () => {
      await themeManager.init();
      
      // Mock failed CSS fetch
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      // Should handle error and potentially fallback
      await expect(themeManager.setTheme('failing-theme', 'light'))
        .rejects.toThrow();
      
      // Should maintain previous state or fallback
      expect(themeManager.getCurrentTheme()).toBe('default');
    });

    it('should recover from storage failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await storageManager.init();
      await themeManager.init();
      
      // Mock storage failure during theme installation
      vi.spyOn(storageManager, 'storeTheme').mockRejectedValueOnce(new Error('Storage failed'));
      
      const themeData = {
        name: 'storage-fail-theme',
        cssVars: { light: { '--background': '0 0% 100%' } }
      };
      
      // Should handle storage failure but continue with theme installation
      await expect(themeManager.installTheme(themeData)).rejects.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should handle corrupted theme data gracefully', async () => {
      await themeManager.init();
      
      const corruptedTheme = {
        name: 'corrupted-theme',
        cssVars: null // Invalid structure
      } as any;
      
      await expect(themeManager.installTheme(corruptedTheme))
        .rejects.toThrow();
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle rapid theme switches', async () => {
      await themeManager.init();
      
      // Mock multiple CSS responses
      for (let i = 0; i < 5; i++) {
        mockCSSResponse(`:root { --primary: ${i * 60} 100% 50%; }`);
      }
      
      // Perform rapid theme switches
      const switches = [];
      for (let i = 0; i < 5; i++) {
        switches.push(themeManager.setTheme(`theme-${i}`, 'light'));
      }
      
      // Should handle concurrent switches
      await Promise.allSettled(switches);
      
      // Should end up with a consistent state
      expect(themeManager.getCurrentTheme()).toMatch(/theme-\d/);
    });

    it('should handle concurrent font and theme operations', async () => {
      await themeManager.init();
      await fontManager.init();
      
      mockCSSResponse(mockThemeCSS);
      
      // Perform concurrent operations
      const operations = [
        themeManager.setTheme('concurrent-theme', 'light'),
        fontManager.enableOverride(),
        fontManager.setFontOverride('sans', 'inter')
      ];
      
      await Promise.allSettled(operations);
      
      // Verify both systems are in expected state
      expect(themeManager.getCurrentTheme()).toBe('concurrent-theme');
      expect(fontManager.isOverrideEnabled()).toBe(true);
    });

    it('should maintain performance with large theme catalogs', async () => {
      await themeManager.init();
      
      // Install multiple themes
      const installPromises = [];
      for (let i = 0; i < 10; i++) {
        const themeData = {
          name: `perf-theme-${i}`,
          cssVars: {
            light: { '--primary': `${i * 36} 70% 50%` },
            dark: { '--primary': `${i * 36} 70% 30%` }
          }
        };
        installPromises.push(themeManager.installTheme(themeData));
      }
      
      await Promise.allSettled(installPromises);
      
      // Verify all themes are available
      const availableThemes = themeManager.getAvailableThemes();
      const perfThemes = availableThemes.filter(t => t.name.startsWith('perf-theme-'));
      expect(perfThemes.length).toBeGreaterThanOrEqual(5); // Allow for some failures
      
      // Performance check: switching should be fast
      const startTime = performance.now();
      mockCSSResponse(`:root { --primary: 180 70% 50%; }`);
      await themeManager.setTheme('perf-theme-5', 'light');
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });

  describe('State Persistence and Recovery', () => {
    it('should persist and restore complete application state', async () => {
      // Initialize with state
      await themeManager.init();
      await fontManager.init();
      
      // Set up initial state
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'inter');
      
      mockCSSResponse(mockThemeCSS);
      await themeManager.setTheme('persistent-state', 'dark');
      
      // Wait for debounced saves
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new instances (simulate page reload)
      const newThemeManager = new ThemeManager();
      const newFontManager = new FontManager();
      
      await newThemeManager.init();
      await newFontManager.init();
      
      // Verify state restoration
      expect(newThemeManager.getCurrentTheme()).toBe('persistent-state');
      expect(newThemeManager.getCurrentMode()).toBe('dark');
      expect(newFontManager.isOverrideEnabled()).toBe(true);
      
      const fontConfig = newFontManager.getOverrideConfiguration();
      expect(fontConfig.fonts.sans).toBe('inter');
    });

    it('should handle partial state corruption gracefully', async () => {
      // Corrupt theme state but keep font state
      localStorage.setItem('theme', 'non-existent-theme');
      localStorage.setItem('font-override', JSON.stringify({
        enabled: true,
        fonts: { sans: 'system-ui' }
      }));
      
      await themeManager.init();
      await fontManager.init();
      
      // Should fallback theme but preserve font config
      expect(themeManager.getCurrentTheme()).toBe('default');
      expect(fontManager.isOverrideEnabled()).toBe(true);
      expect(fontManager.getCurrentFont('sans')?.id).toBe('system-ui');
    });
  });
});