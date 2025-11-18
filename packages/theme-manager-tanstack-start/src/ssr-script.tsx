/**
 * SSR Script Generator for TanStack Start
 * Centralized FOUC prevention and cookie synchronization
 */

/**
 * Generate FOUC prevention script for HTML injection
 * @param storageType 'localStorage' | 'cookie'
 */
export function generateFOUCScript(storageType: 'localStorage' | 'cookie' = 'cookie'): string {
  const storageCode = storageType === 'cookie'
    ? generateCookieFOUCCode()
    : generateLocalStorageFOUCCode();

  return `
(function() {
  ${storageCode}
})();
  `.trim();
}

/**
 * Generate FOUC script using localStorage (fallback behavior)
 */
function generateLocalStorageFOUCCode(): string {
  return `
try {
  // Read theme preferences from localStorage
  var savedTheme = localStorage.getItem('theme-current');
  var savedMode = localStorage.getItem('theme-mode');

  // Fallback to consolidated config
  if (!savedTheme || !savedMode) {
    var cfg = localStorage.getItem('theme-mode-config');
    if (cfg) {
      var parsed = JSON.parse(cfg);
      if (!savedTheme && parsed.currentTheme) savedTheme = parsed.currentTheme;
      if (!savedMode && parsed.currentMode) savedMode = parsed.currentMode;
    }
  }

  // Apply defaults
  savedTheme = savedTheme || 'default';
  savedMode = savedMode || 'auto';

  // Resolve auto mode
  var effectiveMode = savedMode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedMode;

  // Apply attributes to document
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-mode', effectiveMode);

  if (effectiveMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  console.log('✅ FOUC prevention (localStorage): Applied theme', savedTheme, effectiveMode);

} catch (e) {
  console.warn('⚠️ FOUC prevention failed:', e);
}
  `.trim();
}

/**
 * Generate FOUC script using cookies (SSR-optimized)
 */
function generateCookieFOUCCode(): string {
  return `
try {
  // Read theme preferences from cookies first (SSR-friendly)
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^|;\\\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  var savedTheme = getCookie('theme-current');
  var savedMode = getCookie('theme-mode');

  // Fallback to localStorage if cookies not set
  if (!savedTheme) savedTheme = localStorage.getItem('theme-current');
  if (!savedMode) savedMode = localStorage.getItem('theme-mode');

  // Fallback to consolidated config
  if (!savedTheme || !savedMode) {
    var cfg = localStorage.getItem('theme-mode-config');
    if (cfg) {
      var parsed = JSON.parse(cfg);
      if (!savedTheme && parsed.currentTheme) savedTheme = parsed.currentTheme;
      if (!savedMode && parsed.currentMode) savedMode = parsed.currentMode;
    }
  }

  // Apply defaults
  savedTheme = savedTheme || 'default';
  savedMode = savedMode || 'auto';

  // Sync to cookies for next server request
  var expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = 'theme-current=' + encodeURIComponent(savedTheme) + '; expires=' + expires.toUTCString() + '; path=/';
  document.cookie = 'theme-mode=' + encodeURIComponent(savedMode) + '; expires=' + expires.toUTCString() + '; path=/';

  // Resolve auto mode
  var effectiveMode = savedMode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedMode;

  // Apply attributes to document (for CSS conditional selectors)
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-mode', effectiveMode);

  if (effectiveMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  console.log('✅ FOUC prevention (cookie sync): Applied theme', savedTheme, effectiveMode);

} catch (e) {
  console.warn('⚠️ FOUC prevention failed:', e);
}
  `.trim();
}