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

export class StorageManager {
  private dbName = 'theme-installer-db';
  private dbVersion = 1;
  private storeName = 'themes';
  private db: IDBDatabase | null = null;
  private indexedDBAvailable = false;

  /**
   * Initialize storage (try IndexedDB, fallback to localStorage)
   */
  async init(): Promise<void> {
    try {
      await this.initIndexedDB();
      this.indexedDBAvailable = true;
      console.log('📦 StorageManager: Using IndexedDB');
    } catch (error) {
      console.warn('📦 StorageManager: IndexedDB failed, using localStorage fallback', error);
      this.indexedDBAvailable = false;
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

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create themes store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'name' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('installed', 'installed', { unique: false });
        }
      };
    });
  }

  /**
   * Store theme data
   */
  async storeTheme(theme: CachedTheme): Promise<void> {
    if (this.indexedDBAvailable && this.db) {
      await this.storeInIndexedDB(theme);
    } else {
      this.storeInLocalStorage(theme);
    }
  }

  /**
   * Get theme by name
   */
  async getTheme(name: string): Promise<CachedTheme | null> {
    if (this.indexedDBAvailable && this.db) {
      return await this.getFromIndexedDB(name);
    } else {
      return this.getFromLocalStorage(name);
    }
  }

  /**
   * Get all cached themes
   */
  async getAllThemes(): Promise<CachedTheme[]> {
    if (this.indexedDBAvailable && this.db) {
      return await this.getAllFromIndexedDB();
    } else {
      return this.getAllFromLocalStorage();
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
   * Delete theme
   */
  async deleteTheme(name: string): Promise<void> {
    console.log(`🗑️ StorageManager: Starting deletion of theme: ${name}`);
    console.log(`📊 StorageManager: Using ${this.indexedDBAvailable ? 'IndexedDB' : 'localStorage'} for deletion`);
    
    if (this.indexedDBAvailable && this.db) {
      await this.deleteFromIndexedDB(name);
    } else {
      console.log(`💾 StorageManager: Deleting from localStorage: ${name}`);
      this.deleteFromLocalStorage(name);
    }
  }

  // IndexedDB implementations
  private storeInIndexedDB(theme: CachedTheme): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`💾 StorageManager: Storing theme in IndexedDB:`, {
        name: theme.name,
        installed: theme.installed,
        url: theme.url
      });
      
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(theme);

      request.onsuccess = () => {
        console.log(`✅ StorageManager: Successfully stored theme: ${theme.name} (installed: ${theme.installed})`);
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
      console.log(`🗑️ StorageManager: Deleting theme from IndexedDB: ${name}`);
      
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(name);

      request.onsuccess = () => {
        console.log(`✅ StorageManager: Successfully deleted theme from IndexedDB: ${name}`);
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
            console.warn(`Failed to parse cached theme: ${key}`, error);
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
}