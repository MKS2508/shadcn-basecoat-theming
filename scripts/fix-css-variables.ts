#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Convert OKLCH to HSL format suitable for CSS custom properties
 */
function convertOklchToHsl(oklchValue: string): string {
  // Remove oklch() wrapper
  const values = oklchValue.replace('oklch(', '').replace(')', '');
  const [l, c, h] = values.split(' ').map(v => parseFloat(v.trim()));
  
  // Simple conversion (this is approximate - for exact conversion we'd need a color library)
  // For now, let's convert OKLCH lightness to HSL lightness and keep chroma/hue
  const lightness = Math.round(l * 100);
  const saturation = Math.round(c * 100);
  const hue = h || 0;
  
  return `${hue} ${saturation}% ${lightness}%`;
}

/**
 * Fix CSS variables format in style.css
 */
function fixCssVariables() {
  const stylePath = path.join(process.cwd(), 'src', 'style.css');
  let content = fs.readFileSync(stylePath, 'utf-8');
  
  console.log('🔧 Fixing CSS variables format...');
  
  // Find all oklch() values and convert them
  const oklchRegex = /oklch\([^)]+\)/g;
  const matches = content.match(oklchRegex);
  
  if (matches) {
    console.log(`Found ${matches.length} OKLCH values to convert`);
    
    matches.forEach(match => {
      const hslValue = convertOklchToHsl(match);
      content = content.replace(match, hslValue);
      console.log(`  ${match} → ${hslValue}`);
    });
  }
  
  // Also fix any remaining oklch references
  content = content.replace(/oklch\(/g, '').replace(/\)/g, '');
  
  // Write back to file
  fs.writeFileSync(stylePath, content);
  
  console.log('✅ CSS variables format fixed!');
  console.log('📝 Updated:', stylePath);
}

fixCssVariables();