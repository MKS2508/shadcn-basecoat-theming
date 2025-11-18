/**
 * Storage adapter interface for theme persistence
 * Allows different storage backends (localStorage, cookies, etc.)
 */

export interface StorageAdapter {
  /**
   * Get value from storage
   */
  getItem(key: string): string | null;

  /**
   * Set value in storage
   */
  setItem(key: string, value: string): void;

  /**
   * Remove value from storage
   */
  removeItem(key: string): void;

  /**
   * Check if storage is available
   */
  isAvailable(): boolean;

  /**
   * Clear all storage (optional)
   */
  clear?(): void;
}

/**
 * Cookie options for cookie storage adapter
 */
export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}