import { Command } from 'commander';
import chalk from 'chalk';

export const infoCommand = (services: any) => {
  const { chalk } = services;

  return new Command('info')
    .description('Show theme info (placeholder)')
    .argument('<theme-id>', 'Theme ID to show info for')
    .action(() => {
      console.log(chalk.yellow('Info command - coming soon!'));
    });
};