import { Command } from 'commander';
import chalk from 'chalk';

export const exportCommand = (services: any) => {
  const { chalk } = services;

  return new Command('export')
    .description('Export theme (placeholder)')
    .argument('<theme-id>', 'Theme ID to export')
    .action(() => {
      console.log(chalk.yellow('Export command - coming soon!'));
    });
};