/**
 * Theme List Fetcher - Integrates with TweakCN registry for theme discovery
 */

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
  private readonly REGISTRY_URL = 'https://raw.githubusercontent.com/Decentralised-AI/tweakcn-A-visual-no-code-theme-editor-for-shadcn-ui-components/refs/heads/main/public/r/registry.json';
  private readonly STORAGE_KEY = 'tweakcn-theme-names';
  private readonly LAST_FETCH_KEY = 'tweakcn-theme-fetch-timestamp';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
          console.log(`🎨 ThemeListFetcher: Using cached theme names (${cached.length} themes)`);
          return cached;
        }
      }

      console.log(`🌐 ThemeListFetcher: Fetching theme registry...`);

      const response = await fetch(this.REGISTRY_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': force ? 'no-cache' : 'default'
        }
      });

      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status} ${response.statusText}`);
      }

      const registry: ExternalRegistry = await response.json();
      
      if (!registry.items || !Array.isArray(registry.items)) {
        throw new Error('Invalid registry format: missing items array');
      }

      // Extract only theme names and basic info
      const themeNames = registry.items.map(item => item.name);

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(themeNames));
      localStorage.setItem(this.LAST_FETCH_KEY, Date.now().toString());

      console.log(`✅ ThemeListFetcher: Cached ${themeNames.length} theme names`);
      return themeNames;

    } catch (error) {
      console.error('❌ ThemeListFetcher: Failed to fetch themes:', error);
      
      // Return cached data if available
      const cached = this.getCachedThemeNames();
      if (cached.length > 0) {
        console.warn('⚠️ ThemeListFetcher: Using cached data due to fetch error');
        return cached;
      }

      throw error;
    }
  }

  /**
   * Get theme install URL by name
   */
  getThemeInstallUrl(themeName: string): string {
    return `https://raw.githubusercontent.com/Decentralised-AI/tweakcn-A-visual-no-code-theme-editor-for-shadcn-ui-components/refs/heads/main/public/r/themes/${themeName}.json`;
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
    const themes = await this.fetchAvailableThemes();
    if (this.cache) {
      return {
        name: this.cache.name,
        homepage: this.cache.homepage
      };
    }
    return null;
  }
}