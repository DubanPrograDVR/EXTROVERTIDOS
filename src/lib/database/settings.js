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
 * Usa upsert para crear la fila si no existe.
 * @param {string} key - Clave de la configuración
 * @param {any} value - Nuevo valor
 * @param {string} userId - ID del admin que actualiza
 * @param {string} [description] - Descripción opcional (usada al insertar)
 * @returns {Promise<boolean>} true si se actualizó correctamente
 */
export async function updateAppSetting(key, value, userId, description) {
  const row = {
    key,
    value,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (description) {
    row.description = description;
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(row, { onConflict: "key" });

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

// =============================
// PRECIOS DE SUSCRIPCIONES
// =============================

const DEFAULT_PLAN_PRICES = {
  panorama_unica: 25000,
  panorama_pack4: 39990,
  panorama_ilimitado: 70000,
  superguia: 15000,
};

/**
 * Obtener precios de planes (plan_type -> monto)
 * @returns {Promise<Object>} Precios de planes
 */
export async function getPlanPrices() {
  const value = await getAppSetting("plan_prices");
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PLAN_PRICES };
  }

  return {
    ...DEFAULT_PLAN_PRICES,
    ...value,
  };
}

/**
 * Actualizar precios de planes (solo admins)
 * Intenta UPDATE primero; si la fila no existe, hace INSERT.
 * Verifica que los datos se hayan guardado correctamente.
 * @param {Object} prices - Precios por plan_type
 * @param {string} userId - ID del admin
 * @returns {Promise<boolean>}
 * @throws {Error} Si falla la actualización
 */
export async function updatePlanPrices(prices, userId) {
  const normalized = {
    ...DEFAULT_PLAN_PRICES,
    ...prices,
  };

  // 1. Intentar UPDATE (funciona si la fila ya existe)
  const { data: updated, error: updateError } = await supabase
    .from("app_settings")
    .update({
      value: normalized,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "plan_prices")
    .select("key");

  if (updateError) {
    console.error("[updatePlanPrices] Error en UPDATE:", updateError);
    throw new Error(
      "No se pudieron actualizar los precios: " + updateError.message,
    );
  }

  // 2. Si UPDATE no afectó filas, la fila no existe → INSERT
  if (!updated || updated.length === 0) {
    console.log("[updatePlanPrices] Fila no existe, insertando...");
    const { error: insertError } = await supabase.from("app_settings").insert({
      key: "plan_prices",
      value: normalized,
      description: "Precios de planes en CLP por plan_type",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[updatePlanPrices] Error en INSERT:", insertError);
      throw new Error(
        "No se pudieron guardar los precios: " + insertError.message,
      );
    }
  }

  // 3. Verificar que se guardó correctamente
  const saved = await getAppSetting("plan_prices");
  if (!saved || typeof saved !== "object") {
    throw new Error(
      "Los precios no se guardaron correctamente en la base de datos",
    );
  }

  // Validar que los valores coincidan
  const mismatch = Object.keys(normalized).find(
    (key) => saved[key] !== normalized[key],
  );
  if (mismatch) {
    console.error("[updatePlanPrices] Precios no coinciden tras guardar:", {
      normalized,
      saved,
    });
    throw new Error("Los precios guardados no coinciden con los enviados");
  }

  console.log("[updatePlanPrices] Precios guardados exitosamente:", saved);
  return true;
}
