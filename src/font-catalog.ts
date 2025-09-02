/**
 * Font catalog with system fonts and popular Google Fonts
 */

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'system' | 'google-fonts';
  weights?: number[];
  styles?: string[];
  preview?: string;
  fallback: string;
}

export interface FontCatalog {
  system: FontOption[];
  googleFonts: FontOption[];
}

/**
 * Curated catalog of available fonts
 */
export const FONT_CATALOG: FontCatalog = {
  system: [
    {
      id: 'system-ui',
      name: 'System UI',
      family: 'system-ui',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    {
      id: 'apple-system',
      name: 'Apple System',
      family: '-apple-system',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    {
      id: 'segoe-ui',
      name: 'Segoe UI',
      family: '"Segoe UI"',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Tahoma, Geneva, Verdana, sans-serif'
    },
    {
      id: 'roboto-system',
      name: 'Roboto (System)',
      family: 'Roboto',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'georgia',
      name: 'Georgia',
      family: 'Georgia',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'serif'
    },
    {
      id: 'times-new-roman',
      name: 'Times New Roman',
      family: '"Times New Roman"',
      category: 'system',
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Times, serif'
    },
    {
      id: 'monaco',
      name: 'Monaco',
      family: 'Monaco',
      category: 'system',
      preview: 'const code = "example";',
      fallback: 'Consolas, "Liberation Mono", monospace'
    },
    {
      id: 'consolas',
      name: 'Consolas',
      family: 'Consolas',
      category: 'system',
      preview: 'const code = "example";',
      fallback: '"Liberation Mono", "Courier New", monospace'
    }
  ],

  googleFonts: [
    // Sans-serif fonts
    {
      id: 'inter',
      name: 'Inter',
      family: 'Inter',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'system-ui, sans-serif'
    },
    {
      id: 'roboto',
      name: 'Roboto',
      family: 'Roboto',
      category: 'google-fonts',
      weights: [300, 400, 500, 700],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'open-sans',
      name: 'Open Sans',
      family: 'Open Sans',
      category: 'google-fonts',
      weights: [300, 400, 600, 700, 800],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'lato',
      name: 'Lato',
      family: 'Lato',
      category: 'google-fonts',
      weights: [300, 400, 700, 900],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'montserrat',
      name: 'Montserrat',
      family: 'Montserrat',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'poppins',
      name: 'Poppins',
      family: 'Poppins',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },
    {
      id: 'outfit',
      name: 'Outfit',
      family: 'Outfit',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: '"Helvetica Neue", Arial, sans-serif'
    },

    // Serif fonts
    {
      id: 'source-serif-4',
      name: 'Source Serif 4',
      family: 'Source Serif 4',
      category: 'google-fonts',
      weights: [400, 600, 700],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Georgia, serif'
    },
    {
      id: 'merriweather',
      name: 'Merriweather',
      family: 'Merriweather',
      category: 'google-fonts',
      weights: [300, 400, 700, 900],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Georgia, serif'
    },
    {
      id: 'lora',
      name: 'Lora',
      family: 'Lora',
      category: 'google-fonts',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Georgia, serif'
    },
    {
      id: 'playfair-display',
      name: 'Playfair Display',
      family: 'Playfair Display',
      category: 'google-fonts',
      weights: [400, 500, 600, 700, 800, 900],
      styles: ['normal', 'italic'],
      preview: 'The quick brown fox jumps over the lazy dog',
      fallback: 'Georgia, serif'
    },

    // Monospace fonts
    {
      id: 'fira-code',
      name: 'Fira Code',
      family: 'Fira Code',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      preview: 'const code = "example"; // ligatures',
      fallback: 'Monaco, Consolas, monospace'
    },
    {
      id: 'jetbrains-mono',
      name: 'JetBrains Mono',
      family: 'JetBrains Mono',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal', 'italic'],
      preview: 'const code = "example"; // ligatures',
      fallback: 'Monaco, Consolas, monospace'
    },
    {
      id: 'source-code-pro',
      name: 'Source Code Pro',
      family: 'Source Code Pro',
      category: 'google-fonts',
      weights: [300, 400, 500, 600, 700, 900],
      styles: ['normal', 'italic'],
      preview: 'const code = "example";',
      fallback: 'Monaco, Consolas, monospace'
    },
    {
      id: 'inconsolata',
      name: 'Inconsolata',
      family: 'Inconsolata',
      category: 'google-fonts',
      weights: [400, 500, 600, 700, 800, 900],
      styles: ['normal'],
      preview: 'const code = "example";',
      fallback: 'Monaco, Consolas, monospace'
    }
  ]
};

/**
 * Font categories for UI organization
 */
export const FONT_CATEGORIES = {
  sans: {
    label: 'Sans-serif',
    description: 'Modern, clean fonts for headings and UI',
    systemFonts: ['system-ui', 'apple-system', 'segoe-ui', 'roboto-system'],
    googleFonts: ['inter', 'roboto', 'open-sans', 'lato', 'montserrat', 'poppins', 'outfit']
  },
  serif: {
    label: 'Serif',
    description: 'Traditional fonts with serifs, great for reading',
    systemFonts: ['georgia', 'times-new-roman'],
    googleFonts: ['source-serif-4', 'merriweather', 'lora', 'playfair-display']
  },
  mono: {
    label: 'Monospace',
    description: 'Fixed-width fonts for code and technical content',
    systemFonts: ['monaco', 'consolas'],
    googleFonts: ['fira-code', 'jetbrains-mono', 'source-code-pro', 'inconsolata']
  }
};

/**
 * Get all fonts flattened
 */
export function getAllFonts(): FontOption[] {
  return [...FONT_CATALOG.system, ...FONT_CATALOG.googleFonts];
}

/**
 * Get font by ID
 */
export function getFontById(id: string): FontOption | null {
  return getAllFonts().find(font => font.id === id) || null;
}

/**
 * Get fonts by category (sans, serif, mono)
 */
export function getFontsByCategory(category: 'sans' | 'serif' | 'mono'): FontOption[] {
  const categoryConfig = FONT_CATEGORIES[category];
  const allFonts = getAllFonts();
  
  const systemFonts = allFonts.filter(font => 
    categoryConfig.systemFonts.includes(font.id)
  );
  
  const googleFonts = allFonts.filter(font => 
    categoryConfig.googleFonts.includes(font.id)
  );
  
  return [...systemFonts, ...googleFonts];
}

/**
 * Build full font family string with fallbacks
 */
export function buildFontFamily(font: FontOption): string {
  return `${font.family}, ${font.fallback}`;
}

/**
 * Check if font needs to be loaded from Google Fonts
 */
export function needsGoogleFontsLoad(font: FontOption): boolean {
  return font.category === 'google-fonts';
}