import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ICSSParseResult } from './css-parser.ts';
import { confirmChanges, type IFileChange } from './diff-preview.ts';

interface IThemeEntry {
  id: string;
  name: string;
  label: string;
  description: string;
  author: string;
  version: string;
  source: string;
  category: string;
  default?: boolean;
  modes: { light: string; dark: string };
  fonts: { sans: string; serif: string; mono: string };
  preview: { primary: string; background: string; accent: string };
  config: { radius: string };
}

interface IRegistry {
  version: string;
  lastUpdated: string;
  themes: IThemeEntry[];
}

const CORE_THEMES: IThemeEntry[] = [
  {
    id: 'synthwave84',
    name: 'synthwave84',
    label: 'Synthwave84',
    description: 'Retro-futuristic neon theme with vibrant pink and purple accents',
    author: 'System',
    version: '1.0.0',
    source: 'local',
    category: 'built-in',
    modes: {
      light: '/themes/synthwave84-light.css',
      dark: '/themes/synthwave84-dark.css',
    },
    fonts: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: '"Fira Code", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    preview: {
      primary: 'oklch(0.5220 0.1732 16.5777)',
      background: 'oklch(0.9640 0.0085 304.2185)',
      accent: 'oklch(0.9253 0.0228 6.0819)',
    },
    config: { radius: '0.5rem' },
  },
  {
    id: 'graphite',
    name: 'graphite',
    label: 'Graphite',
    description: 'Elegant grayscale theme with subtle shadows',
    author: 'System',
    version: '1.0.0',
    source: 'local',
    category: 'built-in',
    modes: {
      light: '/themes/graphite-light.css',
      dark: '/themes/graphite-dark.css',
    },
    fonts: {
      sans: 'Montserrat, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Fira Code, monospace',
    },
    preview: {
      primary: 'oklch(0.4891 0 0)',
      background: 'oklch(0.9551 0 0)',
      accent: 'oklch(0.8078 0 0)',
    },
    config: { radius: '0.35rem' },
  },
  {
    id: 'darkmatteviolet',
    name: 'darkmatteviolet',
    label: 'Dark Matte Violet',
    description: 'Purple-accented theme with monospace aesthetics',
    author: 'System',
    version: '1.0.0',
    source: 'local',
    category: 'built-in',
    modes: {
      light: '/themes/darkmatteviolet-light.css',
      dark: '/themes/darkmatteviolet-dark.css',
    },
    fonts: {
      sans: 'Geist Mono, ui-monospace, monospace',
      serif: 'serif',
      mono: 'JetBrains Mono, monospace',
    },
    preview: {
      primary: 'oklch(0.5452 0.2088 308.6980)',
      background: 'oklch(1.0000 0 0)',
      accent: 'oklch(0.9491 0 0)',
    },
    config: { radius: '0.75rem' },
  },
];

/**
 * Builds and writes public/registry.json with default theme + 3 core themes (4 total).
 * Shows a diff preview and asks for confirmation before writing.
 * The default theme always comes first and is marked as the default.
 * When the project has CSS variables, preview colors come from those.
 * Otherwise, standard shadcn/neutral preview colors are used.
 * @param cwd - Project root directory.
 * @param cssResult - Parsed CSS variables from the project.
 * @returns Number of themes in the registry, or `'declined'` if user declines.
 */
export async function buildRegistry(
  cwd: string,
  cssResult: ICSSParseResult,
): Promise<number | 'declined'> {
  const description = cssResult.hasVariables
    ? 'Original project theme extracted from CSS variables'
    : 'Standard shadcn/neutral theme';

  const themes: IThemeEntry[] = [
    {
      id: 'default',
      name: 'default',
      label: 'Default',
      description,
      author: 'Project',
      version: '1.0.0',
      source: 'local',
      category: 'built-in',
      default: true,
      modes: {
        light: '/themes/default-light.css',
        dark: '/themes/default-dark.css',
      },
      fonts: {
        sans: 'system-ui, sans-serif',
        serif: 'Georgia, serif',
        mono: 'monospace',
      },
      preview: {
        primary: cssResult.lightVars.get('--primary') ?? 'oklch(0.205 0 0)',
        background: cssResult.lightVars.get('--background') ?? 'oklch(1 0 0)',
        accent: cssResult.lightVars.get('--accent') ?? 'oklch(0.965 0 0)',
      },
      config: { radius: cssResult.lightVars.get('--radius') ?? '0.625rem' },
    },
    ...CORE_THEMES,
  ];

  const registry: IRegistry = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    themes,
  };

  const registryPath = join(cwd, 'public', 'registry.json');
  const newContent = JSON.stringify(registry, null, 2) + '\n';

  let oldContent: string | null = null;
  try {
    oldContent = await readFile(registryPath, 'utf-8');
  } catch {
    // File doesn't exist yet
  }

  const changes: IFileChange[] = [
    { filePath: registryPath, oldContent, newContent },
  ];

  const confirmed = await confirmChanges(changes);
  if (!confirmed) return 'declined';

  await writeFile(registryPath, newContent, 'utf-8');
  return themes.length;
}
