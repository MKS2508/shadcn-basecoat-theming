import { Command } from 'commander';
import chalk from 'chalk';

export const validateCommand = (services: any) => {
  const { chalk } = services;

  return new Command('validate')
    .description('Validate theme CSS (placeholder)')
    .argument('<theme-id>', 'Theme ID to validate')
    .action(() => {
      console.log(chalk.yellow('Validate command - coming soon!'));
    });
};