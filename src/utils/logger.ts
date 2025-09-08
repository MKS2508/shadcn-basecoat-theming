import logger, { 
  setGlobalPrefix,
  setVerbosity,
  setTheme,
  debug,
  info,
  warn,
  error,
  success,
  critical,
  time,
  timeEnd
} from '@mks2508/better-logger';

// Set global configuration with cyberpunk theme for neon aesthetics
setGlobalPrefix('ThemeManager');
setTheme('cyberpunk');
setVerbosity('debug');

// Export main logger
export { logger };

// Create specialized loggers with styled prefixes using better-logger's functionality
export const themeLogger = {
  debug: (...args: any[]) => debug('[🎨 Theme]', ...args),
  info: (...args: any[]) => info('[🎨 Theme]', ...args),
  warn: (...args: any[]) => warn('[🎨 Theme]', ...args),
  error: (...args: any[]) => error('[🎨 Theme]', ...args),
  success: (...args: any[]) => success('[🎨 Theme]', ...args)
};

export const fontLogger = {
  debug: (...args: any[]) => debug('[🔤 Font]', ...args),
  info: (...args: any[]) => info('[🔤 Font]', ...args),
  warn: (...args: any[]) => warn('[🔤 Font]', ...args),
  error: (...args: any[]) => error('[🔤 Font]', ...args),
  success: (...args: any[]) => success('[🔤 Font]', ...args)
};

export const storageLogger = {
  debug: (...args: any[]) => debug('[💾 Storage]', ...args),
  info: (...args: any[]) => info('[💾 Storage]', ...args),
  warn: (...args: any[]) => warn('[💾 Storage]', ...args),
  error: (...args: any[]) => error('[💾 Storage]', ...args),
  success: (...args: any[]) => success('[💾 Storage]', ...args)
};

export const uiLogger = {
  debug: (...args: any[]) => debug('[🖼️ UI]', ...args),
  info: (...args: any[]) => info('[🖼️ UI]', ...args),
  warn: (...args: any[]) => warn('[🖼️ UI]', ...args),
  error: (...args: any[]) => error('[🖼️ UI]', ...args),
  success: (...args: any[]) => success('[🖼️ UI]', ...args)
};

export const componentLogger = {
  debug: (...args: any[]) => debug('[🧩 Component]', ...args),
  info: (...args: any[]) => info('[🧩 Component]', ...args),
  warn: (...args: any[]) => warn('[🧩 Component]', ...args),
  error: (...args: any[]) => error('[🧩 Component]', ...args),
  success: (...args: any[]) => success('[🧩 Component]', ...args)
};

export const templateLogger = {
  debug: (...args: any[]) => debug('[📄 Template]', ...args),
  info: (...args: any[]) => info('[📄 Template]', ...args),
  warn: (...args: any[]) => warn('[📄 Template]', ...args),
  error: (...args: any[]) => error('[📄 Template]', ...args),
  success: (...args: any[]) => success('[📄 Template]', ...args)
};

export const registryLogger = {
  debug: (...args: any[]) => debug('[📂 Registry]', ...args),
  info: (...args: any[]) => info('[📂 Registry]', ...args),
  warn: (...args: any[]) => warn('[📂 Registry]', ...args),
  error: (...args: any[]) => error('[📂 Registry]', ...args),
  success: (...args: any[]) => success('[📂 Registry]', ...args)
};

export const installerLogger = {
  debug: (...args: any[]) => debug('[⚙️ Installer]', ...args),
  info: (...args: any[]) => info('[⚙️ Installer]', ...args),
  warn: (...args: any[]) => warn('[⚙️ Installer]', ...args),
  error: (...args: any[]) => error('[⚙️ Installer]', ...args),
  success: (...args: any[]) => success('[⚙️ Installer]', ...args)
};

export const performanceLogger = {
  debug: (...args: any[]) => debug('[📊 Performance]', ...args),
  info: (...args: any[]) => info('[📊 Performance]', ...args),
  warn: (...args: any[]) => warn('[📊 Performance]', ...args),
  error: (...args: any[]) => error('[📊 Performance]', ...args),
  success: (...args: any[]) => success('[📊 Performance]', ...args)
};

// API logger for different services
export const apiLogger = {
  debug: (...args: any[]) => debug('[🌐 API]', ...args),
  info: (...args: any[]) => info('[🌐 API]', ...args),
  warn: (...args: any[]) => warn('[🌐 API]', ...args),
  error: (...args: any[]) => error('[🌐 API]', ...args),
  success: (...args: any[]) => success('[🌐 API]', ...args)
};

// Helper functions for common logging patterns
export const logPerformance = (operation: string, duration: number) => {
  const performanceIcon = duration < 16 ? '🚀' : duration < 50 ? '⚡' : '📈';
  performanceLogger.info(`${performanceIcon} ${operation}: ${duration.toFixed(2)}ms`);
};

export const logError = (context: string, errorMsg: Error | string) => {
  const message = errorMsg instanceof Error ? errorMsg.message : String(errorMsg);
  error(`${context}: ${message}`);
};

export const logSuccess = (message: string) => {
  success(message);
};

export const logWarning = (message: string) => {
  warn(message);
};

// Export timing functions for performance monitoring
export { time, timeEnd };

// Export direct logging functions
export { debug, info, warn, error, success, critical };

export default logger;