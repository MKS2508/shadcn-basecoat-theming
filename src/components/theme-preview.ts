import { BaseComponent } from '../utils/base-component';
import { TemplateEngine } from '../utils/template-engine';
import themePreviewTemplate from '../templates/components/theme-preview-content.html?raw';

interface ThemeData {
  name: string;
  cssVars: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };
}

interface FontInfo {
  type: string;
  family: string;
  value: string;
  isExternal: boolean;
}

interface ColorInfo {
  name: string;
  value: string;
}

export class ThemePreview extends BaseComponent {

  constructor(containerId: string) {
    super(themePreviewTemplate);
    this.element = document.getElementById(containerId);
  }

  protected bindEvents(): void {
    // No events needed for preview component
  }

  async showTheme(themeData: ThemeData, _url: string): Promise<void> {

    const fontInfo = this.extractFontInfo(themeData.cssVars.light || {});
    const lightColors = this.extractPreviewColors(themeData.cssVars.light);
    const darkColors = this.extractPreviewColors(themeData.cssVars.dark);
    const variants = this.createVariants(themeData);

    const templateData = {
      themeName: themeData.name,
      url: _url,
      variants: variants,
      hasTypography: fontInfo.length > 0,
      fonts: fontInfo,
      hasExternalFonts: fontInfo.some(f => f.isExternal),
      hasTypographyPreview: fontInfo.length > 0,
      typographyPreview: fontInfo.length > 0 ? await this.generateTypographyPreview(fontInfo) : '',
      hasLightColors: lightColors.length > 0,
      lightColors: lightColors,
      hasDarkColors: darkColors.length > 0,
      darkColors: darkColors
    };

    this.setData(templateData);
    await this.render();
  }

  async showError(message: string, suggestion?: string): Promise<void> {
    const errorTemplate = new TemplateEngine();
    const errorHtml = await errorTemplate.renderTemplate('/templates/components/theme-preview-error.html', {
      errorMessage: message,
      hasSuggestion: !!suggestion,
      suggestion: suggestion || ''
    });
    
    if (this.element) {
      this.element.innerHTML = errorHtml;
    }
  }

  showLoading(message: string = 'Validating...'): void {
    if (this.element) {
      this.element.innerHTML = `
        <div class="flex items-center justify-center py-8">
          <div class="text-center space-y-3">
            <div class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div class="text-muted-foreground text-sm">${message}</div>
          </div>
        </div>
      `;
    }
  }

  showEmpty(): void {
    if (this.element) {
      this.element.innerHTML = `
        <div class="flex items-center justify-center text-muted-foreground text-sm min-h-[60px]">
          <div class="text-center">
            <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z"></path>
            </svg>
            <div>Enter a theme URL to see preview</div>
          </div>
        </div>
      `;
    }
  }

  private createVariants(themeData: ThemeData): Array<{name: string}> {
    const variants: Array<{name: string}> = [];
    
    if (themeData.cssVars.light) variants.push({ name: 'Light' });
    if (themeData.cssVars.dark) variants.push({ name: 'Dark' });
    if (themeData.cssVars.theme) variants.push({ name: 'Custom' });
    
    return variants;
  }

  private extractFontInfo(cssVars: Record<string, string>): FontInfo[] {
    const fonts: FontInfo[] = [];
    const fontVars = ['--font-sans', '--font-serif', '--font-mono'];

    for (const fontVar of fontVars) {
      if (cssVars[fontVar]) {
        const value = cssVars[fontVar];
        
        let fontFamily = value;
        let isExternal = false;

        if (value.includes('"') || value.includes("'")) {
          const matches = value.match(/['"]([^'"]+)['"]/);
          if (matches) {
            fontFamily = matches[1];
            isExternal = !this.isSystemFont(fontFamily);
          }
        } else {
          const firstFont = value.split(',')[0].trim();
          fontFamily = firstFont;
          isExternal = !this.isSystemFont(fontFamily);
        }

        const type = fontVar.replace('--font-', '').toLowerCase();
        
        fonts.push({
          type: type,
          family: fontFamily,
          value: value,
          isExternal: isExternal
        });
      }
    }

    return fonts;
  }

  private isSystemFont(fontName: string): boolean {
    const systemFonts = [
      'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
      'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia',
      'ui-rounded', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto'
    ];
    return systemFonts.some(sysFont => 
      fontName.toLowerCase().includes(sysFont.toLowerCase())
    );
  }

  private async generateTypographyPreview(fontInfo: FontInfo[]): Promise<string> {
    const sansFont = fontInfo.find(f => f.type === 'sans');
    const serifFont = fontInfo.find(f => f.type === 'serif');
    const monoFont = fontInfo.find(f => f.type === 'mono');

    const typographyEngine = new TemplateEngine();
    return await typographyEngine.renderTemplate('/templates/components/typography-preview.html', {
      hasSansFont: !!sansFont,
      sansFont: sansFont,
      hasSerifFont: !!serifFont,
      serifFont: serifFont,
      hasMonoFont: !!monoFont,
      monoFont: monoFont
    });
  }

  private extractPreviewColors(cssVars?: Record<string, string>): ColorInfo[] {
    if (!cssVars) return [];

    const colorKeys = ['--background', '--foreground', '--primary', '--secondary', '--accent', '--muted', '--destructive'];
    const colors: ColorInfo[] = [];

    for (const key of colorKeys) {
      if (cssVars[key]) {
        const name = key.replace('--', '').replace('-', ' ');
        let value = cssVars[key];
        
        // Handle different color formats
        if (value.includes('hsl')) {
          // Already HSL format
          colors.push({ name, value });
        } else if (value.includes('oklch')) {
          // OKLCH format - approximate conversion for preview
          colors.push({ 
            name, 
            value: `hsl(${this.oklchToHslApprox(value)})`
          });
        } else if (value.includes('rgb')) {
          // RGB format
          colors.push({ name, value });
        } else {
          // Assume it's HSL values without wrapper
          colors.push({ 
            name, 
            value: `hsl(${value})` 
          });
        }
      }
    }

    return colors;
  }

  private oklchToHslApprox(oklchValue: string): string {
    // Simple approximation for preview purposes
    const match = oklchValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (match) {
      const l = parseFloat(match[1]) * 100;
      const c = parseFloat(match[2]) * 100;  
      const h = parseFloat(match[3]);
      return `${h}, ${c}%, ${l}%`;
    }
    return '0, 0%, 50%'; // fallback
  }
}