/**
 * @fileoverview Funciones para gestión de eventos/publicaciones
 * @module database/events
 */

import { supabase } from "../supabase";

/**
 * Asegura que el perfil del usuario exista antes de crear un evento
 * @param {string} userId - ID del usuario
 */
const ensureProfileExists = async (userId) => {
  // Verificar si el perfil existe
  const { data: profile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  // Si no existe el perfil, crearlo
  if (checkError?.code === "PGRST116" || !profile) {
    // Obtener datos del usuario desde auth
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (user) {
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: userId,
          email: user.email,
          nombre:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Usuario",
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      ]);

      if (insertError && insertError.code !== "23505") {
        // 23505 = ya existe (ignorar)
        console.error("Error creando perfil:", insertError);
        throw new Error("No se pudo crear el perfil del usuario");
      }
    }
  }
};

/**
 * Valida los campos requeridos de un evento
 * @param {Object} eventData - Datos del evento a validar
 * @throws {Error} Si faltan campos requeridos
 */
const validateEventData = (eventData) => {
  const requiredFields = ["titulo", "user_id", "category_id"];
  const missingFields = requiredFields.filter((field) => !eventData[field]);

  if (missingFields.length > 0) {
    throw new Error(`Campos requeridos faltantes: ${missingFields.join(", ")}`);
  }

  if (eventData.titulo && eventData.titulo.length > 200) {
    throw new Error("El título no puede exceder 200 caracteres");
  }

  if (eventData.descripcion && eventData.descripcion.length > 5000) {
    throw new Error("La descripción no puede exceder 5000 caracteres");
  }
};

/**
 * Crea un nuevo evento
 * También crea una notificación de "en revisión"
 * @param {Object} eventData - Datos del evento
 * @returns {Promise<Object>} Evento creado
 */
export const createEvent = async (eventData) => {
  // Validar datos antes de insertar
  validateEventData(eventData);

  // Asegurar que el perfil del usuario exista
  await ensureProfileExists(eventData.user_id);

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
 * @returns {Promise<Array>} Lista de eventos publicados
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
      ),
      event_tags (
        tags (
          id,
          nombre
        )
      )
    `,
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
 * @returns {Promise<Array>} Eventos filtrados por ubicación
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
      ),
      event_tags (
        tags (
          id,
          nombre
        )
      )
    `,
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
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Eventos del usuario
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
    `,
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
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object>} Evento con datos completos
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
      ),
      event_tags (
        tags (
          id,
          nombre
        )
      )
    `,
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
 * @param {Object} filters - Filtros a aplicar
 * @param {string} filters.categoryId - ID de categoría
 * @param {string} filters.provincia - Provincia
 * @param {string} filters.comuna - Comuna
 * @param {string} filters.search - Texto de búsqueda
 * @returns {Promise<Array>} Eventos filtrados
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
      ),
      event_tags (
        tags (
          id,
          nombre
        )
      )
    `,
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
      `titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%,comuna.ilike.%${filters.search}%`,
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
 * @param {string} eventId - ID del evento
 * @param {Object} eventData - Datos a actualizar
 * @returns {Promise<Object>} Evento actualizado
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
 * @param {string} eventId - ID del evento
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    console.error("Error al eliminar evento:", error);
    throw error;
  }

  return true;
};
