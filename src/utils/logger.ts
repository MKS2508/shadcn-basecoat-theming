import logger from '@mks2508/better-logger';

// Solo exportar loggers mínimos - SOLO errores críticos
export const themeLogger = {
  info: () => {}, // No-op
  debug: () => {}, // No-op
  success: () => {}, // No-op
  error: () => {} // No-op
};

export const fontLogger = {
  info: () => {}, // No-op
  debug: () => {}, // No-op
  success: () => {}, // No-op
  error: () => {} // No-op
};

export const componentLogger = {
  info: () => {}, // No-op
  debug: () => {}, // No-op
  success: () => {}, // No-op
  error: () => {} // No-op
};

// Funciones helper - solo errores críticos
export const logError = () => {};

export const logSuccess = () => {}; // No-op

// Export logger por compatibilidad
export { logger };
export default logger;