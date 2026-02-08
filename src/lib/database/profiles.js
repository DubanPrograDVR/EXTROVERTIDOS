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
 * Campos que un usuario puede modificar en su propio perfil.
 * SEGURIDAD: 'rol', 'email', 'id' NO están aquí → no se pueden sobreescribir.
 */
const ALLOWED_PROFILE_FIELDS = [
  "nombre",
  "telefono",
  "avatar_url",
  "tipo_usuario",
  "razon_social",
  "rut_empresa",
];

/**
 * Crea o actualiza el perfil de un usuario
 * SEGURIDAD: Solo permite campos de la whitelist + 'id' (necesario para upsert).
 * Campos como 'rol' son ignorados silenciosamente.
 * @param {Object} profileData - Datos del perfil
 * @returns {Promise<Object>} Perfil actualizado
 */
export const upsertProfile = async (profileData) => {
  // Sanitizar: solo permitir campos seguros + id
  const sanitized = { id: profileData.id };
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (profileData[key] !== undefined) {
      sanitized[key] = profileData[key];
    }
  }

  if (!sanitized.id) {
    throw new Error('El campo "id" es obligatorio para actualizar el perfil');
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(sanitized, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar perfil:", error);
    throw error;
  }

  return data;
};
