import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import chalk from 'chalk';

export interface PrerequisiteCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  required: boolean;
}

export interface ProjectInfo {
  isAstroProject: boolean;
  isReactProject: boolean;
  hasPackageJson: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | null;
  astroConfigFile: string | null;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export async function detectProject(cwd: string = process.cwd()): Promise<ProjectInfo> {
  const packageJsonPath = path.join(cwd, 'package.json');
  const astroConfigs = [
    'astro.config.mjs',
    'astro.config.js', 
    'astro.config.ts'
  ];

  let packageJson: any = {};
  let hasPackageJson = false;

  // Check for package.json
  try {
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
      hasPackageJson = true;
    }
  } catch (error) {
    // Invalid package.json
  }

  // Detect Astro config file
  let astroConfigFile: string | null = null;
  for (const configFile of astroConfigs) {
    const configPath = path.join(cwd, configFile);
    if (await fs.pathExists(configPath)) {
      astroConfigFile = configFile;
      break;
    }
  }

  // Detect package manager
  const packageManager = await detectPackageManager(cwd);

  // Check for frameworks in dependencies
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const allDeps = { ...dependencies, ...devDependencies };
  
  const isAstroProject = astroConfigFile !== null || 'astro' in allDeps;
  const isReactProject = 'react' in allDeps || 'react-dom' in allDeps;

  return {
    isAstroProject,
    isReactProject,
    hasPackageJson,
    packageManager,
    astroConfigFile,
    dependencies,
    devDependencies
  };
}

async function detectPackageManager(cwd: string): Promise<'npm' | 'pnpm' | 'yarn' | 'bun' | null> {
  const lockFiles = [
    { file: 'pnpm-lock.yaml', pm: 'pnpm' as const },
    { file: 'yarn.lock', pm: 'yarn' as const },
    { file: 'bun.lockb', pm: 'bun' as const },
    { file: 'package-lock.json', pm: 'npm' as const }
  ];

  for (const { file, pm } of lockFiles) {
    if (await fs.pathExists(path.join(cwd, file))) {
      return pm;
    }
  }

  return null;
}

export async function checkPrerequisites(cwd: string = process.cwd(), framework?: 'astro' | 'react'): Promise<PrerequisiteCheck[]> {
  const checks: PrerequisiteCheck[] = [];
  const projectInfo = await detectProject(cwd);

  // 1. Check for framework based on argument
  if (framework === 'astro') {
    checks.push({
      name: 'Astro Project',
      status: projectInfo.isAstroProject ? 'pass' : 'fail',
      message: projectInfo.isAstroProject 
        ? `Found Astro project (${projectInfo.astroConfigFile || 'via package.json'})`
        : 'No Astro project detected. Make sure astro.config.{js,mjs,ts} exists.',
      required: true
    });
  } else if (framework === 'react') {
    checks.push({
      name: 'React Project',
      status: projectInfo.isReactProject ? 'pass' : 'fail',
      message: projectInfo.isReactProject 
        ? 'Found React project (react/react-dom in dependencies)'
        : 'No React project detected. Make sure react and react-dom are installed.',
      required: true
    });
  } else {
    // Auto-detect framework
    const hasFramework = projectInfo.isAstroProject || projectInfo.isReactProject;
    checks.push({
      name: 'Framework Detection',
      status: hasFramework ? 'pass' : 'fail',
      message: hasFramework 
        ? `Found ${projectInfo.isAstroProject ? 'Astro' : 'React'} project`
        : 'No supported framework detected. Make sure you have Astro or React installed.',
      required: true
    });
  }

  // 2. Check for package.json
  checks.push({
    name: 'Package.json',
    status: projectInfo.hasPackageJson ? 'pass' : 'fail',
    message: projectInfo.hasPackageJson 
      ? 'Found package.json'
      : 'No package.json found.',
    required: true
  });

  // 3. Check package manager
  checks.push({
    name: 'Package Manager',
    status: projectInfo.packageManager ? 'pass' : 'warning',
    message: projectInfo.packageManager 
      ? `Detected: ${projectInfo.packageManager}`
      : 'No lock file detected. Will default to npm.',
    required: false
  });

  if (projectInfo.hasPackageJson) {
    const allDeps = { ...projectInfo.dependencies, ...projectInfo.devDependencies };

    // 4. Check for Tailwind CSS v4
    const tailwindVersion = allDeps['tailwindcss'];
    if (tailwindVersion) {
      // Check if version starts with 4, contains beta, or satisfies 4.x range
      const isV4 = tailwindVersion.startsWith('^4.') || 
                   tailwindVersion.startsWith('4.') ||
                   tailwindVersion.includes('beta') ||
                   tailwindVersion.includes('4.0.0');
      checks.push({
        name: 'Tailwind CSS v4',
        status: isV4 ? 'pass' : 'fail',
        message: isV4 
          ? `Found Tailwind CSS v4: ${tailwindVersion}`
          : `Found Tailwind CSS ${tailwindVersion}, but v4 is required. Install with: npm install tailwindcss@beta`,
        required: true
      });
    } else {
      checks.push({
        name: 'Tailwind CSS v4',
        status: 'fail',
        message: 'Tailwind CSS v4 not found. Install with: npm install tailwindcss@beta',
        required: true
      });
    }

    // 5. Check for UI framework (Basecoat CSS for Astro, shadcn/ui for React)
    if (framework === 'astro') {
      const basecoatVersion = allDeps['basecoat-css'];
      checks.push({
        name: 'Basecoat CSS',
        status: basecoatVersion ? 'pass' : 'fail',
        message: basecoatVersion 
          ? `Found Basecoat CSS: ${basecoatVersion}`
          : 'Basecoat CSS not found. Install with: npm install basecoat-css',
        required: true
      });
    } else if (framework === 'react') {
      // Check for shadcn/ui: both components.json config file and dependencies
      const componentsJsonPath = path.join(cwd, 'components.json');
      const hasComponentsJson = await fs.pathExists(componentsJsonPath);
      
      const hasRadixUI = Object.keys(allDeps).some(dep => dep.startsWith('@radix-ui/'));
      const hasClassVarianceAuthority = allDeps['class-variance-authority'];
      const hasTailwindMerge = allDeps['tailwind-merge'];
      const hasClsx = allDeps['clsx'];
      
      const shadcnComponents = [hasRadixUI, hasClassVarianceAuthority, hasTailwindMerge, hasClsx].filter(Boolean);
      const hasShadcnDeps = shadcnComponents.length >= 3; // At least 3 of the typical shadcn packages
      const hasShadcn = hasComponentsJson || hasShadcnDeps;
      
      checks.push({
        name: 'shadcn/ui Components',
        status: hasShadcn ? 'pass' : 'warning',
        message: hasShadcn 
          ? `Found shadcn/ui: ${hasComponentsJson ? 'components.json' : ''}${hasComponentsJson && hasShadcnDeps ? ' + ' : ''}${hasShadcnDeps ? `${shadcnComponents.length}/4 typical packages` : ''}`
          : 'shadcn/ui components not detected. Make sure you have components.json or shadcn dependencies installed.',
        required: false // Made optional since user might be using other component libraries
      });
    }

    // 6. Check for Tailwind integration (v4 uses @tailwindcss/vite, v3 uses @astrojs/tailwind)
    const astroTailwind = allDeps['@astrojs/tailwind'];
    const tailwindVite = allDeps['@tailwindcss/vite'];
    const isV4 = tailwindVersion && (tailwindVersion.startsWith('^4.') || tailwindVersion.startsWith('4.'));
    
    if (isV4) {
      // For Tailwind v4, check for @tailwindcss/vite
      checks.push({
        name: 'Tailwind Integration',
        status: tailwindVite ? 'pass' : 'warning',
        message: tailwindVite 
          ? `Found @tailwindcss/vite: ${tailwindVite} (correct for Tailwind v4)`
          : 'Optional: @tailwindcss/vite not found. Consider installing for better Tailwind v4 integration.',
        required: false
      });
    } else {
      // For Tailwind v3, check for @astrojs/tailwind
      checks.push({
        name: '@astrojs/tailwind',
        status: astroTailwind ? 'pass' : 'warning',
        message: astroTailwind 
          ? `Found @astrojs/tailwind: ${astroTailwind}`
          : 'Optional: @astrojs/tailwind not found. Consider installing for better integration.',
        required: false
      });
    }
  }

  return checks;
}

export function displayPrerequisiteResults(checks: PrerequisiteCheck[]): void {
  console.log(chalk.bold('\n🔍 Prerequisites Check\n'));

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    const color = check.status === 'pass' ? 'green' : check.status === 'warning' ? 'yellow' : 'red';
    
    console.log(`${icon} ${chalk[color](check.name)}: ${check.message}`);
  }

  const failedRequired = checks.filter(c => c.status === 'fail' && c.required);
  const warnings = checks.filter(c => c.status === 'warning');

  if (failedRequired.length > 0) {
    console.log(chalk.red.bold('\n❌ Installation cannot continue. Please fix the required issues above.'));
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️ Some optional requirements are missing but installation can continue.'));
  } else {
    console.log(chalk.green.bold('\n✅ All prerequisites met!'));
  }
}

export async function checkProjectReadiness(cwd: string = process.cwd(), verbose: boolean = false, framework?: 'astro' | 'react' | 'vanilla'): Promise<{ 
  ready: boolean; 
  checks: PrerequisiteCheck[];
  projectInfo: ProjectInfo;
}> {
  const checks = await checkPrerequisites(cwd, framework);
  const projectInfo = await detectProject(cwd);
  
  if (verbose) {
    displayPrerequisiteResults(checks);
  }

  const failedRequired = checks.filter(c => c.status === 'fail' && c.required);
  const ready = failedRequired.length === 0;

  return { ready, checks, projectInfo };
}