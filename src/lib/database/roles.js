/**
 * @fileoverview Funciones para gestión de roles y permisos
 * @module database/roles
 */

import { supabase } from "../supabase";

/**
 * Roles disponibles en el sistema
 */
export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
};

/**
 * Estados de publicación
 */
export const ESTADOS_PUBLICACION = {
  PENDIENTE: "pendiente",
  PUBLICADO: "publicado",
  RECHAZADO: "rechazado",
};

/**
 * Obtiene el rol del usuario actual
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} Rol del usuario
 */
export const getUserRole = async (userId) => {
  if (!userId) return ROLES.USER;

  const { data, error } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener rol:", error);
    return ROLES.USER;
  }

  return data?.rol || ROLES.USER;
};

/**
 * Verifica si el usuario es administrador
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si es admin
 */
export const isAdmin = async (userId) => {
  const rol = await getUserRole(userId);
  return rol === ROLES.ADMIN;
};

/**
 * Verifica si el usuario es moderador o admin
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si puede moderar
 */
export const isModerator = async (userId) => {
  const rol = await getUserRole(userId);
  return rol === ROLES.ADMIN || rol === ROLES.MODERATOR;
};

/**
 * Actualiza el rol de un usuario (solo admin puede hacerlo)
 * @param {string} targetUserId - ID del usuario a modificar
 * @param {string} newRole - Nuevo rol
 * @param {string} adminUserId - ID del admin que realiza el cambio
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUserRole = async (targetUserId, newRole, adminUserId) => {
  // Verificar que quien hace el cambio es admin
  const isAdminUser = await isAdmin(adminUserId);
  if (!isAdminUser) {
    throw new Error("No tienes permisos para cambiar roles");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ rol: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetUserId)
    .select();

  if (error) {
    console.error("Error al actualizar rol:", error);
    throw error;
  }

  return data?.[0] || data;
};

/**
 * Obtiene todos los usuarios con sus roles (solo admin)
 * Optimizado: Solo trae campos necesarios
 * @param {string} adminUserId - ID del admin
 * @param {boolean} skipPermissionCheck - Saltar verificación de permisos
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async (adminUserId, skipPermissionCheck = false) => {
  if (!skipPermissionCheck) {
    const isAdminUser = await isAdmin(adminUserId);
    if (!isAdminUser) {
      throw new Error("No tienes permisos para ver usuarios");
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre, email, avatar_url, rol, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }

  return data;
};

/**
 * Elimina un usuario del sistema (solo admin)
 * Nota: Esto elimina el perfil. El auth.user se mantiene pero no podrá acceder.
 * @param {string} targetUserId - ID del usuario a eliminar
 * @param {string} adminUserId - ID del admin que realiza la acción
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteUser = async (targetUserId, adminUserId) => {
  // Verificar que quien hace el cambio es admin
  const isAdminUser = await isAdmin(adminUserId);
  if (!isAdminUser) {
    throw new Error("No tienes permisos para eliminar usuarios");
  }

  // Verificar que no se elimine a sí mismo
  if (targetUserId === adminUserId) {
    throw new Error("No puedes eliminarte a ti mismo");
  }

  // Verificar que el usuario a eliminar no sea admin
  const targetRole = await getUserRole(targetUserId);
  if (targetRole === ROLES.ADMIN) {
    throw new Error("No puedes eliminar a otro administrador");
  }

  // Eliminar eventos del usuario primero (para evitar errores de FK)
  const { error: eventsError } = await supabase
    .from("events")
    .delete()
    .eq("user_id", targetUserId);

  if (eventsError) {
    console.warn("Error al eliminar eventos del usuario:", eventsError);
  }

  // Eliminar favoritos del usuario
  const { error: favoritesError } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", targetUserId);

  if (favoritesError) {
    console.warn("Error al eliminar favoritos del usuario:", favoritesError);
  }

  // Eliminar bans relacionados
  const { error: bansError } = await supabase
    .from("user_bans")
    .delete()
    .eq("user_id", targetUserId);

  if (bansError) {
    console.warn("Error al eliminar bans del usuario:", bansError);
  }

  // Eliminar notificaciones del usuario
  const { error: notificationsError } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", targetUserId);

  if (notificationsError) {
    console.warn(
      "Error al eliminar notificaciones del usuario:",
      notificationsError
    );
  }

  // Finalmente eliminar el perfil
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", targetUserId);

  if (profileError) {
    console.error("Error al eliminar perfil del usuario:", profileError);
    throw profileError;
  }

  return true;
};
