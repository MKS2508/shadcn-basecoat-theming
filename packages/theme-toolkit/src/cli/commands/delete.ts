import { Command } from 'commander';
import chalk from 'chalk';

export const deleteCommand = (services: any) => {
  const { chalk } = services;

  return new Command('delete')
    .description('Delete a theme (placeholder)')
    .argument('<theme-id>', 'Theme ID to delete')
    .action(() => {
      console.log(chalk.yellow('Delete command - coming soon!'));
    });
};