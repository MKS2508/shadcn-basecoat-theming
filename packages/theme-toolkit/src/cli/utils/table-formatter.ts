import Table from 'cli-table3';
import chalk from 'chalk';
import type { Theme, ColorVariable, ColorAccessibilityReport } from '../../types/color.js';

export class TableFormatter {
  renderThemesList(themes: Theme[]): string {
    const table = new Table({
      head: [
        chalk.bold('ID'),
        chalk.bold('Name'),
        chalk.bold('Category'),
        chalk.bold('Modes'),
        chalk.bold('Updated')
      ],
      colWidths: [15, 20, 12, 15, 20],
      wordWrap: true
    });

    themes.forEach(theme => {
      const modes = [];
      if (theme.modes.light) modes.push(chalk.green('Light'));
      if (theme.modes.dark) modes.push(chalk.blue('Dark'));

      const categoryColor = this.getCategoryColor(theme.category);
      const lastUpdated = theme.metadata?.updatedAt
        ? new Date(theme.metadata.updatedAt).toLocaleDateString()
        : 'Unknown';

      table.push([
        theme.id,
        theme.label,
        categoryColor(theme.category),
        modes.join('\n') || chalk.dim('None'),
        lastUpdated
      ]);
    });

    return table.toString();
  }

  renderThemeDetails(theme: Theme): string {
    const table = new Table({
      head: [chalk.bold('Property'), chalk.bold('Value')],
      colWidths: [20, 50],
      wordWrap: true
    });

    table.push(
      [chalk.cyan('ID'), theme.id],
      [chalk.cyan('Name'), theme.label],
      [chalk.cyan('Description'), theme.description],
      [chalk.cyan('Author'), theme.author],
      [chalk.cyan('Version'), theme.version],
      [chalk.cyan('Category'), this.getCategoryColor(theme.category)(theme.category)],
      [chalk.cyan('Source'), theme.source],
      [chalk.cyan('Modes'), Object.keys(theme.modes).join(', ') || 'None'],
      [chalk.cyan('Created'), theme.metadata?.createdAt || 'Unknown'],
      [chalk.cyan('Updated'), theme.metadata?.updatedAt || 'Unknown'],
      [chalk.cyan('Tags'), theme.metadata?.tags?.join(', ') || 'None']
    );

    return table.toString();
  }

  renderColorVariables(variables: ColorVariable[], showDetails: boolean = true): string {
    const colorVariables = variables.filter(v => v.color);
    if (colorVariables.length === 0) {
      return chalk.yellow('No color variables found');
    }

    const table = new Table({
      head: [
        chalk.bold('Variable'),
        chalk.bold('Color'),
        chalk.bold('Value'),
        ...(showDetails ? [chalk.bold('Details')] : []),
        chalk.bold('Category'),
        chalk.bold('Semantic')
      ],
      colWidths: [25, 8, 20, showDetails ? 25 : 0, 12, 15],
      wordWrap: true
    });

    colorVariables.forEach(variable => {
      const colorBlock = this.renderColorBlock(variable.color!);
      const details = showDetails ? this.formatColorDetails(variable.color!) : '';
      const categoryColor = this.getCategoryColor(variable.category);
      const semanticColor = this.getSemanticColor(variable.semantic);

      const row = [
        variable.name,
        colorBlock,
        variable.value,
        ...(showDetails ? [chalk.dim(details)] : []),
        categoryColor(variable.category),
        semanticColor(variable.semantic)
      ];

      table.push(row);
    });

    return table.toString();
  }

  renderAccessibilityReport(report: ColorAccessibilityReport): string {
    const sections: string[] = [];

    // Overview
    sections.push(chalk.bold.underline('Accessibility Overview'));
    sections.push('');

    const overviewTable = new Table({
      head: [chalk.bold('Metric'), chalk.bold('Value')],
      colWidths: [20, 30]
    });

    const scoreColor = this.getScoreColor(report.overallScore.grade);
    overviewTable.push(
      ['Overall Score', scoreColor(`${report.overallScore.overall}/100 (${report.overallScore.grade})`)],
      ['Contrast Score', this.formatScore(report.overallScore.contrast)],
      ['Total Variables', report.totalVariables.toString()],
      ['Color Groups', report.colorGroups.length.toString()],
      ['Contrast Pairs', report.contrastPairs.length.toString()],
      ['Issues Found', report.issues.length.toString()]
    );

    sections.push(overviewTable.toString());
    sections.push('');

    // Contrast Pairs
    if (report.contrastPairs.length > 0) {
      sections.push(chalk.bold.underline('Contrast Analysis'));
      sections.push('');

      const contrastTable = new Table({
        head: [
          chalk.bold('Foreground'),
          chalk.bold('Background'),
          chalk.bold('Ratio'),
          chalk.bold('WCAG AA'),
          chalk.bold('WCAG AAA'),
          chalk.bold('Status')
        ],
        colWidths: [20, 20, 10, 10, 10, 15]
      });

      report.contrastPairs.forEach(pair => {
        const ratioColor = this.getContrastColor(pair.ratio);
        const aaStatus = pair.wcag.aa ? chalk.green('✓') : chalk.red('✗');
        const aaaStatus = pair.wcag.aaa ? chalk.green('✓') : chalk.red('✗');
        const statusColor = this.getWCAGStatusColor(pair.wcag.level);

        contrastTable.push([
          pair.foreground.name,
          pair.background.name,
          ratioColor(`${pair.ratio.toFixed(2)}:1`),
          aaStatus,
          aaaStatus,
          statusColor(pair.wcag.level.toUpperCase())
        ]);
      });

      sections.push(contrastTable.toString());
      sections.push('');
    }

    // Issues
    if (report.issues.length > 0) {
      sections.push(chalk.bold.underline('Accessibility Issues'));
      sections.push('');

      const issuesTable = new Table({
        head: [
          chalk.bold('Type'),
          chalk.bold('Severity'),
          chalk.bold('Description'),
          chalk.bold('Variables')
        ],
        colWidths: [12, 10, 40, 25]
      });

      report.issues.forEach(issue => {
        const severityColor = this.getSeverityColor(issue.severity);
        const typeColor = this.getIssueTypeColor(issue.type);

        issuesTable.push([
          typeColor(issue.type),
          severityColor(issue.severity),
          issue.description,
          issue.variables.join(', ')
        ]);
      });

      sections.push(issuesTable.toString());
      sections.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      sections.push(chalk.bold.underline('Recommendations'));
      sections.push('');

      report.recommendations.forEach((rec, index) => {
        sections.push(`${chalk.cyan((index + 1).toString())}. ${rec}`);
      });
    }

    return sections.join('\n');
  }

  renderSemanticGroups(groups: Array<{ category: string; variables: ColorVariable[]; completeness: number }>): string {
    const table = new Table({
      head: [
        chalk.bold('Category'),
        chalk.bold('Variables'),
        chalk.bold('Count'),
        chalk.bold('Completeness')
      ],
      colWidths: [20, 40, 8, 12]
    });

    groups.forEach(group => {
      const variables = group.variables.map(v => v.name.replace('--', '')).join(', ');
      const completenessColor = this.getCompletenessColor(group.completeness);

      table.push([
        chalk.bold(group.category),
        chalk.dim(variables),
        group.variables.length.toString(),
        completenessColor(`${group.completeness}%`)
      ]);
    });

    return table.toString();
  }

  private renderColorBlock(color: any): string {
    // Simple color block representation
    return chalk.bgHex(color.hex)('  ');
  }

  private formatColorDetails(color: any): string {
    return `oklch(${color.oklch.l.toFixed(2)} ${color.oklch.c.toFixed(3)} ${color.oklch.h.toFixed(1)})`;
  }

  private getCategoryColor(category: string): chalk.Chalk {
    switch (category) {
      case 'built-in': return chalk.blue;
      case 'custom': return chalk.green;
      case 'external': return chalk.yellow;
      case 'primary': return chalk.magenta;
      case 'secondary': return chalk.cyan;
      default: return chalk.gray;
    }
  }

  private getSemanticColor(semantic: string): chalk.Chalk {
    switch (semantic) {
      case 'background': return chalk.bgWhite;
      case 'foreground': return chalk.bgBlack;
      case 'primary': return chalk.bgMagenta;
      case 'accent': return chalk.bgCyan;
      default: return chalk.gray;
    }
  }

  private getScoreColor(grade: string): chalk.Chalk {
    switch (grade) {
      case 'A': return chalk.green.bold;
      case 'B': return chalk.yellow.bold;
      case 'C': return chalk.hex('#ff9800').bold;
      case 'D': return chalk.red.bold;
      default: return chalk.red.bold;
    }
  }

  private formatScore(score: number): string {
    let color: chalk.Chalk;
    if (score >= 90) color = chalk.green;
    else if (score >= 80) color = chalk.yellow;
    else if (score >= 70) color = chalk.hex('#ff9800');
    else color = chalk.red;

    return color(`${score}/100`);
  }

  private getContrastColor(ratio: number): chalk.Chalk {
    if (ratio >= 7) return chalk.green;
    else if (ratio >= 4.5) return chalk.yellow;
    else if (ratio >= 3) return chalk.hex('#ff9800');
    else return chalk.red;
  }

  private getWCAGStatusColor(level: string): chalk.Chalk {
    switch (level) {
      case 'aaa-large': return chalk.green;
      case 'aaa': return chalk.yellow;
      case 'aa': return chalk.hex('#ff9800');
      case 'aa-large': return chalk.red;
      default: return chalk.red;
    }
  }

  private getSeverityColor(severity: string): chalk.Chalk {
    switch (severity) {
      case 'critical': return chalk.red.bold;
      case 'high': return chalk.red;
      case 'medium': return chalk.hex('#ff9800');
      case 'low': return chalk.yellow;
      default: return chalk.gray;
    }
  }

  private getIssueTypeColor(type: string): chalk.Chalk {
    switch (type) {
      case 'contrast': return chalk.magenta;
      case 'semantics': return chalk.cyan;
      case 'color-blindness': return chalk.yellow;
      case 'usage': return chalk.blue;
      default: return chalk.gray;
    }
  }

  private getCompletenessColor(completeness: number): chalk.Chalk {
    if (completeness >= 90) return chalk.green;
    else if (completeness >= 70) return chalk.yellow;
    else if (completeness >= 50) return chalk.hex('#ff9800');
    else return chalk.red;
  }
}