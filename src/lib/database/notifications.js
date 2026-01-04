/**
 * @fileoverview Funciones para gestión de notificaciones
 * @module database/notifications
 */

import { supabase } from "../supabase";

/**
 * Tipos de notificación
 */
export const NOTIFICATION_TYPES = {
  PUBLICATION_APPROVED: "publication_approved",
  PUBLICATION_REJECTED: "publication_rejected",
  PUBLICATION_PENDING: "publication_pending",
  WELCOME: "welcome",
  INFO: "info",
};

/**
 * Crea una nueva notificación
 * @param {Object} params - Parámetros de la notificación
 * @param {string} params.userId - ID del usuario
 * @param {string} params.type - Tipo de notificación
 * @param {string} params.title - Título
 * @param {string} params.message - Mensaje
 * @param {string} params.relatedEventId - ID del evento relacionado
 * @param {string} params.relatedBusinessId - ID del negocio relacionado
 * @returns {Promise<Object>} Notificación creada
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEventId = null,
  relatedBusinessId = null,
}) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: userId,
        type,
        title,
        message,
        related_event_id: relatedEventId,
        related_business_id: relatedBusinessId,
        read: false,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al crear notificación:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene las notificaciones de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de notificaciones
 */
export const getUserNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      events:related_event_id (
        id,
        titulo
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error al obtener notificaciones:", error);
    throw error;
  }

  return data;
};

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Notificación actualizada
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error al marcar notificación como leída:", error);
    throw error;
  }

  return data;
};

/**
 * Marca todas las notificaciones como leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Notificaciones actualizadas
 */
export const markAllNotificationsAsRead = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)
    .select();

  if (error) {
    console.error("Error al marcar todas las notificaciones:", error);
    throw error;
  }

  return data;
};

/**
 * Elimina una notificación
 * @param {string} notificationId - ID de la notificación
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteNotification = async (notificationId, userId) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error al eliminar notificación:", error);
    throw error;
  }

  return { success: true };
};

/**
 * Cuenta las notificaciones no leídas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Cantidad de notificaciones no leídas
 */
export const getUnreadNotificationsCount = async (userId) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error al contar notificaciones:", error);
    throw error;
  }

  return count || 0;
};

/**
 * Crea notificación de bienvenida para nuevos usuarios
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Notificación creada
 */
export const createWelcomeNotification = async (userId) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.WELCOME,
    title: "¡Bienvenido a Extrovertidos!",
    message:
      "Gracias por unirte a nuestra comunidad. Explora y publica tus eventos favoritos.",
  });
};
