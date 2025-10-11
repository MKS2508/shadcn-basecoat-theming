import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { Theme, ThemeRegistry, ValidationResult, ThemeVariable, ThemeCreateRequest } from '@/types/theme.js';
import logger from '@mks2508/better-logger';

logger.preset('cyberpunk');
logger.showTimestamp();
logger.showLocation();

const themeLogger = logger;

export class ThemeManager {
  private themesDir: string;
  private registryPath: string;
  private registry: ThemeRegistry;

  constructor(themesDir: string = './themes') {
    this.themesDir = themesDir;
    this.registryPath = join(themesDir, 'registry.json');
    this.registry = this.loadRegistry();
    themeLogger.success('Theme Manager initialized');
  }

  private loadRegistry(): ThemeRegistry {
    try {
      if (!existsSync(this.registryPath)) {
        themeLogger.warn('Registry not found, creating default registry');
        this.createDefaultRegistry();
      }

      const content = readFileSync(this.registryPath, 'utf-8');
      const registry = JSON.parse(content) as ThemeRegistry;
      themeLogger.success(`Loaded ${registry.themes.length} themes from registry`);
      return registry;
    } catch (error) {
      themeLogger.error('Failed to load registry:', error);
      return this.createDefaultRegistry();
    }
  }

  private createDefaultRegistry(): ThemeRegistry {
    const defaultRegistry: ThemeRegistry = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      themes: [{
        id: 'medmoderna',
        name: 'medmoderna',
        label: 'MedModerna',
        description: 'Tema oficial de Medicina Moderna con colores verdes característicos',
        author: 'MedModerna Team',
        version: '1.0.0',
        source: 'local',
        category: 'built-in',
        modes: {
          light: '/themes/css/medmoderna-light.css',
          dark: '/themes/css/medmoderna-dark.css'
        },
        fonts: {
          sans: '"Space Grotesk", "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          serif: '"Spectral", "Fraunces", Georgia, Cambria, serif',
          mono: '"Space Mono", "JetBrains Mono", "Fira Code", Monaco, Consolas, monospace'
        },
        preview: {
          primary: 'oklch(0.6124 0.1584 142.74)',
          background: 'oklch(1.0000 0 0)',
          accent: 'oklch(0.7278 0.1745 130.54)'
        },
        config: {
          radius: '0.5rem'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['medical', 'modern', 'green']
        }
      }]
    };

    this.saveRegistry(defaultRegistry);
    themeLogger.success('Created default registry with MedModerna theme');
    return defaultRegistry;
  }

  private saveRegistry(registry?: ThemeRegistry): void {
    const registryToSave = registry || this.registry;
    const content = JSON.stringify(registryToSave, null, 2);

    // Ensure directory exists
    if (!existsSync(dirname(this.registryPath))) {
      mkdirSync(dirname(this.registryPath), { recursive: true });
    }

    writeFileSync(this.registryPath, content, 'utf-8');
    if (!registry) {
      this.registry = registryToSave;
    }
    themeLogger.success('Registry saved successfully');
  }

  async getAllThemes(): Promise<Theme[]> {
    themeLogger.info('Retrieving all themes');
    return this.registry.themes;
  }

  async getThemeById(id: string): Promise<Theme | null> {
    themeLogger.info(`Retrieving theme: ${id}`);
    const theme = this.registry.themes.find(t => t.id === id);
    if (theme) {
      themeLogger.success(`Found theme: ${theme.label}`);
    } else {
      themeLogger.warn(`Theme not found: ${id}`);
    }
    return theme || null;
  }

  async createTheme(request: ThemeCreateRequest): Promise<Theme> {
    themeLogger.info(`Creating new theme: ${request.name}`);

    const newTheme: Theme = {
      id: request.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: request.name,
      label: request.label,
      description: request.description,
      author: 'Theme Toolkit',
      version: '1.0.0',
      source: 'local',
      category: request.category,
      modes: request.modes,
      fonts: {
        sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
        mono: '"Fira Code", Monaco, Consolas, monospace'
      },
      preview: {
        primary: 'oklch(0.5 0.2 200)',
        background: 'oklch(1 0 0)',
        accent: 'oklch(0.6 0.2 250)'
      },
      config: {
        radius: '0.5rem'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: []
      }
    };

    // If base theme provided, copy its content
    if (request.baseThemeId) {
      const baseTheme = await this.getThemeById(request.baseThemeId);
      if (baseTheme) {
        themeLogger.info(`Copying content from base theme: ${baseTheme.name}`);
        if (!newTheme.modes.light && baseTheme.modes.light) {
          newTheme.modes.light = baseTheme.modes.light;
        }
        if (!newTheme.modes.dark && baseTheme.modes.dark) {
          newTheme.modes.dark = baseTheme.modes.dark;
        }
        newTheme.fonts = { ...baseTheme.fonts };
        newTheme.config = { ...baseTheme.config };
      }
    }

    this.registry.themes.push(newTheme);
    this.registry.lastUpdated = new Date().toISOString();
    this.saveRegistry();

    themeLogger.success(`Theme created successfully: ${newTheme.label}`);
    return newTheme;
  }

  async updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | null> {
    themeLogger.info(`Updating theme: ${id}`);

    const themeIndex = this.registry.themes.findIndex(t => t.id === id);
    if (themeIndex === -1) {
      themeLogger.error(`Theme not found for update: ${id}`);
      return null;
    }

    const updatedTheme = {
      ...this.registry.themes[themeIndex],
      ...updates,
      metadata: {
        ...this.registry.themes[themeIndex].metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    this.registry.themes[themeIndex] = updatedTheme;
    this.registry.lastUpdated = new Date().toISOString();
    this.saveRegistry();

    themeLogger.success(`Theme updated successfully: ${updatedTheme.label}`);
    return updatedTheme;
  }

  async deleteTheme(id: string): Promise<boolean> {
    themeLogger.info(`Deleting theme: ${id}`);

    const themeIndex = this.registry.themes.findIndex(t => t.id === id);
    if (themeIndex === -1) {
      themeLogger.error(`Theme not found for deletion: ${id}`);
      return false;
    }

    const deletedTheme = this.registry.themes[themeIndex];
    this.registry.themes.splice(themeIndex, 1);
    this.registry.lastUpdated = new Date().toISOString();
    this.saveRegistry();

    themeLogger.success(`Theme deleted successfully: ${deletedTheme.label}`);
    return true;
  }

  async getThemeCSS(themeId: string, mode: 'light' | 'dark'): Promise<string | null> {
    themeLogger.info(`Getting CSS for theme ${themeId} in ${mode} mode`);

    const theme = await this.getThemeById(themeId);
    if (!theme || !theme.modes[mode]) {
      themeLogger.error(`CSS not found for theme ${themeId} in ${mode} mode`);
      return null;
    }

    const cssPath = join(this.themesDir, theme.modes[mode].replace('/themes/', ''));

    if (!existsSync(cssPath)) {
      themeLogger.error(`CSS file not found: ${cssPath}`);
      return null;
    }

    try {
      const css = readFileSync(cssPath, 'utf-8');
      themeLogger.success(`Loaded CSS for ${theme.label} (${mode})`);
      return css;
    } catch (error) {
      themeLogger.error(`Failed to read CSS file: ${error}`);
      return null;
    }
  }

  async saveThemeCSS(themeId: string, mode: 'light' | 'dark', css: string): Promise<boolean> {
    themeLogger.info(`Saving CSS for theme ${themeId} in ${mode} mode`);

    const theme = await this.getThemeById(themeId);
    if (!theme) {
      themeLogger.error(`Theme not found: ${themeId}`);
      return false;
    }

    const cssPath = join(this.themesDir, 'css', `${theme.name}-${mode}.css`);

    // Ensure directory exists
    if (!existsSync(dirname(cssPath))) {
      mkdirSync(dirname(cssPath), { recursive: true });
    }

    try {
      writeFileSync(cssPath, css, 'utf-8');

      // Update theme registry with new path
      const relativePath = `/themes/css/${theme.name}-${mode}.css`;
      await this.updateTheme(themeId, {
        modes: {
          ...theme.modes,
          [mode]: relativePath
        }
      });

      themeLogger.success(`CSS saved successfully for ${theme.label} (${mode})`);
      return true;
    } catch (error) {
      themeLogger.error(`Failed to save CSS file: ${error}`);
      return false;
    }
  }

  validateCSS(css: string): ValidationResult {
    themeLogger.info('Validating CSS');

    const errors: any[] = [];
    const warnings: any[] = [];
    const variables: ThemeVariable[] = [];

    const lines = css.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      if (trimmed.startsWith('--') && trimmed.includes(':')) {
        const match = trimmed.match(/^--([^:]+):\s*(.+);?$/);
        if (match) {
          const [, name, value] = match;

          let category: ThemeVariable['category'] = 'other';
          if (name.includes('color') || value.includes('oklch') || value.includes('hsl')) {
            category = 'color';
          } else if (name.includes('spacing') || name.includes('size') || value.includes('rem') || value.includes('px')) {
            category = 'spacing';
          } else if (name.includes('font') || name.includes('text')) {
            category = 'typography';
          } else if (name.includes('shadow')) {
            category = 'shadow';
          }

          variables.push({
            name: `--${name}`,
            value: value.replace(';', ''),
            category
          });
        }
      }

      // Basic syntax validation
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        // Check for opening brace without closing
        let openBraces = (trimmed.match(/\{/g) || []).length;
        let closeBraces = (trimmed.match(/\}/g) || []).length;

        for (let i = index; i < Math.min(index + 10, lines.length); i++) {
          closeBraces += (lines[i].match(/\}/g) || []).length;
        }

        if (openBraces > closeBraces) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('{') + 1,
            message: 'Unclosed brace detected',
            type: 'syntax'
          });
        }
      }
    });

    const isValid = errors.length === 0;

    if (isValid) {
      themeLogger.success(`CSS validation passed. Found ${variables.length} variables`);
    } else {
      themeLogger.error(`CSS validation failed with ${errors.length} errors`);
    }

    return {
      isValid,
      errors,
      warnings,
      variables
    };
  }
}