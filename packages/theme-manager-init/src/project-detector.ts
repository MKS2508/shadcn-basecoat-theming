import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/** Detected project information. */
export interface IProjectInfo {
  framework: 'react';
  packageManager: 'bun' | 'pnpm' | 'npm';
  cssFile: string | null;
  installedPackages: Set<string>;
}

const CSS_CANDIDATES = [
  'src/index.css',
  'src/globals.css',
  'src/app.css',
  'src/styles/index.css',
  'src/styles/globals.css',
  'app/globals.css',
];

const REQUIRED_PACKAGES = [
  '@mks2508/shadcn-basecoat-theme-manager',
  '@mks2508/theme-manager-react',
];

const LOCK_FILE_MAP: Record<string, IProjectInfo['packageManager']> = {
  'bun.lock': 'bun',
  'bun.lockb': 'bun',
  'pnpm-lock.yaml': 'pnpm',
  'package-lock.json': 'npm',
};

/**
 * Detects project framework, package manager, CSS file location, and installed packages.
 * @param cwd - Project root directory
 * @returns Detected project metadata
 */
export async function detectProject(cwd: string): Promise<IProjectInfo> {
  const pkgPath = join(cwd, 'package.json');
  const pkgRaw = await readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgRaw) as Record<string, Record<string, string>>;

  const allDeps = { ...pkg['dependencies'], ...pkg['devDependencies'] };
  const installedPackages = new Set(Object.keys(allDeps));

  let packageManager: IProjectInfo['packageManager'] = 'npm';
  for (const [lockFile, pm] of Object.entries(LOCK_FILE_MAP)) {
    if (await fileExists(join(cwd, lockFile))) {
      packageManager = pm;
      break;
    }
  }

  let cssFile: string | null = null;
  for (const candidate of CSS_CANDIDATES) {
    if (await fileExists(join(cwd, candidate))) {
      cssFile = candidate;
      break;
    }
  }

  return { framework: 'react', packageManager, cssFile, installedPackages };
}

/**
 * Installs missing required packages using the detected package manager.
 * @param cwd - Project root directory
 * @param project - Detected project info
 * @returns List of packages that were installed
 */
export function installPackages(cwd: string, project: IProjectInfo): string[] {
  const missing = REQUIRED_PACKAGES.filter((p) => !project.installedPackages.has(p));
  if (missing.length === 0) return [];

  const cmds: Record<IProjectInfo['packageManager'], string> = {
    bun: `bun add ${missing.join(' ')}`,
    pnpm: `pnpm add ${missing.join(' ')}`,
    npm: `npm install ${missing.join(' ')}`,
  };

  execSync(cmds[project.packageManager], { cwd, stdio: 'pipe' });
  return missing;
}

/**
 * Checks if the CSS file has @theme inline with the required --color-background mapping.
 * @param cwd - Project root directory
 * @param cssFile - Relative path to the CSS file
 * @returns Whether the CSS is properly configured
 */
export async function verifyCSSImports(cwd: string, cssFile: string): Promise<boolean> {
  const content = await readFile(join(cwd, cssFile), 'utf-8');
  return content.includes('--color-background: var(--background)');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
