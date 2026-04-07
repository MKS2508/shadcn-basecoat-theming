/**
 * ThemeResolver - Main orchestration class for embedded theme resolution
 * Provides unified interface for disk, embedded, and remote theme sources
 */

import type {
	IThemeResolverConfig,
	IEmbeddedThemeData,
	IThemeMetadata,
	IResolvedThemeResult,
	TDiscriminatedInput,
} from '../types/theme-resolver';
import type { ThemeConfig } from './theme-registry';

import { DiskThemeResolver } from '../resolvers/disk-theme-resolver';
import { EmbeddedThemeResolver } from '../resolvers/embedded-theme-resolver';
import { RemoteThemeResolver } from '../resolvers/remote-theme-resolver';

/**
 * ThemeResolver - Main class for theme resolution with fallback chain
 *
 * Resolution order:
 * 1. Disk scan (Desktop/Web with filesystem access)
 * 2. Embedded themes (All platforms)
 * 3. Remote fetch (Web only)
 */
export class ThemeResolver {
	private config: IThemeResolverConfig;
	private diskResolver: DiskThemeResolver;
	private embeddedResolver: EmbeddedThemeResolver;
	private remoteResolver: RemoteThemeResolver;
	private registryCache: Map<string, ThemeConfig> = new Map();
	private initialized = false;

	/**
	 * Create a new ThemeResolver
	 * @param config - Configuration options
	 */
	constructor(config: IThemeResolverConfig = {}) {
		this.config = this.normalizeConfig(config);
		this.diskResolver = new DiskThemeResolver(this.config);
		this.embeddedResolver = new EmbeddedThemeResolver(this.config);
		this.remoteResolver = new RemoteThemeResolver(this.config);
	}

	/**
	 * Initialize the resolver with directory scanning
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		console.log('🔄 [ThemeResolver] Initializing...');

		// Initialize all resolvers in parallel
		await Promise.all([
			this.diskResolver.init(),
			this.embeddedResolver.init(),
			this.remoteResolver.init(),
		]);

		// Build unified registry from all sources
		await this.buildRegistry();

		this.initialized = true;
		console.log('✅ [ThemeResolver] Initialized');
	}

	/**
	 * Resolve CSS content with fallback chain
	 * @param themeId - Theme identifier
	 * @param mode - Light or dark mode
	 * @returns Resolved theme result with CSS content
	 */
	async resolveCSS(themeId: string, mode: 'light' | 'dark'): Promise<IResolvedThemeResult> {
		// 1. Try disk resolver
		const diskResult = await this.diskResolver.resolveCSS(themeId, mode);
		if (diskResult.css) {
			console.log(`🎨 [ThemeResolver] ${themeId}/${mode} from disk`);
			return { ...diskResult, source: 'disk' };
		}

		// 2. Try embedded resolver
		const embeddedResult = await this.embeddedResolver.resolveCSS(themeId, mode);
		if (embeddedResult.css) {
			console.log(`🎨 [ThemeResolver] ${themeId}/${mode} from embedded`);
			return { ...embeddedResult, source: 'embedded' };
		}

		// 3. Try remote resolver (web only)
		if (this.config.enableRemoteFallback !== false) {
			const remoteResult = await this.remoteResolver.resolveCSS(themeId, mode);
			if (remoteResult.css) {
				console.log(`🎨 [ThemeResolver] ${themeId}/${mode} from remote`);
				return { ...remoteResult, source: 'remote' };
			}
		}

		console.warn(`⚠️ [ThemeResolver] ${themeId}/${mode} not found`);
		return { source: 'not-found', css: null };
	}

	/**
	 * Get unified theme registry from all sources
	 */
	getRegistry(): ThemeConfig[] {
		return Array.from(this.registryCache.values());
	}

	/**
	 * Check if theme exists in any source
	 */
	hasTheme(themeId: string): boolean {
		return this.registryCache.has(themeId);
	}

	/**
	 * Auto-detect if input is path, CSS content, or URL
	 * @param input - String to discriminate
	 * @returns Discriminated type
	 */
	discriminateInput(input: string): TDiscriminatedInput {
		// CSS content detection - check for CSS patterns
		if (
			input.includes(':root') ||
			input.includes('--') ||
			input.includes('{') ||
			input.includes('}')
		) {
			return 'css';
		}

		// URL detection
		if (input.startsWith('http://') || input.startsWith('https://')) {
			return 'url';
		}

		// Default to path
		return 'path';
	}

	/**
	 * Parse metadata from CSS comments
	 * Format: /* @theme: key: value *\/
	 * @param css - CSS content
	 * @returns Parsed metadata
	 */
	parseCSSMetadata(css: string): IThemeMetadata {
		const metadata: IThemeMetadata = {};

		// Match /* @theme: key: value */ comments
		const themeCommentRegex = /\/\*\s*@theme:\s*(\w+):\s*([^\n*]+)\s*\*\//g;
		let match: RegExpExecArray | null;

		while ((match = themeCommentRegex.exec(css)) !== null) {
			const [, key, value] = match;
			metadata[key as keyof IThemeMetadata] = value.trim();
		}

		return metadata;
	}

	/**
	 * Build unified registry from all sources
	 */
	private async buildRegistry(): Promise<void> {
		this.registryCache.clear();

		// Add disk themes (highest priority)
		const diskThemes = await this.diskResolver.getThemes();
		diskThemes.forEach((theme) => {
			this.registryCache.set(theme.id, theme);
		});

		// Add embedded themes (don't override disk themes)
		const embeddedThemes = await this.embeddedResolver.getThemes();
		embeddedThemes.forEach((theme) => {
			if (!this.registryCache.has(theme.id)) {
				this.registryCache.set(theme.id, theme);
			}
		});

		console.log(
			`📊 [ThemeResolver] Registry: ${this.registryCache.size} themes total`,
		);
	}

	/**
	 * Normalize configuration with defaults
	 */
	private normalizeConfig(config: IThemeResolverConfig): IThemeResolverConfig {
		return {
			themesDir:
				config.themesDir ||
				(typeof process !== 'undefined' ? process.env.MKS_MC_THEMES_DIR : undefined),
			registryPath:
				config.registryPath ||
				(typeof process !== 'undefined'
					? process.env.MKS_MC_THEMES_REGISTRY
					: undefined) ||
				'/themes/registry.json',
			embeddedThemes: config.embeddedThemes || {},
			enableRemoteFallback: config.enableRemoteFallback !== false,
			remoteTimeout: config.remoteTimeout || 5000,
			autoDetectDiskThemes: config.autoDetectDiskThemes !== false,
			autoDetectEmbeddedThemes: config.autoDetectEmbeddedThemes !== false,
			allowedThemesDirs: config.allowedThemesDirs || [],
			maxCSSFileSize: config.maxCSSFileSize || 100 * 1024, // 100KB
		};
	}
}
