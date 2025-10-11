export interface ColorVariable {
  name: string;
  value: string;
  color?: ParsedColor;
  category: ColorCategory;
  semantic: SemanticCategory;
  usage: ColorUsage[];
}

export interface ParsedColor {
  oklch: {
    l: number;
    c: number;
    h: number;
  };
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  p3?: {
    r: number;
    g: number;
    b: number;
  };
}

export type ColorCategory =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'info';

export type SemanticCategory =
  | 'background'
  | 'foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'card'
  | 'popover'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'warning'
  | 'sidebar'
  | 'chart'
  | 'shadow'
  | 'font'
  | 'spacing'
  | 'other';

export type ColorUsage =
  | 'text'
  | 'background'
  | 'border'
  | 'outline'
  | 'fill'
  | 'gradient'
  | 'shadow';

export interface ColorPalette {
  category: ColorCategory;
  colors: ColorVariable[];
  harmony: ColorHarmony;
}

export interface ColorHarmony {
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split-complementary';
  description: string;
  relationships: ColorRelationship[];
}

export interface ColorRelationship {
  from: string;
  to: string;
  type: 'complement' | 'analogous' | 'triad' | 'split';
  angle: number;
}

export interface ColorGroup {
  name: string;
  description: string;
  variables: ColorVariable[];
  colorCount: number;
  harmony: ColorHarmony;
}

export interface ColorContrastPair {
  foreground: ColorVariable;
  background: ColorVariable;
  ratio: number;
  wcag: WCAGResult;
  usage: string[];
}

export interface WCAGResult {
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
  aaaLarge: boolean;
  level: 'fail' | 'aa-large' | 'aa' | 'aaa-large' | 'aaa';
  recommendation?: string;
}

export interface ColorAccessibilityReport {
  themeId: string;
  mode: 'light' | 'dark';
  totalVariables: number;
  colorGroups: ColorGroup[];
  contrastPairs: ColorContrastPair[];
  overallScore: AccessibilityScore;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

export interface AccessibilityScore {
  overall: number; // 0-100
  contrast: number;
  colorBlindness: number;
  semantics: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface AccessibilityIssue {
  type: 'contrast' | 'semantics' | 'color-blindness' | 'usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  variables: string[];
  suggestion: string;
}

export interface ColorBlindnessSimulation {
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  colors: ColorMapping[];
  issues: string[];
}

export interface ColorMapping {
  original: string;
  simulated: string;
  deltaE: number;
  distinguishable: boolean;
}

export interface SemanticAnalysis {
  themeId: string;
  mode: 'light' | 'dark';
  groups: SemanticGroup[];
  inconsistencies: SemanticInconsistency[];
  recommendations: SemanticRecommendation[];
}

export interface SemanticGroup {
  category: SemanticCategory;
  description: string;
  variables: ColorVariable[];
  patterns: SemanticPattern[];
  completeness: number; // 0-100
}

export interface SemanticPattern {
  type: 'naming' | 'hierarchy' | 'relationship';
  description: string;
  examples: string[];
  score: number; // 0-100
}

export interface SemanticInconsistency {
  type: 'naming' | 'value' | 'relationship';
  description: string;
  variables: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface SemanticRecommendation {
  category: 'naming' | 'structure' | 'organization';
  description: string;
  examples: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface ColorExportFormat {
  format: 'css' | 'scss' | 'json' | 'tailwind' | 'styled-components';
  content: string;
  filename: string;
}

export interface ColorValidationResult {
  isValid: boolean;
  errors: ColorValidationError[];
  warnings: ColorValidationWarning[];
  suggestions: ColorValidationSuggestion[];
}

export interface ColorValidationError {
  variable: string;
  type: 'syntax' | 'value' | 'format';
  message: string;
  line?: number;
}

export interface ColorValidationWarning {
  variable: string;
  type: 'contrast' | 'accessibility' | 'best-practice';
  message: string;
  suggestion?: string;
}

export interface ColorValidationSuggestion {
  variable: string;
  type: 'color' | 'naming' | 'usage';
  currentValue: string;
  suggestedValue: string;
  reason: string;
}