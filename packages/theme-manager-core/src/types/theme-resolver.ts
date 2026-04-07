/**
 * ThemeResolver type definitions
 * Provides interfaces for the embedded theme resolution system
 */

/**
 * Configuration for ThemeResolver
 */
export interface IThemeResolverConfig {
	/** Directory to scan for theme files (Desktop/Web) */
	themesDir?: string;
	/** Path to registry.json file */
	registryPath?: string;
	/** Embedded themes bundled with application (All platforms) */
	embeddedThemes?: Record<string, IEmbeddedThemeData>;
	/** Enable remote fetch fallback (Web only) */
	enableRemoteFallback?: boolean;
	/** Timeout for remote fetch in ms */
	remoteTimeout?: number;
	/** Auto-detect themes from disk */
	autoDetectDiskThemes?: boolean;
	/** Auto-detect embedded themes */
	autoDetectEmbeddedThemes?: boolean;
	/** Allowed theme directories for security */
	allowedThemesDirs?: string[];
	/** Maximum CSS file size in bytes (default 100KB) */
	maxCSSFileSize?: number;
}

/**
 * Embedded theme data with CSS content
 */
export interface IEmbeddedThemeData {
	/** Raw CSS content for light mode */
	light: string;
	/** Raw CSS content for dark mode */
	dark: string;
	/** Optional theme metadata */
	metadata?: IThemeMetadata;
}

/**
 * Theme metadata extracted from CSS comments
 * Format: /* @theme: key: value *\/
 */
export interface IThemeMetadata {
	/** Theme name */
	name?: string;
	/** Theme description */
	description?: string;
	/** Theme author */
	author?: string;
	/** Theme version */
	version?: string;
}

/**
 * Result of theme resolution
 */
export interface IResolvedThemeResult {
	/** Source of the theme CSS */
	source: 'disk' | 'embedded' | 'remote' | 'not-found';
	/** Raw CSS content or null if not found */
	css: string | null;
	/** Optional metadata extracted from CSS */
	metadata?: IThemeMetadata;
	/** Error if resolution failed */
	error?: Error;
}

/**
 * Discriminated input type
 */
export type TDiscriminatedInput = 'path' | 'css' | 'url';
