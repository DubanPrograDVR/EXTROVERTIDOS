/**
 * Módulo de Likes
 * Funciones para gestionar "me gusta" en eventos
 */

import { supabase } from "../supabase";

/**
 * Obtener cantidad de likes de un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<number>} Cantidad de likes
 */
export async function getLikesCount(eventId) {
  if (!eventId) return 0;

  const { count, error } = await supabase
    .from("event_likes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) {
    console.error("Error obteniendo likes:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Verificar si el usuario dio like a un evento
 * @param {string} userId - ID del usuario
 * @param {string} eventId - ID del evento
 * @returns {Promise<boolean>}
 */
export async function hasUserLiked(userId, eventId) {
  if (!userId || !eventId) return false;

  const { data, error } = await supabase
    .from("event_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error verificando like:", error);
  }

  return !!data;
}

/**
 * Obtener estado de likes para múltiples eventos (optimizado)
 * @param {string} userId - ID del usuario
 * @param {string[]} eventIds - Array de IDs de eventos
 * @returns {Promise<Object>} { eventId: { isLiked, count } }
 */
export async function getLikesState(userId, eventIds) {
  if (!eventIds?.length) return {};

  const result = {};

  // Inicializar todos los eventos
  eventIds.forEach((id) => {
    result[id] = { isLiked: false, count: 0 };
  });

  // Obtener conteos de likes para todos los eventos
  const { data: counts, error: countError } = await supabase
    .from("event_likes")
    .select("event_id")
    .in("event_id", eventIds);

  if (!countError && counts) {
    counts.forEach((like) => {
      if (result[like.event_id]) {
        result[like.event_id].count++;
      }
    });
  }

  // Si hay usuario, verificar cuáles ha dado like
  if (userId) {
    const { data: userLikes, error: likeError } = await supabase
      .from("event_likes")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", eventIds);

    if (!likeError && userLikes) {
      userLikes.forEach((like) => {
        if (result[like.event_id]) {
          result[like.event_id].isLiked = true;
        }
      });
    }
  }

  return result;
}

/**
 * Toggle like (agregar si no existe, eliminar si existe)
 * @param {string} userId - ID del usuario
 * @param {string} eventId - ID del evento
 * @returns {Promise<{isLiked: boolean, count: number}>} Nuevo estado
 */
export async function toggleLike(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  // Intentar insertar primero
  const { data, error } = await supabase
    .from("event_likes")
    .insert({
      user_id: userId,
      event_id: eventId,
    })
    .select()
    .single();

  // Si se insertó correctamente, es nuevo like
  if (!error && data) {
    const count = await getLikesCount(eventId);
    return { isLiked: true, count };
  }

  // Si ya existe (error 23505), eliminar
  if (error?.code === "23505") {
    await supabase
      .from("event_likes")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    const count = await getLikesCount(eventId);
    return { isLiked: false, count };
  }

  // Otro tipo de error
  console.error("Error en toggleLike:", error);
  throw error;
}

/**
 * Agregar like
 * @param {string} userId - ID del usuario
 * @param {string} eventId - ID del evento
 * @returns {Promise<boolean>} true si se agregó
 */
export async function addLike(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  const { error } = await supabase.from("event_likes").insert({
    user_id: userId,
    event_id: eventId,
  });

  if (error && error.code !== "23505") {
    console.error("Error agregando like:", error);
    throw error;
  }

  return true;
}

/**
 * Eliminar like
 * @param {string} userId - ID del usuario
 * @param {string} eventId - ID del evento
 * @returns {Promise<boolean>} true si se eliminó
 */
export async function removeLike(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  const { error } = await supabase
    .from("event_likes")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error eliminando like:", error);
    throw error;
  }

  return true;
}
