/**
 * @fileoverview Funciones del panel de administración
 * @module database/admin
 */

import { supabase } from "../supabase";
import cache from "./cache";
import { isModerator, ESTADOS_PUBLICACION } from "./roles";

/**
 * Obtiene todas las publicaciones pendientes de aprobación
 * @param {string} adminUserId - ID del usuario admin/moderador
 * @returns {Promise<Array>} Eventos pendientes
 */
export const getPendingEvents = async (adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para ver publicaciones pendientes");
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      titulo,
      descripcion,
      fecha_evento,
      comuna,
      provincia,
      imagenes,
      created_at,
      categories (
        id,
        nombre,
        icono,
        color
      ),
      profiles (
        id,
        nombre,
        avatar_url,
        email
      )
    `,
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error al obtener eventos pendientes:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene todas las publicaciones (todos los estados) para admin
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Array>} Todos los eventos
 */
export const getAllEvents = async (adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para ver todas las publicaciones");
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      categories (
        id,
        nombre,
        icono,
        color
      ),
      profiles (
        id,
        nombre,
        avatar_url,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener todos los eventos:", error);
    throw error;
  }

  return data;
};

/**
 * Aprueba una publicación (cambia estado a 'publicado')
 * También crea una notificación para el autor
 * @param {string} eventId - ID del evento
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Object>} Evento aprobado
 */
export const approveEvent = async (eventId, adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para aprobar publicaciones");
  }

  // Obtener el evento para saber quién es el autor
  const { data: eventData, error: fetchError } = await supabase
    .from("events")
    .select("user_id, titulo")
    .eq("id", eventId)
    .single();

  if (fetchError) {
    console.error("Error al obtener evento:", fetchError);
    throw fetchError;
  }

  // Actualizar estado del evento
  const { data, error } = await supabase
    .from("events")
    .update({
      estado: ESTADOS_PUBLICACION.PUBLICADO,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select();

  if (error) {
    console.error("Error al aprobar evento:", error);
    throw error;
  }

  // Invalidar caché de estadísticas
  cache.invalidate("adminStats");

  // Crear notificación para el autor
  try {
    await supabase.from("notifications").insert([
      {
        user_id: eventData.user_id,
        type: "publication_approved",
        title: "¡Publicación aprobada!",
        message: `Tu evento "${eventData.titulo}" ha sido aprobado y ya está visible para todos.`,
        related_event_id: eventId,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (notifError) {
    console.warn("No se pudo crear la notificación:", notifError);
  }

  return data;
};

/**
 * Rechaza una publicación
 * También crea una notificación para el autor
 * @param {string} eventId - ID del evento
 * @param {string} adminUserId - ID del admin
 * @param {string} motivo - Motivo del rechazo
 * @returns {Promise<Object>} Evento rechazado
 */
export const rejectEvent = async (eventId, adminUserId, motivo = "") => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para rechazar publicaciones");
  }

  // Obtener el evento para saber quién es el autor
  const { data: eventData, error: fetchError } = await supabase
    .from("events")
    .select("user_id, titulo")
    .eq("id", eventId)
    .single();

  if (fetchError) {
    console.error("Error al obtener evento:", fetchError);
    throw fetchError;
  }

  // Actualizar estado del evento
  const { data, error } = await supabase
    .from("events")
    .update({
      estado: ESTADOS_PUBLICACION.RECHAZADO,
      motivo_rechazo: motivo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select();

  if (error) {
    console.error("Error al rechazar evento:", error);
    throw error;
  }

  // Invalidar caché de estadísticas
  cache.invalidate("adminStats");

  // Crear notificación para el autor
  try {
    const motivoTexto = motivo ? ` Motivo: ${motivo}` : "";
    await supabase.from("notifications").insert([
      {
        user_id: eventData.user_id,
        type: "publication_rejected",
        title: "Publicación rechazada",
        message: `Tu evento "${eventData.titulo}" no ha sido aprobado.${motivoTexto}`,
        related_event_id: eventId,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (notifError) {
    console.warn("No se pudo crear la notificación:", notifError);
  }

  return data;
};

/**
 * Obtiene negocios pendientes de aprobación
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Array>} Negocios pendientes
 */
export const getPendingBusinesses = async (adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para ver negocios pendientes");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      *,
      categories (
        id,
        nombre,
        icono,
        color
      ),
      profiles (
        id,
        nombre,
        avatar_url,
        email
      )
    `,
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener negocios pendientes:", error);
    throw error;
  }

  return data;
};

/**
 * Aprueba un negocio
 * @param {string} businessId - ID del negocio
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Object>} Negocio aprobado
 */
export const approveBusiness = async (businessId, adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para aprobar negocios");
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: ESTADOS_PUBLICACION.PUBLICADO,
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error al aprobar negocio:", error);
    throw error;
  }

  return data;
};

/**
 * Rechaza un negocio
 * @param {string} businessId - ID del negocio
 * @param {string} adminUserId - ID del admin
 * @param {string} razon - Razón del rechazo
 * @returns {Promise<Object>} Negocio rechazado
 */
export const rejectBusiness = async (businessId, adminUserId, razon = "") => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para rechazar negocios");
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: ESTADOS_PUBLICACION.RECHAZADO,
      rejected_by: adminUserId,
      rejected_at: new Date().toISOString(),
      razon_rechazo: razon,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error al rechazar negocio:", error);
    throw error;
  }

  return data;
};

/**
 * Estadísticas del panel de administración
 * OPTIMIZADO: Queries en paralelo + caché de 30 segundos
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Object>} Estadísticas
 */
export const getAdminStats = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos para ver estadísticas");
    }

    // Verificar caché
    const cacheKey = `adminStats_${adminUserId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Ejecutar todas las queries de conteo en paralelo
    const [pendientesResult, publicadosResult, rechazadosResult, usersResult] =
      await Promise.all([
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente"),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("estado", "publicado"),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("estado", "rechazado"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

    const stats = {
      eventos: {
        pendientes: pendientesResult.count || 0,
        publicados: publicadosResult.count || 0,
        rechazados: rechazadosResult.count || 0,
      },
      negocios: {
        pendientes: 0,
      },
      usuarios: {
        total: usersResult.count || 0,
      },
    };

    // Guardar en caché
    cache.set(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error("Error en getAdminStats:", error);
    return {
      eventos: { pendientes: 0, publicados: 0, rechazados: 0 },
      negocios: { pendientes: 0 },
      usuarios: { total: 0 },
    };
  }
};

/**
 * Obtiene publicaciones por día de los últimos 7 días
 * OPTIMIZADO: Solo trae las fechas necesarias
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Array>} Datos por día
 */
export const getEventsPerDay = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos");
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("events")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .lte("created_at", today.toISOString());

    if (error) throw error;

    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const daysMap = new Map();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      daysMap.set(dayKey, {
        day: days[date.getDay()],
        fecha: dayKey,
        publicaciones: 0,
      });
    }

    data?.forEach((event) => {
      const dayKey = event.created_at.split("T")[0];
      const dayData = daysMap.get(dayKey);
      if (dayData) {
        dayData.publicaciones++;
      }
    });

    return Array.from(daysMap.values());
  } catch (error) {
    console.error("Error en getEventsPerDay:", error);
    return [];
  }
};

/**
 * Obtiene usuarios registrados por día de los últimos 7 días
 * OPTIMIZADO: Solo trae las fechas necesarias
 * @param {string} adminUserId - ID del admin
 * @returns {Promise<Array>} Datos por día
 */
export const getUsersPerDay = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos");
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .lte("created_at", today.toISOString());

    if (error) throw error;

    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const daysMap = new Map();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      daysMap.set(dayKey, {
        day: days[date.getDay()],
        fecha: dayKey,
        usuarios: 0,
      });
    }

    data?.forEach((user) => {
      const dayKey = user.created_at.split("T")[0];
      const dayData = daysMap.get(dayKey);
      if (dayData) {
        dayData.usuarios++;
      }
    });

    return Array.from(daysMap.values());
  } catch (error) {
    console.error("Error en getUsersPerDay:", error);
    return [];
  }
};

/**
 * Obtiene todos los usuarios con su estado de baneo
 * OPTIMIZADO: Queries en paralelo y paginación
 * @param {string} adminId - ID del admin
 * @param {number} page - Página actual
 * @param {number} limit - Cantidad por página
 * @returns {Promise<Array>} Usuarios con estado de baneo
 */
export const getAllUsersWithBanStatus = async (
  adminId,
  page = 1,
  limit = 50,
) => {
  // SEGURIDAD: Verificar permisos antes de exponer datos de usuarios
  const canModerate = await isModerator(adminId);
  if (!canModerate) {
    throw new Error("No tienes permisos para ver la lista de usuarios");
  }

  const offset = (page - 1) * limit;

  const [usersResult, bansResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, email, avatar_url, rol, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from("user_bans")
      .select("id, user_id, ban_reason, banned_at")
      .eq("is_active", true),
  ]);

  if (usersResult.error) {
    console.error("Error al obtener usuarios:", usersResult.error);
    throw usersResult.error;
  }

  if (bansResult.error) {
    console.error("Error al obtener baneos:", bansResult.error);
    throw bansResult.error;
  }

  const bansMap = new Map();
  bansResult.data?.forEach((ban) => {
    bansMap.set(ban.user_id, ban);
  });

  const usersWithBanStatus = usersResult.data.map((user) => {
    const ban = bansMap.get(user.id);
    return {
      ...user,
      is_banned: !!ban,
      ban_info: ban || null,
    };
  });

  return usersWithBanStatus;
};
