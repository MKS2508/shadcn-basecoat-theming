import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, CachedTheme } from '../src/core/storage-manager';
import { resetAllMocks } from '../test-setup';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockTheme: CachedTheme;

  beforeEach(() => {
    resetAllMocks();
    storageManager = new StorageManager();
    
    mockTheme = {
      name: 'test-theme',
      url: 'https://example.com/theme.json',
      data: {
        name: 'test-theme',
        cssVars: {
          light: {
            '--background': '0 0% 100%',
            '--foreground': '222.2 84% 4.9%'
          },
          dark: {
            '--background': '222.2 84% 4.9%',
            '--foreground': '210 40% 98%'
          }
        }
      },
      installed: false,
      timestamp: Date.now()
    };
  });

  describe('Initialization', () => {
    it('should initialize successfully with IndexedDB support', async () => {
      await expect(storageManager.init()).resolves.not.toThrow();
    });

    it('should fallback to localStorage when IndexedDB is not available', async () => {
      // Mock IndexedDB as undefined
      const originalIndexedDB = global.indexedDB;
      delete (global as any).indexedDB;
      
      await storageManager.init();
      
      // Should still work with localStorage fallback
      await expect(storageManager.storeTheme(mockTheme)).resolves.not.toThrow();
      
      // Restore IndexedDB
      global.indexedDB = originalIndexedDB;
    });

    it('should handle IndexedDB initialization errors', async () => {
      // Mock IndexedDB open to fail
      const mockOpen = vi.fn().mockReturnValue({
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        error: new Error('DB Error')
      });
      
      vi.spyOn(indexedDB, 'open').mockImplementation(mockOpen);
      
      await storageManager.init();
      
      // Should fallback to localStorage on IndexedDB failure
      await expect(storageManager.storeTheme(mockTheme)).resolves.not.toThrow();
    });

    it('should create object store on upgrade needed', async () => {
      const mockDB = {
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(false)
        },
        createObjectStore: vi.fn().mockReturnValue({
          createIndex: vi.fn()
        })
      };
      
      const mockRequest = {
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: mockDB
      };
      
      vi.spyOn(indexedDB, 'open').mockReturnValue(mockRequest as any);
      
      const initPromise = storageManager.init();
      
      // Trigger upgrade needed
      if (mockRequest.onupgradeneeded) {
        mockRequest.onupgradeneeded({ target: mockRequest } as any);
      }
      
      // Then trigger success
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({} as any);
      }
      
      await initPromise;
      
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('themes', { keyPath: 'name' });
    });
  });

  describe('Theme Storage - IndexedDB', () => {
    beforeEach(async () => {
      await storageManager.init();
    });

    it('should store theme in IndexedDB', async () => {
      await storageManager.storeTheme(mockTheme);
      
      const stored = await storageManager.getTheme('test-theme');
      expect(stored).toEqual(mockTheme);
    });

    it('should retrieve theme from IndexedDB', async () => {
      await storageManager.storeTheme(mockTheme);
      const retrieved = await storageManager.getTheme('test-theme');
      
      expect(retrieved).toEqual(mockTheme);
      expect(retrieved?.name).toBe('test-theme');
      expect(retrieved?.url).toBe('https://example.com/theme.json');
    });

    it('should return null for non-existent theme', async () => {
      const result = await storageManager.getTheme('non-existent');
      expect(result).toBeNull();
    });

    it('should get all themes from IndexedDB', async () => {
      const theme2: CachedTheme = { ...mockTheme, name: 'test-theme-2' };
      
      await storageManager.storeTheme(mockTheme);
      await storageManager.storeTheme(theme2);
      
      const allThemes = await storageManager.getAllThemes();
      expect(allThemes).toHaveLength(2);
      expect(allThemes.map(t => t.name)).toContain('test-theme');
      expect(allThemes.map(t => t.name)).toContain('test-theme-2');
    });

    it('should delete theme from IndexedDB', async () => {
      await storageManager.storeTheme(mockTheme);
      
      const beforeDelete = await storageManager.getTheme('test-theme');
      expect(beforeDelete).toEqual(mockTheme);
      
      await storageManager.deleteTheme('test-theme');
      
      const afterDelete = await storageManager.getTheme('test-theme');
      expect(afterDelete).toBeNull();
    });

    it('should handle IndexedDB transaction errors on store', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock a failing transaction
      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            error: new Error('Transaction failed')
          })
        })
      };
      
      // Mock DB with failing transaction
      (storageManager as any).db = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      };
      (storageManager as any).indexedDBAvailable = true;
      
      const storePromise = storageManager.storeTheme(mockTheme);
      
      // Trigger the error
      const putRequest = mockTransaction.objectStore().put();
      if (putRequest.onerror) {
        putRequest.onerror({} as any);
      }
      
      await expect(storePromise).rejects.toThrow('Transaction failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ StorageManager: Failed to store theme: test-theme'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Storage - localStorage Fallback', () => {
    beforeEach(async () => {
      // Force localStorage fallback
      (storageManager as any).indexedDBAvailable = false;
      (storageManager as any).db = null;
    });

    it('should store theme in localStorage', async () => {
      await storageManager.storeTheme(mockTheme);
      
      const stored = localStorage.getItem('theme-cache-test-theme');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockTheme);
    });

    it('should retrieve theme from localStorage', async () => {
      await storageManager.storeTheme(mockTheme);
      const retrieved = await storageManager.getTheme('test-theme');
      
      expect(retrieved).toEqual(mockTheme);
    });

    it('should return null for non-existent theme in localStorage', async () => {
      const result = await storageManager.getTheme('non-existent');
      expect(result).toBeNull();
    });

    it('should get all themes from localStorage', async () => {
      const theme2: CachedTheme = { ...mockTheme, name: 'test-theme-2' };
      
      await storageManager.storeTheme(mockTheme);
      await storageManager.storeTheme(theme2);
      
      const allThemes = await storageManager.getAllThemes();
      expect(allThemes).toHaveLength(2);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('theme-cache-corrupted', 'invalid-json');
      
      const allThemes = await storageManager.getAllThemes();
      expect(Array.isArray(allThemes)).toBe(true);
    });

    it('should delete theme from localStorage', async () => {
      await storageManager.storeTheme(mockTheme);
      
      expect(localStorage.getItem('theme-cache-test-theme')).toBeTruthy();
      
      await storageManager.deleteTheme('test-theme');
      
      expect(localStorage.getItem('theme-cache-test-theme')).toBeNull();
    });

    it('should filter only theme cache items from localStorage', async () => {
      // Add non-theme items
      localStorage.setItem('other-data', 'not-a-theme');
      localStorage.setItem('theme-cache-valid', JSON.stringify(mockTheme));
      
      const allThemes = await storageManager.getAllThemes();
      expect(allThemes).toHaveLength(1);
      expect(allThemes[0].name).toBe('test-theme');
    });
  });

  describe('Theme Management Operations', () => {
    beforeEach(async () => {
      await storageManager.init();
    });

    it('should check if theme exists by URL', async () => {
      await storageManager.storeTheme(mockTheme);
      
      const existingTheme = await storageManager.themeExistsByUrl('https://example.com/theme.json');
      expect(existingTheme).toEqual(mockTheme);
      
      const nonExistingTheme = await storageManager.themeExistsByUrl('https://other.com/theme.json');
      expect(nonExistingTheme).toBeNull();
    });

    it('should mark theme as installed', async () => {
      await storageManager.storeTheme(mockTheme);
      
      expect(mockTheme.installed).toBe(false);
      
      await storageManager.markThemeInstalled('test-theme');
      
      const updatedTheme = await storageManager.getTheme('test-theme');
      expect(updatedTheme?.installed).toBe(true);
    });

    it('should handle marking non-existent theme as installed', async () => {
      await expect(storageManager.markThemeInstalled('non-existent'))
        .resolves.not.toThrow();
    });

    it('should find themes by multiple criteria', async () => {
      const theme1: CachedTheme = { ...mockTheme, name: 'theme-1', installed: true };
      const theme2: CachedTheme = { ...mockTheme, name: 'theme-2', installed: false };
      const theme3: CachedTheme = { ...mockTheme, name: 'theme-3', url: 'https://different.com/theme.json' };
      
      await storageManager.storeTheme(theme1);
      await storageManager.storeTheme(theme2);
      await storageManager.storeTheme(theme3);
      
      const allThemes = await storageManager.getAllThemes();
      expect(allThemes).toHaveLength(3);
      
      // Check that we can find themes with same URL
      const sameUrlThemes = allThemes.filter(t => t.url === 'https://example.com/theme.json');
      expect(sameUrlThemes).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await storageManager.init();
    });

    it('should handle IndexedDB transaction errors on delete', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await storageManager.storeTheme(mockTheme);
      
      // Mock failing delete transaction
      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            error: new Error('Delete failed')
          })
        })
      };
      
      (storageManager as any).db = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      };
      
      const deletePromise = storageManager.deleteTheme('test-theme');
      
      // Trigger the error
      const deleteRequest = mockTransaction.objectStore().delete();
      if (deleteRequest.onerror) {
        deleteRequest.onerror({} as any);
      }
      
      await expect(deletePromise).rejects.toThrow('Delete failed');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ StorageManager: Failed to delete theme from IndexedDB: test-theme'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle quota exceeded errors gracefully', async () => {
      // Mock localStorage quota exceeded
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      // Force localStorage fallback
      (storageManager as any).indexedDBAvailable = false;
      
      await expect(storageManager.storeTheme(mockTheme)).resolves.not.toThrow();
    });
  });

  describe('Performance and Edge Cases', () => {
    beforeEach(async () => {
      await storageManager.init();
    });

    it('should handle concurrent operations', async () => {
      const themes: CachedTheme[] = [];
      for (let i = 0; i < 10; i++) {
        themes.push({
          ...mockTheme,
          name: `theme-${i}`,
          url: `https://example.com/theme-${i}.json`
        });
      }
      
      // Store all themes concurrently
      await Promise.all(themes.map(theme => storageManager.storeTheme(theme)));
      
      // Retrieve all themes
      const stored = await storageManager.getAllThemes();
      expect(stored).toHaveLength(10);
    });

    it('should handle large theme data', async () => {
      const largeTheme: CachedTheme = {
        ...mockTheme,
        data: {
          ...mockTheme.data,
          cssVars: {
            light: {},
            dark: {}
          }
        }
      };
      
      // Add many CSS variables
      for (let i = 0; i < 100; i++) {
        largeTheme.data.cssVars.light![`--color-${i}`] = `hsl(${i * 3.6}, 50%, 50%)`;
        largeTheme.data.cssVars.dark![`--color-${i}`] = `hsl(${i * 3.6}, 50%, 25%)`;
      }
      
      await storageManager.storeTheme(largeTheme);
      const retrieved = await storageManager.getTheme('test-theme');
      
      expect(retrieved?.data.cssVars.light).toHaveProperty('--color-99');
      expect(retrieved?.data.cssVars.dark).toHaveProperty('--color-99');
    });

    it('should handle empty theme collections', async () => {
      const allThemes = await storageManager.getAllThemes();
      expect(allThemes).toEqual([]);
      
      const nonExistentByUrl = await storageManager.themeExistsByUrl('https://example.com/none.json');
      expect(nonExistentByUrl).toBeNull();
    });

    it('should maintain data integrity across operations', async () => {
      // Store original theme
      await storageManager.storeTheme(mockTheme);
      
      // Mark as installed
      await storageManager.markThemeInstalled('test-theme');
      
      // Retrieve and verify
      const installed = await storageManager.getTheme('test-theme');
      expect(installed?.installed).toBe(true);
      expect(installed?.data).toEqual(mockTheme.data);
      
      // Store updated version
      const updatedTheme = { ...mockTheme, timestamp: Date.now() + 1000 };
      await storageManager.storeTheme(updatedTheme);
      
      // Verify update
      const updated = await storageManager.getTheme('test-theme');
      expect(updated?.timestamp).toBe(updatedTheme.timestamp);
      expect(updated?.installed).toBe(true); // Should maintain installed status
    });
  });
});