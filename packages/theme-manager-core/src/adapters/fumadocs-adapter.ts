/**
 * FumadocsAdapter - Transforms Shadcn/Basecoat theme variables to Fumadocs UI format
 * 
 * Handles:
 * - Variable name mapping (shadcn → fd prefix)
 * - Color format detection (OKLCH vs HSL)
 * - OKLCH to HSL conversion for Fumadocs compatibility
 * - Layout width configuration
 */

import type { ThemeManager } from '../core/theme-manager';

export interface IFumadocsAdapterConfig {
  /** Enable OKLCH to HSL conversion (default: true) */
  convertOklchToHsl?: boolean;
  /** Custom layout width for Fumadocs */
  layoutWidth?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom variable mappings (extends default) */
  customMappings?: Record<string, string>;
}

interface IRGB {
  r: number;
  g: number;
  b: number;
}

interface IHSL {
  h: number;
  s: number;
  l: number;
}

const SHADCN_TO_FUMADOCS_MAP: Record<string, string> = {
  'background': 'fd-background',
  'foreground': 'fd-foreground',
  'muted': 'fd-muted',
  'muted-foreground': 'fd-muted-foreground',
  'popover': 'fd-popover',
  'popover-foreground': 'fd-popover-foreground',
  'card': 'fd-card',
  'card-foreground': 'fd-card-foreground',
  'border': 'fd-border',
  'primary': 'fd-primary',
  'primary-foreground': 'fd-primary-foreground',
  'secondary': 'fd-secondary',
  'secondary-foreground': 'fd-secondary-foreground',
  'accent': 'fd-accent',
  'accent-foreground': 'fd-accent-foreground',
  'ring': 'fd-ring',
  'destructive': 'fd-destructive',
  'destructive-foreground': 'fd-destructive-foreground',
  'input': 'fd-input',
};

export class FumadocsAdapter {
  private themeManager: ThemeManager | null = null;
  private config: Required<IFumadocsAdapterConfig>;
  private isConnected: boolean = false;
  private unsubscribeThemeChange: (() => void) | null = null;

  constructor(config?: IFumadocsAdapterConfig) {
    this.config = {
      convertOklchToHsl: config?.convertOklchToHsl ?? true,
      layoutWidth: config?.layoutWidth ?? '1400px',
      debug: config?.debug ?? false,
      customMappings: config?.customMappings ?? {},
    };
  }

  connect(themeManager: ThemeManager): void {
    if (this.isConnected) {
      this.disconnect();
    }

    this.themeManager = themeManager;
    this.isConnected = true;

    this.applyCurrentTheme();

    const handler = () => this.applyCurrentTheme();
    themeManager.addEventListener('theme-changed', handler);
    this.unsubscribeThemeChange = () => themeManager.removeEventListener('theme-changed', handler);

    if (this.config.debug) {
      console.log('[FumadocsAdapter] Connected to ThemeManager');
    }
  }

  disconnect(): void {
    if (this.unsubscribeThemeChange) {
      this.unsubscribeThemeChange();
      this.unsubscribeThemeChange = null;
    }
    this.themeManager = null;
    this.isConnected = false;

    if (this.config.debug) {
      console.log('[FumadocsAdapter] Disconnected from ThemeManager');
    }
  }

  updateConfig(newConfig: Partial<IFumadocsAdapterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isConnected && this.themeManager) {
      this.applyCurrentTheme();
    }
  }

  setLayoutWidth(width: string): void {
    this.config.layoutWidth = width;
    this.applyLayoutWidth();
  }

  private applyCurrentTheme(): void {
    if (!this.themeManager || typeof document === 'undefined') return;

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const fdVariables: Record<string, string> = {};
    const allMappings = { ...SHADCN_TO_FUMADOCS_MAP, ...this.config.customMappings };

    for (const [shadcnVar, fdVar] of Object.entries(allMappings)) {
      const fullShadcnVar = `--${shadcnVar}`;
      const fullFdVar = `--color-${fdVar}`;
      
      let value = computedStyle.getPropertyValue(fullShadcnVar).trim();
      
      if (value) {
        if (this.config.convertOklchToHsl && this.isOklch(value)) {
          value = this.convertOklchToHslString(value);
          if (this.config.debug) {
            console.log(`[FumadocsAdapter] Converted ${fullShadcnVar}: OKLCH → HSL`);
          }
        }
        fdVariables[fullFdVar] = value;
      }
    }

    this.applyVariables(fdVariables);
    this.applyLayoutWidth();

    if (this.config.debug) {
      console.log('[FumadocsAdapter] Applied variables:', Object.keys(fdVariables).length);
    }
  }

  private applyVariables(variables: Record<string, string>): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    for (const [property, value] of Object.entries(variables)) {
      root.style.setProperty(property, value);
    }
  }

  private applyLayoutWidth(): void {
    if (typeof document === 'undefined') return;

    document.documentElement.style.setProperty('--fd-layout-width', this.config.layoutWidth);
  }

  isOklch(value: string): boolean {
    return value.startsWith('oklch(') || value.startsWith('oklab(');
  }

  parseOklch(value: string): { l: number; c: number; h: number; a: number } | null {
    const oklchMatch = value.match(/oklch\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?/);
    if (oklchMatch) {
      return {
        l: parseFloat(oklchMatch[1]),
        c: parseFloat(oklchMatch[2]),
        h: parseFloat(oklchMatch[3]),
        a: oklchMatch[4] ? parseFloat(oklchMatch[4]) : 1,
      };
    }
    return null;
  }

  convertOklchToHslString(oklchValue: string): string {
    const parsed = this.parseOklch(oklchValue);
    if (!parsed) {
      return oklchValue;
    }

    const rgb = this.oklchToRgb(parsed.l, parsed.c, parsed.h);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    return `${hsl.h.toFixed(1)} ${hsl.s.toFixed(1)}% ${hsl.l.toFixed(1)}%`;
  }

  private oklchToRgb(l: number, c: number, h: number): IRGB {
    const hRad = (h * Math.PI) / 180;

    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // OKLab → LMS' (Bjorn Ottosson reference coefficients)
    const lp = l + 0.3963377774 * a + 0.2158037573 * b;
    const mp = l - 0.1055613458 * a - 0.0638541728 * b;
    const sp = l - 0.0894841775 * a - 1.2914855480 * b;

    // LMS' → LMS (cube)
    const lLms = lp * lp * lp;
    const mLms = mp * mp * mp;
    const sLms = sp * sp * sp;

    // LMS → linear sRGB
    const rLinear = +4.0767416621 * lLms - 3.3077115913 * mLms + 0.2309699292 * sLms;
    const gLinear = -1.2684380046 * lLms + 2.6097574011 * mLms - 0.3413193965 * sLms;
    const bLinear = -0.0041960863 * lLms - 0.7034186147 * mLms + 1.7076147010 * sLms;

    return {
      r: Math.max(0, Math.min(255, Math.round(this.gamma(rLinear) * 255))),
      g: Math.max(0, Math.min(255, Math.round(this.gamma(gLinear) * 255))),
      b: Math.max(0, Math.min(255, Math.round(this.gamma(bLinear) * 255))),
    };
  }

  private gamma(linear: number): number {
    return linear > 0.0031308
      ? 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
      : 12.92 * linear;
  }

  private rgbToHsl(r: number, g: number, b: number): IHSL {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100,
    };
  }

  generateCssSnippet(): string {
    let css = `/* Fumadocs Adapter CSS - Auto-generated mappings */\n`;
    css += `/* Add this AFTER your theme CSS imports */\n\n`;
    css += `:root {\n`;
    css += `  --fd-layout-width: ${this.config.layoutWidth};\n`;
    
    for (const [shadcnVar, fdVar] of Object.entries(SHADCN_TO_FUMADOCS_MAP)) {
      css += `  --color-${fdVar}: var(--${shadcnVar});\n`;
    }
    
    css += `}\n`;

    return css;
  }

  getMappings(): Record<string, string> {
    return { ...SHADCN_TO_FUMADOCS_MAP };
  }
}

export const fumadocsAdapter = new FumadocsAdapter();
