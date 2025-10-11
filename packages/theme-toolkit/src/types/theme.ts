export interface Theme {
  id: string;
  name: string;
  label: string;
  description: string;
  author: string;
  version: string;
  source: 'local' | 'external';
  category: 'built-in' | 'custom' | 'external';
  modes: {
    light?: string;
    dark?: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
  config: {
    radius: string;
    [key: string]: any;
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  };
}

export interface ThemeRegistry {
  version: string;
  lastUpdated: string;
  themes: Theme[];
}

export interface ThemeVariable {
  name: string;
  value: string;
  description?: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'other';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  variables: ThemeVariable[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'value' | 'structure';
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  type: 'deprecated' | 'suggestion' | 'accessibility';
}

export interface ThemeEditRequest {
  themeId: string;
  mode: 'light' | 'dark';
  content: string;
}

export interface ThemeCreateRequest {
  name: string;
  label: string;
  description: string;
  category: 'built-in' | 'custom';
  baseThemeId?: string;
  modes: {
    light?: string;
    dark?: string;
  };
}