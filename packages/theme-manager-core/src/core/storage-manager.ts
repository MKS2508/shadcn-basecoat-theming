/**
 * Storage abstraction for theme caching with IndexedDB + localStorage fallback
 */

export interface CachedTheme {
  name: string;
  url: string;
  data: {
    name: string;
    cssVars: {
      light?: Record<string, string>;
      dark?: Record<string, string>;
      theme?: Record<string, string>;
    };
  };
  installed: boolean;
  timestamp: number;
}

export interface CachedFont {
  fontKey: string; // e.g., "Inter-400,700" 
  family: string;  // e.g., "Inter"
  cssContent: string; // Full CSS from Google Fonts
  timestamp: number;
  url: string; // Original Google Fonts URL - this is the main reference
}

export interface FontOverrideConfig {
  enabled: boolean;
  fonts: {
    sans?: string;   // Font ID from catalog
    serif?: string;  // Font ID from catalog  
    mono?: string;   // Font ID from catalog
  };
  timestamp: number;
}

export interface ThemeModeConfig {
  currentTheme: string;
  currentMode: 'light' | 'dark' | 'auto';
  timestamp: number;
}

export class StorageManager {
  private static instance: StorageManager | null = null;
  private dbName = 'theme-installer-db';
  private dbVersion = 5; // Increment for migration
  private storeName = 'themes';
  private fontConfigStoreName = 'font-config';
  private themeModeStoreName = 'theme-mode-config';
  private db: IDBDatabase | null = null;
  private indexedDBAvailable = false;
  
  // localStorage keys for FOUC-critical data only
  private static readonly FOUC_KEYS = {
    THEME: 'theme-current',
    MODE: 'theme-mode', 
    FONTS: 'fonts-active'
  } as const;
  private initPromise: Promise<void> | null = null;

  /**
   * Get singleton instance of StorageManager
   */
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      console.log('🔧 StorageManager: Creating new singleton instance');
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Inicializa el sistema de almacenamiento con IndexedDB y fallback a localStorage
   * @returns Promise que se resuelve cuando el almacenamiento est\u00e1 configurado
   */
  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      console.log('🔄 StorageManager: Using existing initialization promise');
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db && this.indexedDBAvailable) {
      console.log('⚡ StorageManager: Already initialized, skipping');
      return Promise.resolve();
    }

    console.log('🚀 StorageManager: Starting initialization (singleton)');
    
    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    try {
      await this.initIndexedDB();
      this.indexedDBAvailable = true;
      
      // Run migration from legacy localStorage to IndexedDB
      await this.migrateLegacyData();
      
      console.log('✅ StorageManager: Singleton initialization completed successfully');
    } catch (error) {
      console.error('❌ StorageManager: Initialization failed, falling back to localStorage:', error);
      this.indexedDBAvailable = false;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Initialize IndexedDB
   */
  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('IndexedDB initialization timeout'));
      }, 5000);

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        clearTimeout(timeout);
        reject(request.error || new Error('IndexedDB open failed'));
      };
      
      request.onsuccess = () => {
        clearTimeout(timeout);
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('🔄 IndexedDB upgrade needed, creating object stores...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create themes store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'name' });
          store.createIndex('url', 'url', { unique: false });
          console.log('✅ IndexedDB themes store created');
        }
        
        // Create font config store if it doesn't exist
        if (!db.objectStoreNames.contains(this.fontConfigStoreName)) {
          const fontConfigStore = db.createObjectStore(this.fontConfigStoreName, { keyPath: 'id' });
          fontConfigStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ IndexedDB font config store created');
        }
      };
    });
  }

  /**
   * Store theme data (always in IndexedDB)
   */
  async storeTheme(theme: CachedTheme): Promise<void> {
    if (this.indexedDBAvailable && this.db) {
      await this.storeInIndexedDB(theme);
    } else {
      console.warn('⚠️ IndexedDB not available, theme data cannot be persisted');
    }
  }

  /**
   * Get theme by name (always from IndexedDB)
   */
  async getTheme(name: string): Promise<CachedTheme | null> {
    if (this.indexedDBAvailable && this.db) {
      return await this.getFromIndexedDB(name);
    } else {
      console.warn('⚠️ IndexedDB not available, cannot retrieve theme data');
      return null;
    }
  }

  /**
   * Get all cached themes (always from IndexedDB)
   */
  async getAllThemes(): Promise<CachedTheme[]> {
    if (this.indexedDBAvailable && this.db) {
      return await this.getAllFromIndexedDB();
    } else {
      console.warn('⚠️ IndexedDB not available, cannot retrieve themes');
      return [];
    }
  }

  /**
   * Check if theme exists by URL
   */
  async themeExistsByUrl(url: string): Promise<CachedTheme | null> {
    const themes = await this.getAllThemes();
    return themes.find(theme => theme.url === url) || null;
  }

  /**
   * Mark theme as installed
   */
  async markThemeInstalled(name: string): Promise<void> {
    const theme = await this.getTheme(name);
    if (theme) {
      theme.installed = true;
      await this.storeTheme(theme);
    }
  }

  /**
   * Delete theme (always from IndexedDB)
   */
  async deleteTheme(name: string): Promise<void> {
    if (this.indexedDBAvailable && this.db) {
      await this.deleteFromIndexedDB(name);
    } else {
      console.warn('⚠️ IndexedDB not available, cannot delete theme');
    }
  }

  // ===== FOUC-CRITICAL LOCALSTORAGE METHODS =====
  // Only for data needed before IndexedDB is available

  /**
   * Store current theme for FOUC prevention (localStorage only)
   */
  setCurrentTheme(theme: string): void {
    try {
      localStorage.setItem(StorageManager.FOUC_KEYS.THEME, theme);
    } catch (error) {
      console.error('❌ Failed to store current theme in localStorage:', error);
    }
  }

  /**
   * Get current theme for FOUC prevention (localStorage only)
   */
  getCurrentTheme(): string | null {
    try {
      return localStorage.getItem(StorageManager.FOUC_KEYS.THEME);
    } catch (error) {
      console.error('❌ Failed to get current theme from localStorage:', error);
      return null;
    }
  }

  /**
   * Store current mode for FOUC prevention (localStorage only)
   */
  setCurrentMode(mode: 'light' | 'dark' | 'auto'): void {
    try {
      localStorage.setItem(StorageManager.FOUC_KEYS.MODE, mode);
    } catch (error) {
      console.error('❌ Failed to store current mode in localStorage:', error);
    }
  }

  /**
   * Get current mode for FOUC prevention (localStorage only)
   */
  getCurrentMode(): 'light' | 'dark' | 'auto' | null {
    try {
      const mode = localStorage.getItem(StorageManager.FOUC_KEYS.MODE);
      return mode as 'light' | 'dark' | 'auto' | null;
    } catch (error) {
      console.error('❌ Failed to get current mode from localStorage:', error);
      return null;
    }
  }

  /**
   * Store active fonts for FOUC prevention (localStorage only)
   */
  setActiveFonts(fonts: { sans?: string; serif?: string; mono?: string }): void {
    try {
      localStorage.setItem(StorageManager.FOUC_KEYS.FONTS, JSON.stringify(fonts));
    } catch (error) {
      console.error('❌ Failed to store active fonts in localStorage:', error);
    }
  }

  /**
   * Get active fonts for FOUC prevention (localStorage only)
   */
  getActiveFonts(): { sans?: string; serif?: string; mono?: string } | null {
    try {
      const data = localStorage.getItem(StorageManager.FOUC_KEYS.FONTS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to get active fonts from localStorage:', error);
      return null;
    }
  }

  /**
   * Migrate legacy localStorage data to IndexedDB (one-time operation)
   */
  async migrateLegacyData(): Promise<void> {
    if (!this.indexedDBAvailable || !this.db) {
      console.warn('⚠️ IndexedDB not available, skipping migration');
      return;
    }

    const migrationKey = 'theme-migration-completed';
    if (localStorage.getItem(migrationKey)) {
      console.log('✅ Legacy data migration already completed');
      return;
    }

    console.log('🔄 Migrating legacy localStorage data to IndexedDB...');

    const legacyThemes: CachedTheme[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('theme-cache-') && !Object.values(StorageManager.FOUC_KEYS).includes(key)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const theme = JSON.parse(data);
            legacyThemes.push(theme);
            localStorage.removeItem(key);
          } catch (error) {
            console.warn(`⚠️ Failed to migrate theme data for key: ${key}`, error);
          }
        }
      }
    }

    for (const theme of legacyThemes) {
      try {
        await this.storeTheme(theme);
      } catch (error) {
        console.error('❌ Failed to migrate theme to IndexedDB:', theme.name, error);
      }
    }

    localStorage.setItem(migrationKey, 'true');
    console.log(`✅ Migrated ${legacyThemes.length} themes to IndexedDB`);
  }

  // IndexedDB implementations
  private storeInIndexedDB(theme: CachedTheme): Promise<void> {
    return new Promise((resolve, reject) => {
      
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(theme);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ StorageManager: Failed to store theme: ${theme.name}`, request.error);
        reject(request.error);
      };
    });
  }

  private getFromIndexedDB(name: string): Promise<CachedTheme | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(name);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private getAllFromIndexedDB(): Promise<CachedTheme[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private deleteFromIndexedDB(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(name);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ StorageManager: Failed to delete theme from IndexedDB: ${name}`, request.error);
        reject(request.error);
      };
    });
  }

  // localStorage implementations  
  private storeInLocalStorage(theme: CachedTheme): void {
    const key = `theme-cache-${theme.name}`;
    localStorage.setItem(key, JSON.stringify(theme));
  }

  private getFromLocalStorage(name: string): CachedTheme | null {
    const key = `theme-cache-${name}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private getAllFromLocalStorage(): CachedTheme[] {
    const themes: CachedTheme[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('theme-cache-')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            themes.push(JSON.parse(data));
          } catch (error) {
          }
        }
      }
    }
    return themes;
  }

  private deleteFromLocalStorage(name: string): void {
    const key = `theme-cache-${name}`;
    localStorage.removeItem(key);
  }

  // === FONT methods removed - using only font-config store ===

  // ===== FONT OVERRIDE CONFIGURATION METHODS =====

  /**
   * Store font override configuration in IndexedDB
   */
  async storeFontConfig(config: FontOverrideConfig): Promise<void> {
    if (this.indexedDBAvailable && this.db) {
      await this.storeFontConfigInIndexedDB(config);
    }
    
    // Always store in localStorage as backup
    this.storeFontConfigInLocalStorage(config);
  }

  /**
   * Get font override configuration from storage
   */
  async getFontConfig(): Promise<FontOverrideConfig | null> {
    if (this.indexedDBAvailable && this.db) {
      try {
        return await this.getFontConfigFromIndexedDB();
      } catch (error) {
        console.warn('⚠️ StorageManager: Failed to get font config from IndexedDB, trying localStorage:', error);
      }
    }
    
    return this.getFontConfigFromLocalStorage();
  }

  private storeFontConfigInIndexedDB(config: FontOverrideConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.fontConfigStoreName], 'readwrite');
      const store = transaction.objectStore(this.fontConfigStoreName);
      
      const configWithId = { 
        id: 'font-overrides', // Single config record
        ...config 
      };
      
      const request = store.put(configWithId);

      request.onsuccess = () => {
        console.log('✅ StorageManager: Font config stored in IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ StorageManager: Failed to store font config in IndexedDB', request.error);
        reject(request.error);
      };
    });
  }

  private getFontConfigFromIndexedDB(): Promise<FontOverrideConfig | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.fontConfigStoreName], 'readonly');
      const store = transaction.objectStore(this.fontConfigStoreName);
      const request = store.get('font-overrides');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove the 'id' field added for IndexedDB
          const { id, ...config } = result;
          resolve(config);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private storeFontConfigInLocalStorage(config: FontOverrideConfig): void {
    try {
      localStorage.setItem('font-override-config', JSON.stringify(config));
    } catch (error) {
      console.error('❌ StorageManager: Failed to store font config in localStorage:', error);
    }
  }

  private getFontConfigFromLocalStorage(): FontOverrideConfig | null {
    try {
      const data = localStorage.getItem('font-override-config');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ StorageManager: Failed to parse font config from localStorage:', error);
      return null;
    }
  }

  // ===== THEME MODE CONFIGURATION METHODS =====
  // Using themes store to store a special "theme-mode-config" record

  /**
   * Store theme mode configuration using existing themes store
   */
  async storeThemeModeConfig(config: ThemeModeConfig): Promise<void> {
    // Create a special theme record for mode config
    const modeConfigRecord: CachedTheme = {
      name: '__theme-mode-config__',
      url: 'internal://config',
      data: {
        name: '__theme-mode-config__',
        cssVars: {
          theme: {
            '__current-theme': config.currentTheme,
            '__current-mode': config.currentMode,
            '__timestamp': config.timestamp.toString()
          }
        }
      },
      installed: true,
      timestamp: config.timestamp
    };

    await this.storeTheme(modeConfigRecord);
    
    // Also store in localStorage as backup
    try {
      localStorage.setItem('theme-mode-config', JSON.stringify(config));
    } catch (error) {
      console.error('❌ StorageManager: Failed to store theme mode config in localStorage:', error);
    }
  }

  /**
   * Get theme mode configuration from themes store
   */
  async getThemeModeConfig(): Promise<ThemeModeConfig | null> {
    try {
      const configRecord = await this.getTheme('__theme-mode-config__');
      
      if (configRecord && configRecord.data.cssVars.theme) {
        const vars = configRecord.data.cssVars.theme;
        return {
          currentTheme: vars['__current-theme'] || 'default',
          currentMode: (vars['__current-mode'] as 'light' | 'dark' | 'auto') || 'auto',
          timestamp: parseInt(vars['__timestamp'] || '0')
        };
      }
    } catch (error) {
      console.warn('⚠️ StorageManager: Failed to get theme mode config from IndexedDB, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
      const data = localStorage.getItem('theme-mode-config');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ StorageManager: Failed to parse theme mode config from localStorage:', error);
      return null;
    }
  }
}