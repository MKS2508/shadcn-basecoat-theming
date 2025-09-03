#!/usr/bin/env bun
import { GoogleGenAI } from "@google/genai";
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const DOCS_DIR = '/Users/mks/Downloads/themes/docs/references';
const ASTRO_COMPONENTS_DIR = '/Users/mks/Downloads/themes/examples/astro/src/components/ui';

// Initialize Google GenAI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ComponentAnalysis {
  componentType: string;
  baseClass: string;
  requiresJavaScript: boolean;
  jsFiles?: string[];
  variants?: string[];
  sizes?: string[];
  hasGroups?: boolean;
  isInteractive?: boolean;
  ariaDependencies?: string[];
}

async function analyzeComponent(componentName: string, docContent: string): Promise<ComponentAnalysis> {
  console.log(`🔍 Analyzing ${componentName} structure...`);
  
  try {
    const analysisPromptPath = join('/Users/mks/Downloads/themes/docs', 'gemini-analysis-prompt.md');
    const analysisPrompt = readFileSync(analysisPromptPath, 'utf-8');
    
    const fullPrompt = `${analysisPrompt}

---

DOCUMENTACIÓN BASECOAT:
${docContent}

---

Analiza y responde SOLO con JSON:`;

    console.log(`📤 Sending analysis prompt (${fullPrompt.length} characters)...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });
    
    const jsonText = response.text.trim();
    console.log(`📝 Analysis response:`, jsonText);
    
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || [null, jsonText];
    const cleanJson = jsonMatch[1] || jsonText;
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error(`❌ Error analyzing ${componentName}:`, error);
    throw error;
  }
}

async function generateComponent(componentName: string, analysis: ComponentAnalysis, docContent: string): Promise<string> {
  console.log(`🤖 Generating ${componentName} component...`);
  
  try {
    const generationPromptPath = join('/Users/mks/Downloads/themes/docs', 'gemini-generation-prompt.md');
    const generationPrompt = readFileSync(generationPromptPath, 'utf-8');
    
    const fullPrompt = `${generationPrompt}

---

ANÁLISIS PREVIO:
${JSON.stringify(analysis, null, 2)}

---

DOCUMENTACIÓN BASECOAT:
${docContent.substring(0, 2000)}

---

Genera el componente Astro usando el formato <component></component>:`;

    console.log(`📤 Sending generation prompt (${fullPrompt.length} characters)...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });
    
    const output = response.text;
    console.log(`📝 Generation response:`, output);
    
    return output;
  } catch (error) {
    console.error(`❌ Error generating ${componentName}:`, error);
    throw error;
  }
}

function extractComponentFromResponse(response: string): string {
  // Try multiple patterns to extract component
  const patterns = [
    /<component>([\s\S]*?)<\/component>/,
    /```astro\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/
  ];
  
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  throw new Error('No component code found in response');
}

async function processComponent(componentName: string): Promise<void> {
  const docPath = join(DOCS_DIR, `basecoat-${componentName}.md`);
  
  if (!existsSync(docPath)) {
    console.log(`⚠️  Documentation not found for ${componentName}, skipping...`);
    return;
  }
  
  console.log(`📖 Reading documentation: ${docPath}`);
  const docContent = readFileSync(docPath, 'utf-8');
  
  try {
    // Step 1: Analyze component
    const analysis = await analyzeComponent(componentName, docContent);
    console.log(`✅ Analysis completed:`, analysis);
    
    // Step 2: Generate component
    const geminiResponse = await generateComponent(componentName, analysis, docContent);
    const astroComponent = extractComponentFromResponse(geminiResponse);
    
    // Step 3: Save component
    const pascalCaseName = componentName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    const outputPath = join(ASTRO_COMPONENTS_DIR, `${pascalCaseName}.astro`);
    await writeFile(outputPath, astroComponent, 'utf-8');
    
    console.log(`✅ Generated: ${pascalCaseName}.astro`);
    console.log(`📍 Path: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to process ${componentName}:`, error);
  }
}

async function main(): Promise<void> {
  const componentName = process.argv[2];
  
  if (!componentName) {
    console.error('❌ Please provide a component name');
    console.log('Usage: bun run generate-single-component.ts <component-name>');
    console.log('Example: bun run generate-single-component.ts button');
    process.exit(1);
  }
  
  try {
    // Create output directory
    if (!existsSync(ASTRO_COMPONENTS_DIR)) {
      mkdirSync(ASTRO_COMPONENTS_DIR, { recursive: true });
      console.log(`📁 Created directory: ${ASTRO_COMPONENTS_DIR}`);
    }
    
    console.log(`🚀 Processing component: ${componentName}`);
    await processComponent(componentName);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}