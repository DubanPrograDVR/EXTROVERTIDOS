/**
 * @fileoverview Funciones para el sistema de baneo de usuarios
 * @module database/bans
 */

import { supabase } from "../supabase";
import { createNotification } from "./notifications";

/**
 * Verifica si un usuario está baneado
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estado de baneo { isBanned, reason?, bannedAt?, banId? }
 */
export const checkBanStatus = async (userId) => {
  if (!userId) {
    return { isBanned: false };
  }

  const { data, error } = await supabase
    .from("user_bans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar estado de baneo:", error);
    return { isBanned: false };
  }

  if (data) {
    return {
      isBanned: true,
      reason: data.ban_reason,
      bannedAt: data.banned_at,
      banId: data.id,
    };
  }

  return { isBanned: false };
};

/**
 * Banea a un usuario
 * @param {string} userId - ID del usuario a banear
 * @param {string} adminId - ID del admin que banea
 * @param {string} reason - Motivo del baneo (obligatorio, mín 10 caracteres)
 * @returns {Promise<Object>} Datos del baneo
 */
export const banUser = async (userId, adminId, reason) => {
  if (!userId || !adminId || !reason) {
    throw new Error("userId, adminId y reason son obligatorios");
  }

  if (reason.length < 10) {
    throw new Error("El motivo debe tener al menos 10 caracteres");
  }

  // Verificar que no se esté baneando a sí mismo
  if (userId === adminId) {
    throw new Error("No puedes banearte a ti mismo");
  }

  // Verificar que el usuario a banear no sea admin
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", userId)
    .single();

  if (targetUser?.rol === "admin") {
    throw new Error("No puedes banear a un administrador");
  }

  // Crear el registro de baneo
  const { data, error } = await supabase
    .from("user_bans")
    .insert([
      {
        user_id: userId,
        banned_by: adminId,
        ban_reason: reason,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al banear usuario:", error);
    throw error;
  }

  // Crear notificación para el usuario baneado
  try {
    await createNotification({
      userId,
      type: "account_banned",
      title: "Cuenta suspendida",
      message: `Tu cuenta ha sido suspendida. Motivo: ${reason}`,
    });
  } catch (notifError) {
    console.warn("No se pudo crear notificación de baneo:", notifError);
  }

  return data;
};

/**
 * Desbanea a un usuario
 * @param {string} banId - ID del registro de baneo
 * @param {string} adminId - ID del admin que desbanea
 * @returns {Promise<Object>} Datos actualizados del baneo
 */
export const unbanUser = async (banId, adminId) => {
  if (!banId || !adminId) {
    throw new Error("banId y adminId son obligatorios");
  }

  const { data, error } = await supabase
    .from("user_bans")
    .update({
      is_active: false,
      unbanned_by: adminId,
      unbanned_at: new Date().toISOString(),
    })
    .eq("id", banId)
    .select()
    .single();

  if (error) {
    console.error("Error al desbanear usuario:", error);
    throw error;
  }

  // Crear notificación para el usuario desbaneado
  if (data?.user_id) {
    try {
      await createNotification({
        userId: data.user_id,
        type: "account_unbanned",
        title: "Cuenta restaurada",
        message:
          "Tu cuenta ha sido restaurada. Ya puedes volver a utilizar la plataforma.",
      });
    } catch (notifError) {
      console.warn("No se pudo crear notificación de desbaneo:", notifError);
    }
  }

  return data;
};

/**
 * Obtiene el historial de baneos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Historial de baneos
 */
export const getUserBanHistory = async (userId) => {
  const { data, error } = await supabase
    .from("user_bans")
    .select(
      `
      *,
      banned_by_profile:profiles!user_bans_banned_by_fkey(nombre, avatar_url),
      unbanned_by_profile:profiles!user_bans_unbanned_by_fkey(nombre, avatar_url)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener historial de baneos:", error);
    throw error;
  }

  return data;
};
