/**
 * EmbeddedThemeResolver - CSS module support via ?raw imports
 * Handles in-memory CSS strings bundled with application
 */

import type {
	IThemeResolverConfig,
	IEmbeddedThemeData,
	IResolvedThemeResult,
	IThemeMetadata,
} from '../types/theme-resolver';
import type { ThemeConfig } from '../core/theme-registry';

/**
 * EmbeddedThemeResolver - Loads themes from embedded CSS
 * Supports CSS modules imported with ?raw suffix
 */
export class EmbeddedThemeResolver {
	private config: IThemeResolverConfig;
	private embeddedThemes: Record<string, IEmbeddedThemeData>;

	constructor(config: IThemeResolverConfig) {
		this.config = config;
		this.embeddedThemes = config.embeddedThemes || {};
	}

	/**
	 * Initialize embedded resolver
	 */
	async init(): Promise<void> {
		console.log(
			`✅ [EmbeddedThemeResolver] ${Object.keys(this.embeddedThemes).length} themes loaded`,
		);
	}

	/**
	 * Resolve CSS content from embedded themes
	 * @param themeId - Theme identifier
	 * @param mode - Light or dark mode
	 * @returns Resolved theme result
	 */
	async resolveCSS(
		themeId: string,
		mode: 'light' | 'dark',
	): Promise<IResolvedThemeResult> {
		const theme = this.embeddedThemes[themeId];

		if (!theme) {
			return { source: 'embedded', css: null };
		}

		const css = theme[mode];

		if (!css) {
			return { source: 'embedded', css: null };
		}

		const metadata = theme.metadata || this.parseCSSMetadata(css);

		return {
			source: 'embedded',
			css,
			metadata,
		};
	}

	/**
	 * Get all embedded themes as ThemeConfig[]
	 */
	async getThemes(): Promise<ThemeConfig[]> {
		return Object.entries(this.embeddedThemes).map(([id, data]) => ({
			id,
			name: id,
			label: this.formatLabel(id),
			description: data.metadata?.description || 'Embedded theme',
			author: data.metadata?.author || 'System',
			version: data.metadata?.version || '1.0.0',
			source: 'local' as const,
			category: 'built-in' as const,
			modes: {
				light: `embedded://${id}-light`,
				dark: `embedded://${id}-dark`,
			},
			fonts: {
				sans: 'system-ui, sans-serif',
				serif: 'Georgia, serif',
				mono: 'monospace',
			},
			preview: this.extractPreviewColors(data.light),
			config: {
				radius: '0.5rem',
			},
		}));
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
	 * Extract preview colors from CSS
	 * @param css - CSS content
	 * @returns Preview colors
	 */
	private extractPreviewColors(
		css: string,
	): { primary: string; background: string; accent: string } {
		// Extract --primary, --background, --accent from CSS
		const primaryMatch = css.match(/--primary:\s*([^;]+)/);
		const bgMatch = css.match(/--background:\s*([^;]+)/);
		const accentMatch = css.match(/--accent:\s*([^;]+)/);

		return {
			primary: primaryMatch?.[1]?.trim() || '#000',
			background: bgMatch?.[1]?.trim() || '#fff',
			accent: accentMatch?.[1]?.trim() || '#f0f0f0',
		};
	}

	/**
	 * Format theme ID as label
	 * @param id - Theme identifier
	 * @returns Formatted label
	 */
	private formatLabel(id: string): string {
		return id
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}
}
