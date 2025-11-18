/**
 * Cookie Storage Adapter
 * Implements storage interface using browser cookies for SSR compatibility
 */

import { isClient } from '../utils/ssr-utils';
import type { StorageAdapter, CookieOptions } from '../types/storage-adapter';

export class CookieStorageAdapter implements StorageAdapter {
  private defaultOptions: CookieOptions;

  constructor(options: CookieOptions = {}) {
    this.defaultOptions = {
      path: '/',
      sameSite: 'lax',
      ...options
    };
  }

  /**
   * Get value from cookies
   */
  getItem(key: string): string | null {
    if (!isClient()) {
      return null;
    }

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === key) {
          return decodeURIComponent(value || '');
        }
      }
      return null;
    } catch (error) {
      console.warn('CookieStorageAdapter: Failed to read cookie:', error);
      return null;
    }
  }

  /**
   * Set value in cookies
   */
  setItem(key: string, value: string, options?: CookieOptions): void {
    if (!isClient()) {
      console.warn('CookieStorageAdapter: Cannot set cookie on server-side');
      return;
    }

    try {
      const opts = { ...this.defaultOptions, ...options };
      let cookieString = `${key}=${encodeURIComponent(value)}`;

      if (opts.expires) {
        cookieString += `; expires=${opts.expires.toUTCString()}`;
      } else if (opts.maxAge) {
        cookieString += `; max-age=${opts.maxAge}`;
      }

      if (opts.domain) {
        cookieString += `; domain=${opts.domain}`;
      }

      if (opts.path) {
        cookieString += `; path=${opts.path}`;
      }

      if (opts.secure) {
        cookieString += '; secure';
      }

      if (opts.httpOnly) {
        cookieString += '; httpOnly';
      }

      if (opts.sameSite) {
        cookieString += `; samesite=${opts.sameSite}`;
      }

      document.cookie = cookieString;
    } catch (error) {
      console.warn('CookieStorageAdapter: Failed to set cookie:', error);
    }
  }

  /**
   * Remove value from cookies
   */
  removeItem(key: string, options?: CookieOptions): void {
    if (!isClient()) {
      console.warn('CookieStorageAdapter: Cannot remove cookie on server-side');
      return;
    }

    this.setItem(key, '', {
      ...options,
      maxAge: -1,
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')
    });
  }

  /**
   * Check if cookies are available
   */
  isAvailable(): boolean {
    return isClient() && navigator.cookieEnabled;
  }

  /**
   * Clear all cookies (limited to current path/domain)
   */
  clear(): void {
    if (!isClient()) {
      return;
    }

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name] = cookie.trim().split('=');
        if (name) {
          this.removeItem(name);
        }
      }
    } catch (error) {
      console.warn('CookieStorageAdapter: Failed to clear cookies:', error);
    }
  }

  /**
   * Set theme preference with 1-year expiry
   */
  setThemePreference(theme: string, mode: 'light' | 'dark' | 'auto'): void {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    this.setItem('theme-current', theme, { expires });
    this.setItem('theme-mode', mode, { expires });
  }

  /**
   * Get theme preference
   */
  getThemePreference(): { theme: string; mode: 'light' | 'dark' | 'auto' } {
    return {
      theme: this.getItem('theme-current') || 'default',
      mode: (this.getItem('theme-mode') as 'light' | 'dark' | 'auto') || 'auto'
    };
  }
}