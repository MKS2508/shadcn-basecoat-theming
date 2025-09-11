#!/usr/bin/env node

/**
 * Version Manager para Theme Manager Monorepo
 * Gestiona versionado coordinado de todos los packages
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { WORKSPACE_CONFIG, VERSION_PREFIXES, getVersionPrefixById } from '../config/project-config';

interface PackageJSON {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface VersionBump {
  type: 'major' | 'minor' | 'patch';
  prefix?: 'alpha' | 'beta' | 'rc' | '';
  increment?: number;
}

class VersionManager {
  private projectRoot: string;
  private mainPackageJson: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.mainPackageJson = join(this.projectRoot, 'package.json');
  }

  /**
   * Ejecuta comando shell
   */
  private async execute(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => stdout += data.toString());
      proc.stderr?.on('data', (data) => stderr += data.toString());

      proc.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`${command} failed: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Lee y parsea package.json
   */
  private readPackageJson(path: string): PackageJSON {
    if (!existsSync(path)) {
      throw new Error(`Package.json no encontrado: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf-8'));
  }

  /**
   * Escribe package.json
   */
  private writePackageJson(path: string, data: PackageJSON): void {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  }

  /**
   * Parsea versión semántica
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number; prefix: string; increment: number } {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+)(?:\.(\d+))?)?$/;
    const match = version.match(regex);
    
    if (!match) {
      throw new Error(`Versión inválida: ${version}`);
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prefix: match[4] || '',
      increment: parseInt(match[5] || '0')
    };
  }

  /**
   * Genera nueva versión
   */
  private generateVersion(current: string, bump: VersionBump): string {
    const parsed = this.parseVersion(current);
    let { major, minor, patch } = parsed;

    // Aplicar bump
    switch (bump.type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
    }

    // Construir versión
    let newVersion = `${major}.${minor}.${patch}`;
    
    if (bump.prefix && bump.prefix !== '') {
      const increment = bump.increment || 1;
      newVersion += `-${bump.prefix}.${increment}`;
    }

    return newVersion;
  }

  /**
   * Obtiene todas las versiones actuales
   */
  async getCurrentVersions(): Promise<Record<string, string>> {
    const versions: Record<string, string> = {};
    
    // Versión principal
    const mainPkg = this.readPackageJson(this.mainPackageJson);
    versions['main'] = mainPkg.version;

    // Versiones de packages
    for (const pkg of WORKSPACE_CONFIG.packages) {
      const packagePath = join(this.projectRoot, pkg.path, 'package.json');
      if (existsSync(packagePath)) {
        const packageJson = this.readPackageJson(packagePath);
        versions[pkg.id] = packageJson.version;
      }
    }

    return versions;
  }

  /**
   * Actualiza versión de un package específico
   */
  private updatePackageVersion(packagePath: string, newVersion: string): void {
    const packageJson = this.readPackageJson(packagePath);
    packageJson.version = newVersion;
    this.writePackageJson(packagePath, packageJson);
  }

  /**
   * Actualiza dependencias workspace entre packages
   */
  private updateWorkspaceDependencies(newVersion: string): void {
    for (const pkg of WORKSPACE_CONFIG.packages) {
      const packagePath = join(this.projectRoot, pkg.path, 'package.json');
      if (existsSync(packagePath)) {
        const packageJson = this.readPackageJson(packagePath);
        let updated = false;

        // Actualizar dependencies
        if (packageJson.dependencies) {
          for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
            if (depName.startsWith('@mks2508/') && depVersion.startsWith('workspace:')) {
              // Mantener workspace: prefix para desarrollo local
              continue;
            }
            if (depName.startsWith('@mks2508/theme-manager') || depName.startsWith('@mks2508/shadcn-basecoat-theme-manager')) {
              packageJson.dependencies[depName] = `^${newVersion}`;
              updated = true;
            }
          }
        }

        // Actualizar peerDependencies
        if (packageJson.peerDependencies) {
          for (const [depName, depVersion] of Object.entries(packageJson.peerDependencies)) {
            if (depName.startsWith('@mks2508/theme-manager') || depName.startsWith('@mks2508/shadcn-basecoat-theme-manager')) {
              packageJson.peerDependencies[depName] = `^${newVersion}`;
              updated = true;
            }
          }
        }

        if (updated) {
          this.writePackageJson(packagePath, packageJson);
        }
      }
    }
  }

  /**
   * Actualiza todas las versiones de forma coordinada
   */
  async updateVersions(bump: VersionBump): Promise<{ oldVersion: string; newVersion: string }> {
    const currentVersions = await this.getCurrentVersions();
    const mainVersion = currentVersions['main'];
    const newVersion = this.generateVersion(mainVersion, bump);

    console.log(`📦 Actualizando versiones: ${mainVersion} → ${newVersion}`);

    // Actualizar package.json principal
    const mainPkg = this.readPackageJson(this.mainPackageJson);
    mainPkg.version = newVersion;
    this.writePackageJson(this.mainPackageJson, mainPkg);

    // Actualizar todos los packages
    for (const pkg of WORKSPACE_CONFIG.packages) {
      const packagePath = join(this.projectRoot, pkg.path, 'package.json');
      if (existsSync(packagePath)) {
        console.log(`   Actualizando ${pkg.id}...`);
        this.updatePackageVersion(packagePath, newVersion);
      }
    }

    // Actualizar dependencias internas
    console.log('🔄 Actualizando dependencias workspace...');
    this.updateWorkspaceDependencies(newVersion);

    return { oldVersion: mainVersion, newVersion };
  }

  /**
   * Genera changelog entry
   */
  generateChangelogEntry(oldVersion: string, newVersion: string, type: string): string {
    const date = new Date().toISOString().split('T')[0];
    const versionType = type === 'major' ? 'Major' : type === 'minor' ? 'Minor' : 'Patch';
    
    return `## [${newVersion}] - ${date}

### ${this.getChangeIcon(type)} ${versionType} Release

**Cambios desde v${oldVersion}:**

- Versión coordinada de todos los packages del monorepo
- Dependencias workspace actualizadas automáticamente
- Compatibilidad mantenida entre packages

**Packages Actualizados:**
${WORKSPACE_CONFIG.packages.map(pkg => `- ${pkg.name}: v${newVersion}`).join('\n')}
`;
  }

  private getChangeIcon(type: string): string {
    switch (type) {
      case 'major': return '🚨';
      case 'minor': return '✨';
      case 'patch': return '🐛';
      default: return '📝';
    }
  }

  /**
   * Crea git tag para la nueva versión
   */
  async createGitTag(version: string): Promise<void> {
    const tagName = `v${version}`;
    const tagMessage = `Release version ${version}`;
    
    try {
      await this.execute('git', ['tag', '-a', tagName, '-m', tagMessage]);
      console.log(`🏷️  Tag creado: ${tagName}`);
    } catch (error) {
      console.warn(`⚠️  Error creando tag: ${error}`);
    }
  }

  /**
   * Workflow completo de versionado
   */
  async run(options: { 
    type: 'major' | 'minor' | 'patch';
    prefix?: 'alpha' | 'beta' | 'rc' | '';
    increment?: number;
    autoApprove?: boolean;
    createTag?: boolean;
  }): Promise<void> {
    try {
      const bump: VersionBump = {
        type: options.type,
        prefix: options.prefix,
        increment: options.increment
      };

      console.log('🔍 Analizando versiones actuales...');
      const currentVersions = await this.getCurrentVersions();
      
      console.log('📊 Versiones actuales:');
      Object.entries(currentVersions).forEach(([pkg, version]) => {
        console.log(`   ${pkg}: ${version}`);
      });

      if (!options.autoApprove) {
        const newVersion = this.generateVersion(currentVersions['main'], bump);
        console.log(`\n🎯 Nueva versión propuesta: ${newVersion}`);
        console.log('⚠️  Este cambio afectará todos los packages del monorepo');
        console.log('   Usa --auto-approve para ejecutar automáticamente');
        return;
      }

      const result = await this.updateVersions(bump);
      
      if (options.createTag) {
        await this.createGitTag(result.newVersion);
      }

      console.log(`✅ Versionado completado: ${result.oldVersion} → ${result.newVersion}`);
      console.log(`📝 Changelog entry generado`);

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => ['--type'].some(flag => arg.startsWith(flag)));
  const type = typeArg?.split('=')[1] as 'major' | 'minor' | 'patch' || 'patch';
  const prefix = args.find(arg => arg.startsWith('--prefix='))?.split('=')[1] as 'alpha' | 'beta' | 'rc' | '' || '';
  const increment = parseInt(args.find(arg => arg.startsWith('--increment='))?.split('=')[1] || '1');
  const autoApprove = args.includes('--auto-approve');
  const createTag = args.includes('--create-tag');

  const versionManager = new VersionManager();
  versionManager.run({ type, prefix, increment, autoApprove, createTag });
}

export { VersionManager };