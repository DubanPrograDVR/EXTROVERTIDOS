/**
 * @fileoverview Utility de logging para desarrollo y producción
 * @module lib/logger
 *
 * En desarrollo: muestra todos los logs
 * En producción: solo muestra errores
 */

const isDev = import.meta.env.DEV;

/**
 * Logger con diferentes niveles que respeta el entorno
 */
export const logger = {
  /**
   * Log informativo - solo en desarrollo
   */
  log: (...args) => {
    if (isDev) console.log("[INFO]", ...args);
  },

  /**
   * Log de debug - solo en desarrollo
   */
  debug: (...args) => {
    if (isDev) console.debug("[DEBUG]", ...args);
  },

  /**
   * Warning - solo en desarrollo
   */
  warn: (...args) => {
    if (isDev) console.warn("[WARN]", ...args);
  },

  /**
   * Error - siempre se muestra
   */
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },

  /**
   * Log de grupo - solo en desarrollo
   */
  group: (label) => {
    if (isDev) console.group(label);
  },

  /**
   * Fin de grupo - solo en desarrollo
   */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },

  /**
   * Tabla de datos - solo en desarrollo
   */
  table: (data) => {
    if (isDev) console.table(data);
  },

  /**
   * Timer start - solo en desarrollo
   */
  time: (label) => {
    if (isDev) console.time(label);
  },

  /**
   * Timer end - solo en desarrollo
   */
  timeEnd: (label) => {
    if (isDev) console.timeEnd(label);
  },
};

export default logger;
