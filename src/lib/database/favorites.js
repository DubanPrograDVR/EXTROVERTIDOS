/**
 * Módulo de Favoritos
 * Funciones para gestionar eventos guardados por usuarios
 */

import { supabase } from "../supabase";

/**
 * Obtener todos los favoritos del usuario actual
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de eventos favoritos con sus datos completos
 */
export async function getUserFavorites(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_favorites")
    .select(
      `
      id,
      created_at,
      event_id,
      events (
        id,
        titulo,
        descripcion,
        imagenes,
        fecha_evento,
        hora_inicio,
        hora_fin,
        tipo_entrada,
        precio,
        comuna,
        provincia,
        direccion,
        estado,
        categories (
          id,
          nombre,
          icono,
          color
        ),
        profiles (
          id,
          nombre,
          avatar_url
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo favoritos:", error);
    throw error;
  }

  // Aplanar la estructura para devolver los eventos directamente
  return data.map((fav) => ({
    favoriteId: fav.id,
    savedAt: fav.created_at,
    ...fav.events,
  }));
}

/**
 * Verificar si un evento está en favoritos
 * @param {string} userId - ID del usuario
 * @param {number} eventId - ID del evento
 * @returns {Promise<boolean>}
 */
export async function isFavorite(userId, eventId) {
  if (!userId || !eventId) return false;

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error verificando favorito:", error);
  }

  return !!data;
}

/**
 * Obtener IDs de todos los eventos favoritos del usuario (para verificación rápida)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Set<number>>} Set de IDs de eventos favoritos
 */
export async function getFavoriteIds(userId) {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from("user_favorites")
    .select("event_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error obteniendo IDs de favoritos:", error);
    return new Set();
  }

  return new Set(data.map((fav) => fav.event_id));
}

/**
 * Agregar evento a favoritos
 * @param {string} userId - ID del usuario
 * @param {number} eventId - ID del evento
 * @returns {Promise<Object>} Favorito creado
 */
export async function addFavorite(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .insert({
      user_id: userId,
      event_id: eventId,
    })
    .select()
    .single();

  if (error) {
    // Si ya existe, no es error crítico
    if (error.code === "23505") {
      console.log("El evento ya está en favoritos");
      return { alreadyExists: true };
    }
    console.error("Error agregando favorito:", error);
    throw error;
  }

  return data;
}

/**
 * Eliminar evento de favoritos
 * @param {string} userId - ID del usuario
 * @param {number} eventId - ID del evento
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export async function removeFavorite(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error eliminando favorito:", error);
    throw error;
  }

  return true;
}

/**
 * Toggle favorito (agregar si no existe, eliminar si existe)
 * @param {string} userId - ID del usuario
 * @param {number} eventId - ID del evento
 * @returns {Promise<{isFavorite: boolean}>} Nuevo estado del favorito
 */
export async function toggleFavorite(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error("Se requiere userId y eventId");
  }

  const exists = await isFavorite(userId, eventId);

  if (exists) {
    await removeFavorite(userId, eventId);
    return { isFavorite: false };
  } else {
    await addFavorite(userId, eventId);
    return { isFavorite: true };
  }
}

/**
 * Contar favoritos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>}
 */
export async function countUserFavorites(userId) {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("user_favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error contando favoritos:", error);
    return 0;
  }

  return count || 0;
}
