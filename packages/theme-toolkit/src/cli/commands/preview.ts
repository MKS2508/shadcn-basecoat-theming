import { Command } from 'commander';
import chalk from 'chalk';
import type { ThemeManager, ColorAnalyzer, ColorRenderer } from '../types.js';

export const previewCommand = (services: any) => {
  const { themeManager, colorAnalyzer, colorRenderer, chalk } = services;

  return new Command('preview')
    .description('Show color preview with ASCII blocks')
    .argument('<theme-id>', 'Theme ID to preview')
    .option('-m, --mode <mode>', 'Preview mode (light|dark)', 'light')
    .option('-g, --grouped', 'Group colors by semantic category')
    .option('--grid', 'Display colors in a grid layout')
    .option('--gradient', 'Show color gradients')
    .action(async (themeId, options, command) => {
      const logger = command.parent?.getLogger?.() || console;

    try {
      logger.log(chalk.bold(`🎨 Preview: ${themeId} (${options.mode})`));
      logger.log('');

      // Get theme
      const theme = await themeManager.getThemeById(themeId);
      if (!theme) {
        logger.error(chalk.red(`Theme "${themeId}" not found`));
        logger.log(chalk.dim('Available themes:'));
        const themes = await themeManager.getAllThemes();
        themes.forEach(t => logger.log(`  • ${chalk.cyan(t.id)} (${t.label})`));
        return;
      }

      // Check if mode exists
      if (!theme.modes[options.mode]) {
        logger.error(chalk.red(`Mode "${options.mode}" not available for theme "${themeId}"`));
        const availableModes = Object.keys(theme.modes).join(', ');
        logger.log(chalk.dim(`Available modes: ${availableModes}`));
        return;
      }

      // Get CSS content
      const css = await themeManager.getThemeCSS(themeId, options.mode);
      if (!css) {
        logger.error(chalk.red(`No CSS found for ${options.mode} mode`));
        return;
      }

      // Parse color variables
      const variables = colorAnalyzer.parseCSSVariables(css);
      const colorVariables = variables.filter(v => v.color);

      if (colorVariables.length === 0) {
        logger.log(chalk.yellow('No color variables found in CSS'));
        return;
      }

      // Theme header
      logger.log(`${chalk.bold(theme.label)} ${chalk.dim(`(${theme.description})`)}`);
      logger.log(chalk.dim(`Category: ${theme.category} | Author: ${theme.author}`));
      logger.log('');

      // Color palette preview
      if (options.grouped) {
        // Group by semantic categories
        const groups = colorVariables.reduce((acc, variable) => {
          const category = variable.semantic;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(variable);
          return acc;
        }, {} as Record<string, typeof colorVariables>);

        Object.entries(groups).forEach(([category, categoryVariables]) => {
          const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          logger.log(chalk.bold.underline(`${categoryName} Colors`));
          logger.log('');

          categoryVariables.forEach(variable => {
            logger.log(`  ${colorRenderer.renderColorVariable(variable, true)}`);
          });

          logger.log('');
        });
      } else {
        // Simple color palette
        logger.log(colorRenderer.renderColorPalette(colorVariables, 'Color Palette'));
      }

      // Grid layout if requested
      if (options.grid) {
        logger.log(chalk.bold.underline('Color Grid'));
        logger.log('');
        logger.log(colorRenderer.renderColorGrid(colorVariables, 4));
        logger.log('');
      }

      // Gradient preview if requested
      if (options.gradient && colorVariables.length >= 2) {
        logger.log(chalk.bold.underline('Color Gradient'));
        logger.log('');

        // Create gradient from first to last color
        const gradientColors = [colorVariables[0].color!, colorVariables[colorVariables.length - 1].color!];
        logger.log(colorRenderer.renderColorGradient(gradientColors, 60));
        logger.log('');
      }

      // Color statistics
      const stats = getColorStatistics(colorVariables);
      logger.log(chalk.bold.underline('Color Statistics'));
      logger.log('');
      logger.log(`Total Colors: ${chalk.bold(colorVariables.length.toString())}`);
      logger.log(`Unique Categories: ${chalk.bold(stats.categories.toString())}`);
      logger.log(`Light Colors (L > 0.7): ${chalk.green(stats.lightColors.toString())}`);
      logger.log(`Dark Colors (L < 0.3): ${chalk.blue(stats.darkColors.toString())}`);
      logger.log(`Saturated Colors (C > 0.1): ${chalk.magenta(stats.saturatedColors.toString())}`);

    } catch (error) {
      logger.error(chalk.red('Error generating preview:'), error.message);
      process.exit(1);
    }
    });
};

function getColorStatistics(variables: any[]) {
  const categories = new Set(variables.map(v => v.category)).size;
  const lightColors = variables.filter(v => v.color && v.color.oklch.l > 0.7).length;
  const darkColors = variables.filter(v => v.color && v.color.oklch.l < 0.3).length;
  const saturatedColors = variables.filter(v => v.color && v.color.oklch.c > 0.1).length;

  return { categories, lightColors, darkColors, saturatedColors };
}