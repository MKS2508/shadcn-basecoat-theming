import { Command } from 'commander';
import chalk from 'chalk';

export const contrastCommand = (services: any) => {
  const { chalk } = services;

  return new Command('contrast')
    .description('Check contrast (placeholder)')
    .argument('<theme-id>', 'Theme ID to check')
    .action(() => {
      console.log(chalk.yellow('Contrast command - coming soon!'));
    });
};