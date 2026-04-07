/**
 * DiskThemeResolver - Filesystem access for desktop environments
 * Handles loading themes from disk with security validation
 */

import type {
	IThemeResolverConfig,
	IResolvedThemeResult,
	IThemeMetadata,
} from '../types/theme-resolver';
import type { ThemeConfig, ThemeRegistryData } from '../core/theme-registry';

/**
 * DiskThemeResolver - Loads themes from filesystem
 * Supports Electrobun, Electron, and Node.js environments
 */
export class DiskThemeResolver {
	private config: IThemeResolverConfig;
	private themesDir: string;
	private registryPath: string;
	private fileSystemAvailable = false;
	private themeCache: Map<string, ThemeConfig[]> = new Map();

	constructor(config: IThemeResolverConfig) {
		this.config = config;
		this.themesDir = this.expandPath(config.themesDir || '');
		this.registryPath = config.registryPath || '';
		this.detectFileSystemAvailability();
	}

	/**
	 * Initialize disk resolver
	 */
	async init(): Promise<void> {
		if (!this.fileSystemAvailable) {
			console.log('⚠️ [DiskThemeResolver] File system not available');
			return;
		}

		console.log(`📁 [DiskThemeResolver] Themes dir: ${this.themesDir}`);

		// Validate themes directory if available
		await this.validateThemesDirectory().catch((err) => {
			console.warn('⚠️ [DiskThemeResolver] Directory validation failed:', err);
		});
	}

	/**
	 * Resolve CSS content from disk
	 * @param themeId - Theme identifier
	 * @param mode - Light or dark mode
	 * @returns Resolved theme result
	 */
	async resolveCSS(
		themeId: string,
		mode: 'light' | 'dark',
	): Promise<IResolvedThemeResult> {
		if (!this.fileSystemAvailable) {
			return { source: 'disk', css: null };
		}

		try {
			const themeConfig = await this.getThemeConfig(themeId);
			if (!themeConfig) {
				return { source: 'disk', css: null };
			}

			const cssPath = themeConfig.modes[mode];
			const fullPath = this.resolvePath(cssPath);

			// Security check
			if (!this.isPathAllowed(fullPath)) {
				throw new Error(`Path traversal detected: ${fullPath}`);
			}

			// Read CSS file
			const css = await this.readFile(fullPath);

			// Parse metadata
			const metadata = this.parseCSSMetadata(css);

			return { source: 'disk', css, metadata };
		} catch (error) {
			console.warn(
				`⚠️ [DiskThemeResolver] Failed to load ${themeId}/${mode}:`,
				error,
			);
			return { source: 'disk', css: null, error: error as Error };
		}
	}

	/**
	 * Get all themes from disk registry
	 */
	async getThemes(): Promise<ThemeConfig[]> {
		if (!this.fileSystemAvailable) {
			return [];
		}

		// Check cache
		if (this.themeCache.has('disk')) {
			return this.themeCache.get('disk')!;
		}

		try {
			const registryData = await this.loadRegistry();
			const themes = registryData.themes || [];

			// Cache results
			this.themeCache.set('disk', themes);

			return themes;
		} catch (error) {
			console.warn('⚠️ [DiskThemeResolver] Failed to load registry:', error);
			return [];
		}
	}

	/**
	 * Load registry.json from disk
	 */
	private async loadRegistry(): Promise<ThemeRegistryData> {
		const registryPath = this.resolvePath(this.registryPath);
		const content = await this.readFile(registryPath);
		return JSON.parse(content) as ThemeRegistryData;
	}

	/**
	 * Read file from disk
	 * @param path - Absolute file path
	 * @returns File content
	 */
	private async readFile(path: string): Promise<string> {
		// Check if running in Node.js/Electrobun environment
		if (typeof window !== 'undefined' && (window as any).require) {
			const fs = (window as any).require('fs');
			const content = fs.readFileSync(path, 'utf-8');

			// Check file size
			if (content.length > this.config.maxCSSFileSize!) {
				throw new Error(
					`CSS file too large: ${content.length} bytes (max: ${this.config.maxCSSFileSize} bytes)`,
				);
			}

			return content;
		}

		// Node.js environment (server-side)
		if (typeof require !== 'undefined') {
			const fs = require('fs');
			const content = fs.readFileSync(path, 'utf-8');

			if (content.length > this.config.maxCSSFileSize!) {
				throw new Error(
					`CSS file too large: ${content.length} bytes (max: ${this.config.maxCSSFileSize} bytes)`,
				);
			}

			return content;
		}

		throw new Error('File system not available in this environment');
	}

	/**
	 * Check if path is allowed (security)
	 * @param path - Path to check
	 * @returns True if path is within allowed directories
	 */
	private isPathAllowed(path: string): boolean {
		const normalizedPath = this.normalizePath(path);

		// Check against allowed directories
		const allowedDirs = this.config.allowedThemesDirs?.length
			? this.config.allowedThemesDirs
			: [this.themesDir];

		return allowedDirs.some((dir) => {
			const normalizedDir = this.normalizePath(dir);
			return normalizedPath.startsWith(normalizedDir);
		});
	}

	/**
	 * Detect if filesystem is available
	 */
	private detectFileSystemAvailability(): void {
		// Detect if we're in a desktop environment with file system access
		this.fileSystemAvailable =
			(typeof window !== 'undefined' && (window as any).require) ||
			(typeof window !== 'undefined' && (window as any).Electron) ||
			(typeof window !== 'undefined' && (window as any).__ELECTROBUN__) ||
			(typeof require !== 'undefined' && typeof process !== 'undefined');
	}

	/**
	 * Expand ~ to home directory
	 * @param path - Path to expand
	 * @returns Expanded path
	 */
	private expandPath(path: string): string {
		if (path.startsWith('~')) {
			const homeDir =
				typeof process !== 'undefined' ? process.env.HOME || process.env.USERPROFILE || '' : '';
			return path.replace('~', homeDir);
		}
		return path;
	}

	/**
	 * Resolve relative path against themes directory
	 * @param path - Path to resolve
	 * @returns Resolved path
	 */
	private resolvePath(path: string): string {
		// Resolve relative paths against themes directory
		if (path.startsWith('./') || path.startsWith('../')) {
			return `${this.themesDir}/${path}`;
		}
		return path;
	}

	/**
	 * Normalize path for comparison
	 * @param path - Path to normalize
	 * @returns Normalized path
	 */
	private normalizePath(path: string): string {
		return path.replace(/\\/g, '/').replace(/\/+/g, '/');
	}

	/**
	 * Validate themes directory exists and is readable
	 */
	private async validateThemesDirectory(): Promise<void> {
		if (!this.themesDir) {
			return;
		}

		try {
			const fs = typeof require !== 'undefined' ? require('fs') : null;
			if (!fs) return;

			// Check if directory exists
			if (!fs.existsSync(this.themesDir)) {
				console.warn(
					`⚠️ [DiskThemeResolver] Themes directory does not exist: ${this.themesDir}`,
				);
				return;
			}

			// Check if directory is readable
			fs.accessSync(this.themesDir, fs.constants.R_OK);
		} catch (error) {
			console.warn('⚠️ [DiskThemeResolver] Directory validation failed:', error);
		}
	}

	/**
	 * Parse metadata from CSS comments
	 * @param css - CSS content
	 * @returns Parsed metadata
	 */
	private parseCSSMetadata(css: string): IThemeMetadata {
		const metadata: IThemeMetadata = {};
		const regex = /\/\*\s*@theme:\s*(\w+):\s*([^\n*]+)\s*\*\//g;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(css)) !== null) {
			const [, key, value] = match;
			metadata[key as keyof IThemeMetadata] = value.trim();
		}

		return metadata;
	}

	/**
	 * Get theme config by ID
	 * @param themeId - Theme identifier
	 * @returns Theme config or null
	 */
	private async getThemeConfig(themeId: string): Promise<ThemeConfig | null> {
		const themes = await this.getThemes();
		return themes.find((t) => t.id === themeId) || null;
	}
}
