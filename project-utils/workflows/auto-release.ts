#!/usr/bin/env node

/**
 * Auto-Release Manager para Theme Manager Monorepo
 * Sistema completo de release: commit + versión + build + GitHub + publish
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CommitGenerator } from '../core/commit-generator';
import { VersionManager } from '../core/version-manager';
import { WORKSPACE_CONFIG, VERSION_PREFIXES } from '../config/project-config';

interface ReleaseOptions {
  type: 'major' | 'minor' | 'patch';
  prefix?: 'alpha' | 'beta' | 'rc' | '';
  increment?: number;
  publishNpm?: boolean;
  publishGithub?: boolean;
  autoApprove?: boolean;
  skipBuild?: boolean;
  skipCommit?: boolean;
  dryRun?: boolean;
}

class AutoReleaseManager {
  private projectRoot: string;
  private tempDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.tempDir = join(this.projectRoot, 'project-utils', '.temp');
    
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Ejecuta comando shell
   */
  private async execute(command: string, args: string[], options: { silent?: boolean } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!options.silent) {
        console.log(`🔧 Ejecutando: ${command} ${args.join(' ')}`);
      }

      const proc = spawn(command, args, {
        cwd: this.projectRoot,
        stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (!options.silent) process.stdout.write(output);
      });

      proc.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (!options.silent) process.stderr.write(output);
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`${command} falló con código ${code}: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Valida el estado del repositorio
   */
  private async validateRepository(): Promise<void> {
    // Verificar que estamos en master
    const branch = await this.execute('git', ['branch', '--show-current'], { silent: true });
    if (branch !== 'master') {
      throw new Error(`Debe estar en la rama master, actual: ${branch}`);
    }

    // Verificar que no hay conflictos
    try {
      await this.execute('git', ['diff', '--check'], { silent: true });
    } catch (error) {
      throw new Error('Hay conflictos de merge sin resolver');
    }

    // Verificar workspace limpio (o solo staged changes)
    const status = await this.execute('git', ['status', '--porcelain'], { silent: true });
    if (status && !status.split('\n').every(line => line.startsWith('A ') || line.startsWith('M ') || line.trim() === '')) {
      console.log('⚠️  Hay cambios sin stage. Continuando con auto-commit...');
    }
  }

  /**
   * Ejecuta build de todos los packages
   */
  private async buildPackages(): Promise<void> {
    console.log('🔨 Construyendo todos los packages...');
    
    try {
      await this.execute('pnpm', ['run', 'build:packages']);
      console.log('✅ Build completado exitosamente');
    } catch (error) {
      throw new Error(`Build falló: ${error}`);
    }
  }

  /**
   * Ejecuta type-check en todos los packages
   */
  private async typeCheck(): Promise<void> {
    console.log('🔍 Verificando tipos en todos los packages...');
    
    try {
      await this.execute('pnpm', ['run', 'type-check:all']);
      console.log('✅ Type-check completado exitosamente');
    } catch (error) {
      throw new Error(`Type-check falló: ${error}`);
    }
  }

  /**
   * Publica package en NPM
   */
  private async publishToNpm(packagePath: string, npmTag: string = 'latest'): Promise<void> {
    const fullPath = join(this.projectRoot, packagePath);
    
    console.log(`📦 Publicando ${packagePath} con tag ${npmTag}...`);
    
    try {
      await this.execute('npm', ['publish', '--access', 'public', '--tag', npmTag], { silent: false });
      console.log(`✅ Publicado en NPM: ${packagePath}`);
    } catch (error) {
      console.warn(`⚠️  Error publicando ${packagePath}: ${error}`);
    }
  }

  /**
   * Publica todos los packages en NPM
   */
  private async publishAllPackages(npmTag: string): Promise<void> {
    console.log(`📦 Publicando todos los packages con tag ${npmTag}...`);
    
    for (const pkg of WORKSPACE_CONFIG.packages) {
      const packagePath = join(this.projectRoot, pkg.path);
      if (existsSync(join(packagePath, 'package.json'))) {
        process.chdir(packagePath);
        await this.publishToNpm(pkg.path, npmTag);
        process.chdir(this.projectRoot);
      }
    }
  }

  /**
   * Crea GitHub release
   */
  private async createGitHubRelease(version: string, changelog: string): Promise<void> {
    console.log(`🚀 Creando GitHub release para v${version}...`);
    
    try {
      const tagName = `v${version}`;
      const releaseName = `Theme Manager v${version}`;
      
      await this.execute('gh', ['release', 'create', tagName, '--title', releaseName, '--notes', changelog]);
      console.log(`✅ GitHub release creado: ${tagName}`);
    } catch (error) {
      console.warn(`⚠️  Error creando GitHub release: ${error}`);
    }
  }

  /**
   * Genera changelog para el release
   */
  private generateReleaseChangelog(oldVersion: string, newVersion: string, type: string): string {
    const date = new Date().toISOString().split('T')[0];
    const versionType = type === 'major' ? 'Major' : type === 'minor' ? 'Minor' : 'Patch';
    
    return `# Theme Manager v${newVersion}

## 🎯 ${versionType} Release

**Fecha**: ${date}
**Versión anterior**: v${oldVersion}

### 📦 Packages Incluidos

${WORKSPACE_CONFIG.packages.map(pkg => `- **${pkg.name}**: v${newVersion}`).join('\n')}

### ✨ Características Principales

- Sistema de theme management multi-framework
- Soporte para shadcn/ui y Basecoat CSS
- Componentes React, Astro, Vanilla JS y Web Components
- CLI para instalación automatizada de temas
- Gestión de fuentes con Google Fonts

### 🔧 Instalación

\`\`\`bash
# Package principal (Core)
npm install @mks2508/shadcn-basecoat-theme-manager@${newVersion}

# React
npm install @mks2508/theme-manager-react@${newVersion}

# Astro
npm install @mks2508/theme-manager-astro@${newVersion}

# CLI
npm install -g @mks2508/theme-manager-cli@${newVersion}
\`\`\`

### 📚 Documentación

- [GitHub Pages](https://mks2508.github.io/shadcn-basecoat-theming/)
- [Repository](https://github.com/MKS2508/shadcn-basecoat-theming)

---

*Release generado automáticamente por project-utils*`;
  }

  /**
   * Workflow completo de release
   */
  async run(options: ReleaseOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando Auto-Release para Theme Manager');
      console.log(`📋 Opciones: ${JSON.stringify(options, null, 2)}`);

      if (options.dryRun) {
        console.log('🔍 MODO DRY-RUN - No se ejecutarán cambios reales');
      }

      // 1. Validar repositorio
      console.log('\n📍 Paso 1: Validando repositorio...');
      if (!options.dryRun) {
        await this.validateRepository();
      }

      // 2. Commit automático (si hay cambios)
      if (!options.skipCommit) {
        console.log('\n📍 Paso 2: Generando commit automático...');
        if (!options.dryRun) {
          const commitGenerator = new CommitGenerator();
          await commitGenerator.run({ autoApprove: true, quiet: true });
        }
      }

      // 3. Type-check y build
      if (!options.skipBuild) {
        console.log('\n📍 Paso 3: Type-check y build...');
        if (!options.dryRun) {
          await this.typeCheck();
          await this.buildPackages();
        }
      }

      // 4. Actualizar versiones
      console.log('\n📍 Paso 4: Actualizando versiones...');
      let versionResult: { oldVersion: string; newVersion: string };
      if (!options.dryRun) {
        const versionManager = new VersionManager();
        versionResult = await versionManager.updateVersions({
          type: options.type,
          prefix: options.prefix,
          increment: options.increment
        });
        
        // Commit de cambios de versión
        await this.execute('git', ['add', '.']);
        await this.execute('git', ['commit', '-m', `chore(release): bump version to ${versionResult.newVersion}`]);
        await this.execute('git', ['tag', '-a', `v${versionResult.newVersion}`, '-m', `Release v${versionResult.newVersion}`]);
      } else {
        versionResult = { oldVersion: '1.0.0', newVersion: '1.1.0' };
      }

      // 5. Publicar en NPM
      if (options.publishNpm) {
        console.log('\n📍 Paso 5: Publicando en NPM...');
        if (!options.dryRun) {
          const prefixConfig = VERSION_PREFIXES.find(p => p.id === options.prefix);
          const npmTag = prefixConfig?.npmTag || 'latest';
          await this.publishAllPackages(npmTag);
        }
      }

      // 6. Crear GitHub release
      if (options.publishGithub || (!options.publishNpm && !options.prefix)) {
        console.log('\n📍 Paso 6: Creando GitHub release...');
        if (!options.dryRun) {
          const changelog = this.generateReleaseChangelog(
            versionResult.oldVersion, 
            versionResult.newVersion, 
            options.type
          );
          await this.createGitHubRelease(versionResult.newVersion, changelog);
        }
      }

      // 7. Push cambios
      console.log('\n📍 Paso 7: Pushing cambios...');
      if (!options.dryRun) {
        await this.execute('git', ['push', 'origin', 'master']);
        await this.execute('git', ['push', 'origin', '--tags']);
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n✅ Release completado exitosamente en ${duration}s`);
      console.log(`🎯 Nueva versión: ${versionResult.newVersion}`);
      
      if (options.publishNpm) {
        console.log(`📦 Packages publicados en NPM`);
      }
      if (options.publishGithub) {
        console.log(`🚀 GitHub release creado`);
      }

    } catch (error) {
      console.error('\n❌ Error durante el release:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  const options: ReleaseOptions = {
    type: (args.find(arg => arg.startsWith('--type='))?.split('=')[1] as 'major' | 'minor' | 'patch') || 'patch',
    prefix: (args.find(arg => arg.startsWith('--prefix='))?.split('=')[1] as 'alpha' | 'beta' | 'rc' | '') || '',
    increment: parseInt(args.find(arg => arg.startsWith('--increment='))?.split('=')[1] || '1'),
    publishNpm: args.includes('--publish-npm'),
    publishGithub: args.includes('--publish-github'),
    autoApprove: args.includes('--auto-approve'),
    skipBuild: args.includes('--skip-build'),
    skipCommit: args.includes('--skip-commit'),
    dryRun: args.includes('--dry-run')
  };

  const releaseManager = new AutoReleaseManager();
  releaseManager.run(options);
}

export { AutoReleaseManager };