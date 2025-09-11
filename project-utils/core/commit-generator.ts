#!/usr/bin/env node

/**
 * Generador de Commits Inteligente para Theme Manager
 * Analiza cambios del workspace y genera commits estructurados
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseGitStatus, getFileArea, suggestCommitType, analyzeDiff, generateTechnicalSummary } from './git-utils';
import { PROJECT_COMPONENTS, WORK_TYPES, getComponentById, getWorkTypeById } from '../config/project-config';
import { createCommitPrompt, THEME_MANAGER_PROJECT_CONFIG } from '../ai/prompt-templates';

interface CommitAnalysis {
  affectedPackages: string[];
  workType: string;
  suggestedTitle: string;
  technicalChanges: string[];
  changelogEntry: string;
}

class CommitGenerator {
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
   * Ejecuta comando git y devuelve resultado
   */
  private async gitCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Git error: ${stderr || 'Git command failed'}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Analiza el estado actual de git
   */
  private async analyzeGitStatus(): Promise<CommitAnalysis> {
    const statusOutput = await this.gitCommand(['status', '--porcelain']);
    const files = parseGitStatus(statusOutput);

    if (files.length === 0) {
      throw new Error('No hay cambios para hacer commit');
    }

    // Obtener diffs de archivos modificados
    const diffs: Record<string, string> = {};
    for (const file of files.filter(f => !f.untracked)) {
      try {
        const diff = await this.gitCommand(['diff', 'HEAD', file.path]);
        diffs[file.path] = diff;
      } catch (error) {
        // Archivo nuevo o eliminado
        diffs[file.path] = '';
      }
    }

    // Analizar archivos afectados por área/package
    const affectedAreas = files.map(f => getFileArea(f.path));
    const uniqueAreas = [...new Set(affectedAreas)];
    
    // Detectar packages específicos afectados
    const affectedPackages = uniqueAreas.filter(area => 
      PROJECT_COMPONENTS.some(comp => comp.id === area && comp.packagePath)
    );

    // Sugerir tipo de trabajo
    const workType = suggestCommitType(files);
    
    // Generar resumen técnico
    const technicalSummary = generateTechnicalSummary(files, diffs);
    
    // Generar título sugerido
    const primaryArea = affectedPackages.length > 0 ? affectedPackages[0] : uniqueAreas[0];
    const scopeText = affectedPackages.length > 1 ? 'packages' : primaryArea;
    
    let suggestedTitle: string;
    if (files.some(f => f.untracked)) {
      suggestedTitle = `agregar ${this.summarizeChanges(files, uniqueAreas)}`;
    } else if (files.some(f => f.deleted)) {
      suggestedTitle = `eliminar ${this.summarizeChanges(files, uniqueAreas)}`;
    } else {
      suggestedTitle = `actualizar ${this.summarizeChanges(files, uniqueAreas)}`;
    }

    return {
      affectedPackages,
      workType,
      suggestedTitle: `${workType}(${scopeText}): ${suggestedTitle}`,
      technicalChanges: technicalSummary.split('\n').filter(l => l.trim()),
      changelogEntry: this.generateChangelogEntry(workType, files, uniqueAreas)
    };
  }

  /**
   * Resume los cambios principales
   */
  private summarizeChanges(files: any[], areas: string[]): string {
    const newFiles = files.filter(f => f.untracked).length;
    const modifiedFiles = files.filter(f => f.staged || f.unstaged).length;
    const deletedFiles = files.filter(f => f.deleted).length;

    const changes = [];
    if (newFiles > 0) changes.push(`${newFiles} archivos nuevos`);
    if (modifiedFiles > 0) changes.push(`${modifiedFiles} archivos modificados`);
    if (deletedFiles > 0) changes.push(`${deletedFiles} archivos eliminados`);

    if (areas.includes('ui-components')) return 'componentes UI shadcn';
    if (areas.includes('themes')) return 'sistema de temas';
    if (areas.includes('core')) return 'funcionalidad core';
    if (areas.includes('config')) return 'configuración del proyecto';
    
    return changes.join(', ') || 'archivos del proyecto';
  }

  /**
   * Genera entrada de changelog
   */
  private generateChangelogEntry(workType: string, files: any[], areas: string[]): string {
    const workConfig = getWorkTypeById(workType);
    const emoji = workConfig?.emoji || '📝';
    
    if (areas.includes('ui-components')) {
      return `${emoji} Componentes UI shadcn/ui actualizados para mejor integración TypeScript`;
    }
    if (areas.includes('themes')) {
      return `${emoji} Sistema de gestión de temas mejorado con nuevas capacidades`;
    }
    if (areas.includes('core')) {
      return `${emoji} Funcionalidad principal del theme manager actualizada`;
    }
    if (workType === 'feat') {
      return `${emoji} Nueva funcionalidad implementada en el sistema de temas`;
    }
    if (workType === 'fix') {
      return `${emoji} Correcciones importantes en la gestión de temas`;
    }
    
    return `${emoji} Mejoras en el sistema de theme management`;
  }

  /**
   * Genera propuesta de commit
   */
  async generateCommitProposal(): Promise<void> {
    console.log('🔍 Analizando cambios en el repositorio...');
    
    const analysis = await this.analyzeGitStatus();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const proposalFile = join(this.tempDir, `commit-proposal-${timestamp}.md`);

    const proposal = `### **ANÁLISIS PRINCIPAL**

Se han detectado cambios en ${analysis.affectedPackages.length || 1} área(s) del monorepo theme manager. Los cambios afectan principalmente: ${analysis.affectedPackages.join(', ') || 'archivos de configuración'}.

---

### **Propuesta de Commit #1**

\`\`\`markdown
${analysis.suggestedTitle}

Descripción detallada de los cambios realizados en el sistema de theme management.

<technical>
${analysis.technicalChanges.map(change => `- ${change}`).join('\n')}
</technical>

<changelog>
${analysis.changelogEntry}
</changelog>
\`\`\`

---

**DECISION**: Se propone un único commit para mantener la coherencia de los cambios relacionados.

**Packages Afectados**: ${analysis.affectedPackages.join(', ') || 'General'}
**Tipo de Trabajo**: ${analysis.workType}
**Generado**: ${new Date().toISOString()}
`;

    writeFileSync(proposalFile, proposal);
    console.log(`📄 Propuesta generada: ${proposalFile}`);
  }

  /**
   * Ejecuta el commit con la propuesta generada
   */
  async executeCommit(message: string): Promise<void> {
    console.log('🚀 Ejecutando commit...');
    
    // Agregar archivos al staging area
    await this.gitCommand(['add', '.']);
    
    // Hacer commit
    await this.gitCommand(['commit', '-m', message]);
    
    console.log('✅ Commit ejecutado exitosamente');
  }

  /**
   * Workflow completo: analizar, generar y ejecutar
   */
  async run(options: { autoApprove?: boolean; quiet?: boolean } = {}): Promise<void> {
    try {
      const analysis = await this.analyzeGitStatus();
      
      if (!options.quiet) {
        console.log('📊 Análisis de cambios:');
        console.log(`   Packages afectados: ${analysis.affectedPackages.join(', ') || 'General'}`);
        console.log(`   Tipo de trabajo: ${analysis.workType}`);
        console.log(`   Título sugerido: ${analysis.suggestedTitle}`);
      }

      const commitMessage = `${analysis.suggestedTitle}

Cambios realizados en el sistema de theme management.

<technical>
${analysis.technicalChanges.map(change => `- ${change}`).join('\n')}
</technical>

<changelog>
${analysis.changelogEntry}
</changelog>`;

      if (options.autoApprove) {
        await this.executeCommit(commitMessage);
      } else {
        // Generar propuesta para revisión manual
        await this.generateCommitProposal();
        console.log('📝 Propuesta generada. Revisa el archivo y ejecuta manualmente si es necesario.');
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const autoApprove = args.includes('--auto-approve');
  const quiet = args.includes('--quiet');

  const generator = new CommitGenerator();
  generator.run({ autoApprove, quiet });
}

export { CommitGenerator };