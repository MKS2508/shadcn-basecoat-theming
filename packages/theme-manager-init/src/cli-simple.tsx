#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { checkProjectReadiness, displayPrerequisiteResults } from './core/prerequisites.js';
import { detectInstallationState, displayInstallationStatus, canProceedWithInstallation } from './core/state-detector.js';
import { installThemeManager } from './core/installer.js';

const program = new Command();

program
  .name('@mks2508/theme-manager-cli')
  .description('CLI para automatizar la integración del Theme Manager en proyectos Astro')
  .version('1.0.0');

program
  .command('init')
  .argument('<framework>', 'Framework target ("astro", "react", or "vanilla")')
  .option('--with-fouc', 'Add FOUC prevention to Layout.astro')
  .option('--theme-dir <dir>', 'Custom theme directory', 'public/src/themes')
  .option('--no-examples', 'Don\'t generate default theme examples')
  .option('--check-only', 'Only verify prerequisites without installing')
  .option('--force', 'Skip prerequisite checks and force installation')
  .option('--verbose', 'Detailed output')
  .description('Initialize theme manager in a project (supports Astro, React, and Vanilla)')
  .action(async (framework: string, options) => {
    try {
      // Support Astro, React, and Vanilla
      if (framework !== 'astro' && framework !== 'react' && framework !== 'vanilla') {
        console.error(chalk.red(`❌ Framework "${framework}" is not supported. Supported frameworks: astro, react, vanilla`));
        process.exit(1);
      }

      const cwd = process.cwd();

      // Show header
      console.log(chalk.bold.blue('\n🛠️ Theme Manager CLI (Simple Mode)\n'));

      console.log(chalk.dim('Debug: Starting prerequisites check...'));

      // Check prerequisites
      const { ready, checks, projectInfo } = await checkProjectReadiness(cwd, options.verbose || options.checkOnly, framework as 'astro' | 'react' | 'vanilla');

      if (options.checkOnly) {
        console.log(chalk.dim('Debug: Check-only mode, displaying results...'));
        displayPrerequisiteResults(checks);
        const status = await detectInstallationState(cwd);
        displayInstallationStatus(status);
        return;
      }

      if (!ready && !options.force) {
        console.log(chalk.red('❌ Prerequisites check failed'));
        displayPrerequisiteResults(checks);
        process.exit(1);
      }

      console.log(chalk.dim('Debug: Prerequisites passed, checking installation state...'));

      // Check installation state
      const { proceed, status, message } = await canProceedWithInstallation(cwd, options.force);
      
      if (options.verbose) {
        displayInstallationStatus(status);
      }

      if (!proceed) {
        console.log(chalk.yellow(`⚠️ ${message}`));
        process.exit(1);
      }

      console.log(chalk.green(`✅ ${message}`));

      // Proceed with installation - traditional CLI output
      console.log(chalk.dim('Debug: Starting installation...'));
      
      await installThemeManager(projectInfo, {
        cwd,
        themeDir: options.themeDir,
        noExamples: options.noExamples,
        verbose: options.verbose || true, // Force verbose for debugging
        framework: framework as 'astro' | 'react' | 'vanilla'
      });

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      if (error instanceof Error) {
        console.error(chalk.red('Stack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Show help if no arguments
if (process.argv.length <= 2) {
  program.help();
}

program.parse();