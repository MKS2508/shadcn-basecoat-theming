import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../src/core/theme-manager';
import { mockCSSResponse, mockThemeCSS, resetAllMocks } from '../test-setup';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(async () => {
    resetAllMocks();
    themeManager = new ThemeManager();
    
    // Mock default theme CSS response
    mockCSSResponse(mockThemeCSS);
  });

  describe('Initialization', () => {
    it('should initialize with default theme', async () => {
      await themeManager.init();
      
      expect(themeManager.getCurrentTheme()).toBe('default');
      expect(themeManager.getCurrentMode()).toBe('auto');
    });

    it('should load saved theme from localStorage', async () => {
      localStorage.setItem('theme', 'supabase');
      localStorage.setItem('theme-mode', 'dark');
      
      mockCSSResponse(mockThemeCSS); // Mock supabase theme CSS
      await themeManager.init();
      
      expect(themeManager.getCurrentTheme()).toBe('supabase');
      expect(themeManager.getCurrentMode()).toBe('dark');
    });

    it('should fallback to default theme if saved theme does not exist', async () => {
      localStorage.setItem('theme', 'non-existent-theme');
      
      await themeManager.init();
      
      expect(themeManager.getCurrentTheme()).toBe('default');
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock registry initialization failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error during initialization
      vi.spyOn(themeManager as any, 'applyTheme').mockRejectedValueOnce(new Error('Test error'));
      
      await themeManager.init();
      
      expect(themeManager.getCurrentTheme()).toBe('default');
      expect(themeManager.getCurrentMode()).toBe('auto');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ ThemeManager: Failed to initialize:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Switching', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should switch theme successfully', async () => {
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('supabase', 'dark');
      
      expect(themeManager.getCurrentTheme()).toBe('supabase');
      expect(themeManager.getCurrentMode()).toBe('dark');
    });

    it('should not switch if theme and mode are the same', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      // Set initial theme
      mockCSSResponse(mockThemeCSS);
      await themeManager.setTheme('default', 'light');
      
      fetchSpy.mockClear();
      
      // Try to set same theme again
      await themeManager.setTheme('default', 'light');
      
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should use current mode if no mode is specified', async () => {
      mockCSSResponse(mockThemeCSS);
      
      // Set initial mode
      await themeManager.setTheme('default', 'dark');
      expect(themeManager.getCurrentMode()).toBe('dark');
      
      mockCSSResponse(mockThemeCSS);
      
      // Switch theme without specifying mode
      await themeManager.setTheme('supabase');
      
      expect(themeManager.getCurrentTheme()).toBe('supabase');
      expect(themeManager.getCurrentMode()).toBe('dark'); // Should keep previous mode
    });

    it('should resolve auto mode based on system preference', async () => {
      // Mock system preference for dark mode
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      } as any);
      
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('default', 'auto');
      
      expect(themeManager.getCurrentMode()).toBe('auto');
      // Should apply dark theme based on system preference
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    });
  });

  describe('CSS Variable Management', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should extract and apply CSS variables correctly', async () => {
      const testCSS = `:root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
      }`;
      
      mockCSSResponse(testCSS);
      
      await themeManager.setTheme('test-theme', 'light');
      
      // Check that CSS variables are applied to document root
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--background')).toBe('0 0% 100%');
      expect(root.style.getPropertyValue('--foreground')).toBe('222.2 84% 4.9%');
      expect(root.style.getPropertyValue('--primary')).toBe('221.2 83.2% 53.3%');
    });

    it('should set data attributes for debugging', async () => {
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('debug-theme', 'dark');
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('debug-theme');
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    });

    it('should handle CSS transitions', async () => {
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('transition-theme', 'light');
      
      // Should add theme-switching class initially
      expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
      
      // Wait for transition completion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
    });
  });

  describe('Theme Installation', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should install new theme successfully', async () => {
      const themeData = {
        name: 'custom-theme',
        cssVars: {
          light: { '--background': '0 0% 100%' },
          dark: { '--background': '222.2 84% 4.9%' }
        }
      };
      
      const callback = vi.fn();
      themeManager.setOnThemeInstalledCallback(callback);
      
      await themeManager.installTheme(themeData, 'https://example.com/theme.json');
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        name: 'custom-theme'
      }));
    });

    it('should handle theme installation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const invalidThemeData = {
        name: '', // Invalid name
        cssVars: null
      } as any;
      
      await expect(themeManager.installTheme(invalidThemeData)).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to install theme'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Storage Management', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should save theme settings to localStorage', async () => {
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('storage-theme', 'dark');
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(localStorage.getItem('theme')).toBe('storage-theme');
      expect(localStorage.getItem('theme-mode')).toBe('dark');
    });

    it('should debounce storage saves', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      mockCSSResponse(mockThemeCSS);
      await themeManager.setTheme('theme1', 'light');
      
      mockCSSResponse(mockThemeCSS);
      await themeManager.setTheme('theme2', 'dark');
      
      // Should not have saved immediately
      expect(setItemSpy).not.toHaveBeenCalled();
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Should save the final values
      expect(setItemSpy).toHaveBeenCalledWith('theme', 'theme2');
      expect(setItemSpy).toHaveBeenCalledWith('theme-mode', 'dark');
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage to throw error
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      mockCSSResponse(mockThemeCSS);
      await themeManager.setTheme('error-theme', 'light');
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ ThemeManager: Failed to save settings',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should track theme switch performance', async () => {
      const performanceSpy = vi.spyOn(performance, 'now');
      performanceSpy.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      mockCSSResponse(mockThemeCSS);
      
      await themeManager.setTheme('perf-theme', 'light');
      
      expect(performanceSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Methods', () => {
    beforeEach(async () => {
      await themeManager.init();
    });

    it('should return current theme and mode', () => {
      expect(typeof themeManager.getCurrentTheme()).toBe('string');
      expect(['light', 'dark', 'auto']).toContain(themeManager.getCurrentMode());
    });

    it('should return available themes', () => {
      const themes = themeManager.getAvailableThemes();
      expect(Array.isArray(themes)).toBe(true);
    });

    it('should return theme registry', () => {
      const registry = themeManager.getThemeRegistry();
      expect(registry).toBeDefined();
    });

    it('should return font manager', () => {
      const fontManager = themeManager.getFontManager();
      expect(fontManager).toBeDefined();
    });
  });
});