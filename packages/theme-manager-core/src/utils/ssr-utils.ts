/**
 * SSR Utility Functions
 * Provides environment detection and SSR-safe operations
 */

/**
 * Check if running in client (browser) environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if running in server environment
 */
export function isServer(): boolean {
  return !isClient();
}

/**
 * Safe document access with fallback
 */
export function safeGetDocument(): Document | null {
  return isClient() ? document : null;
}

/**
 * Safe window access with fallback
 */
export function safeGetWindow(): Window | null {
  return isClient() ? window : null;
}

/**
 * Safe localStorage access with fallback
 */
export function safeGetLocalStorage(): Storage | null {
  return isClient() && typeof localStorage !== 'undefined' ? localStorage : null;
}

/**
 * Safe sessionStorage access with fallback
 */
export function safeGetSessionStorage(): Storage | null {
  return isClient() && typeof sessionStorage !== 'undefined' ? sessionStorage : null;
}

/**
 * Execute function only in client environment
 */
export function runOnClient<T>(fn: () => T): T | undefined {
  return isClient() ? fn() : undefined;
}

/**
 * Execute function only in server environment
 */
export function runOnServer<T>(fn: () => T): T | undefined {
  return isServer() ? fn() : undefined;
}

/**
 * Safe DOM manipulation with error handling
 */
export function safeDOMManipulation(fn: () => void): void {
  if (!isClient()) return;

  try {
    fn();
  } catch (error) {
    console.warn('DOM manipulation failed:', error);
  }
}

/**
 * Safe setTimeout with fallback for server
 */
export function safeSetTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
  if (isClient()) {
    return setTimeout(callback, delay);
  }

  // Server fallback - return a fake timeout ID
  return setTimeout(callback, delay);
}

/**
 * Safe clearTimeout with fallback
 */
export function safeClearTimeout(timeoutId: ReturnType<typeof setTimeout> | null): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if a DOM element exists
 */
export function safeElementExists(selector: string): boolean {
  if (!isClient()) return false;

  try {
    return !!document.querySelector(selector);
  } catch {
    return false;
  }
}

/**
 * Get computed style safely
 */
export function safeGetComputedStyle(element: HTMLElement): CSSStyleDeclaration | null {
  if (!isClient() || !element) return null;

  try {
    return window.getComputedStyle(element);
  } catch {
    return null;
  }
}

/**
 * Create SSR-safe event listener
 */
export function safeAddEventListener<K extends keyof DocumentEventMap>(
  target: Document | Window | HTMLElement,
  event: K,
  callback: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): () => void {
  if (!isClient()) return () => {}; // Return noop function

  try {
    target.addEventListener(event, callback, options);

    // Return cleanup function
    return () => {
      try {
        target.removeEventListener(event, callback, options);
      } catch {
        // Ignore cleanup errors
      }
    };
  } catch {
    return () => {}; // Return noop function if addEventListener fails
  }
}

/**
 * Storage operations with SSR safety
 */
export const ssrSafeStorage = {
  getItem: (key: string): string | null => {
    const storage = safeGetLocalStorage();
    return storage ? storage.getItem(key) : null;
  },

  setItem: (key: string, value: string): boolean => {
    const storage = safeGetLocalStorage();
    if (!storage) return false;

    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    const storage = safeGetLocalStorage();
    if (!storage) return false;

    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Match media with SSR fallback
 */
export function safeMatchMedia(query: string): MediaQueryList | false {
  if (!isClient()) return false;

  try {
    return window.matchMedia(query);
  } catch {
    return false;
  }
}

/**
 * Request animation frame with fallback
 */
export function safeRequestAnimationFrame(callback: FrameRequestCallback): number | null {
  if (!isClient()) return null;

  try {
    return requestAnimationFrame(callback);
  } catch {
    // Fallback to setTimeout
    return setTimeout(callback, 16) as any;
  }
}

/**
 * Cancel animation frame with fallback
 */
export function safeCancelAnimationFrame(requestId: number | null): void {
  if (!isClient() || !requestId) return;

  try {
    cancelAnimationFrame(requestId);
  } catch {
    // Try clearing as timeout if it was a fallback
    clearTimeout(requestId as any);
  }
}