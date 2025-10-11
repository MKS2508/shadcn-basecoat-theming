import { Command } from 'commander';
import type { ThemeManager, ColorAnalyzer, ColorRenderer, TableFormatter } from '../types.js';

export const listCommand = (services: any) => {
  const { themeManager, colorAnalyzer, colorRenderer, tableFormatter, console: logger } = services;

  return new Command('list')
    .description('List all available themes')
    .option('-t, --table', 'Display themes in table format', true)
    .option('-d, --details', 'Show detailed information')
    .option('-c, --colors', 'Show color previews')
    .option('-g, --grouped', 'Group themes by category')
    .option('--mode <mode>', 'Filter by mode (light/dark)', 'both')
    .action(async (options) => {
    const logger = console;

    try {
      logger.log('🎨 Available Themes');
      logger.log('');

      const themes = await themeManager.getAllThemes();

      if (themes.length === 0) {
        logger.log('No themes found. Create your first theme with:');
        logger.log('  theme-toolkit create');
        return;
      }

      let filteredThemes = themes;

      // Filter by mode if specified
      if (options.mode !== 'both') {
        filteredThemes = themes.filter(theme => theme.modes[options.mode]);
      }

      if (filteredThemes.length === 0) {
        logger.log(`No themes found with ${options.mode} mode`);
        return;
      }

      // Display themes
      if (options.table) {
        logger.log(tableFormatter.renderThemesList(filteredThemes));
      } else {
        filteredThemes.forEach(theme => {
          const modes = Object.keys(theme.modes).map(mode =>
            mode === 'light' ? '[LIGHT]' : '[DARK]'
          ).join(', ');

          logger.log(`${theme.label} (${theme.id})`);
          logger.log(`  ${theme.category} • ${modes}`);
          logger.log(`  ${theme.description}`);

          if (options.details) {
            const lastUpdated = theme.metadata?.updatedAt
              ? new Date(theme.metadata.updatedAt).toLocaleDateString()
              : 'Unknown';
            logger.log(`  Updated: ${lastUpdated} | Author: ${theme.author}`);
          }

          logger.log('');
        });
      }

      // Show color previews if requested
      if (options.colors) {
        logger.log('Color Previews:');
        logger.log('');

        for (const theme of filteredThemes.slice(0, 3)) { // Limit to first 3 themes
          const lightCSS = await themeManager.getThemeCSS(theme.id, 'light');
          const darkCSS = await themeManager.getThemeCSS(theme.id, 'dark');

          logger.log(`${theme.label} (${theme.id})`);

          if (lightCSS) {
            const lightVariables = colorAnalyzer.parseCSSVariables(lightCSS);
            const lightColors = lightVariables.filter(v => v.color).slice(0, 8);
            logger.log(colorRenderer.renderColorPalette(lightColors, 'Light Mode'));
          }

          if (darkCSS) {
            const darkVariables = colorAnalyzer.parseCSSVariables(darkCSS);
            const darkColors = darkVariables.filter(v => v.color).slice(0, 8);
            logger.log(colorRenderer.renderColorPalette(darkColors, 'Dark Mode'));
          }

          if (theme !== filteredThemes[filteredThemes.length - 1]) {
            logger.log('─'.repeat(50));
          }
        }
      }

      // Show grouped view if requested
      if (options.grouped) {
        logger.log('Themes by Category:');
        logger.log('');

        const grouped = filteredThemes.reduce((acc, theme) => {
          if (!acc[theme.category]) {
            acc[theme.category] = [];
          }
          acc[theme.category].push(theme);
          return acc;
        }, {} as Record<string, typeof filteredThemes>);

        Object.entries(grouped).forEach(([category, categoryThemes]) => {
          logger.log(`${category.toUpperCase()} (${categoryThemes.length})`);

          categoryThemes.forEach(theme => {
            const modes = Object.keys(theme.modes).map(mode =>
              mode === 'light' ? '[LIGHT]' : '[DARK]'
            ).join(', ');
            logger.log(`  • ${theme.label} (${theme.id}) • ${modes}`);
          });

          logger.log('');
        });
      }

      // Summary
      logger.log(`Total: ${filteredThemes.length} theme${filteredThemes.length !== 1 ? 's' : ''}`);

    } catch (error) {
      logger.error('Error listing themes:', error.message);
      process.exit(1);
    }
  });
};

function getCategoryColor(category: string): string {
  switch (category) {
    case 'built-in': return 'blue';
    case 'custom': return 'green';
    case 'external': return 'yellow';
    default: return 'gray';
  }
}