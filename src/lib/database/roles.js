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
 * Elimina todos los datos relacionados antes del perfil.
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

  // Tablas a limpiar ANTES de eliminar el perfil (orden importa por FKs)
  const tablesToClean = [
    { table: "event_likes", column: "user_id" },
    { table: "event_tags", column: "event_id", subquery: true },
    { table: "events", column: "user_id" },
    { table: "businesses", column: "user_id" },
    { table: "drafts", column: "user_id" },
    { table: "user_favorites", column: "user_id" },
    { table: "user_bans", column: "user_id" },
    { table: "notifications", column: "user_id" },
  ];

  const errors = [];

  for (const { table, column, subquery } of tablesToClean) {
    try {
      if (subquery && table === "event_tags") {
        // Eliminar tags de los eventos del usuario primero
        const { data: userEvents } = await supabase
          .from("events")
          .select("id")
          .eq("user_id", targetUserId);

        if (userEvents?.length > 0) {
          const eventIds = userEvents.map((e) => e.id);
          await supabase.from("event_tags").delete().in("event_id", eventIds);
        }
      } else {
        await supabase.from(table).delete().eq(column, targetUserId);
      }
    } catch (err) {
      console.warn(`Error al limpiar ${table}:`, err);
      errors.push({ table, error: err.message });
    }
  }

  // Eliminar el perfil (esto es crítico - si falla, lanzar error)
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", targetUserId);

  if (profileError) {
    console.error("Error al eliminar perfil del usuario:", profileError);
    throw new Error(
      `Error al eliminar perfil. ${errors.length > 0 ? `Además, fallaron: ${errors.map((e) => e.table).join(", ")}` : ""}`,
    );
  }

  if (errors.length > 0) {
    console.warn("Eliminación completada con advertencias:", errors);
  }

  return true;
};
