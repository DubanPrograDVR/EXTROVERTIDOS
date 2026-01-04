/**
 * @fileoverview Funciones para gestión de perfiles de usuario
 * @module database/profiles
 */

import { supabase } from "../supabase";

/**
 * Obtiene el perfil de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Perfil del usuario o null
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error al obtener perfil:", error);
    throw error;
  }

  return data;
};

/**
 * Crea o actualiza el perfil de un usuario
 * @param {Object} profileData - Datos del perfil
 * @returns {Promise<Object>} Perfil actualizado
 */
export const upsertProfile = async (profileData) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar perfil:", error);
    throw error;
  }

  return data;
};
