import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import type { ProjectInfo } from './prerequisites.js';

export interface InstallOptions {
  cwd: string;
  themeDir?: string;
  noExamples?: boolean;
  verbose?: boolean;
  framework?: 'astro' | 'react' | 'vanilla';
}

export async function installThemeManager(
  projectInfo: ProjectInfo, 
  options: InstallOptions
): Promise<void> {
  const { cwd, themeDir = 'public/src/themes', verbose, framework } = options;

  console.log(chalk.bold('\n📦 Installing Theme Manager...\n'));

  // 1. Install the package
  await installPackage(projectInfo.packageManager || 'npm', cwd, verbose ?? false, framework);

  // 2. Create directories
  await createDirectories(cwd, themeDir, verbose ?? false);

  // 3. Generate theme files
  await generateThemeFiles(cwd, themeDir, verbose ?? false);

  // 4. Generate registry
  await generateRegistry(cwd, themeDir, verbose ?? false);

  // 5. Update global.css
  await updateGlobalCSS(cwd, verbose ?? false);

  console.log(chalk.green.bold('\n✅ Theme manager setup complete!\n'));
  displayNextSteps(projectInfo.packageManager || 'npm');
}

async function installPackage(
  packageManager: string, 
  cwd: string, 
  verbose: boolean,
  framework?: 'astro' | 'react' | 'vanilla'
): Promise<void> {
  
  // Determine packages to install based on framework
  const packagesToInstall = {
    astro: [
      '@mks2508/shadcn-basecoat-theme-manager',
      '@mks2508/theme-manager-astro'
    ],
    react: [
      '@mks2508/shadcn-basecoat-theme-manager',
      '@mks2508/theme-manager-react'
    ],
    vanilla: [
      '@mks2508/shadcn-basecoat-theme-manager',
      '@mks2508/theme-manager-vanilla'
    ]
  };

  const packages = packagesToInstall[framework || 'astro'] || packagesToInstall.astro;
  
  console.log(chalk.blue(`📦 Installing packages for ${framework}: ${packages.join(', ')}...`));

  const baseCommands = {
    npm: ['install'],
    pnpm: ['add', '-w'], // Add -w flag for workspace root installation
    yarn: ['add'],
    bun: ['add']
  };

  const baseArgs = baseCommands[packageManager as keyof typeof baseCommands] || baseCommands.npm;
  const args = [...baseArgs, ...packages];

  return new Promise((resolve, reject) => {
    const proc = spawn(packageManager, args, { 
      cwd, 
      stdio: verbose ? 'inherit' : 'pipe' 
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Package installed successfully'));
        resolve();
      } else {
        reject(new Error(`Package installation failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function createDirectories(
  cwd: string, 
  themeDir: string, 
  verbose: boolean
): Promise<void> {
  console.log(chalk.blue('📁 Creating theme directories...'));

  const directories = [
    'public/themes',
    themeDir,
    'src/components'
  ];

  for (const dir of directories) {
    const fullPath = path.join(cwd, dir);
    await fs.ensureDir(fullPath);
    if (verbose) {
      console.log(`  Created: ${dir}`);
    }
  }

  console.log(chalk.green('✅ Directories created'));
}

async function generateThemeFiles(
  cwd: string, 
  themeDir: string, 
  verbose: boolean
): Promise<void> {
  console.log(chalk.blue('🎨 Generating builtin theme files...'));

  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templateDir = path.join(currentDir, '../templates');

  // All theme files to copy
  const themeFiles = [
    'default-light.css',
    'default-dark.css',
    'supabase-light.css',
    'supabase-dark.css',
    'tangerine-light.css',
    'tangerine-dark.css',
    'base.css'
  ];

  for (const fileName of themeFiles) {
    const templatePath = path.join(templateDir, `${fileName}.template`);
    const themeTemplate = await fs.readFile(templatePath, 'utf8');
    const themePath = path.join(cwd, themeDir, fileName);
    await fs.writeFile(themePath, themeTemplate);

    if (verbose) {
      console.log(`  Generated: ${themeDir}/${fileName}`);
    }
  }

  console.log(chalk.green(`✅ Generated ${themeFiles.length} theme files`));
}

async function generateRegistry(
  cwd: string, 
  themeDir: string, 
  verbose: boolean
): Promise<void> {
  console.log(chalk.blue('📋 Creating themes registry...'));

  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templateDir = path.join(currentDir, '../templates');
  const registryTemplate = await fs.readFile(
    path.join(templateDir, 'registry.json.template'), 
    'utf8'
  );

  // Update paths in registry to match themeDir
  const registry = JSON.parse(registryTemplate);
  registry.themes[0].modes.light = `/${themeDir}/default-light.css`;
  registry.themes[0].modes.dark = `/${themeDir}/default-dark.css`;

  const registryPath = path.join(cwd, 'public/themes/registry.json');
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

  if (verbose) {
    console.log('  Generated: public/themes/registry.json');
  }

  console.log(chalk.green('✅ Registry created'));
}

async function updateGlobalCSS(cwd: string, verbose: boolean): Promise<void> {
  console.log(chalk.blue('⚙️ Updating global.css...'));

  const globalCSSPath = path.join(cwd, 'src/styles/global.css');
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templateDir = path.join(currentDir, '../templates');
  
  const additionsTemplate = await fs.readFile(
    path.join(templateDir, 'global-css-additions.template'), 
    'utf8'
  );

  let existingContent = '';
  
  // Check if global.css exists
  if (await fs.pathExists(globalCSSPath)) {
    existingContent = await fs.readFile(globalCSSPath, 'utf8');
    
    // Check if already has our additions
    if (existingContent.includes('@mks2508/theme-manager-cli')) {
      if (verbose) {
        console.log('  global.css already has theme manager additions');
      }
      console.log(chalk.green('✅ Global CSS up to date'));
      return;
    }
  } else {
    // Ensure directory exists
    await fs.ensureDir(path.dirname(globalCSSPath));
  }

  // Add our imports at the beginning
  const newContent = additionsTemplate + '\n\n' + existingContent;
  await fs.writeFile(globalCSSPath, newContent);

  if (verbose) {
    console.log('  Updated: src/styles/global.css');
  }

  console.log(chalk.green('✅ Global CSS updated'));
}

function displayNextSteps(packageManager: string): void {
  console.log(chalk.bold('📚 Next steps:'));
  console.log(`1. Start your dev server: ${chalk.cyan(packageManager + ' run dev')}`);
  console.log('2. Your themes are available in the UI');
  console.log('3. Add theme selector components as needed');
  console.log('');
  console.log(chalk.gray('📖 Documentation: https://docs.your-domain.com/theme-manager'));
}