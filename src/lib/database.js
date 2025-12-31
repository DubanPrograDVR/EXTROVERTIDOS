import { supabase } from "./supabase";

// ============ CATEGORÍAS ============

/**
 * Obtiene todas las categorías activas
 */
export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene una categoría por ID
 */
export const getCategoryById = async (id) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener categoría:", error);
    throw error;
  }

  return data;
};

// ============ EVENTOS ============

/**
 * Crea un nuevo evento
 * También crea una notificación de "en revisión"
 */
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from("events")
    .insert([eventData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear evento:", error);
    throw error;
  }

  // Crear notificación de "en revisión" para el autor
  try {
    await supabase.from("notifications").insert([
      {
        user_id: eventData.user_id,
        type: "publication_pending",
        title: "Publicación en revisión",
        message: `Tu evento "${eventData.titulo}" está siendo revisado por nuestro equipo. Te notificaremos cuando sea aprobado.`,
        related_event_id: data.id,
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
 * Obtiene todos los eventos publicados con información del autor
 */
export const getPublishedEvents = async () => {
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
        avatar_url
      )
    `
    )
    .eq("estado", "publicado")
    .order("fecha_evento", { ascending: true });

  if (error) {
    console.error("Error al obtener eventos:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene eventos publicados filtrados por ciudad/comuna
 * @param {string} ciudad - Nombre de la ciudad o comuna a filtrar
 * @param {string} provincia - Nombre de la provincia (opcional)
 */
export const getEventsByCity = async (ciudad, provincia = null) => {
  let query = supabase
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
        avatar_url
      )
    `
    )
    .eq("estado", "publicado");

  // Filtrar por comuna o provincia
  if (ciudad) {
    query = query.or(`comuna.ilike.%${ciudad}%,provincia.ilike.%${ciudad}%`);
  }

  if (provincia) {
    query = query.ilike("provincia", `%${provincia}%`);
  }

  const { data, error } = await query.order("fecha_evento", {
    ascending: true,
  });

  if (error) {
    console.error("Error al obtener eventos por ciudad:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene eventos por usuario con información de categoría
 */
export const getEventsByUser = async (userId) => {
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
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener eventos del usuario:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene un evento por ID con información completa
 */
export const getEventById = async (eventId) => {
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
        avatar_url
      )
    `
    )
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error al obtener evento:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene eventos filtrados por categoría, ciudad o búsqueda
 */
export const getFilteredEvents = async (filters = {}) => {
  let query = supabase
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
        avatar_url
      )
    `
    )
    .eq("estado", "publicado");

  // Filtro por categoría
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  // Filtro por provincia
  if (filters.provincia) {
    query = query.eq("provincia", filters.provincia);
  }

  // Filtro por comuna
  if (filters.comuna) {
    query = query.eq("comuna", filters.comuna);
  }

  // Búsqueda por texto
  if (filters.search) {
    query = query.or(
      `titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%,comuna.ilike.%${filters.search}%`
    );
  }

  // Ordenamiento
  query = query.order("fecha_evento", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error al filtrar eventos:", error);
    throw error;
  }

  return data;
};

/**
 * Actualiza un evento
 */
export const updateEvent = async (eventId, eventData) => {
  const { data, error } = await supabase
    .from("events")
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar evento:", error);
    throw error;
  }

  return data;
};

/**
 * Elimina un evento
 */
export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    console.error("Error al eliminar evento:", error);
    throw error;
  }

  return true;
};

// ============ IMÁGENES ============

/**
 * Sube una imagen al storage de Supabase
 */
export const uploadEventImage = async (file, userId) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `events/${fileName}`;

  const { data, error } = await supabase.storage
    .from("Imagenes")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Sube múltiples imágenes
 */
export const uploadMultipleImages = async (files, userId) => {
  const uploadPromises = files.map((file) => uploadEventImage(file, userId));
  return Promise.all(uploadPromises);
};

/**
 * Elimina una imagen del storage
 */
export const deleteEventImage = async (imageUrl) => {
  // Extraer el path de la URL
  const urlParts = imageUrl.split("/storage/v1/object/public/Imagenes/");
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage.from("Imagenes").remove([filePath]);

  if (error) {
    console.error("Error al eliminar imagen:", error);
    throw error;
  }

  return true;
};

// ============ TAGS ============

/**
 * Obtiene todos los tags
 */
export const getTags = async () => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener tags:", error);
    throw error;
  }

  return data;
};

/**
 * Asocia tags a un evento
 */
export const addTagsToEvent = async (eventId, tagIds) => {
  const eventTags = tagIds.map((tagId) => ({
    event_id: eventId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("event_tags").insert(eventTags);

  if (error) {
    console.error("Error al asociar tags:", error);
    throw error;
  }

  return true;
};

// ============ PROFILES ============

/**
 * Obtiene el perfil de un usuario
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

// ============ NEGOCIOS ============

/**
 * Crea un nuevo negocio
 */
export const createBusiness = async (businessData) => {
  const { data, error } = await supabase
    .from("businesses")
    .insert([businessData])
    .select()
    .single();

  if (error) {
    console.error("Error al crear negocio:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene todos los negocios publicados con información del autor
 */
export const getPublishedBusinesses = async () => {
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
        avatar_url
      )
    `
    )
    .eq("estado", "publicado")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener negocios:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene negocios por usuario
 */
export const getBusinessesByUser = async (userId) => {
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
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener negocios del usuario:", error);
    throw error;
  }

  return data;
};

/**
 * Sube una imagen de negocio al storage
 */
export const uploadBusinessImage = async (file, userId) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `businesses/${fileName}`;

  const { data, error } = await supabase.storage
    .from("Imagenes")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

  return publicUrl;
};

// ============ ROLES Y ADMINISTRACIÓN ============

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
    return ROLES.USER; // Por defecto es usuario normal
  }

  return data?.rol || ROLES.USER;
};

/**
 * Verifica si el usuario es administrador
 */
export const isAdmin = async (userId) => {
  const rol = await getUserRole(userId);
  return rol === ROLES.ADMIN;
};

/**
 * Verifica si el usuario es moderador o admin
 */
export const isModerator = async (userId) => {
  const rol = await getUserRole(userId);
  return rol === ROLES.ADMIN || rol === ROLES.MODERATOR;
};

/**
 * Actualiza el rol de un usuario (solo admin puede hacerlo)
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
 */
export const getAllUsers = async (adminUserId) => {
  const isAdminUser = await isAdmin(adminUserId);
  if (!isAdminUser) {
    throw new Error("No tienes permisos para ver usuarios");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }

  return data;
};

// ============ GESTIÓN DE PUBLICACIONES (ADMIN) ============

/**
 * Obtiene todas las publicaciones pendientes de aprobación
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
    `
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener eventos pendientes:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene todas las publicaciones (todos los estados) para admin
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
    `
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
 */
export const approveEvent = async (eventId, adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para aprobar publicaciones");
  }

  // Primero obtener el evento para saber quién es el autor
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
 */
export const rejectEvent = async (eventId, adminUserId, motivo = "") => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para rechazar publicaciones");
  }

  // Primero obtener el evento para saber quién es el autor
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

  return data;
};

/**
 * Obtiene negocios pendientes de aprobación
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
    `
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
 */
export const getAdminStats = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos para ver estadísticas");
    }

    // Contar eventos por estado
    const { data: eventsPendientes } = await supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("estado", "pendiente");

    const { data: eventsPublicados } = await supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("estado", "publicado");

    const { data: eventsRechazados } = await supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("estado", "rechazado");

    // Contar usuarios
    const { data: totalUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact" });

    return {
      eventos: {
        pendientes: eventsPendientes?.length || 0,
        publicados: eventsPublicados?.length || 0,
        rechazados: eventsRechazados?.length || 0,
      },
      negocios: {
        pendientes: 0, // No hay tabla businesses por ahora
      },
      usuarios: {
        total: totalUsers?.length || 0,
      },
    };
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
 */
export const getEventsPerDay = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos");
    }

    // Obtener fecha de hace 7 días
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("events")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    // Agrupar por día
    const daysMap = {};
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    // Inicializar los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      const dayName = days[date.getDay()];
      daysMap[dayKey] = { day: dayName, fecha: dayKey, publicaciones: 0 };
    }

    // Contar publicaciones por día
    data?.forEach((event) => {
      const dayKey = event.created_at.split("T")[0];
      if (daysMap[dayKey]) {
        daysMap[dayKey].publicaciones++;
      }
    });

    return Object.values(daysMap);
  } catch (error) {
    console.error("Error en getEventsPerDay:", error);
    return [];
  }
};

/**
 * Obtiene usuarios registrados por día de los últimos 7 días
 */
export const getUsersPerDay = async (adminUserId) => {
  try {
    const canModerate = await isModerator(adminUserId);
    if (!canModerate) {
      throw new Error("No tienes permisos");
    }

    // Obtener fecha de hace 7 días
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    // Agrupar por día
    const daysMap = {};
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    // Inicializar los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      const dayName = days[date.getDay()];
      daysMap[dayKey] = { day: dayName, fecha: dayKey, usuarios: 0 };
    }

    // Contar usuarios por día
    data?.forEach((user) => {
      const dayKey = user.created_at.split("T")[0];
      if (daysMap[dayKey]) {
        daysMap[dayKey].usuarios++;
      }
    });

    return Object.values(daysMap);
  } catch (error) {
    console.error("Error en getUsersPerDay:", error);
    return [];
  }
};

// ============ NOTIFICACIONES ============

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

// ============ SISTEMA DE BANEO ============

/**
 * Verifica si un usuario está baneado
 * @param {string} userId - ID del usuario
 * @returns {Object} { isBanned: boolean, reason?: string, bannedAt?: string }
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
 * @param {string} reason - Motivo del baneo (obligatorio)
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

/**
 * Obtiene todos los usuarios con su estado de baneo (para admin)
 * @param {string} adminId - ID del admin que consulta
 */
export const getAllUsersWithBanStatus = async (adminId) => {
  // Primero obtener todos los usuarios
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Error al obtener usuarios:", usersError);
    throw usersError;
  }

  // Obtener baneos activos
  const { data: activeBans, error: bansError } = await supabase
    .from("user_bans")
    .select("*")
    .eq("is_active", true);

  if (bansError) {
    console.error("Error al obtener baneos:", bansError);
    throw bansError;
  }

  // Mapear baneos a usuarios
  const bansMap = new Map();
  activeBans?.forEach((ban) => {
    bansMap.set(ban.user_id, ban);
  });

  // Combinar datos
  const usersWithBanStatus = users.map((user) => {
    const ban = bansMap.get(user.id);
    return {
      ...user,
      is_banned: !!ban,
      ban_info: ban || null,
    };
  });

  return usersWithBanStatus;
};
