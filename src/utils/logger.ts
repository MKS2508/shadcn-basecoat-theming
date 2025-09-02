import logger, { 
  createScopedLogger,
  setGlobalPrefix,
  setVerbosity,
  setTheme,
  debug,
  info,
  warn,
  error,
  success,
  critical
} from '@mks2508/better-logger';

// Set global configuration
setGlobalPrefix('🎨 ThemeManager');
setTheme('neon');
setVerbosity('debug');

// Export main logger
export { logger };

// Export specialized loggers for different subsystems
export const themeLogger = createScopedLogger('🎨 Theme');
export const fontLogger = createScopedLogger('🔤 Font');
export const storageLogger = createScopedLogger('📦 Storage');
export const uiLogger = createScopedLogger('🖼️ UI');
export const componentLogger = createScopedLogger('🧩 Component');
export const templateLogger = createScopedLogger('📄 Template');
export const registryLogger = createScopedLogger('📂 Registry');
export const installerLogger = createScopedLogger('⚙️ Installer');
export const performanceLogger = createScopedLogger('📊 Performance');

// Helper functions for common logging patterns
export const logPerformance = (operation: string, duration: number) => {
  performanceLogger.info(`${operation}: ${duration.toFixed(1)}ms`);
};

export const logError = (context: string, errorMsg: Error | string) => {
  error(`❌ ${context}: ${errorMsg}`);
};

export const logSuccess = (message: string) => {
  success(`✅ ${message}`);
};

export const logWarning = (message: string) => {
  warn(`⚠️ ${message}`);
};

// Export direct logging functions
export { debug, info, warn, error, success, critical };

export default logger;