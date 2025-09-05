#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { checkProjectReadiness, displayPrerequisiteResults } from './core/prerequisites.js';
import { detectInstallationState, displayInstallationStatus, canProceedWithInstallation } from './core/state-detector.js';
import { installThemeManager } from './core/installer.js';
import { render } from '@opentui/react';
import { InstallationUI } from './components/InstallationUI.js';
import React from 'react';

const program = new Command();

program
  .name('@mks2508/theme-manager-cli')
  .description('CLI para automatizar la integración del Theme Manager en proyectos Astro')
  .version('1.0.0');

program
  .command('init')
  .argument('<framework>', 'Framework target (currently only "astro" is supported)')
  .option('--with-fouc', 'Add FOUC prevention to Layout.astro')
  .option('--theme-dir <dir>', 'Custom theme directory', 'public/src/themes')
  .option('--no-examples', 'Don\'t generate default theme examples')
  .option('--check-only', 'Only verify prerequisites without installing')
  .option('--force', 'Skip prerequisite checks and force installation')
  .option('--verbose', 'Detailed output')
  .description('Initialize theme manager in an Astro project')
  .action(async (framework: string, options) => {
    try {
      // Only support Astro for now
      if (framework !== 'astro') {
        console.error(chalk.red(`❌ Framework "${framework}" is not supported. Currently only "astro" is supported.`));
        process.exit(1);
      }

      const cwd = process.cwd();

      // Show header
      console.log(chalk.bold.blue('\n🛠️ Theme Manager CLI\n'));

      // Check prerequisites
      const { ready, checks, projectInfo } = await checkProjectReadiness(cwd, options.verbose || options.checkOnly);

      if (options.checkOnly) {
        displayPrerequisiteResults(checks);
        const status = await detectInstallationState(cwd);
        displayInstallationStatus(status);
        return;
      }

      if (!ready && !options.force) {
        displayPrerequisiteResults(checks);
        process.exit(1);
      }

      // Check installation state
      const { proceed, status, message } = await canProceedWithInstallation(cwd, options.force);
      
      if (options.verbose) {
        displayInstallationStatus(status);
      }

      if (!proceed) {
        console.log(chalk.yellow(`⚠️ ${message}`));
        process.exit(1);
      }

      // Proceed with installation
      if (options.verbose) {
        console.log(chalk.green(`✅ ${message}`));
      }

      // Use OpenTUI for installation process
      if (!options.verbose) {
        // Show TUI interface
        render(React.createElement(InstallationUI, { 
          projectInfo,
          options: {
            cwd,
            themeDir: options.themeDir,
            noExamples: options.noExamples,
            verbose: false
          }
        }));
      } else {
        // Traditional CLI output
        await installThemeManager(projectInfo, {
          cwd,
          themeDir: options.themeDir,
          noExamples: options.noExamples,
          verbose: true
        });
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      if (options.verbose && error instanceof Error) {
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