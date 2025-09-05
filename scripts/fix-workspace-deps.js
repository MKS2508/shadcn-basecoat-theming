#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Versiones NPM conocidas de nuestros packages
const NPM_VERSIONS = {
  '@mks2508/shadcn-basecoat-theme-manager': '0.1.0',
  '@mks2508/basecoat-astro-components': '1.0.0',
  '@mks2508/theme-manager-cli': '1.0.3'
};

// Colores para consola
const colors = {
  cyan: '\x1b[36m%s\x1b[0m',
  green: '\x1b[32m%s\x1b[0m',
  yellow: '\x1b[33m%s\x1b[0m',
  red: '\x1b[31m%s\x1b[0m',
  blue: '\x1b[34m%s\x1b[0m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(colors[color], message);
}

// Función para encontrar todos los package.json
function findPackageJsonFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findPackageJsonFiles(fullPath, files);
    } else if (item === 'package.json') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Función para detectar dependencies workspace
function detectWorkspaceDeps(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    const workspaceDeps = {};
    
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.entries(pkg[depType]).forEach(([name, version]) => {
          if (version.startsWith('workspace:') || version.startsWith('file:')) {
            if (!workspaceDeps[depType]) workspaceDeps[depType] = {};
            workspaceDeps[depType][name] = version;
          }
        });
      }
    });
    
    return Object.keys(workspaceDeps).length > 0 ? workspaceDeps : null;
  } catch (error) {
    log('red', `Error reading ${packageJsonPath}: ${error.message}`);
    return null;
  }
}

// Función para crear interfaz de readline
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Función para hacer pregunta
function question(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Función para actualizar package.json
function updatePackageJson(packageJsonPath, updates) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    Object.entries(updates).forEach(([depType, deps]) => {
      if (pkg[depType]) {
        Object.entries(deps).forEach(([name, version]) => {
          pkg[depType][name] = version;
        });
      }
    });
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    return true;
  } catch (error) {
    log('red', `Error updating ${packageJsonPath}: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  log('cyan', '\n🔧 Workspace Dependencies Fixer\n');
  
  // 1. Encontrar todos los package.json
  const packageJsonFiles = findPackageJsonFiles(rootDir);
  log('blue', `Found ${packageJsonFiles.length} package.json files\n`);
  
  // 2. Detectar workspace dependencies
  const packagesWithWorkspace = [];
  
  for (const filePath of packageJsonFiles) {
    const workspaceDeps = detectWorkspaceDeps(filePath);
    if (workspaceDeps) {
      const relativePath = path.relative(rootDir, filePath);
      packagesWithWorkspace.push({
        path: filePath,
        relativePath,
        workspaceDeps
      });
    }
  }
  
  if (packagesWithWorkspace.length === 0) {
    log('green', '✅ No workspace dependencies found!');
    return;
  }
  
  log('yellow', `Found ${packagesWithWorkspace.length} packages with workspace dependencies:\n`);
  
  // 3. Mostrar packages con workspace deps
  packagesWithWorkspace.forEach((pkg, index) => {
    console.log(`${index + 1}. ${colors.blue}${pkg.relativePath}${colors.reset}`);
    
    Object.entries(pkg.workspaceDeps).forEach(([depType, deps]) => {
      console.log(`   ${depType}:`);
      Object.entries(deps).forEach(([name, version]) => {
        const npmVersion = NPM_VERSIONS[name] ? `→ ^${NPM_VERSIONS[name]}` : '→ ?';
        console.log(`     ${name}: ${colors.yellow}${version}${colors.reset} ${colors.green}${npmVersion}${colors.reset}`);
      });
    });
    console.log();
  });
  
  // 4. Interfaz interactiva
  const rl = createInterface();
  
  try {
    while (true) {
      const choice = await question(rl, 
        '\nOptions:\n' +
        '1. Fix all packages\n' +
        '2. Fix specific package\n' +
        '3. Add/Update NPM version for package\n' +
        '4. Show current NPM versions\n' +
        '5. Exit\n' +
        'Choose (1-5): '
      );
      
      switch (choice.trim()) {
        case '1':
          await fixAllPackages(packagesWithWorkspace);
          break;
          
        case '2':
          await fixSpecificPackage(packagesWithWorkspace, rl);
          break;
          
        case '3':
          await updateNpmVersion(rl);
          break;
          
        case '4':
          showCurrentVersions();
          break;
          
        case '5':
          log('green', '\nGoodbye! 👋');
          return;
          
        default:
          log('red', 'Invalid option');
      }
    }
  } finally {
    rl.close();
  }
}

async function fixAllPackages(packages) {
  log('cyan', '\n🔄 Fixing all packages...\n');
  
  let fixed = 0;
  
  for (const pkg of packages) {
    const updates = {};
    
    Object.entries(pkg.workspaceDeps).forEach(([depType, deps]) => {
      updates[depType] = {};
      Object.keys(deps).forEach(name => {
        if (NPM_VERSIONS[name]) {
          updates[depType][name] = `^${NPM_VERSIONS[name]}`;
        } else {
          log('yellow', `Warning: No NPM version found for ${name}, skipping...`);
        }
      });
    });
    
    if (Object.values(updates).some(deps => Object.keys(deps).length > 0)) {
      if (updatePackageJson(pkg.path, updates)) {
        log('green', `✅ Fixed ${pkg.relativePath}`);
        fixed++;
      } else {
        log('red', `❌ Failed to fix ${pkg.relativePath}`);
      }
    }
  }
  
  log('cyan', `\n🎉 Fixed ${fixed} packages!`);
}

async function fixSpecificPackage(packages, rl) {
  console.log('\nSelect package to fix:');
  packages.forEach((pkg, index) => {
    console.log(`${index + 1}. ${pkg.relativePath}`);
  });
  
  const choice = await question(rl, `Choose (1-${packages.length}): `);
  const index = parseInt(choice) - 1;
  
  if (index >= 0 && index < packages.length) {
    const pkg = packages[index];
    const updates = {};
    
    Object.entries(pkg.workspaceDeps).forEach(([depType, deps]) => {
      updates[depType] = {};
      Object.keys(deps).forEach(name => {
        if (NPM_VERSIONS[name]) {
          updates[depType][name] = `^${NPM_VERSIONS[name]}`;
        }
      });
    });
    
    if (updatePackageJson(pkg.path, updates)) {
      log('green', `✅ Fixed ${pkg.relativePath}`);
    } else {
      log('red', `❌ Failed to fix ${pkg.relativePath}`);
    }
  } else {
    log('red', 'Invalid selection');
  }
}

async function updateNpmVersion(rl) {
  const packageName = await question(rl, '\nEnter package name: ');
  const version = await question(rl, 'Enter NPM version: ');
  
  NPM_VERSIONS[packageName] = version;
  log('green', `✅ Updated ${packageName} to version ${version}`);
}

function showCurrentVersions() {
  console.log('\n📦 Current NPM Versions:');
  Object.entries(NPM_VERSIONS).forEach(([name, version]) => {
    console.log(`  ${name}: ${colors.green}${version}${colors.reset}`);
  });
}

// Ejecutar
main().catch(error => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});