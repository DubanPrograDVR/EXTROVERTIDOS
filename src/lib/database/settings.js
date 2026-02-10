/**
 * @fileoverview Funciones para gestionar configuraciones globales de la app
 * @module database/settings
 */

import { supabase } from "../supabase";

/**
 * Obtener el valor de una configuración
 * @param {string} key - Clave de la configuración
 * @returns {Promise<any>} Valor de la configuración
 */
export async function getAppSetting(key) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    console.warn(`Error al obtener configuración "${key}":`, error);
    return null;
  }

  return data?.value;
}

/**
 * Actualizar el valor de una configuración (solo admins)
 * @param {string} key - Clave de la configuración
 * @param {any} value - Nuevo valor
 * @param {string} userId - ID del admin que actualiza
 * @returns {Promise<boolean>} true si se actualizó correctamente
 */
export async function updateAppSetting(key, value, userId) {
  const { error } = await supabase
    .from("app_settings")
    .update({
      value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) {
    console.error(`Error al actualizar configuración "${key}":`, error);
    throw error;
  }

  return true;
}

/**
 * Verificar si los planes están habilitados
 * Retorna true por defecto si no se puede obtener la configuración
 * (ej: tabla no existe aún o error de conexión)
 * @returns {Promise<boolean>}
 */
export async function isPlanesEnabled() {
  const value = await getAppSetting("planes_enabled");
  // Si no se pudo obtener (null), asumir habilitado por defecto
  if (value === null) return true;
  return value === true;
}

/**
 * Activar o desactivar los planes
 * @param {boolean} enabled
 * @param {string} userId - ID del admin
 * @returns {Promise<boolean>}
 */
export async function togglePlanesEnabled(enabled, userId) {
  return updateAppSetting("planes_enabled", enabled, userId);
}
