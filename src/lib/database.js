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
 * Obtiene todos los eventos publicados
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
 * Obtiene eventos por usuario
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
 * Obtiene un evento por ID
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
