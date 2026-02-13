import { createInterface } from 'node:readline';
import { extname } from 'node:path';
import { createHighlighter, type Highlighter } from 'shiki';
import { mksDarkTheme } from './shiki-mks-theme.ts';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const BR_CYAN = '\x1b[96m';

const CONTEXT_LINES = 3;

const SUPPORTED_LANGS = ['typescript', 'tsx', 'javascript', 'jsx', 'html', 'css', 'json'] as const;

/** Singleton highlighter instance, lazily initialized. */
let highlighterInstance: Highlighter | null = null;

/**
 * Returns a cached shiki highlighter configured with the MKS Dark theme.
 * @returns Singleton Highlighter instance.
 */
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: [mksDarkTheme],
      langs: [...SUPPORTED_LANGS],
    });
  }
  return highlighterInstance;
}

/**
 * Converts a hex color string (#RRGGBB) to a 24-bit true color ANSI escape sequence.
 * @param hex - Hex color string (e.g. '#ff7edb').
 * @returns ANSI escape sequence for the foreground color.
 */
function hexToAnsi(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * Converts shiki token lines into an ANSI-colored string.
 * Supports true color foreground, italic (fontStyle & 1), and bold (fontStyle & 2).
 * @param tokens - 2D array of shiki tokens (lines × tokens).
 * @returns ANSI-highlighted string with newlines.
 */
function tokensToAnsi(tokens: Array<Array<{ content: string; color?: string; fontStyle?: number }>>): string {
  const lines: string[] = [];

  for (const line of tokens) {
    let lineStr = '';
    for (const token of line) {
      let text = token.content;
      if (token.color) {
        text = hexToAnsi(token.color) + text + '\x1b[39m';
      }
      if (token.fontStyle) {
        if (token.fontStyle & 1) text = '\x1b[3m' + text + '\x1b[23m';
        if (token.fontStyle & 2) text = '\x1b[1m' + text + '\x1b[22m';
      }
      lineStr += text;
    }
    lines.push(lineStr);
  }

  return lines.join('\n');
}

/**
 * Maps file extensions to shiki language identifiers (TextMate grammar names).
 * @param filePath - File path to detect language from.
 * @returns Shiki-compatible language identifier.
 */
function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
  };
  return map[ext] ?? 'typescript';
}

/**
 * Highlights a full code block using shiki's TextMate grammars with the MKS Dark theme,
 * then splits into individual lines for diff rendering.
 * Falls back to raw lines on error.
 * @param code - Full source code string.
 * @param language - Shiki language identifier.
 * @returns Array of ANSI-highlighted lines.
 */
async function highlightCode(code: string, language: string): Promise<string[]> {
  try {
    const highlighter = await getHighlighter();
    const tokens = highlighter.codeToTokensBase(code, {
      lang: language as any,
      theme: 'mks-dark',
    });
    const ansi = tokensToAnsi(tokens);
    return ansi.split('\n');
  } catch {
    return code.split('\n');
  }
}

/**
 * Describes a file change: the target path and before/after content.
 * For new files, `oldContent` is `null`.
 */
export interface IFileChange {
  filePath: string;
  oldContent: string | null;
  newContent: string;
}

/**
 * Generates a diff-style preview string for a file change.
 * Uses shiki (TextMate grammars) with the MKS Dark theme for syntax highlighting.
 * Shows added lines with `+` prefix in green, context lines with syntax highlighting,
 * and `...` for skipped sections.
 * @param change - The file change to preview.
 * @returns Formatted string ready for console output.
 */
export async function generateDiffPreview(change: IFileChange): Promise<string> {
  const separator = DIM + '─'.repeat(60) + RESET;
  const header = `${BOLD}File: ${BR_CYAN}${change.filePath}${RESET}`;
  const language = detectLanguage(change.filePath);

  if (change.oldContent === null) {
    const label = `${DIM}(new file)${RESET}`;
    const highlightedLines = await highlightCode(change.newContent, language);
    const body = highlightedLines
      .map((line) => `${GREEN}+ ${RESET}${line}`)
      .join('\n');
    return `${header} ${label}\n${separator}\n${body}\n${separator}`;
  }

  const oldLines = change.oldContent.split('\n');
  const rawNewLines = change.newContent.split('\n');

  const addedLineNumbers = findAddedLines(oldLines, rawNewLines);
  if (addedLineNumbers.size === 0) return '';

  const highlightedNewLines = await highlightCode(change.newContent, language);
  const visibleLines = buildVisibleSet(addedLineNumbers, rawNewLines.length);
  const body = renderLines(highlightedNewLines, addedLineNumbers, visibleLines);

  return `${header}\n${separator}\n${body}\n${separator}`;
}

/**
 * Prompts the user to confirm changes. Shows all file previews and waits for Y/n.
 * @param changes - Array of file changes to preview.
 * @returns `true` if confirmed, `false` if declined.
 */
export async function confirmChanges(changes: IFileChange[]): Promise<boolean> {
  const previews = (await Promise.all(changes.map(generateDiffPreview))).filter(Boolean);
  if (previews.length === 0) return true;

  console.log('');
  console.log(previews.join('\n\n'));
  console.log('');

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise<boolean>((resolve) => {
    rl.question(`${BOLD}Apply changes?${RESET} ${DIM}(Y/n)${RESET} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Diff computation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Simple sequential diff: finds line indices in `newLines` that are additions.
 * @param oldLines - Original file lines.
 * @param newLines - Modified file lines.
 * @returns Set of 0-based line numbers in newLines that are new.
 */
function findAddedLines(oldLines: string[], newLines: string[]): Set<number> {
  const added = new Set<number>();
  let oldIdx = 0;

  for (let newIdx = 0; newIdx < newLines.length; newIdx++) {
    if (oldIdx < oldLines.length && newLines[newIdx] === oldLines[oldIdx]) {
      oldIdx++;
    } else {
      added.add(newIdx);
    }
  }

  return added;
}

/**
 * Builds the set of line indices that should be visible (added + context).
 * @param addedLines - Set of added line indices.
 * @param totalLines - Total number of lines in new content.
 * @returns Set of visible line indices.
 */
function buildVisibleSet(addedLines: Set<number>, totalLines: number): Set<number> {
  const visible = new Set<number>();

  for (const lineNum of addedLines) {
    const start = Math.max(0, lineNum - CONTEXT_LINES);
    const end = Math.min(totalLines - 1, lineNum + CONTEXT_LINES);
    for (let i = start; i <= end; i++) {
      visible.add(i);
    }
  }

  return visible;
}

/**
 * Renders the diff output with `+` for added lines, context lines, and `...` for gaps.
 * Lines are pre-highlighted with shiki syntax coloring.
 * @param highlightedLines - All lines of the new content, already syntax-highlighted.
 * @param addedLines - Set of indices that are additions.
 * @param visibleLines - Set of indices that should be shown.
 * @returns Formatted diff string.
 */
function renderLines(
  highlightedLines: string[],
  addedLines: Set<number>,
  visibleLines: Set<number>,
): string {
  const output: string[] = [];
  let inGap = false;

  for (let i = 0; i < highlightedLines.length; i++) {
    if (!visibleLines.has(i)) {
      if (!inGap) {
        output.push(`${DIM}  ...${RESET}`);
        inGap = true;
      }
      continue;
    }

    inGap = false;
    const line = highlightedLines[i];

    if (addedLines.has(i)) {
      output.push(`${GREEN}+ ${RESET}${line}`);
    } else {
      output.push(`  ${line}`);
    }
  }

  return output.join('\n');
}
