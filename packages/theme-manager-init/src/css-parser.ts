import { readFile } from 'node:fs/promises';

/** Result of parsing CSS variables from a project stylesheet. */
export interface ICSSParseResult {
  hasVariables: boolean;
  lightVars: Map<string, string>;
  darkVars: Map<string, string>;
}

/**
 * Extracts CSS custom properties from :root and .dark blocks in a stylesheet.
 * Returns empty maps for Tailwind v4 projects that use @theme inline without :root vars.
 * @param cssFilePath - Absolute path to the CSS file to parse
 * @returns Parsed light/dark variable maps
 */
export async function parseCSSVariables(cssFilePath: string): Promise<ICSSParseResult> {
  const content = await readFile(cssFilePath, 'utf-8');

  const lightVars = extractBlock(content, /:root\s*\{([^}]+)\}/);
  const darkVars = extractBlock(content, /\.dark\s*\{([^}]+)\}/);

  return {
    hasVariables: lightVars.size > 0 || darkVars.size > 0,
    lightVars,
    darkVars,
  };
}

/**
 * Extracts --variable: value pairs from a regex-matched CSS block.
 * @param content - Full CSS file content
 * @param pattern - Regex with a capture group for the block body
 * @returns Map of variable names to values
 */
function extractBlock(content: string, pattern: RegExp): Map<string, string> {
  const vars = new Map<string, string>();
  const match = content.match(pattern);
  if (!match?.[1]) return vars;

  for (const line of match[1].split(';')) {
    const varMatch = line.match(/--([\w-]+)\s*:\s*(.+)/);
    if (varMatch?.[1] && varMatch[2]) {
      vars.set(`--${varMatch[1]}`, varMatch[2].trim());
    }
  }
  return vars;
}
