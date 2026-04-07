/**
 * RemoteThemeResolver - Fetch fallback for web environments
 * Handles loading themes from remote URLs with caching
 */

import type {
	IThemeResolverConfig,
	IResolvedThemeResult,
} from '../types/theme-resolver';
import type { ThemeConfig } from '../core/theme-registry';

interface ICachedEntry {
	css: string;
	timestamp: number;
}

/**
 * RemoteThemeResolver - Loads themes from remote URLs
 * Fallback resolver for web environments
 */
export class RemoteThemeResolver {
	private config: IThemeResolverConfig;
	private cache: Map<string, ICachedEntry> = new Map();
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	constructor(config: IThemeResolverConfig) {
		this.config = config;
	}

	/**
	 * Initialize remote resolver
	 */
	async init(): Promise<void> {
		console.log('✅ [RemoteThemeResolver] Initialized');
	}

	/**
	 * Resolve CSS content from remote URL
	 * @param themeId - Theme identifier
	 * @param mode - Light or dark mode
	 * @returns Resolved theme result
	 */
	async resolveCSS(
		themeId: string,
		mode: 'light' | 'dark',
	): Promise<IResolvedThemeResult> {
		const cacheKey = `${themeId}-${mode}`;

		// Check cache
		const cached = this.cache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			console.log(`🎯 [RemoteThemeResolver] Cache hit: ${cacheKey}`);
			return { source: 'remote', css: cached.css };
		}

		// Remote resolver doesn't have theme URLs by itself
		// It's used as fallback when ThemeConfig has URL in modes
		// This resolver is mostly for future extensibility
		return { source: 'remote', css: null };
	}

	/**
	 * Get themes (remote resolver doesn't provide themes)
	 */
	async getThemes(): Promise<ThemeConfig[]> {
		// Remote resolver doesn't provide themes
		return [];
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear();
		console.log('🗑️ [RemoteThemeResolver] Cache cleared');
	}

	/**
	 * Fetch CSS from URL with timeout
	 * @param url - URL to fetch
	 * @returns CSS content
	 */
	async fetchCSS(url: string): Promise<string> {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			this.config.remoteTimeout || 5000,
		);

		try {
			const response = await fetch(url, {
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch CSS: ${response.status}`);
			}

			return await response.text();
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Cache CSS content
	 * @param key - Cache key
	 * @param css - CSS content
	 */
	setCache(key: string, css: string): void {
		this.cache.set(key, {
			css,
			timestamp: Date.now(),
		});
	}

	/**
	 * Get cached CSS
	 * @param key - Cache key
	 * @returns CSS content or null
	 */
	getCache(key: string): string | null {
		const cached = this.cache.get(key);
		if (!cached) return null;

		// Check TTL
		if (Date.now() - cached.timestamp > this.CACHE_TTL) {
			this.cache.delete(key);
			return null;
		}

		return cached.css;
	}
}
