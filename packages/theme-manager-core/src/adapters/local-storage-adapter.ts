/**
 * LocalStorage Adapter
 * Default storage adapter using browser localStorage
 */

import { isClient, safeGetLocalStorage } from '../utils/ssr-utils';
import type { StorageAdapter } from '../types/storage-adapter';

export class LocalStorageAdapter implements StorageAdapter {
  /**
   * Get value from localStorage
   */
  getItem(key: string): string | null {
    const storage = safeGetLocalStorage();
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn('LocalStorageAdapter: Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Set value in localStorage
   */
  setItem(key: string, value: string): void {
    const storage = safeGetLocalStorage();
    if (!storage) {
      console.warn('LocalStorageAdapter: localStorage not available');
      return;
    }

    try {
      storage.setItem(key, value);
    } catch (error) {
      console.warn('LocalStorageAdapter: Failed to write to localStorage:', error);
    }
  }

  /**
   * Remove value from localStorage
   */
  removeItem(key: string): void {
    const storage = safeGetLocalStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn('LocalStorageAdapter: Failed to remove from localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    return isClient() && !!safeGetLocalStorage();
  }

  /**
   * Clear all localStorage
   */
  clear(): void {
    const storage = safeGetLocalStorage();
    if (!storage) {
      return;
    }

    try {
      storage.clear();
    } catch (error) {
      console.warn('LocalStorageAdapter: Failed to clear localStorage:', error);
    }
  }
}