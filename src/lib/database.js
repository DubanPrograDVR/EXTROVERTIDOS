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
 */
export const approveEvent = async (eventId, adminUserId) => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para aprobar publicaciones");
  }

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

  return data;
};

/**
 * Rechaza una publicación
 */
export const rejectEvent = async (eventId, adminUserId, motivo = "") => {
  const canModerate = await isModerator(adminUserId);
  if (!canModerate) {
    throw new Error("No tienes permisos para rechazar publicaciones");
  }

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
