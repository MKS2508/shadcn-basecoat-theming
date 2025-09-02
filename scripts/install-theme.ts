#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

interface ThemeData {
  name: string;
  cssVars: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };
}

async function fetchTheme(url: string): Promise<ThemeData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.statusText}`);
  }
  return response.json();
}

function generateThemeCSS(themeData: ThemeData, mode: 'light' | 'dark'): string {
  let css = `/* ${themeData.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${mode.charAt(0).toUpperCase() + mode.slice(1)} Theme */\n`;
  css += ':root {\n';
  
  const vars = mode === 'light' ? themeData.cssVars.light : themeData.cssVars.dark;
  
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      css += `  --${key}: ${value};\n`;
    }
  }
  
  if (themeData.cssVars.theme) {
    for (const [key, value] of Object.entries(themeData.cssVars.theme)) {
      css += `  --${key}: ${value};\n`;
    }
  }
  
  css += '}\n';
  return css;
}

async function installTheme(themeUrl: string) {
  try {
    console.log(`📦 Fetching theme from: ${themeUrl}`);
    const themeData = await fetchTheme(themeUrl);
    
    console.log(`🎨 Installing theme: ${themeData.name}`);
    
    const themesDir = path.join(process.cwd(), 'src', 'themes');
    
    // Ensure themes directory exists
    if (!fs.existsSync(themesDir)) {
      fs.mkdirSync(themesDir, { recursive: true });
    }
    
    // Generate and write light theme file
    if (themeData.cssVars.light) {
      const lightCss = generateThemeCSS(themeData, 'light');
      const lightPath = path.join(themesDir, `${themeData.name}-light.css`);
      fs.writeFileSync(lightPath, lightCss);
      console.log(`📁 Created: ${lightPath}`);
    }
    
    // Generate and write dark theme file
    if (themeData.cssVars.dark) {
      const darkCss = generateThemeCSS(themeData, 'dark');
      const darkPath = path.join(themesDir, `${themeData.name}-dark.css`);
      fs.writeFileSync(darkPath, darkCss);
      console.log(`📁 Created: ${darkPath}`);
    }
    
    // Update theme-manager.ts
    const themeManagerPath = path.join(process.cwd(), 'src', 'theme-manager.ts');
    let themeManagerContent = fs.readFileSync(themeManagerPath, 'utf-8');
    
    // Add to THEMES config if not exists
    const themesMatch = themeManagerContent.match(/export const THEMES: Record<string, ThemeConfig> = \{[\s\S]*?\n\}/);
    if (themesMatch && !themeManagerContent.includes(`'${themeData.name}':`)) {
      const themesEnd = themesMatch.index! + themesMatch[0].length - 1;
      const newThemeConfig = `,
  '${themeData.name}': {
    name: '${themeData.name}',
    label: '${themeData.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}',
    modes: {
      light: '/src/themes/${themeData.name}-light.css',
      dark: '/src/themes/${themeData.name}-dark.css'
    }
  }`;
      
      themeManagerContent = themeManagerContent.slice(0, themesEnd) + newThemeConfig + themeManagerContent.slice(themesEnd);
      fs.writeFileSync(themeManagerPath, themeManagerContent);
    }
    
    console.log(`✅ Theme ${themeData.name} installed successfully!`);
    console.log(`📝 Added CSS files to src/themes/ and updated src/theme-manager.ts`);
    
  } catch (error) {
    console.error('❌ Error installing theme:', error);
    process.exit(1);
  }
}

// Get theme URL from command line
const themeUrl = process.argv[2];
if (!themeUrl) {
  console.error('Usage: npm run install-theme <theme-url>');
  console.error('Example: npm run install-theme https://tweakcn.com/r/themes/retro-arcade.json');
  process.exit(1);
}

installTheme(themeUrl);