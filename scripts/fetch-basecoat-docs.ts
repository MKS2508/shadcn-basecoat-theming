#!/usr/bin/env bun

/**
 * Script to fetch Basecoat UI component documentation
 * Usage: bun run scripts/fetch-basecoat-docs.ts [component-name]
 * Example: bun run scripts/fetch-basecoat-docs.ts popover
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BASECOAT_COMPONENTS = [
  'accordion',
  'alert',
  'badge',
  'breadcrumb',
  'button',
  'card',
  'checkbox',
  'dialog',
  'dropdown-menu',
  'input',
  'label',
  'popover',
  'progress',
  'radio-group',
  'select',
  'separator',
  'sidebar',
  'skeleton',
  'switch',
  'table',
  'tabs',
  'textarea',
  'toast',
  'toggle',
  'tooltip'
];

async function fetchComponentDoc(component: string) {
  const url = `https://into.md/basecoatui.com/components/${component}/`;
  
  console.log(`📥 Fetching documentation for: ${component}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    // Save to docs/references
    const docsDir = join(process.cwd(), 'docs/references');
    if (!existsSync(docsDir)) {
      await mkdir(docsDir, { recursive: true });
    }

    const fileName = `basecoat-${component}.md`;
    const filePath = join(docsDir, fileName);
    
    await writeFile(filePath, content);
    
    console.log(`✅ Saved to: docs/references/${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to fetch ${component}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📚 Fetching all Basecoat UI component documentation...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const component of BASECOAT_COMPONENTS) {
      const success = await fetchComponentDoc(component);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}/${BASECOAT_COMPONENTS.length}`);
    console.log(`   ❌ Failed: ${failCount}/${BASECOAT_COMPONENTS.length}`);
  } else {
    const component = args[0].toLowerCase();
    
    if (!BASECOAT_COMPONENTS.includes(component)) {
      console.warn(`⚠️  Warning: "${component}" is not in the known components list`);
      console.log('Known components:', BASECOAT_COMPONENTS.join(', '));
      console.log('Attempting to fetch anyway...\n');
    }
    
    await fetchComponentDoc(component);
  }
}

main().catch(console.error);