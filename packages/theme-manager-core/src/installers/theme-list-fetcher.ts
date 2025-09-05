/**
 * Theme List Fetcher - Integrates with TweakCN registry for theme discovery
 */

import { StorageManager } from '../core/storage-manager';

export interface ExternalThemeItem {
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  // Additional properties from registry
  [key: string]: any;
}

export interface ExternalRegistry {
  name: string;
  homepage: string;
  items: ExternalThemeItem[];
}

export class ThemeListFetcher {
  private readonly REGISTRY_URL = 'https://tweakcn.com/r/registry.json';
  private readonly STORAGE_KEY = 'tweakcn-theme-names';
  private readonly LAST_FETCH_KEY = 'tweakcn-theme-fetch-timestamp';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private cache: ExternalRegistry | null = null;
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = StorageManager.getInstance();
  }

  /**
   * Initialize the fetcher
   */
  async init(): Promise<void> {
    await this.storageManager.init();
  }

  /**
   * Get cached theme names from localStorage
   */
  getCachedThemeNames(): string[] {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Failed to parse cached theme names:', error);
      return [];
    }
  }

  /**
   * Fetch and cache theme names from TweakCN registry
   */
  async fetchAndCacheThemeNames(force: boolean = false): Promise<string[]> {
    try {
      // Check if we need to fetch
      if (!force && this.isCacheValid()) {
        const cached = this.getCachedThemeNames();
        if (cached.length > 0) {
          
          // Populate this.cache for fetchAvailableThemes() compatibility
          if (!this.cache) {
            this.cache = {
              name: 'TweakCN Registry',
              homepage: 'https://tweakcn.com',
              items: cached.map(name => ({ name }))
            };
          }
          
          return cached;
        }
      }


      // Direct fetch to TweakCN registry
      const response = await fetch(this.REGISTRY_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status} ${response.statusText}`);
      }

      const registry: ExternalRegistry = await response.json();
      
      if (!registry.items || !Array.isArray(registry.items)) {
        throw new Error('Invalid registry format: missing items array');
      }

      // Cache full registry for advanced methods
      this.cache = registry;

      // Extract only theme names and basic info for storage
      const themeNames = registry.items.map(item => item.name);

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(themeNames));
      localStorage.setItem(this.LAST_FETCH_KEY, Date.now().toString());

      return themeNames;

    } catch (error) {
      console.error('❌ ThemeListFetcher: Failed to fetch themes:', error);
      
      // Return cached data if available
      const cached = this.getCachedThemeNames();
      if (cached.length > 0) {
        return cached;
      }

      throw error;
    }
  }

  /**
   * Get theme install URL by name (direct to TweakCN)
   */
  getThemeInstallUrl(themeName: string): string {
    return `https://tweakcn.com/r/themes/${themeName}.json`;
  }

  /**
   * Fetch available themes with full metadata (for advanced operations)
   */
  async fetchAvailableThemes(): Promise<ExternalThemeItem[]> {
    // If we have cache, use it
    if (this.cache && this.cache.items) {
      return this.cache.items;
    }

    // Otherwise, fetch and populate cache
    await this.fetchAndCacheThemeNames();
    
    if (!this.cache || !this.cache.items) {
      console.error('❌ ThemeListFetcher: Cache still empty after fetch');
      return [];
    }
    
    return this.cache.items;
  }

  /**
   * Search themes by name or description
   */
  async searchThemes(query: string): Promise<ExternalThemeItem[]> {
    const themes = await this.fetchAvailableThemes();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return themes;

    return themes.filter(theme => 
      theme.name.toLowerCase().includes(searchTerm) ||
      (theme.description && theme.description.toLowerCase().includes(searchTerm)) ||
      (theme.author && theme.author.toLowerCase().includes(searchTerm)) ||
      (theme.tags && theme.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  /**
   * Get theme categories/tags for filtering
   */
  async getAvailableTags(): Promise<string[]> {
    const themes = await this.fetchAvailableThemes();
    const allTags = themes
      .filter(theme => theme.tags)
      .flatMap(theme => theme.tags || []);
    
    return [...new Set(allTags)].sort();
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    try {
      const lastFetch = localStorage.getItem(this.LAST_FETCH_KEY);
      if (!lastFetch) return false;
      
      const lastFetchTime = parseInt(lastFetch);
      return (Date.now() - lastFetchTime) < this.CACHE_DURATION;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear cache (useful for force refresh)
   */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_FETCH_KEY);
  }

  /**
   * Get registry info
   */
  async getRegistryInfo(): Promise<{ name: string; homepage: string } | null> {
    // const themes = await this.fetchAvailableThemes();
    if (this.cache) {
      return {
        name: this.cache.name,
        homepage: this.cache.homepage
      };
    }
    return null;
  }

  /**
   * Fetch theme list - alias for fetchAvailableThemes
   */
  async fetchThemeList(forceRefresh: boolean = false): Promise<ExternalThemeItem[]> {
    if (!forceRefresh && this.cache && this.cache.items) {
      return this.cache.items;
    }
    return await this.fetchAvailableThemes();
  }
}