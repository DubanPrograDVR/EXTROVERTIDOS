/**
 * @fileoverview Sistema de caché en memoria para optimizar consultas frecuentes
 * @module database/cache
 */

/**
 * Caché simple en memoria para datos que no cambian frecuentemente
 * TTL (Time To Live) configurable por tipo de dato
 */
const cache = {
  data: new Map(),
  timestamps: new Map(),

  // TTL en milisegundos
  TTL: {
    categories: 5 * 60 * 1000, // 5 minutos
    adminStats: 30 * 1000, // 30 segundos
    chartData: 60 * 1000, // 1 minuto
  },

  /**
   * Obtiene un valor del caché si no ha expirado
   * @param {string} key - Clave del caché
   * @returns {*} Valor almacenado o null si expiró
   */
  get(key) {
    const timestamp = this.timestamps.get(key);
    const ttlKey = key.split("_")[0];
    const ttl = this.TTL[ttlKey] || 30000;

    if (timestamp && Date.now() - timestamp < ttl) {
      return this.data.get(key);
    }
    return null;
  },

  /**
   * Almacena un valor en el caché
   * @param {string} key - Clave del caché
   * @param {*} value - Valor a almacenar
   */
  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },

  /**
   * Invalida entradas del caché que coincidan con el patrón
   * @param {string} keyPattern - Patrón a buscar en las claves
   */
  invalidate(keyPattern) {
    for (const key of this.data.keys()) {
      if (key.includes(keyPattern)) {
        this.data.delete(key);
        this.timestamps.delete(key);
      }
    }
  },

  /**
   * Limpia todo el caché
   */
  clear() {
    this.data.clear();
    this.timestamps.clear();
  },
};

// Exportar funciones helper
export const invalidateCache = (pattern) => cache.invalidate(pattern);
export const clearCache = () => cache.clear();

export default cache;
