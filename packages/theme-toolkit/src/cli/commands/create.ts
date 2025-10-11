import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { ThemeManager } from '../types.js';

export const createCommand = (services: any) => {
  const { themeManager, chalk } = services;

  return new Command('create')
    .description('Create a new theme')
    .option('-n, --name <name>', 'Theme name')
    .option('-l, --label <label>', 'Theme display label')
    .option('-d, --description <description>', 'Theme description')
    .option('-c, --category <category>', 'Theme category (built-in|custom)', 'custom')
    .option('-b, --base <theme-id>', 'Base theme to copy from')
    .option('-i, --interactive', 'Interactive mode', true)
    .action(async (options, command) => {
      const logger = command.parent?.getLogger?.() || console;

    try {
      logger.log(chalk.bold('🎨 Create New Theme'));
      logger.log('');

      let themeData: any = {};

      if (options.interactive && (!options.name || !options.label || !options.description)) {
        // Interactive mode
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Theme name (used for ID and files):',
            validate: (input) => input.trim().length > 0 || 'Name is required',
            when: !options.name
          },
          {
            type: 'input',
            name: 'label',
            message: 'Display label:',
            validate: (input) => input.trim().length > 0 || 'Label is required',
            when: !options.label
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
            validate: (input) => input.trim().length > 0 || 'Description is required',
            when: !options.description
          },
          {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: ['custom', 'built-in'],
            default: 'custom',
            when: !options.category
          },
          {
            type: 'list',
            name: 'baseThemeId',
            message: 'Base theme (optional):',
            choices: async () => {
              const themes = await themeManager.getAllThemes();
              return [
                { name: 'None (start from scratch)', value: '' },
                ...themes.map(theme => ({
                  name: `${theme.label} (${theme.id})`,
                  value: theme.id
                }))
              ];
            },
            default: '',
            when: !options.base
          }
        ]);

        themeData = {
          name: options.name || answers.name,
          label: options.label || answers.label,
          description: options.description || answers.description,
          category: options.category || answers.category,
          baseThemeId: options.base || answers.baseThemeId
        };
      } else {
        // Non-interactive mode
        themeData = {
          name: options.name,
          label: options.label,
          description: options.description,
          category: options.category,
          baseThemeId: options.base
        };

        // Validate required fields
        if (!themeData.name || !themeData.label || !themeData.description) {
          logger.error(chalk.red('Error: name, label, and description are required'));
          process.exit(1);
        }
      }

      logger.log(chalk.dim('Creating theme with the following settings:'));
      logger.log(`  Name: ${chalk.cyan(themeData.name)}`);
      logger.log(`  Label: ${chalk.cyan(themeData.label)}`);
      logger.log(`  Description: ${chalk.cyan(themeData.description)}`);
      logger.log(`  Category: ${chalk.cyan(themeData.category)}`);
      if (themeData.baseThemeId) {
        logger.log(`  Base Theme: ${chalk.cyan(themeData.baseThemeId)}`);
      }
      logger.log('');

      // Create the theme
      const newTheme = await themeManager.createTheme(themeData);

      logger.log(chalk.green('✅ Theme created successfully!'));
      logger.log('');
      logger.log(chalk.bold('Theme Details:'));
      logger.log(`  ID: ${chalk.cyan(newTheme.id)}`);
      logger.log(`  Name: ${chalk.cyan(newTheme.label)}`);
      logger.log(`  Description: ${chalk.cyan(newTheme.description)}`);
      logger.log(`  Category: ${chalk.cyan(newTheme.category)}`);
      logger.log(`  Author: ${chalk.cyan(newTheme.author)}`);
      logger.log(`  Version: ${chalk.cyan(newTheme.version)}`);
      logger.log('');

      // Next steps
      logger.log(chalk.bold('Next Steps:'));
      logger.log(`1. Edit the theme CSS files in the themes directory`);
      logger.log(`2. Preview with: ${chalk.cyan(`theme-toolkit preview ${newTheme.id}`)}`);
      logger.log(`3. Analyze with: ${chalk.cyan(`theme-toolkit analyze ${newTheme.id}`)}`);
      logger.log(`4. Start web interface: ${chalk.cyan('bun run dev')}`);

    } catch (error) {
      logger.error(chalk.red('Error creating theme:'), error.message);
      process.exit(1);
    }
    });
};