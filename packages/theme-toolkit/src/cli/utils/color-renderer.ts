import chalk from 'chalk';
import type { ParsedColor, ColorVariable } from '../../types/color.js';
import logger from '@mks2508/better-logger';

const renderLogger = logger;

export class ColorRenderer {
  private colorMap: Map<string, string> = new Map();

  constructor() {
    this.initializeColorMap();
  }

  private initializeColorMap() {
    // Pre-defined color mappings for common colors
    this.colorMap.set('#000000', 'black');
    this.colorMap.set('#ffffff', 'white');
    this.colorMap.set('#ff0000', 'red');
    this.colorMap.set('#00ff00', 'green');
    this.colorMap.set('#0000ff', 'blue');
    this.colorMap.set('#ffff00', 'yellow');
    this.colorMap.set('#ff00ff', 'magenta');
    this.colorMap.set('#00ffff', 'cyan');
  }

  renderColorBlock(color: ParsedColor, width: number = 20): string {
    const hex = color.hex.toLowerCase();
    const rgb = color.rgb;

    // Use chalk's background capability if available
    let colorBlock: string;

    try {
      // Try to use chalk with the hex color
      colorBlock = chalk.bgHex(hex)(' '.repeat(width));
    } catch {
      // Fallback to nearest color
      const nearestColor = this.findNearestAnsiColor(rgb);
      colorBlock = chalk.bgColor(nearestColor)(' '.repeat(width));
    }

    return colorBlock;
  }

  private findNearestAnsiColor(rgb: { r: number; g: number; b: number }): number {
    // Simple nearest color matching for 256-color terminals
    const colors = [
      { r: 0, g: 0, b: 0 },     // 0: Black
      { r: 128, g: 0, b: 0 },   // 1: Red
      { r: 0, g: 128, b: 0 },   // 2: Green
      { r: 128, g: 128, b: 0 }, // 3: Yellow
      { r: 0, g: 0, b: 128 },   // 4: Blue
      { r: 128, g: 0, b: 128 }, // 5: Magenta
      { r: 0, g: 128, b: 128 }, // 6: Cyan
      { r: 192, g: 192, b: 192 }, // 7: White
      { r: 128, g: 128, b: 128 }, // 8: Bright Black
      { r: 255, g: 0, b: 0 },   // 9: Bright Red
      { r: 0, g: 255, b: 0 },   // 10: Bright Green
      { r: 255, g: 255, b: 0 }, // 11: Bright Yellow
      { r: 0, g: 0, b: 255 },   // 12: Bright Blue
      { r: 255, g: 0, b: 255 }, // 13: Bright Magenta
      { r: 0, g: 255, b: 255 }, // 14: Bright Cyan
      { r: 255, g: 255, b: 255 }  // 15: Bright White
    ];

    let minDistance = Infinity;
    let nearestIndex = 0;

    colors.forEach((color, index) => {
      const distance = Math.sqrt(
        Math.pow(rgb.r - color.r, 2) +
        Math.pow(rgb.g - color.g, 2) +
        Math.pow(rgb.b - color.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  renderColorVariable(variable: ColorVariable, showDetails: boolean = true): string {
    if (!variable.color) {
      return `${chalk.gray(variable.name)}: ${chalk.yellow(variable.value)}`;
    }

    const colorBlock = this.renderColorBlock(variable.color);
    const details = showDetails ? this.formatColorDetails(variable.color) : '';

    return [
      `${chalk.bold(variable.name)}`,
      `${colorBlock}`,
      `${chalk.cyan(variable.value)}`,
      details
    ].filter(Boolean).join(' ');
  }

  private formatColorDetails(color: ParsedColor): string {
    const details = [
      chalk.dim(`oklch(${color.oklch.l.toFixed(2)} ${color.oklch.c.toFixed(3)} ${color.oklch.h.toFixed(1)})`),
      chalk.dim(`${color.hex.toUpperCase()}`)
    ];

    return chalk.dim(`[${details.join(', ')}]`);
  }

  renderColorPalette(variables: ColorVariable[], title: string): string {
    const colorVariables = variables.filter(v => v.color);
    if (colorVariables.length === 0) {
      return chalk.yellow(`No colors found in ${title}`);
    }

    const lines = [
      chalk.bold.underline(title),
      '',
      ...colorVariables.map(variable => `  ${this.renderColorVariable(variable)}`),
      ''
    ];

    return lines.join('\n');
  }

  renderSemanticGroups(groups: Array<{ name: string; variables: ColorVariable[] }>): string {
    const lines: string[] = [];

    groups.forEach(group => {
      const colorVariables = group.variables.filter(v => v.color);
      if (colorVariables.length === 0) return;

      lines.push(chalk.bold.underline(group.name));
      lines.push('');

      if (group.description) {
        lines.push(chalk.dim(group.description));
        lines.push('');
      }

      colorVariables.forEach(variable => {
        lines.push(`  ${this.renderColorVariable(variable)}`);
      });

      lines.push('');
    });

    return lines.join('\n');
  }

  renderContrastPair(foreground: ColorVariable, background: ColorVariable, ratio: number, wcag: any): string {
    if (!foreground.color || !background.color) {
      return '';
    }

    const fgBlock = this.renderColorBlock(foreground.color, 8);
    const bgBlock = this.renderColorBlock(background.color, 8);

    const ratioText = this.formatContrastRatio(ratio);
    const wcagText = this.formatWCAGResult(wcag);

    return [
      `${fgBlock} ${chalk.bold(foreground.name)} vs`,
      `${bgBlock} ${chalk.bold(background.name)}`,
      `  ${ratioText} ${wcagText}`
    ].join('\n');
  }

  private formatContrastRatio(ratio: number): string {
    let color: chalk.Chalk;
    if (ratio >= 7) color = chalk.green;
    else if (ratio >= 4.5) color = chalk.yellow;
    else if (ratio >= 3) color = chalk.hex('#ff9800');
    else color = chalk.red;

    return color(`${ratio.toFixed(2)}:1`);
  }

  private formatWCAGResult(wcag: any): string {
    let emoji = '';
    let color: chalk.Chalk;

    switch (wcag.level) {
      case 'aaa-large':
        emoji = '🟢';
        color = chalk.green;
        break;
      case 'aaa':
        emoji = '🟡';
        color = chalk.yellow;
        break;
      case 'aa':
        emoji = '🟠';
        color = chalk.hex('#ff9800');
        break;
      case 'aa-large':
        emoji = '🔴';
        color = chalk.red;
        break;
      default:
        emoji = '❌';
        color = chalk.red;
    }

    return color(`${emoji} ${wcag.level.toUpperCase()}`);
  }

  renderAccessibilityScore(score: { overall: number; grade: string; contrast: number }): string {
    let gradeColor: chalk.Chalk;
    switch (score.grade) {
      case 'A': gradeColor = chalk.green.bold; break;
      case 'B': gradeColor = chalk.yellow.bold; break;
      case 'C': gradeColor = chalk.hex('#ff9800').bold; break;
      case 'D': gradeColor = chalk.red.bold; break;
      default: gradeColor = chalk.red.bold; break;
    }

    return [
      chalk.bold('Accessibility Score:'),
      `  Overall: ${gradeColor(`${score.overall}/100 (${score.grade})`)}`,
      `  Contrast: ${this.formatScore(score.contrast)}`
    ].join('\n');
  }

  private formatScore(score: number): string {
    let color: chalk.Chalk;
    if (score >= 90) color = chalk.green;
    else if (score >= 80) color = chalk.yellow;
    else if (score >= 70) color = chalk.hex('#ff9800');
    else color = chalk.red;

    return color(`${score}/100`);
  }

  renderColorGrid(variables: ColorVariable[], columns: number = 4): string {
    const colorVariables = variables.filter(v => v.color);
    if (colorVariables.length === 0) {
      return chalk.yellow('No colors to display');
    }

    const lines: string[] = [];
    const rows = Math.ceil(colorVariables.length / columns);

    for (let row = 0; row < rows; row++) {
      const rowColors: string[] = [];

      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < colorVariables.length) {
          const variable = colorVariables[index];
          const colorBlock = this.renderColorBlock(variable.color, 12);
          rowColors.push(`${colorBlock}\n${chalk.dim(variable.name.replace('--', ''))}`);
        } else {
          rowColors.push(' '.repeat(12) + '\n' + ' '.repeat(12));
        }
      }

      lines.push(rowColors.join('  '));
      if (row < rows - 1) lines.push('');
    }

    return lines.join('\n');
  }

  renderColorGradient(colors: ParsedColor[], width: number = 40): string {
    if (colors.length < 2) {
      return chalk.yellow('Need at least 2 colors for gradient');
    }

    const gradient: string[] = [];

    for (let i = 0; i < width; i++) {
      const t = i / (width - 1);
      const color = this.interpolateColor(colors[0], colors[colors.length - 1], t);
      gradient.push(chalk.bgHex(color.hex)(' '));
    }

    return gradient.join('');
  }

  private interpolateColor(color1: ParsedColor, color2: ParsedColor, t: number): ParsedColor {
    const oklch1 = color1.oklch;
    const oklch2 = color2.oklch;

    // Interpolate in OKLCH space for better perceptual results
    const l = oklch1.l + (oklch2.l - oklch1.l) * t;
    const c = oklch1.c + (oklch2.c - oklch1.c) * t;

    // Handle hue interpolation across the 0/360 boundary
    let h: number;
    const deltaH = oklch2.h - oklch1.h;
    if (Math.abs(deltaH) <= 180) {
      h = oklch1.h + deltaH * t;
    } else {
      const direction = deltaH > 0 ? -360 : 360;
      h = oklch1.h + (deltaH + direction) * t;
    }

    return {
      oklch: { l, c, h: (h + 360) % 360 },
      hex: this.oklchToHex(l, c, h),
      rgb: this.oklchToRgb(l, c, h),
      hsl: { h: h * 180 / Math.PI, s: 0, l: l * 100 }
    };
  }

  private oklchToHex(l: number, c: number, h: number): string {
    const rgb = this.oklchToRgb(l, c, h);
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
  }

  private oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
    // Simplified OKLCH to RGB conversion
    // In a real implementation, you'd use a proper color library
    const srgb = this.oklchToSrgb(l, c, h);
    return {
      r: Math.round(Math.max(0, Math.min(255, srgb.r * 255))),
      g: Math.round(Math.max(0, Math.min(255, srgb.g * 255))),
      b: Math.round(Math.max(0, Math.min(255, srgb.b * 255)))
    };
  }

  private oklchToSrgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
    // Very simplified OKLCH to sRGB conversion
    // This is a placeholder - use a proper color library in production
    const hRad = h * Math.PI / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // Simplified conversion - NOT ACCURATE
    const r = l + 0.396 * a + 0.215 * b;
    const g = l - 0.212 * a - 0.134 * b;
    const bl = l - 0.214 * a - 0.496 * b;

    return {
      r: Math.max(0, Math.min(1, r)),
      g: Math.max(0, Math.min(1, g)),
      b: Math.max(0, Math.min(1, bl))
    };
  }
}