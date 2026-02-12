/**
 * Unified FOUC (Flash of Unstyled Content) prevention script generator.
 *
 * Produces a self-contained JS string that can be injected into an HTML
 * `<script>` tag in `<head>`.  The generated code reads the user's persisted
 * theme/mode preferences and applies `data-theme`, `data-mode` and the `.dark`
 * class to `<html>` **before** the first paint, eliminating any flash.
 *
 * Canonical localStorage keys: `theme-current`, `theme-mode`, `theme-mode-config`.
 *
 * @module fouc-script
 */

/** Configuration for the FOUC prevention script generator. */
export interface IFOUCScriptConfig {
  /**
   * Where to read persisted preferences from.
   * - `'localStorage'` (default) - reads `theme-current` / `theme-mode` keys.
   * - `'cookie'` - reads cookies first, falls back to localStorage, then syncs
   *   values back to cookies with a 1-year expiry so the server can read them.
   */
  storageType?: 'localStorage' | 'cookie';

  /**
   * When `true` the generated script hides `<body>` until DOMContentLoaded
   * (with a configurable safety timeout) and then reveals it.
   * Useful for vanilla / MPA apps where CSS loads asynchronously.
   * @default false
   */
  bodyReveal?: boolean;

  /** Fallback theme name when nothing is persisted. @default 'default' */
  defaultTheme?: string;

  /** Fallback mode when nothing is persisted. @default 'auto' */
  defaultMode?: 'auto' | 'light' | 'dark';

  /**
   * Safety timeout (ms) for the body-reveal fallback.
   * Only used when `bodyReveal` is `true`.
   * @default 3000
   */
  revealTimeout?: number;

  /**
   * When `true` the generated script emits `console.log` calls and a
   * `debugger` statement so you can inspect what values are being read
   * and applied.
   * @default false
   */
  debug?: boolean;
}

/**
 * Generate a self-contained FOUC prevention script string.
 *
 * Accepts either an {@link IFOUCScriptConfig} object **or** a plain storage-type
 * string for backward compatibility with the old `ThemeManager.generateFOUCScript('cookie')` API.
 *
 * @param configOrStorageType - Configuration object or `'localStorage'` / `'cookie'` shorthand.
 * @returns A JavaScript source string (no surrounding `<script>` tags).
 *
 * @example
 * ```ts
 * // Minimal (SPA, no body hide)
 * const script = generateFOUCScript();
 *
 * // Cookie-based SSR with body reveal
 * const script = generateFOUCScript({
 *   storageType: 'cookie',
 *   bodyReveal: true,
 *   defaultTheme: 'synthwave84',
 *   revealTimeout: 2000,
 * });
 *
 * // Backward compat shorthand
 * const script = generateFOUCScript('cookie');
 * ```
 */
export function generateFOUCScript(
  configOrStorageType?: IFOUCScriptConfig | 'localStorage' | 'cookie'
): string {
  const config = normalizeConfig(configOrStorageType);

  const sections: string[] = [];

  if (config.debug) {
    sections.push(`console.log('[FOUC] script running, storageType=${config.storageType}');`);
  }

  sections.push(storageReadSection(config));

  if (config.debug) {
    sections.push(`console.log('[FOUC] after storage read: t='+t+', m='+m);`);
  }

  sections.push(configFallbackSection());

  if (config.debug) {
    sections.push(`console.log('[FOUC] after config fallback: t='+t+', m='+m);`);
  }

  sections.push(defaultsSection(config));
  sections.push(resolveAutoSection());

  if (config.debug) {
    sections.push(`console.log('[FOUC] resolved: theme='+t+', mode='+m+', effectiveMode='+em);`);
  }

  sections.push(applySection());
  sections.push(cssVarsReplaySection());

  if (config.debug) {
    sections.push(`console.log('[FOUC] applied: data-theme='+document.documentElement.getAttribute('data-theme')+', data-mode='+document.documentElement.getAttribute('data-mode')+', classList='+document.documentElement.className);`);
  }

  if (config.storageType === 'cookie') {
    sections.push(cookieSyncSection());
  }

  if (config.bodyReveal) {
    sections.push(bodyRevealSection(config));
  }

  const body = sections.join('\n\n');

  return `(function(){try{${body}}catch(e){console.warn('FOUC prevention failed:',e);}})();`;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Normalize the public API overload into a concrete config object.
 * @param input - Raw user input (object, string, or undefined).
 * @returns Resolved config with all defaults applied.
 */
function normalizeConfig(
  input?: IFOUCScriptConfig | 'localStorage' | 'cookie'
): Required<IFOUCScriptConfig> {
  const defaults: Required<IFOUCScriptConfig> = {
    storageType: 'localStorage',
    bodyReveal: false,
    defaultTheme: 'default',
    defaultMode: 'auto',
    revealTimeout: 3000,
    debug: false,
  };

  if (!input) return defaults;

  if (typeof input === 'string') {
    return { ...defaults, storageType: input };
  }

  return { ...defaults, ...input };
}

/* ---------- Section generators ---------- */

/**
 * Section 1 - Read saved values from storage.
 *
 * For `'localStorage'` this reads directly.
 * For `'cookie'` this reads cookies first, then falls back to localStorage.
 */
function storageReadSection(config: Required<IFOUCScriptConfig>): string {
  if (config.storageType === 'cookie') {
    return `
function gc(n){var m=document.cookie.match(new RegExp('(^|;\\\\s*)('+n+')=([^;]*)'));return m?decodeURIComponent(m[3]):null;}
var t=gc('theme-current')||localStorage.getItem('theme-current');
var m=gc('theme-mode')||localStorage.getItem('theme-mode');`.trim();
  }

  return `
var t=localStorage.getItem('theme-current');
var m=localStorage.getItem('theme-mode');`.trim();
}

/**
 * Section 2 - Fallback: read the consolidated `theme-mode-config` JSON blob.
 */
function configFallbackSection(): string {
  return `
if(!t||!m){try{var c=localStorage.getItem('theme-mode-config');if(c){var p=JSON.parse(c);if(!t&&p.currentTheme)t=p.currentTheme;if(!m&&p.currentMode)m=p.currentMode;}}catch(e){}}`.trim();
}

/**
 * Section 3 - Apply configurable defaults when no persisted value exists.
 */
function defaultsSection(config: Required<IFOUCScriptConfig>): string {
  return `t=t||'${config.defaultTheme}';m=m||'${config.defaultMode}';`;
}

/**
 * Section 4 - Resolve `'auto'` mode using system preference.
 */
function resolveAutoSection(): string {
  return `var em=m==='auto'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;`;
}

/**
 * Section 5 - Apply `data-theme`, `data-mode` and `.dark` class to `<html>`.
 */
function applySection(): string {
  return `
var d=document.documentElement;
d.setAttribute('data-theme',t);
d.setAttribute('data-mode',em);
d.style.colorScheme=em;
if(em==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}`.trim();
}

/**
 * Section 6 - Replay cached CSS variables from localStorage.
 *
 * ThemeManager caches the last applied CSS variables in `theme-css-vars`.
 * Applying them here eliminates the flash of the default/fallback theme
 * that would otherwise show until ThemeManager re-fetches the theme CSS.
 */
function cssVarsReplaySection(): string {
  return `
try{var cv=localStorage.getItem('theme-css-vars');if(cv){var vars=JSON.parse(cv);for(var k in vars){if(vars.hasOwnProperty(k))d.style.setProperty(k,vars[k]);}}}catch(e){}`.trim();
}

/**
 * Section 7 (cookie only) - Sync values back to cookies for SSR.
 */
function cookieSyncSection(): string {
  return `
var ex=new Date();ex.setFullYear(ex.getFullYear()+1);var xs=ex.toUTCString();
document.cookie='theme-current='+encodeURIComponent(t)+';expires='+xs+';path=/';
document.cookie='theme-mode='+encodeURIComponent(m)+';expires='+xs+';path=/';`.trim();
}

/**
 * Section 7 (bodyReveal only) - Hide body initially, reveal on DOMContentLoaded
 * with a safety timeout.
 */
function bodyRevealSection(config: Required<IFOUCScriptConfig>): string {
  return `
function rv(){if(document.body){document.body.style.visibility='visible';document.body.style.opacity='1';document.body.style.transition='opacity 0.15s ease-out';}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(rv,0);});}else{rv();}
setTimeout(function(){if(document.body&&document.body.style.visibility==='hidden'){rv();}},${config.revealTimeout});`.trim();
}
