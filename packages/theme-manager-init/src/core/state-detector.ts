import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export type InstallationState = 'fresh' | 'partial' | 'complete' | 'conflicted' | 'broken';

export interface InstallationStatus {
  state: InstallationState;
  existingFiles: string[];
  missingFiles: string[];
  modifiedFiles: string[];
  details: string;
}

export interface ExpectedFile {
  path: string;
  required: boolean;
  checkContent?: (content: string) => boolean;
  description: string;
}

const EXPECTED_FILES: ExpectedFile[] = [
  {
    path: 'public/themes/registry.json',
    required: true,
    checkContent: (content) => {
      try {
        const json = JSON.parse(content);
        return json.version && json.themes && Array.isArray(json.themes);
      } catch {
        return false;
      }
    },
    description: 'Theme registry configuration'
  },
  {
    path: 'public/src/themes/default-light.css',
    required: true,
    checkContent: (content) => content.includes('--background:') && content.includes('--foreground:'),
    description: 'Default light theme'
  },
  {
    path: 'public/src/themes/default-dark.css',
    required: true,
    checkContent: (content) => content.includes('--background:') && content.includes('--foreground:'),
    description: 'Default dark theme'
  }
];

const MODIFIED_FILES: ExpectedFile[] = [
  {
    path: 'src/styles/global.css',
    required: false,
    checkContent: (content) => content.includes('@import "tailwindcss"') && content.includes('@theme inline'),
    description: 'Global CSS with theme imports'
  }
];

export async function detectInstallationState(cwd: string = process.cwd()): Promise<InstallationStatus> {
  const results = await Promise.all([
    ...EXPECTED_FILES.map(file => checkFile(cwd, file)),
    ...MODIFIED_FILES.map(file => checkFile(cwd, file))
  ]);

  const allFiles = [...EXPECTED_FILES, ...MODIFIED_FILES];
  const existingFiles: string[] = [];
  const missingFiles: string[] = [];
  const modifiedFiles: string[] = [];
  
  let hasValidContent = 0;
  let hasInvalidContent = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const fileConfig = allFiles[i];

    if (result.exists) {
      existingFiles.push(fileConfig.path);
      
      if (result.hasValidContent) {
        hasValidContent++;
      } else {
        hasInvalidContent++;
        modifiedFiles.push(fileConfig.path);
      }
    } else if (fileConfig.required) {
      missingFiles.push(fileConfig.path);
    }
  }

  // Determine state
  let state: InstallationState;
  let details: string;

  const requiredFiles = EXPECTED_FILES.filter(f => f.required);
  const requiredExisting = existingFiles.filter(path => 
    requiredFiles.some(f => f.path === path)
  );

  if (existingFiles.length === 0) {
    state = 'fresh';
    details = 'No theme manager files detected. Ready for fresh installation.';
  } else if (requiredExisting.length === requiredFiles.length && hasInvalidContent === 0) {
    state = 'complete';
    details = 'Theme manager appears to be fully installed and valid.';
  } else if (hasInvalidContent > 0) {
    state = 'conflicted';
    details = `Found ${hasInvalidContent} files with unexpected content. May have been modified manually.`;
  } else if (missingFiles.length > 0 && existingFiles.length > 0) {
    state = 'partial';
    details = `Partial installation detected. Missing ${missingFiles.length} required files.`;
  } else if (hasValidContent === 0 && existingFiles.length > 0) {
    state = 'broken';
    details = 'Found theme files but none have valid content. Installation may be corrupted.';
  } else {
    state = 'partial';
    details = 'Mixed installation state detected.';
  }

  return {
    state,
    existingFiles,
    missingFiles,
    modifiedFiles,
    details
  };
}

async function checkFile(cwd: string, fileConfig: ExpectedFile): Promise<{
  exists: boolean;
  hasValidContent: boolean;
}> {
  const filePath = path.join(cwd, fileConfig.path);
  
  try {
    const exists = await fs.pathExists(filePath);
    
    if (!exists) {
      return { exists: false, hasValidContent: false };
    }

    if (!fileConfig.checkContent) {
      return { exists: true, hasValidContent: true };
    }

    const content = await fs.readFile(filePath, 'utf8');
    const hasValidContent = fileConfig.checkContent(content);

    return { exists: true, hasValidContent };
  } catch (error) {
    return { exists: false, hasValidContent: false };
  }
}

export function displayInstallationStatus(status: InstallationStatus): void {
  console.log(chalk.bold('\n📊 Installation Status\n'));

  const stateColor = {
    fresh: 'green',
    complete: 'green', 
    partial: 'yellow',
    conflicted: 'red',
    broken: 'red'
  }[status.state] as 'green' | 'yellow' | 'red';

  const stateIcon = {
    fresh: '🆕',
    complete: '✅',
    partial: '🔄',
    conflicted: '⚠️', 
    broken: '❌'
  }[status.state];

  console.log(`${stateIcon} ${chalk.bold[stateColor](status.state.toUpperCase())}: ${status.details}\n`);

  if (status.existingFiles.length > 0) {
    console.log(chalk.bold('📁 Existing files:'));
    status.existingFiles.forEach(file => {
      const isModified = status.modifiedFiles.includes(file);
      const icon = isModified ? '⚠️' : '✅';
      console.log(`  ${icon} ${file}`);
    });
    console.log('');
  }

  if (status.missingFiles.length > 0) {
    console.log(chalk.bold('❓ Missing files:'));
    status.missingFiles.forEach(file => {
      console.log(`  ❌ ${file}`);
    });
    console.log('');
  }

  if (status.modifiedFiles.length > 0) {
    console.log(chalk.bold.yellow('⚠️ Modified files (may need manual review):'));
    status.modifiedFiles.forEach(file => {
      console.log(`  ⚠️ ${file}`);
    });
    console.log('');
  }
}

export async function getInstallationPlan(status: InstallationStatus): Promise<{
  canProceed: boolean;
  requiresForce: boolean;
  actions: string[];
  warnings: string[];
}> {
  const actions: string[] = [];
  const warnings: string[] = [];
  let canProceed = true;
  let requiresForce = false;

  switch (status.state) {
    case 'fresh':
      actions.push('Install @mks2508/shadcn-basecoat-theme-manager package');
      actions.push('Create theme directories and files');
      actions.push('Generate default theme configuration');
      actions.push('Update global.css with theme imports');
      break;

    case 'partial':
      actions.push('Complete missing files installation');
      if (status.missingFiles.length > 0) {
        status.missingFiles.forEach(file => {
          actions.push(`Create missing file: ${file}`);
        });
      }
      break;

    case 'complete':
      warnings.push('Theme manager appears to be already installed');
      warnings.push('Use --force to reinstall or check individual files');
      canProceed = false;
      break;

    case 'conflicted':
      warnings.push('Some files have been modified manually');
      warnings.push('Installation may overwrite your changes');
      requiresForce = true;
      actions.push('Backup existing files');
      actions.push('Update modified files (with --force)');
      status.modifiedFiles.forEach(file => {
        warnings.push(`Will overwrite: ${file}`);
      });
      break;

    case 'broken':
      warnings.push('Existing installation appears corrupted');
      requiresForce = true;
      actions.push('Clean up corrupted files');
      actions.push('Perform fresh installation');
      break;
  }

  return {
    canProceed,
    requiresForce,
    actions,
    warnings
  };
}

export async function canProceedWithInstallation(
  cwd: string = process.cwd(), 
  force: boolean = false
): Promise<{ proceed: boolean; status: InstallationStatus; message: string }> {
  const status = await detectInstallationState(cwd);
  const plan = await getInstallationPlan(status);

  if (status.state === 'complete' && !force) {
    return {
      proceed: false,
      status,
      message: 'Theme manager is already installed. Use --force to reinstall.'
    };
  }

  if (plan.requiresForce && !force) {
    return {
      proceed: false,
      status,
      message: `Installation requires --force flag due to ${status.state} state.`
    };
  }

  return {
    proceed: true,
    status,
    message: `Ready to proceed with ${status.state} installation.`
  };
}