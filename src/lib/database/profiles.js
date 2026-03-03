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
 * Asegura que el perfil del usuario exista en la tabla profiles.
 * Si no existe, lo crea a partir de los datos de auth.users.
 * Es idempotente: si el perfil ya existe, no hace nada.
 *
 * IMPORTANTE: Esta función debe llamarse al autenticar al usuario
 * para garantizar que siempre exista un perfil en la BD.
 * Esto es necesario porque:
 * - La tabla subscriptions tiene FK a profiles(id)
 * - El panel admin lista usuarios desde profiles
 * - Sin perfil, el usuario no puede suscribirse ni es visible para admin
 *
 * @param {string} userId - ID del usuario (auth.users.id)
 * @returns {Promise<boolean>} true si el perfil existe o fue creado
 */
export const ensureProfileExists = async (userId) => {
  if (!userId) return false;

  try {
    // 1. Verificar si ya existe el perfil
    const { data: profile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    // Si ya existe, no hacer nada
    if (profile) return true;

    // Si hubo un error que NO es "no encontrado", loguear y continuar
    if (checkError && checkError.code !== "PGRST116") {
      console.warn(
        "[ensureProfileExists] Error verificando perfil:",
        checkError,
      );
    }

    // 2. El perfil no existe → obtener datos de auth para crearlo
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      console.warn(
        "[ensureProfileExists] No se pudo obtener datos del usuario:",
        authError,
      );
      return false;
    }

    const user = authData.user;

    // 3. Crear el perfil
    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: userId,
        email: user.email,
        nombre:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.nombre ||
          user.email?.split("@")[0] ||
          "Usuario",
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    ]);

    if (insertError) {
      // 23505 = unique violation (perfil ya existe, race condition)
      if (insertError.code === "23505") {
        return true; // Ya fue creado por otro proceso concurrente
      }
      console.error("[ensureProfileExists] Error creando perfil:", insertError);
      return false;
    }

    console.log(
      "[ensureProfileExists] Perfil creado exitosamente para:",
      userId,
    );
    return true;
  } catch (error) {
    console.error("[ensureProfileExists] Error inesperado:", error);
    return false;
  }
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
