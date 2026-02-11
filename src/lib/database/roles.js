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
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async (adminUserId) => {
  const isAdminUser = await isAdmin(adminUserId);
  if (!isAdminUser) {
    throw new Error("No tienes permisos para ver usuarios");
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
 * Llama a la función SQL admin_delete_user que tiene SECURITY DEFINER
 * para poder eliminar de auth.users y todas las tablas relacionadas.
 * @param {string} targetUserId - ID del usuario a eliminar
 * @param {string} adminUserId - ID del admin que realiza la acción
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteUser = async (targetUserId, adminUserId) => {
  if (!targetUserId || !adminUserId) {
    throw new Error("IDs de usuario requeridos");
  }

  if (targetUserId === adminUserId) {
    throw new Error("No puedes eliminarte a ti mismo");
  }

  const { data, error } = await supabase.rpc("admin_delete_user", {
    target_user_id: targetUserId,
  });

  if (error) {
    console.error("Error al eliminar usuario:", error);
    throw new Error(error.message || "Error al eliminar usuario");
  }

  if (data && !data.success) {
    throw new Error(data.error || "Error desconocido al eliminar usuario");
  }

  return true;
};
