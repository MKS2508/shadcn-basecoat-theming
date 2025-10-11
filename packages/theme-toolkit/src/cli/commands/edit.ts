import { Command } from 'commander';
import chalk from 'chalk';

export const editCommand = (services: any) => {
  const { chalk } = services;

  return new Command('edit')
    .description('Edit a theme (placeholder)')
    .argument('<theme-id>', 'Theme ID to edit')
    .action(() => {
      console.log(chalk.yellow('Edit command - coming soon!'));
    });
};