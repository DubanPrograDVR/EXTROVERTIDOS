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

/**
 * Obtener la suscripción activa de panoramas (excluye superguia)
 * Busca una suscripción activa con cupo disponible y dentro del plazo de 30 días.
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Suscripción activa para publicar o null
 */
export async function getActivePublishSubscription(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("estado", "activa")
    .in("plan", ["panorama_unica", "panorama_pack4", "panorama_ilimitado"])
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener suscripción de publicación:", error);
    return null;
  }

  return data;
}

/**
 * Consumir una publicación de la suscripción activa.
 * Incrementa publicaciones_usadas en 1.
 * Usa RPC con SECURITY DEFINER para bypass de RLS y atomicidad.
 *
 * NOTA: La función en BD acepta (p_user_id UUID, p_plan plan_type).
 * Si la migración add_plan_publication_rules.sql fue ejecutada,
 * también existe la sobrecarga (p_subscription_id UUID).
 * Usamos la firma original para máxima compatibilidad.
 *
 * @param {string} userId - ID del usuario
 * @param {string|null} [planType=null] - Tipo de plan (ej: 'panorama_unica')
 * @returns {Promise<string>} UUID de la suscripción consumida
 */
export async function consumePublication(userId, planType = null) {
  if (!userId) throw new Error("ID de usuario requerido");

  const params = { p_user_id: userId };
  if (planType) {
    params.p_plan = planType;
  }

  const { data, error } = await supabase.rpc("consume_publication", params);

  if (error) {
    console.error("Error al consumir publicación:", error);
    throw error;
  }

  return data; // UUID de la suscripción
}

/**
 * Cancelar una suscripción activa del usuario
 * Usa una función RPC con SECURITY DEFINER para bypass de RLS
 * @param {string} subscriptionId - ID de la suscripción a cancelar
 * @returns {Promise<boolean>} true si se canceló correctamente
 */
export async function cancelSubscription(subscriptionId) {
  if (!subscriptionId) throw new Error("ID de suscripción requerido");

  const { data, error } = await supabase.rpc("cancel_subscription", {
    p_subscription_id: subscriptionId,
  });

  if (error) {
    console.error("Error al cancelar suscripción:", error);
    throw error;
  }

  return data === true;
}

/**
 * Valida restricciones de plan y consume 1 publicación atómicamente.
 * Llama a la función RPC validate_and_consume_publication en PostgreSQL.
 *
 * Esta es LA función centralizada para controlar publicaciones.
 * Respeta el interruptor global planes_enabled:
 * - Si false: permite publicar sin consumir plan
 * - Si true: valida plan activo, vencimiento, límite y consume
 *
 * @param {string} userId - ID del usuario
 * @param {boolean} [isAdmin=false] - Si el usuario es admin
 * @param {boolean} [isModerator=false] - Si el usuario es moderador
 * @returns {Promise<Object>} Resultado JSON con allowed, reason, subscription_id, etc.
 * @throws {Error} Si hay error de conexión con el servidor
 */
export async function validateAndConsumePublication(
  userId,
  isAdmin = false,
  isModerator = false,
) {
  if (!userId) throw new Error("ID de usuario requerido");

  const { data, error } = await supabase.rpc(
    "validate_and_consume_publication",
    {
      p_user_id: userId,
      p_is_admin: isAdmin,
      p_is_moderator: isModerator,
    },
  );

  if (error) {
    console.error("Error en validate_and_consume_publication:", error);
    throw new Error(
      error.message ||
        "Error al validar permisos de publicación. Intenta nuevamente.",
    );
  }

  return data;
}
