import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { ProjectInfo } from './prerequisites.js';

export interface InstallOptions {
  cwd: string;
  themeDir?: string;
  noExamples?: boolean;
  verbose?: boolean;
}

export async function installThemeManager(
  projectInfo: ProjectInfo, 
  options: InstallOptions
): Promise<void> {
  const { cwd, themeDir = 'public/src/themes', verbose } = options;

  console.log(chalk.bold('\n📦 Installing Theme Manager...\n'));

  // 1. Install the package
  await installPackage(projectInfo.packageManager || 'npm', cwd, verbose);

  // 2. Create directories
  await createDirectories(cwd, themeDir, verbose);

  // 3. Generate theme files
  await generateThemeFiles(cwd, themeDir, verbose);

  // 4. Generate registry
  await generateRegistry(cwd, themeDir, verbose);

  // 5. Update global.css
  await updateGlobalCSS(cwd, verbose);

  console.log(chalk.green.bold('\n✅ Theme manager setup complete!\n'));
  displayNextSteps(projectInfo.packageManager || 'npm');
}

async function installPackage(
  packageManager: string, 
  cwd: string, 
  verbose: boolean
): Promise<void> {
  console.log(chalk.blue('📦 Installing @mks2508/shadcn-basecoat-theme-manager@0.1.0...'));

  const commands = {
    npm: ['install', '@mks2508/shadcn-basecoat-theme-manager@0.1.0'],
    pnpm: ['add', '@mks2508/shadcn-basecoat-theme-manager@0.1.0'],
    yarn: ['add', '@mks2508/shadcn-basecoat-theme-manager@0.1.0'],
    bun: ['add', '@mks2508/shadcn-basecoat-theme-manager@0.1.0']
  };

  const args = commands[packageManager as keyof typeof commands] || commands.npm;

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
  console.log(chalk.blue('🎨 Generating default theme files...'));

  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const templateDir = path.join(currentDir, '../templates');

  // Generate light theme
  const lightThemeTemplate = await fs.readFile(
    path.join(templateDir, 'default-light.css.template'), 
    'utf8'
  );
  const lightThemePath = path.join(cwd, themeDir, 'default-light.css');
  await fs.writeFile(lightThemePath, lightThemeTemplate);

  // Generate dark theme
  const darkThemeTemplate = await fs.readFile(
    path.join(templateDir, 'default-dark.css.template'), 
    'utf8'
  );
  const darkThemePath = path.join(cwd, themeDir, 'default-dark.css');
  await fs.writeFile(darkThemePath, darkThemeTemplate);

  if (verbose) {
    console.log(`  Generated: ${themeDir}/default-light.css`);
    console.log(`  Generated: ${themeDir}/default-dark.css`);
  }

  console.log(chalk.green('✅ Theme files generated'));
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