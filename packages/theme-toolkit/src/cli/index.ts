#!/usr/bin/env bun
import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { ThemeManager } from '../server/services/theme-manager.js';
import { ColorAnalyzer } from '../server/services/color-analyzer.js';
import { ColorRenderer } from './utils/color-renderer.js';
import { TableFormatter } from './utils/table-formatter.js';
import { listCommand } from './commands/list.js';
import { createCommand } from './commands/create.js';
import { editCommand } from './commands/edit.js';
import { deleteCommand } from './commands/delete.js';
import { previewCommand } from './commands/preview.js';
import { analyzeCommand } from './commands/analyze.js';
import { validateCommand } from './commands/validate.js';
import { exportCommand } from './commands/export.js';
import { contrastCommand } from './commands/contrast.js';
import { infoCommand } from './commands/info.js';
import logger from '@mks2508/better-logger';

// Configure logger for CLI
logger.preset('cyberpunk');
logger.showTimestamp();
logger.showLocation();

const cliLogger = logger;

// Initialize shared services
const themeManager = new ThemeManager(join(process.cwd(), 'themes'));
const colorAnalyzer = new ColorAnalyzer();
const colorRenderer = new ColorRenderer();
const tableFormatter = new TableFormatter();

// CLI Configuration
const program = new Command();

program
  .name('theme-toolkit')
  .description('🎨 Theme Toolkit - Herramienta completa de gestión de themes')
  .version('1.0.0')
  .option('-v, --verbose', 'Mostrar información detallada')
  .option('--no-color', 'Deshabilitar colores en la salida');

// Register all commands with shared services
const services = {
  themeManager,
  colorAnalyzer,
  colorRenderer,
  tableFormatter,
  chalk,
  console
};

program.addCommand(listCommand(services));
program.addCommand(createCommand(services));
program.addCommand(editCommand(services));
program.addCommand(deleteCommand(services));
program.addCommand(previewCommand(services));
program.addCommand(analyzeCommand(services));
program.addCommand(validateCommand(services));
program.addCommand(exportCommand(services));
program.addCommand(contrastCommand(services));
program.addCommand(infoCommand(services));

// Error handling
program.exitOverride();

process.on('uncaughtException', (error) => {
  cliLogger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  cliLogger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Main execution
async function main() {
  try {
    cliLogger.success('🎨 Theme Toolkit CLI started');

    // Check if we're in a theme-toolkit directory
    const themesDir = join(process.cwd(), 'themes');
    if (!require('fs').existsSync(themesDir)) {
      cliLogger.warn('No themes directory found. Creating one...');
      require('fs').mkdirSync(themesDir, { recursive: true });
    }

    // Parse command line arguments
    await program.parseAsync(process.argv);

  } catch (error) {
    if (error.code === 'commander.help') {
      // Don't log anything for help command
      process.exit(0);
    }
    if (error.code === 'commander.version') {
      process.exit(0);
    }

    cliLogger.error('CLI Error:', error.message);
    process.exit(1);
  }
}

// Run the CLI
main();