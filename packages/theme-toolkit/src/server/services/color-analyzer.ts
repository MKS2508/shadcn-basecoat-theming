import { parse, converter } from 'culori';
import ColorContrastChecker from 'color-contrast-checker';
// import { deltaE } from 'delta-e';
import type {
  ColorVariable,
  ParsedColor,
  ColorGroup,
  ColorCategory,
  SemanticCategory,
  ColorPalette,
  ColorHarmony,
  ColorAccessibilityReport,
  AccessibilityScore,
  AccessibilityIssue,
  WCAGResult,
  SemanticAnalysis,
  SemanticGroup,
  SemanticPattern,
  SemanticInconsistency,
  SemanticRecommendation,
  ColorBlindnessSimulation,
  ColorMapping
} from '@/types/color.js';
import logger from '@mks2508/better-logger';

const colorLogger = logger;

export class ColorAnalyzer {
  private contrastChecker: ColorContrastChecker;

  constructor() {
    this.contrastChecker = new ColorContrastChecker();
    colorLogger.success('Color Analyzer initialized');
  }

  private formatHex(color: any): string {
    // Simple hex formatter
    if (color.mode === 'rgb') {
      const r = Math.round((color.r || 0) * 255);
      const g = Math.round((color.g || 0) * 255);
      const b = Math.round((color.b || 0) * 255);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return color.hex || '#000000';
  }

  parseCSSVariables(css: string): ColorVariable[] {
    colorLogger.info('Parsing CSS variables');
    const variables: ColorVariable[] = [];
    const lines = css.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Match CSS custom properties
      const match = trimmed.match(/^--([^:]+):\s*(.+);?$/);
      if (match) {
        const [, name, value] = match;
        const cleanValue = value.replace(';', '').trim();

        try {
          const parsedColor = this.parseColor(cleanValue);
          if (parsedColor) {
            variables.push({
              name: `--${name}`,
              value: cleanValue,
              color: parsedColor,
              category: this.categorizeColor(name),
              semantic: this.categorizeSemantic(name),
              usage: this.detectUsage(name)
            });
          } else {
            // Non-color variables
            variables.push({
              name: `--${name}`,
              value: cleanValue,
              category: 'neutral',
              semantic: this.categorizeSemantic(name),
              usage: this.detectUsage(name)
            });
          }
        } catch (error) {
          colorLogger.warn(`Failed to parse color variable ${name}: ${error.message}`);
        }
      }
    });

    colorLogger.success(`Parsed ${variables.length} CSS variables`);
    return variables;
  }

  parseColor(colorString: string): ParsedColor | null {
    try {
      const color = parse(colorString);
      if (!color) return null;

      const oklchColor = converter('oklch')(color);
      const rgbColor = converter('rgb')(color);
      const hslColor = converter('hsl')(color);

      const parsed: ParsedColor = {
        oklch: {
          l: oklchColor.l || 0,
          c: oklchColor.c || 0,
          h: oklchColor.h || 0
        },
        hex: this.formatHex(color),
        rgb: {
          r: Math.round((rgbColor.r || 0) * 255),
          g: Math.round((rgbColor.g || 0) * 255),
          b: Math.round((rgbColor.b || 0) * 255)
        },
        hsl: {
          h: hslColor.h || 0,
          s: (hslColor.s || 0) * 100,
          l: (hslColor.l || 0) * 100
        }
      };

      // Add P3 color space if available
      if (color.mode === 'oklch') {
        const p3Color = converter('p3')(color);
        if (p3Color) {
          parsed.p3 = {
            r: (p3Color.r || 0) * 255,
            g: (p3Color.g || 0) * 255,
            b: (p3Color.b || 0) * 255
          };
        }
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  categorizeColor(name: string): ColorCategory {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('primary')) return 'primary';
    if (lowerName.includes('secondary')) return 'secondary';
    if (lowerName.includes('accent')) return 'accent';
    if (lowerName.includes('destructive') || lowerName.includes('error')) return 'destructive';
    if (lowerName.includes('warning') || lowerName.includes('caution')) return 'warning';
    if (lowerName.includes('success') || lowerName.includes('positive')) return 'success';
    if (lowerName.includes('info') || lowerName.includes('neutral')) return 'info';

    return 'neutral';
  }

  categorizeSemantic(name: string): SemanticCategory {
    const lowerName = name.toLowerCase();

    // Backgrounds
    if (lowerName.includes('background')) return 'background';
    if (lowerName.includes('card')) return 'card';
    if (lowerName.includes('popover')) return 'popover';
    if (lowerName.includes('muted')) return 'muted';

    // Foregrounds
    if (lowerName.includes('foreground')) return 'foreground';

    // Interactive elements
    if (lowerName.includes('primary') && !lowerName.includes('foreground')) return 'accent';
    if (lowerName.includes('accent')) return 'accent';
    if (lowerName.includes('ring')) return 'ring';

    // Structural
    if (lowerName.includes('border')) return 'border';
    if (lowerName.includes('input')) return 'input';

    // Status colors
    if (lowerName.includes('destructive')) return 'destructive';
    if (lowerName.includes('warning')) return 'warning';

    // Specialized
    if (lowerName.includes('sidebar')) return 'sidebar';
    if (lowerName.includes('chart')) return 'chart';
    if (lowerName.includes('shadow')) return 'shadow';
    if (lowerName.includes('font') || lowerName.includes('text')) return 'font';
    if (lowerName.includes('spacing') || lowerName.includes('size')) return 'spacing';

    return 'other';
  }

  detectUsage(name: string): string[] {
    const lowerName = name.toLowerCase();
    const usage: string[] = [];

    if (lowerName.includes('text') || lowerName.includes('foreground')) usage.push('text');
    if (lowerName.includes('background')) usage.push('background');
    if (lowerName.includes('border')) usage.push('border');
    if (lowerName.includes('ring') || lowerName.includes('outline')) usage.push('outline');
    if (lowerName.includes('fill')) usage.push('fill');
    if (lowerName.includes('shadow')) usage.push('shadow');

    return usage.length > 0 ? usage : ['fill'];
  }

  groupColorsByCategory(variables: ColorVariable[]): ColorGroup[] {
    colorLogger.info('Grouping colors by category');
    const groups: Map<ColorCategory, ColorVariable[]> = new Map();

    variables.forEach(variable => {
      if (variable.color) {
        const category = variable.category;
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(variable);
      }
    });

    const colorGroups: ColorGroup[] = [];

    groups.forEach((colorVariables, category) => {
      const harmony = this.analyzeColorHarmony(colorVariables);

      colorGroups.push({
        name: this.getCategoryName(category),
        description: this.getCategoryDescription(category),
        variables: colorVariables,
        colorCount: colorVariables.length,
        harmony
      });
    });

    colorLogger.success(`Created ${colorGroups.length} color groups`);
    return colorGroups;
  }

  analyzeColorHarmony(variables: ColorVariable[]): ColorHarmony {
    if (variables.length < 2) {
      return {
        type: 'monochromatic',
        description: 'Single color or monochromatic palette',
        relationships: []
      };
    }

    const hues = variables
      .map(v => v.color?.oklch.h || 0)
      .filter(h => h > 0);

    if (hues.length < 2) {
      return {
        type: 'monochromatic',
        description: 'Monochromatic color palette',
        relationships: []
      };
    }

    // Simple harmony detection
    const sortedHues = [...hues].sort((a, b) => a - b);
    const differences: number[] = [];

    for (let i = 1; i < sortedHues.length; i++) {
      differences.push(sortedHues[i] - sortedHues[i - 1]);
    }
    differences.push(360 - sortedHues[sortedHues.length - 1] + sortedHues[0]);

    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;

    let type: ColorHarmony['type'] = 'analogous';
    let description = 'Analogous color harmony';

    if (this.isCloseTo(avgDifference, 180, 15)) {
      type = 'complementary';
      description = 'Complementary color harmony';
    } else if (this.isCloseTo(avgDifference, 120, 15)) {
      type = 'triadic';
      description = 'Triadic color harmony';
    } else if (this.isCloseTo(avgDifference, 150, 15)) {
      type = 'split-complementary';
      description = 'Split-complementary color harmony';
    } else if (avgDifference < 45) {
      type = 'monochromatic';
      description = 'Monochromatic or analogous palette';
    }

    return {
      type,
      description,
      relationships: [] // TODO: Implement detailed relationship analysis
    };
  }

  private isCloseTo(value: number, target: number, tolerance: number): boolean {
    return Math.abs(value - target) <= tolerance;
  }

  private getCategoryName(category: ColorCategory): string {
    const names = {
      primary: 'Primary Colors',
      secondary: 'Secondary Colors',
      accent: 'Accent Colors',
      neutral: 'Neutral Colors',
      destructive: 'Destructive Colors',
      warning: 'Warning Colors',
      success: 'Success Colors',
      info: 'Info Colors'
    };
    return names[category] || 'Other Colors';
  }

  private getCategoryDescription(category: ColorCategory): string {
    const descriptions = {
      primary: 'Main brand colors and primary actions',
      secondary: 'Secondary colors and alternative actions',
      accent: 'Emphasis and highlight colors',
      neutral: 'Background, text, and structural colors',
      destructive: 'Error states and destructive actions',
      warning: 'Warning states and caution messages',
      success: 'Success states and positive feedback',
      info: 'Informational colors and neutral messages'
    };
    return descriptions[category] || 'Other color categories';
  }

  generateAccessibilityReport(themeId: string, mode: 'light' | 'dark', variables: ColorVariable[]): ColorAccessibilityReport {
    colorLogger.info(`Generating accessibility report for ${themeId} (${mode})`);

    const colorVariables = variables.filter(v => v.color);
    const groups = this.groupColorsByCategory(colorVariables);
    const contrastPairs = this.analyzeContrastPairs(colorVariables);
    const issues = this.identifyAccessibilityIssues(colorVariables, contrastPairs);
    const recommendations = this.generateRecommendations(issues);
    const overallScore = this.calculateAccessibilityScore(contrastPairs, issues);

    const report: ColorAccessibilityReport = {
      themeId,
      mode,
      totalVariables: colorVariables.length,
      colorGroups: groups,
      contrastPairs,
      overallScore,
      issues,
      recommendations
    };

    colorLogger.success(`Accessibility report generated with score: ${overallScore.grade}`);
    return report;
  }

  analyzeContrastPairs(variables: ColorVariable[]): Array<{
    foreground: ColorVariable;
    background: ColorVariable;
    ratio: number;
    wcag: WCAGResult;
    usage: string[];
  }> {
    const pairs: Array<{
      foreground: ColorVariable;
      background: ColorVariable;
      ratio: number;
      wcag: WCAGResult;
      usage: string[];
    }> = [];

    // Common color pair combinations
    const combinations = [
      { foreground: 'foreground', background: 'background' },
      { foreground: 'primary', background: 'background' },
      { foreground: 'secondary', background: 'background' },
      { foreground: 'accent', background: 'background' },
      { foreground: 'muted-foreground', background: 'muted' },
      { foreground: 'card-foreground', background: 'card' },
      { foreground: 'popover-foreground', background: 'popover' },
      { foreground: 'primary-foreground', background: 'primary' },
      { foreground: 'secondary-foreground', background: 'secondary' },
      { foreground: 'accent-foreground', background: 'accent' },
      { foreground: 'destructive-foreground', background: 'destructive' },
      { foreground: 'warning-foreground', background: 'warning' }
    ];

    combinations.forEach(combo => {
      const foregroundVar = variables.find(v =>
        v.name.includes(`-${combo.foreground}`) ||
        v.name.endsWith(combo.foreground)
      );
      const backgroundVar = variables.find(v =>
        v.name.includes(`-${combo.background}`) ||
        v.name.endsWith(combo.background)
      );

      if (foregroundVar?.color && backgroundVar?.color) {
        const ratio = this.contrastChecker.contrast(
          foregroundVar.color.hex,
          backgroundVar.color.hex
        );

        const wcag = this.evaluateWCAG(ratio);

        pairs.push({
          foreground: foregroundVar,
          background: backgroundVar,
          ratio,
          wcag,
          usage: this.detectUsage(foregroundVar.name)
        });
      }
    });

    return pairs;
  }

  evaluateWCAG(ratio: number): WCAGResult {
    const aa = ratio >= 4.5;
    const aaLarge = ratio >= 3.0;
    const aaa = ratio >= 7.0;
    const aaaLarge = ratio >= 4.5;

    let level: WCAGResult['level'] = 'fail';
    if (aaaLarge) level = 'aaa-large';
    else if (aaa) level = 'aaa';
    else if (aa) level = 'aa';
    else if (aaLarge) level = 'aa-large';

    return {
      aa,
      aaLarge,
      aaa,
      aaaLarge,
      level,
      recommendation: this.getContrastRecommendation(ratio)
    };
  }

  private getContrastRecommendation(ratio: number): string {
    if (ratio >= 7) return 'Excellent contrast ratio';
    if (ratio >= 4.5) return 'Good contrast ratio';
    if (ratio >= 3) return 'Acceptable for large text only';
    return 'Insufficient contrast - consider adjusting colors';
  }

  private identifyAccessibilityIssues(variables: ColorVariable[], contrastPairs: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Contrast issues
    contrastPairs.forEach(pair => {
      if (pair.wcag.level === 'fail') {
        issues.push({
          type: 'contrast',
          severity: 'high',
          description: `Insufficient contrast between ${pair.foreground.name} and ${pair.background.name}`,
          variables: [pair.foreground.name, pair.background.name],
          suggestion: `Increase contrast ratio to at least 4.5:1 for normal text`
        });
      }
    });

    // Color-only information
    const linkVariables = variables.filter(v => v.name.includes('link'));
    if (linkVariables.length > 0) {
      issues.push({
        type: 'semantics',
        severity: 'medium',
        description: 'Links rely only on color for identification',
        variables: linkVariables.map(v => v.name),
        suggestion: 'Add underline or other non-color indicators for links'
      });
    }

    return issues;
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = new Set<string>();

    issues.forEach(issue => {
      recommendations.add(issue.suggestion);
    });

    // General recommendations
    recommendations.add('Test with color blindness simulators');
    recommendations.add('Ensure all interactive elements have visible focus states');
    recommendations.add('Use multiple indicators for important information');

    return Array.from(recommendations);
  }

  private calculateAccessibilityScore(contrastPairs: any[], issues: AccessibilityIssue[]): AccessibilityScore {
    const totalPairs = contrastPairs.length;
    const passingPairs = contrastPairs.filter(p => p.wcag.aa).length;
    const excellentPairs = contrastPairs.filter(p => p.wcag.aaa).length;

    const contrastScore = totalPairs > 0 ? (passingPairs / totalPairs) * 100 : 0;
    const excellentScore = totalPairs > 0 ? (excellentPairs / totalPairs) * 100 : 0;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    const penaltyScore = Math.min(50, (criticalIssues * 20) + (highIssues * 10));
    const overallScore = Math.max(0, Math.min(100, (contrastScore * 0.7) + (excellentScore * 0.3) - penaltyScore));

    let grade: AccessibilityScore['grade'] = 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';

    return {
      overall: Math.round(overallScore),
      contrast: Math.round(contrastScore),
      colorBlindness: 85, // Placeholder
      semantics: 80, // Placeholder
      grade
    };
  }

  generateSemanticAnalysis(themeId: string, mode: 'light' | 'dark', variables: ColorVariable[]): SemanticAnalysis {
    colorLogger.info(`Generating semantic analysis for ${themeId} (${mode})`);

    const semanticGroups = this.groupSemantically(variables);
    const inconsistencies = this.identifyInconsistencies(variables);
    const recommendations = this.generateSemanticRecommendations(inconsistencies);

    return {
      themeId,
      mode,
      groups: semanticGroups,
      inconsistencies,
      recommendations
    };
  }

  private groupSemantically(variables: ColorVariable[]): SemanticGroup[] {
    const groups: Map<SemanticCategory, ColorVariable[]> = new Map();

    variables.forEach(variable => {
      const category = variable.semantic;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(variable);
    });

    const semanticGroups: SemanticGroup[] = [];

    groups.forEach((groupVariables, category) => {
      const patterns = this.analyzePatterns(groupVariables);
      const completeness = this.calculateCompleteness(groupVariables, category);

      semanticGroups.push({
        category,
        description: this.getSemanticDescription(category),
        variables: groupVariables,
        patterns,
        completeness
      });
    });

    return semanticGroups;
  }

  private analyzePatterns(variables: ColorVariable[]): SemanticPattern[] {
    const patterns: SemanticPattern[] = [];

    // Naming patterns
    const foregroundVariables = variables.filter(v => v.name.includes('foreground'));
    const backgroundVariables = variables.filter(v => v.name.includes('background'));

    if (foregroundVariables.length > 0 && backgroundVariables.length > 0) {
      patterns.push({
        type: 'relationship',
        description: 'Foreground/background relationship pattern',
        examples: [foregroundVariables[0].name, backgroundVariables[0].name],
        score: 90
      });
    }

    // Hierarchy patterns
    const hasPrimary = variables.some(v => v.name.includes('primary'));
    const hasSecondary = variables.some(v => v.name.includes('secondary'));

    if (hasPrimary && hasSecondary) {
      patterns.push({
        type: 'hierarchy',
        description: 'Primary/secondary hierarchy pattern',
        examples: ['--primary', '--secondary'],
        score: 85
      });
    }

    return patterns;
  }

  private calculateCompleteness(variables: ColorVariable[], category: SemanticCategory): number {
    const requiredVariables = this.getRequiredVariables(category);
    const presentVariables = variables.length;
    const totalRequired = requiredVariables.length;

    if (totalRequired === 0) return 100;

    return Math.round((presentVariables / totalRequired) * 100);
  }

  private getRequiredVariables(category: SemanticCategory): string[] {
    const requirements = {
      background: ['background', 'foreground'],
      card: ['card', 'card-foreground', 'card-border'],
      popover: ['popover', 'popover-foreground', 'popover-border'],
      muted: ['muted', 'muted-foreground'],
      accent: ['accent', 'accent-foreground'],
      destructive: ['destructive', 'destructive-foreground'],
      warning: ['warning', 'warning-foreground'],
      sidebar: ['sidebar-background', 'sidebar-foreground', 'sidebar-border'],
      chart: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
      shadow: ['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg'],
      font: ['font-sans', 'font-serif', 'font-mono'],
      spacing: ['spacing'],
      other: []
    };

    return requirements[category] || [];
  }

  private getSemanticDescription(category: SemanticCategory): string {
    const descriptions = {
      background: 'Core background and foreground colors',
      card: 'Card component colors and states',
      popover: 'Popover and dropdown colors',
      muted: 'Muted/subtle color variations',
      accent: 'Accent and emphasis colors',
      destructive: 'Destructive action and error states',
      warning: 'Warning and caution colors',
      sidebar: 'Sidebar navigation component colors',
      chart: 'Data visualization and chart colors',
      shadow: 'Shadow and elevation utilities',
      font: 'Typography and font family definitions',
      spacing: 'Layout spacing and sizing',
      other: 'Other utility variables'
    };

    return descriptions[category] || 'Miscellaneous variables';
  }

  private identifyInconsistencies(variables: ColorVariable[]): SemanticInconsistency[] {
    const inconsistencies: SemanticInconsistency[] = [];

    // Check for missing foreground/background pairs
    const backgroundVars = variables.filter(v => v.name.includes('background'));
    backgroundVars.forEach(bgVar => {
      const fgName = bgVar.name.replace('background', 'foreground');
      const hasForeground = variables.some(v => v.name === fgName);

      if (!hasForeground) {
        inconsistencies.push({
          type: 'relationship',
          description: `Missing foreground color for ${bgVar.name}`,
          variables: [bgVar.name],
          severity: 'medium'
        });
      }
    });

    return inconsistencies;
  }

  private generateSemanticRecommendations(inconsistencies: SemanticInconsistency[]): SemanticRecommendation[] {
    const recommendations: SemanticRecommendation[] = [];

    inconsistencies.forEach(inconsistency => {
      recommendations.push({
        category: 'structure',
        description: inconsistency.description,
        examples: inconsistency.variables,
        impact: inconsistency.severity as any
      });
    });

    // General semantic recommendations
    recommendations.push({
      category: 'organization',
      description: 'Group related variables together in CSS',
      examples: ['/* Colors */', '/* Typography */', '/* Spacing */'],
      impact: 'medium'
    });

    return recommendations;
  }

  simulateColorBlindness(variables: ColorVariable[], type: ColorBlindnessSimulation['type']): ColorBlindnessSimulation {
    colorLogger.info(`Simulating ${type} color blindness`);

    const mappings: ColorMapping[] = [];
    const issues: string[] = [];

    variables.filter(v => v.color).forEach(variable => {
      const original = variable.color!.hex;
      const simulated = this.simulateColorBlindnessForColor(original, type);

      // Simple distance calculation (placeholder for deltaE)
      const delta = Math.sqrt(
        Math.pow(variable.color!.rgb.r - simulated.r, 2) +
        Math.pow(variable.color!.rgb.g - simulated.g, 2) +
        Math.pow(variable.color!.rgb.b - simulated.b, 2)
      );

      mappings.push({
        original,
        simulated: `rgb(${simulated.r}, ${simulated.g}, ${simulated.b})`,
        deltaE: delta,
        distinguishable: delta > 10 // Threshold for distinguishability
      });

      if (delta < 10) {
        issues.push(`${variable.name} may be difficult to distinguish`);
      }
    });

    return {
      type,
      colors: mappings,
      issues
    };
  }

  private simulateColorBlindnessForColor(hex: string, type: string): { r: number; g: number; b: number } {
    // Simple color blindness simulation
    // In a real implementation, you'd use more sophisticated algorithms
    const color = parse(hex);
    if (!color) return { r: 128, g: 128, b: 128 };

    const rgb = converter('rgb')(color);
    let r = Math.round((rgb.r || 0) * 255);
    let g = Math.round((rgb.g || 0) * 255);
    let b = Math.round((rgb.b || 0) * 255);

    switch (type) {
      case 'protanopia': // Red-blind
        r = 0.567 * r + 0.433 * g;
        g = 0.558 * r + 0.442 * g;
        b = 0.242 * g + 0.758 * b;
        break;
      case 'deuteranopia': // Green-blind
        r = 0.625 * r + 0.375 * g;
        g = 0.7 * r + 0.3 * g;
        b = 0.3 * g + 0.7 * b;
        break;
      case 'tritanopia': // Blue-blind
        r = 0.95 * r + 0.05 * g;
        g = 0.433 * g + 0.567 * b;
        b = 0.475 * g + 0.525 * b;
        break;
      case 'achromatopsia': // Complete color blindness
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
        break;
    }

    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b)))
    };
  }
}