import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FontManager, FontOverride } from '../src/core/font-manager';
import { resetAllMocks } from '../test-setup';

describe('FontManager', () => {
  let fontManager: FontManager;

  beforeEach(() => {
    resetAllMocks();
    fontManager = new FontManager();
  });

  describe('Initialization', () => {
    it('should initialize with disabled font overrides', async () => {
      await fontManager.init();
      
      expect(fontManager.isOverrideEnabled()).toBe(false);
      expect(fontManager.getOverrideConfiguration()).toEqual({
        enabled: false,
        fonts: {}
      });
    });

    it('should load saved font override configuration', async () => {
      const savedConfig: FontOverride = {
        enabled: true,
        fonts: {
          sans: 'inter',
          serif: 'playfair-display'
        }
      };
      
      localStorage.setItem('font-override', JSON.stringify(savedConfig));
      
      await fontManager.init();
      
      expect(fontManager.isOverrideEnabled()).toBe(true);
      expect(fontManager.getOverrideConfiguration()).toEqual(savedConfig);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('font-override', 'invalid-json');
      
      await fontManager.init();
      
      expect(fontManager.getOverrideConfiguration()).toEqual({
        enabled: false,
        fonts: {}
      });
    });

    it('should clean up debug elements during initialization', async () => {
      // Create a debug element
      const debugElement = document.createElement('div');
      debugElement.id = 'font-test-container';
      document.body.appendChild(debugElement);
      
      await fontManager.init();
      
      expect(document.getElementById('font-test-container')).toBeNull();
    });
  });

  describe('Override Management', () => {
    beforeEach(async () => {
      await fontManager.init();
    });

    it('should enable font overrides', async () => {
      await fontManager.enableOverride();
      
      expect(fontManager.isOverrideEnabled()).toBe(true);
    });

    it('should disable font overrides', async () => {
      await fontManager.enableOverride();
      await fontManager.disableOverride();
      
      expect(fontManager.isOverrideEnabled()).toBe(false);
    });

    it('should save configuration when enabling/disabling', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      await fontManager.enableOverride();
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'font-override',
        JSON.stringify({ enabled: true, fonts: {} })
      );
    });

    it('should debounce configuration saves', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      await fontManager.enableOverride();
      await fontManager.disableOverride();
      
      // Should not save immediately
      expect(setItemSpy).not.toHaveBeenCalled();
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // Should save final state
      expect(setItemSpy).toHaveBeenCalledWith(
        'font-override',
        JSON.stringify({ enabled: false, fonts: {} })
      );
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await fontManager.enableOverride();
      
      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ FontManager: Failed to save configuration',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Font Override Configuration', () => {
    beforeEach(async () => {
      await fontManager.init();
    });

    it('should set font override for valid font', async () => {
      // Mock font catalog response
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: (id: string) => id === 'inter' ? { 
          id: 'inter', 
          family: 'Inter', 
          category: 'sans-serif',
          source: 'google'
        } : null,
        needsGoogleFontsLoad: () => true,
        buildFontFamily: () => 'Inter, sans-serif'
      }));
      
      await fontManager.setFontOverride('sans', 'inter');
      
      const config = fontManager.getOverrideConfiguration();
      expect(config.fonts.sans).toBe('inter');
    });

    it('should throw error for invalid font', async () => {
      // Mock font catalog to return null
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => null
      }));
      
      await expect(fontManager.setFontOverride('sans', 'invalid-font'))
        .rejects.toThrow('Font not found: invalid-font');
    });

    it('should remove font override', async () => {
      // Set initial override
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => ({ id: 'inter', family: 'Inter', source: 'google' }),
        needsGoogleFontsLoad: () => true
      }));
      
      await fontManager.setFontOverride('sans', 'inter');
      await fontManager.removeFontOverride('sans');
      
      const config = fontManager.getOverrideConfiguration();
      expect(config.fonts.sans).toBeUndefined();
    });

    it('should get current font for category', async () => {
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: (id: string) => id === 'inter' ? { 
          id: 'inter', 
          family: 'Inter' 
        } : null,
        needsGoogleFontsLoad: () => false
      }));
      
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'inter');
      
      const font = fontManager.getCurrentFont('sans');
      expect(font).toEqual({ id: 'inter', family: 'Inter' });
    });

    it('should return null for category without override', () => {
      const font = fontManager.getCurrentFont('serif');
      expect(font).toBeNull();
    });
  });

  describe('Google Fonts Loading', () => {
    beforeEach(async () => {
      await fontManager.init();
      
      // Mock font catalog
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: (id: string) => {
          if (id === 'google-font') {
            return { 
              id: 'google-font', 
              family: 'Google Font', 
              source: 'google',
              weights: ['400', '700']
            };
          }
          if (id === 'system-font') {
            return { 
              id: 'system-font', 
              family: 'System Font', 
              source: 'system'
            };
          }
          return null;
        },
        needsGoogleFontsLoad: (font: any) => font.source === 'google',
        buildFontFamily: (font: any) => `${font.family}, sans-serif`
      }));
    });

    it('should load Google Fonts when setting override', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      await fontManager.setFontOverride('sans', 'google-font');
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should not load system fonts', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      await fontManager.setFontOverride('sans', 'system-font');
      
      expect(createElementSpy).not.toHaveBeenCalledWith('link');
    });

    it('should batch multiple Google Font loads', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      // Set multiple Google Fonts quickly
      await Promise.all([
        fontManager.setFontOverride('sans', 'google-font'),
        fontManager.setFontOverride('serif', 'google-font')
      ]);
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should only create one link element for the batch
      const linkCalls = appendChildSpy.mock.calls.filter(
        call => call[0].tagName === 'LINK'
      );
      expect(linkCalls.length).toBe(1);
    });

    it('should handle Google Fonts loading errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await fontManager.setFontOverride('sans', 'google-font');
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the created link element and trigger error
      const linkElement = document.querySelector('link[data-batch="true"]') as HTMLLinkElement;
      if (linkElement && linkElement.onerror) {
        linkElement.onerror({} as any);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ FontManager: Batch load failed'),
        expect.any(String)
      );
      
      consoleSpy.mockRestore();
    });

    it('should not reload already loaded fonts', async () => {
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      
      // Load font first time
      await fontManager.setFontOverride('sans', 'google-font');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      appendChildSpy.mockClear();
      
      // Try to load same font again
      await fontManager.setFontOverride('serif', 'google-font');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not create new link elements
      const linkCalls = appendChildSpy.mock.calls.filter(
        call => call[0].tagName === 'LINK'
      );
      expect(linkCalls.length).toBe(0);
    });
  });

  describe('CSS Injection', () => {
    beforeEach(async () => {
      await fontManager.init();
      
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => ({ 
          id: 'test-font', 
          family: 'Test Font', 
          source: 'system'
        }),
        needsGoogleFontsLoad: () => false,
        buildFontFamily: () => 'Test Font, sans-serif'
      }));
    });

    it('should inject CSS when applying overrides', async () => {
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'test-font');
      
      const styleElement = document.getElementById('font-overrides');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
    });

    it('should update CSS variables when font overrides change', async () => {
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'test-font');
      
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--font-sans-selected')).toBe('Test Font, sans-serif');
    });

    it('should remove CSS variables when disabling overrides', async () => {
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'test-font');
      await fontManager.disableOverride();
      
      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--font-sans-selected')).toBe('');
    });
  });

  describe('Font Preview', () => {
    beforeEach(async () => {
      await fontManager.init();
      
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => ({ 
          id: 'preview-font', 
          family: 'Preview Font', 
          source: 'system'
        }),
        needsGoogleFontsLoad: () => false,
        buildFontFamily: () => 'Preview Font, sans-serif'
      }));
    });

    it('should apply temporary font preview', async () => {
      await fontManager.previewFont('sans', 'preview-font');
      
      const previewElement = document.getElementById('font-preview');
      expect(previewElement).toBeTruthy();
    });

    it('should stop font preview and revert to current config', async () => {
      await fontManager.previewFont('sans', 'preview-font');
      fontManager.stopPreview();
      
      const previewElement = document.getElementById('font-preview');
      expect(previewElement).toBeNull();
    });

    it('should throw error for invalid preview font', async () => {
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => null
      }));
      
      await expect(fontManager.previewFont('sans', 'invalid-font'))
        .rejects.toThrow('Font not found: invalid-font');
    });
  });

  describe('Reset and Statistics', () => {
    beforeEach(async () => {
      await fontManager.init();
      
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: () => ({ id: 'test-font', family: 'Test Font' }),
        needsGoogleFontsLoad: () => false
      }));
    });

    it('should reset all font overrides', async () => {
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'test-font');
      
      await fontManager.resetOverrides();
      
      const config = fontManager.getOverrideConfiguration();
      expect(config).toEqual({ enabled: false, fonts: {} });
    });

    it('should provide accurate statistics', async () => {
      await fontManager.enableOverride();
      await fontManager.setFontOverride('sans', 'test-font');
      await fontManager.setFontOverride('serif', 'test-font');
      
      const stats = fontManager.getStats();
      expect(stats).toEqual({
        enabled: true,
        overrides: 2,
        categories: ['sans', 'serif']
      });
    });

    it('should provide empty statistics when no overrides', () => {
      const stats = fontManager.getStats();
      expect(stats).toEqual({
        enabled: false,
        overrides: 0,
        categories: []
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await fontManager.init();
    });

    it('should handle requestIdleCallback fallback', async () => {
      // Mock requestIdleCallback as undefined
      const originalRequestIdleCallback = window.requestIdleCallback;
      delete (window as any).requestIdleCallback;
      
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      
      await fontManager.enableOverride();
      
      // Should use setTimeout fallback
      expect(setTimeoutSpy).toHaveBeenCalled();
      
      // Restore
      window.requestIdleCallback = originalRequestIdleCallback;
    });

    it('should handle multiple rapid font changes', async () => {
      vi.doMock('../src/catalogs/font-catalog', () => ({
        getFontById: (id: string) => ({ id, family: `Font ${id}` }),
        needsGoogleFontsLoad: () => false,
        buildFontFamily: (font: any) => `${font.family}, sans-serif`
      }));
      
      // Rapidly change fonts
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(fontManager.setFontOverride('sans', `font-${i}`));
      }
      
      await Promise.all(promises);
      
      // Should handle all changes without errors
      const config = fontManager.getOverrideConfiguration();
      expect(config.fonts.sans).toMatch(/font-\d+/);
    });
  });
});