/**
 * @fileoverview Funciones para consultar suscripciones del usuario
 * @module database/subscriptions
 */

import { supabase } from "../supabase";

/**
 * Obtener la suscripción activa del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Suscripción activa o null
 */
export async function getActiveSubscription(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("estado", "activa")
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener suscripción activa:", error);
    return null;
  }

  return data;
}

/**
 * Obtener todas las suscripciones del usuario (historial)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de suscripciones
 */
export async function getUserSubscriptions(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener suscripciones:", error);
    return [];
  }

  return data || [];
}
