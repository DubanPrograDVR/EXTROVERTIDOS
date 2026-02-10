/**
 * Módulo de Likes y Favoritos para Negocios
 * Funciones para gestionar "me gusta" y "guardar" en negocios de la Superguía
 */

import { supabase } from "../supabase";

// ============ LIKES ============

/**
 * Obtener cantidad de likes de un negocio
 * @param {string} businessId - ID del negocio
 * @returns {Promise<number>}
 */
export async function getBusinessLikesCount(businessId) {
  if (!businessId) return 0;

  const { count, error } = await supabase
    .from("business_likes")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) {
    console.error("Error obteniendo likes de negocio:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Verificar si el usuario dio like a un negocio
 * @param {string} userId
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function hasUserLikedBusiness(userId, businessId) {
  if (!userId || !businessId) return false;

  const { data, error } = await supabase
    .from("business_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error verificando like de negocio:", error);
  }

  return !!data;
}

/**
 * Obtener estado de likes para múltiples negocios (batch)
 * @param {string} userId
 * @param {string[]} businessIds
 * @returns {Promise<Object>} { businessId: { isLiked, count } }
 */
export async function getBusinessLikesState(userId, businessIds) {
  if (!businessIds?.length) return {};

  const result = {};
  businessIds.forEach((id) => {
    result[id] = { isLiked: false, count: 0 };
  });

  const { data: counts, error: countError } = await supabase
    .from("business_likes")
    .select("business_id")
    .in("business_id", businessIds);

  if (!countError && counts) {
    counts.forEach((like) => {
      if (result[like.business_id]) {
        result[like.business_id].count++;
      }
    });
  }

  if (userId) {
    const { data: userLikes, error: likeError } = await supabase
      .from("business_likes")
      .select("business_id")
      .eq("user_id", userId)
      .in("business_id", businessIds);

    if (!likeError && userLikes) {
      userLikes.forEach((like) => {
        if (result[like.business_id]) {
          result[like.business_id].isLiked = true;
        }
      });
    }
  }

  return result;
}

/**
 * Toggle like en negocio
 * @param {string} userId
 * @param {string} businessId
 * @returns {Promise<{isLiked: boolean, count: number}>}
 */
export async function toggleBusinessLike(userId, businessId) {
  if (!userId || !businessId) {
    throw new Error("Se requiere userId y businessId");
  }

  const { data, error } = await supabase
    .from("business_likes")
    .insert({ user_id: userId, business_id: businessId })
    .select()
    .single();

  if (!error && data) {
    const count = await getBusinessLikesCount(businessId);
    return { isLiked: true, count };
  }

  if (error?.code === "23505") {
    await supabase
      .from("business_likes")
      .delete()
      .eq("user_id", userId)
      .eq("business_id", businessId);

    const count = await getBusinessLikesCount(businessId);
    return { isLiked: false, count };
  }

  console.error("Error en toggleBusinessLike:", error);
  throw error;
}

// ============ FAVORITOS ============

/**
 * Verificar si un negocio es favorito del usuario
 * @param {string} userId
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function isBusinessFavorite(userId, businessId) {
  if (!userId || !businessId) return false;

  const { data, error } = await supabase
    .from("business_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error verificando favorito de negocio:", error);
  }

  return !!data;
}

/**
 * Obtener IDs de negocios favoritos del usuario
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getBusinessFavoriteIds(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("business_favorites")
    .select("business_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error obteniendo favoritos de negocios:", error);
    return [];
  }

  return data?.map((f) => f.business_id) || [];
}

/**
 * Toggle favorito en negocio
 * @param {string} userId
 * @param {string} businessId
 * @returns {Promise<{isFavorite: boolean}>}
 */
export async function toggleBusinessFavorite(userId, businessId) {
  if (!userId || !businessId) {
    throw new Error("Se requiere userId y businessId");
  }

  const { data, error } = await supabase
    .from("business_favorites")
    .insert({ user_id: userId, business_id: businessId })
    .select()
    .single();

  if (!error && data) {
    return { isFavorite: true };
  }

  if (error?.code === "23505") {
    await supabase
      .from("business_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("business_id", businessId);
    return { isFavorite: false };
  }

  if (error) {
    console.error("Error en toggleBusinessFavorite:", error);
    throw error;
  }

  return { isFavorite: false };
}
