import { Command } from 'commander';
import chalk from 'chalk';
import type { ThemeManager, ColorAnalyzer, ColorRenderer, TableFormatter } from '../../types/index.js';

export const analyzeCommand = (services: any) => {
  const { themeManager, colorAnalyzer, colorRenderer, tableFormatter, chalk } = services;

  return new Command('analyze')
    .description('Perform comprehensive theme analysis')
    .argument('<theme-id>', 'Theme ID to analyze')
    .option('-m, --mode <mode>', 'Analysis mode (light|dark)', 'light')
    .option('--colors', 'Include color analysis', true)
    .option('--contrast', 'Include contrast analysis', true)
    .option('--semantic', 'Include semantic analysis', true)
    .option('--accessibility', 'Include accessibility report', true)
    .option('--color-blindness', 'Test color blindness accessibility')
    .option('--detailed', 'Show detailed analysis')
    .action(async (themeId, options, command) => {
      const logger = command.parent?.getLogger?.() || console;

    try {
      logger.log(chalk.bold(`🔍 Analysis: ${themeId} (${options.mode})`));
      logger.log('');

      // Get theme
      const theme = await themeManager.getThemeById(themeId);
      if (!theme) {
        logger.error(chalk.red(`Theme "${themeId}" not found`));
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

      // Color Analysis
      if (options.colors) {
        logger.log(chalk.bold.underline('🎨 Color Analysis'));
        logger.log('');

        const colorGroups = colorAnalyzer.groupColorsByCategory(colorVariables);
        colorGroups.forEach(group => {
          logger.log(chalk.bold(`${group.name} (${group.colorCount} colors)`));
          logger.log(chalk.dim(group.description));
          logger.log(chalk.dim(`Harmony: ${group.harmony.type} - ${group.harmony.description}`));

          if (options.detailed) {
            group.variables.forEach(variable => {
              logger.log(`  ${colorRenderer.renderColorVariable(variable, false)}`);
            });
          } else {
            logger.log(colorRenderer.renderColorGrid(group.variables, 6));
          }
          logger.log('');
        });
      }

      // Semantic Analysis
      if (options.semantic) {
        logger.log(chalk.bold.underline('📋 Semantic Analysis'));
        logger.log('');

        const semanticAnalysis = colorAnalyzer.generateSemanticAnalysis(themeId, options.mode, variables);

        // Semantic groups table
        const semanticTable = [];
        semanticAnalysis.groups.forEach(group => {
          semanticTable.push({
            category: group.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            variables: group.variables.length,
            completeness: `${group.completeness}%`,
            patterns: group.patterns.length
          });
        });

        const table = new Table({
          head: ['Category', 'Variables', 'Completeness', 'Patterns'],
          colWidths: [20, 10, 12, 10]
        });

        semanticTable.forEach(row => {
          const completenessColor = getCompletenessColor(parseInt(row.completeness));
          table.push([
            row.category,
            row.variables,
            completenessColor(row.completeness),
            row.patterns
          ]);
        });

        logger.log(table.toString());
        logger.log('');

        // Inconsistencies
        if (semanticAnalysis.inconsistencies.length > 0) {
          logger.log(chalk.yellow('⚠️  Semantic Inconsistencies:'));
          semanticAnalysis.inconsistencies.forEach(issue => {
            const severityColor = getSeverityColor(issue.severity);
            logger.log(`  ${severityColor(issue.severity.toUpperCase())}: ${issue.description}`);
            if (options.detailed) {
              logger.log(`    Variables: ${issue.variables.join(', ')}`);
            }
          });
          logger.log('');
        }

        // Recommendations
        if (semanticAnalysis.recommendations.length > 0) {
          logger.log(chalk.blue('💡 Semantic Recommendations:'));
          semanticAnalysis.recommendations.forEach((rec, index) => {
            logger.log(`  ${chalk.cyan((index + 1).toString())}. ${rec.description}`);
          });
          logger.log('');
        }
      }

      // Contrast Analysis
      if (options.contrast) {
        logger.log(chalk.bold.underline('👁 Contrast Analysis'));
        logger.log('');

        const contrastPairs = colorAnalyzer.analyzeContrastPairs(colorVariables);

        if (contrastPairs.length === 0) {
          logger.log(chalk.yellow('No contrast pairs found'));
        } else {
          // Summary
          const passingAA = contrastPairs.filter(p => p.wcag.aa).length;
          const passingAAA = contrastPairs.filter(p => p.wcag.aaa).length;
          const failing = contrastPairs.filter(p => p.wcag.level === 'fail').length;

          logger.log(`WCAG Compliance Summary:`);
          logger.log(`  ${chalk.green('✓')} AA Compliant: ${passingAA}/${contrastPairs.length} (${Math.round(passingAA / contrastPairs.length * 100)}%)`);
          logger.log(`  ${chalk.green('✓✓')} AAA Compliant: ${passingAAA}/${contrastPairs.length} (${Math.round(passingAAA / contrastPairs.length * 100)}%)`);
          logger.log(`  ${chalk.red('✗')} Failing: ${failing}/${contrastPairs.length} (${Math.round(failing / contrastPairs.length * 100)}%)`);
          logger.log('');

          // Detailed pairs if requested
          if (options.detailed) {
            contrastPairs.forEach(pair => {
              logger.log(colorRenderer.renderContrastPair(
                pair.foreground,
                pair.background,
                pair.ratio,
                pair.wcag
              ));
              logger.log('');
            });
          } else {
            // Top failing pairs
            const failingPairs = contrastPairs.filter(p => p.wcag.level === 'fail').slice(0, 3);
            if (failingPairs.length > 0) {
              logger.log(chalk.red('⚠️  Worst Contrast Issues:'));
              failingPairs.forEach(pair => {
                logger.log(`  ${chalk.bold(pair.foreground.name)} / ${chalk.bold(pair.background.name)}: ${chalk.red(pair.ratio.toFixed(2) + ':1')}`);
              });
              logger.log('');
            }
          }
        }
      }

      // Accessibility Report
      if (options.accessibility) {
        logger.log(chalk.bold.underline('♿ Accessibility Report'));
        logger.log('');

        const accessibilityReport = colorAnalyzer.generateAccessibilityReport(themeId, options.mode, variables);

        // Overall score
        logger.log(colorRenderer.renderAccessibilityScore(accessibilityReport.overallScore));
        logger.log('');

        // Issues summary
        if (accessibilityReport.issues.length > 0) {
          const critical = accessibilityReport.issues.filter(i => i.severity === 'critical').length;
          const high = accessibilityReport.issues.filter(i => i.severity === 'high').length;
          const medium = accessibilityReport.issues.filter(i => i.severity === 'medium').length;
          const low = accessibilityReport.issues.filter(i => i.severity === 'low').length;

          logger.log(`${chalk.bold('Issues Summary:')} ${critical} critical, ${high} high, ${medium} medium, ${low} low`);
          logger.log('');

          if (options.detailed) {
            logger.log(tableFormatter.renderAccessibilityReport(accessibilityReport));
          }
        } else {
          logger.log(chalk.green('🎉 No accessibility issues found!'));
          logger.log('');
        }
      }

      // Color Blindness Test
      if (options.colorBlindness) {
        logger.log(chalk.bold.underline('👨‍🦯 Color Blindness Simulation'));
        logger.log('');

        const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

        for (const type of types) {
          const simulation = colorAnalyzer.simulateColorBlindness(colorVariables, type);
          const problematicColors = simulation.colors.filter(c => !c.distinguishable);

          logger.log(chalk.bold(`${type.charAt(0).toUpperCase() + type.slice(1)}:`));

          if (problematicColors.length === 0) {
            logger.log(chalk.green('  ✓ All colors remain distinguishable'));
          } else {
            logger.log(chalk.yellow(`  ⚠️  ${problematicColors.length} colors may be difficult to distinguish`));

            if (options.detailed) {
              problematicColors.forEach(color => {
                logger.log(`    • ${color.original} → ${color.simulated} (ΔE: ${color.deltaE.toFixed(1)})`);
              });
            }
          }
          logger.log('');
        }
      }

      // Analysis Summary
      logger.log(chalk.bold.underline('📊 Analysis Summary'));
      logger.log('');
      logger.log(`Theme: ${chalk.bold(theme.label)} (${theme.id})`);
      logger.log(`Mode: ${chalk.bold(options.mode)}`);
      logger.log(`Total Variables: ${chalk.bold(variables.length.toString())}`);
      logger.log(`Color Variables: ${chalk.bold(colorVariables.length.toString())}`);
      logger.log(`Analysis Date: ${chalk.bold(new Date().toLocaleString())}`);

    } catch (error) {
      logger.error(chalk.red('Error during analysis:'), error.message);
      process.exit(1);
    }
    });
};

function getCompletenessColor(score: number): chalk.Chalk {
  if (score >= 90) return chalk.green;
  else if (score >= 70) return chalk.yellow;
  else if (score >= 50) return chalk.hex('#ff9800');
  else return chalk.red;
}

function getSeverityColor(severity: string): chalk.Chalk {
  switch (severity) {
    case 'critical': return chalk.red.bold;
    case 'high': return chalk.red;
    case 'medium': return chalk.hex('#ff9800');
    case 'low': return chalk.yellow;
    default: return chalk.gray;
  }
}