/**
 * Simple Template Engine for HTML templates with Mustache-like syntax
 * Supports: {{variable}}, {{{rawHTML}}}, {{#section}}, {{^inverted}}, {{/section}}
 */

interface TemplateData {
  [key: string]: any;
}

export class TemplateEngine {
  private templateCache: Map<string, string> = new Map();
  private basePath: string = '/src/templates';

  /**
   * Load template from file with caching
   */
  async loadTemplate(templatePath: string): Promise<string> {
    // Normalize path
    const fullPath = templatePath.startsWith('/') ? templatePath : `${this.basePath}/${templatePath}`;
    
    // Check cache first
    if (this.templateCache.has(fullPath)) {
      return this.templateCache.get(fullPath)!;
    }

    try {
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${fullPath} (${response.status})`);
      }
      
      const template = await response.text();
      
      // Cache the template
      this.templateCache.set(fullPath, template);
      
      console.log(`📄 TemplateEngine: Loaded and cached template: ${templatePath}`);
      return template;
      
    } catch (error) {
      console.error(`❌ TemplateEngine: Failed to load template: ${templatePath}`, error);
      throw error;
    }
  }

  /**
   * Render template with data
   */
  render(template: string, data: TemplateData = {}): string {
    let result = template;

    // Process sections first ({{#section}} ... {{/section}})
    result = this.processSections(result, data);

    // Process inverted sections ({{^section}} ... {{/section}})
    result = this.processInvertedSections(result, data);

    // Process variables ({{{raw}}} and {{escaped}})
    result = this.processVariables(result, data);

    return result;
  }

  /**
   * Load and render template in one call
   */
  async renderTemplate(templatePath: string, data: TemplateData = {}): Promise<string> {
    const template = await this.loadTemplate(templatePath);
    return this.render(template, data);
  }

  /**
   * Process sections {{#section}} ... {{/section}}
   */
  private processSections(template: string, data: TemplateData): string {
    const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    
    return template.replace(sectionRegex, (match, key, content) => {
      const value = this.getNestedValue(data, key);
      
      if (!value) {
        return '';
      }
      
      if (Array.isArray(value)) {
        return value.map(item => this.render(content, { ...data, ...item })).join('');
      }
      
      if (typeof value === 'object' && value !== null) {
        return this.render(content, { ...data, ...value });
      }
      
      if (value) {
        return this.render(content, data);
      }
      
      return '';
    });
  }

  /**
   * Process inverted sections {{^section}} ... {{/section}}
   */
  private processInvertedSections(template: string, data: TemplateData): string {
    const invertedSectionRegex = /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    
    return template.replace(invertedSectionRegex, (match, key, content) => {
      const value = this.getNestedValue(data, key);
      
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return this.render(content, data);
      }
      
      return '';
    });
  }

  /**
   * Process variables {{variable}} and {{{rawVariable}}}
   */
  private processVariables(template: string, data: TemplateData): string {
    // First process raw variables {{{variable}}} (no escaping)
    template = template.replace(/\{\{\{(\w+(?:\.\w+)*)\}\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : '';
    });

    // Then process escaped variables {{variable}}
    template = template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? this.escapeHtml(String(value)) : '';
    });

    return template;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Escape HTML for security
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    console.log('🗑️ TemplateEngine: Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys())
    };
  }

  /**
   * Helper method to create template data
   */
  static createData(data: TemplateData): TemplateData {
    return data;
  }

  /**
   * Helper method to create theme variants array
   */
  static createThemeVariants(cssVars: any): Array<{name: string}> {
    const variants: Array<{name: string}> = [];
    
    if (cssVars.light) variants.push({ name: 'Light' });
    if (cssVars.dark) variants.push({ name: 'Dark' });
    if (cssVars.theme) variants.push({ name: 'Custom' });
    
    return variants;
  }

  /**
   * Helper method to format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}

// Global instance
export const templateEngine = new TemplateEngine();