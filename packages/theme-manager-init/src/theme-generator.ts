import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import type { ICSSParseResult } from './css-parser.ts';
import { confirmChanges, type IFileChange } from './diff-preview.ts';

/** Standard shadcn/neutral light variables used when the project has no :root block. */
const FALLBACK_LIGHT_VARS: Record<string, string> = {
  '--background': 'oklch(1 0 0)',
  '--foreground': 'oklch(0.145 0 0)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.145 0 0)',
  '--popover': 'oklch(1 0 0)',
  '--popover-foreground': 'oklch(0.145 0 0)',
  '--primary': 'oklch(0.205 0 0)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--secondary': 'oklch(0.965 0 0)',
  '--secondary-foreground': 'oklch(0.205 0 0)',
  '--muted': 'oklch(0.965 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--accent': 'oklch(0.965 0 0)',
  '--accent-foreground': 'oklch(0.205 0 0)',
  '--destructive': 'oklch(0.577 0.245 27.325)',
  '--destructive-foreground': 'oklch(0.985 0 0)',
  '--border': 'oklch(0.922 0 0)',
  '--input': 'oklch(0.922 0 0)',
  '--ring': 'oklch(0.708 0 0)',
  '--chart-1': 'oklch(0.646 0.222 41.116)',
  '--chart-2': 'oklch(0.6 0.118 184.704)',
  '--chart-3': 'oklch(0.398 0.07 227.392)',
  '--chart-4': 'oklch(0.828 0.189 84.429)',
  '--chart-5': 'oklch(0.769 0.188 70.08)',
  '--sidebar': 'oklch(0.985 0 0)',
  '--sidebar-foreground': 'oklch(0.145 0 0)',
  '--sidebar-primary': 'oklch(0.205 0 0)',
  '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
  '--sidebar-accent': 'oklch(0.965 0 0)',
  '--sidebar-accent-foreground': 'oklch(0.205 0 0)',
  '--sidebar-border': 'oklch(0.922 0 0)',
  '--sidebar-ring': 'oklch(0.708 0 0)',
  '--radius': '0.625rem',
};

/** Standard shadcn/neutral dark variables used when the project has no .dark block. */
const FALLBACK_DARK_VARS: Record<string, string> = {
  '--background': 'oklch(0.145 0 0)',
  '--foreground': 'oklch(0.985 0 0)',
  '--card': 'oklch(0.145 0 0)',
  '--card-foreground': 'oklch(0.985 0 0)',
  '--popover': 'oklch(0.145 0 0)',
  '--popover-foreground': 'oklch(0.985 0 0)',
  '--primary': 'oklch(0.985 0 0)',
  '--primary-foreground': 'oklch(0.205 0 0)',
  '--secondary': 'oklch(0.269 0 0)',
  '--secondary-foreground': 'oklch(0.985 0 0)',
  '--muted': 'oklch(0.269 0 0)',
  '--muted-foreground': 'oklch(0.708 0 0)',
  '--accent': 'oklch(0.269 0 0)',
  '--accent-foreground': 'oklch(0.985 0 0)',
  '--destructive': 'oklch(0.396 0.141 25.723)',
  '--destructive-foreground': 'oklch(0.985 0 0)',
  '--border': 'oklch(0.269 0 0)',
  '--input': 'oklch(0.269 0 0)',
  '--ring': 'oklch(0.556 0 0)',
  '--chart-1': 'oklch(0.488 0.243 264.376)',
  '--chart-2': 'oklch(0.696 0.17 162.48)',
  '--chart-3': 'oklch(0.769 0.188 70.08)',
  '--chart-4': 'oklch(0.627 0.265 303.9)',
  '--chart-5': 'oklch(0.645 0.246 16.439)',
  '--sidebar': 'oklch(0.145 0 0)',
  '--sidebar-foreground': 'oklch(0.985 0 0)',
  '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
  '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
  '--sidebar-accent': 'oklch(0.269 0 0)',
  '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
  '--sidebar-border': 'oklch(0.269 0 0)',
  '--sidebar-ring': 'oklch(0.556 0 0)',
  '--radius': '0.625rem',
};

const THEME_FILES = [
  'synthwave84-light.css',
  'synthwave84-dark.css',
  'graphite-light.css',
  'graphite-dark.css',
  'darkmatteviolet-light.css',
  'darkmatteviolet-dark.css',
];

/**
 * Copies 6 core theme CSS files + generates 2 default theme files (8 total) to public/themes/.
 * Shows a diff preview and asks for confirmation before writing.
 * When the project has :root/.dark variables, the default theme uses those.
 * Otherwise, standard shadcn/neutral fallback values are used.
 * Dark CSS files are rewritten from .dark {} to :root {} because ThemeManager's
 * extractCSSVariables() only parses :root blocks.
 * @param cwd - Project root directory.
 * @param cssResult - Parsed CSS variables from the project.
 * @returns List of generated file names, or `'declined'` if user declines.
 */
export async function generateThemeFiles(
  cwd: string,
  cssResult: ICSSParseResult,
): Promise<string[] | 'declined'> {
  const themesDir = join(cwd, 'public', 'themes');

  const coreThemesDir = resolveCoreThemesDir();
  const changes: IFileChange[] = [];

  for (const file of THEME_FILES) {
    let content = await readFile(join(coreThemesDir, file), 'utf-8');
    if (file.includes('-dark')) {
      content = rewriteDarkToRoot(content);
    }

    const targetPath = join(themesDir, file);
    const oldContent = await readFileSafe(targetPath);
    changes.push({ filePath: targetPath, oldContent, newContent: content });
  }

  const lightVars = cssResult.hasVariables
    ? cssResult.lightVars
    : new Map(Object.entries(FALLBACK_LIGHT_VARS));
  const darkVars = cssResult.hasVariables
    ? cssResult.darkVars
    : new Map(Object.entries(FALLBACK_DARK_VARS));

  const defaultLightPath = join(themesDir, 'default-light.css');
  const defaultDarkPath = join(themesDir, 'default-dark.css');
  const defaultLightContent = buildCSSBlock(lightVars);
  const defaultDarkContent = buildCSSBlock(darkVars);

  changes.push({
    filePath: defaultLightPath,
    oldContent: await readFileSafe(defaultLightPath),
    newContent: defaultLightContent,
  });
  changes.push({
    filePath: defaultDarkPath,
    oldContent: await readFileSafe(defaultDarkPath),
    newContent: defaultDarkContent,
  });

  const confirmed = await confirmChanges(changes);
  if (!confirmed) return 'declined';

  await mkdir(themesDir, { recursive: true });
  for (const change of changes) {
    await writeFile(change.filePath, change.newContent, 'utf-8');
  }

  return changes.map((c) => c.filePath.split('/').pop()!);
}

/**
 * Safely reads a file, returning `null` if it doesn't exist.
 * @param filePath - Absolute path to the file.
 * @returns File content or `null`.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Resolves the directory containing core theme CSS files.
 * Resolves the main entry to find the package root, then checks
 * dist/themes/ first (published npm), falls back to src/themes/ (workspace link).
 */
function resolveCoreThemesDir(): string {
  const esmRequire = createRequire(import.meta.url);
  const mainEntry = esmRequire.resolve('@mks2508/shadcn-basecoat-theme-manager');
  let coreRoot = dirname(mainEntry);
  if (coreRoot.endsWith('/dist') || coreRoot.endsWith('\\dist')) {
    coreRoot = dirname(coreRoot);
  }

  const distThemes = join(coreRoot, 'dist', 'themes');
  const srcThemes = join(coreRoot, 'src', 'themes');

  try {
    const files = readdirSync(distThemes);
    if (files.some((f) => f.endsWith('.css'))) return distThemes;
  } catch {
    // dist/themes doesn't exist, fall through to src/themes
  }

  return srcThemes;
}

/**
 * Rewrites .dark { ... } selector to :root { ... } so ThemeManager can parse it.
 * @param css - CSS content with .dark selector.
 * @returns CSS content with :root selector.
 */
function rewriteDarkToRoot(css: string): string {
  return css.replace(/\.dark\s*\{/, ':root {');
}

/**
 * Builds a :root { } CSS block from a variable map.
 * @param vars - Map of CSS variable names to values.
 * @returns Complete CSS block string.
 */
function buildCSSBlock(vars: Map<string, string>): string {
  if (vars.size === 0) return ':root {\n}\n';

  const lines = Array.from(vars.entries())
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `:root {\n${lines}\n}\n`;
}
