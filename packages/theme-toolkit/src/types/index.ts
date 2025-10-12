// Re-export all types
export * from './theme.js';
export * from './color.js';

// Service types
export interface ThemeManager {
  getAllThemes(): Promise<Theme[]>;
  getThemeById(id: string): Promise<Theme | null>;
  getThemeCSS(id: string, mode: string): Promise<string | null>;
  createTheme(data: any): Promise<Theme>;
  updateTheme(id: string, updates: any): Promise<Theme | null>;
  deleteTheme(id: string): Promise<boolean>;
  validateCSS(css: string): ValidationResult;
}

export interface ColorAnalyzer {
  parseCSSVariables(css: string): ColorVariable[];
  analyzeColors(variables: ColorVariable[]): ColorPalette[];
  generateSemanticAnalysis(themeId: string, mode: string, variables: ColorVariable[]): SemanticAnalysis;
}

export interface ColorRenderer {
  renderColorPalettes(palettes: ColorPalette[]): string;
  renderSemanticAnalysis(analysis: SemanticAnalysis): string;
}

export interface TableFormatter {
  createTable(headers: string[], rows: string[][]): string;
  formatThemeTable(themes: Theme[]): string;
  formatColorTable(variables: ColorVariable[]): string;
}