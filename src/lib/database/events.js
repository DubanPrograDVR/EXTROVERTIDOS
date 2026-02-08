/**
 * @fileoverview Funciones para gestión de eventos/publicaciones
 * @module database/events
 */

import { supabase } from "../supabase";

/**
 * Sanitiza un valor para usar en filtros PostgREST.
 * Remueve caracteres que podrían inyectar operadores (., ,, (, )).
 * @param {string} value - Valor a sanitizar
 * @returns {string} Valor seguro
 */
const sanitizeFilterValue = (value) => {
  if (!value || typeof value !== 'string') return '';
  // Remover operadores PostgREST (.,()) y wildcards ILIKE (%_) y backslash
  return value.replace(/[.,()\\%_]/g, '').trim();
};

/**
 * Detecta si un error de Supabase es de autenticación
 * @param {Object} error - Error de Supabase
 * @returns {boolean}
 */
const isSupabaseAuthError = (error) => {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = String(error.code || error.status || "");
  return (
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("expired") ||
    msg.includes("invalid claim") ||
    msg.includes("not authenticated") ||
    msg.includes("unauthorized") ||
    msg.includes("permission denied") ||
    code === "401" ||
    code === "403" ||
    code === "PGRST301"
  );
};

/**
 * Envuelve un error de Supabase en un Error con mensaje claro para auth
 * @param {Object} error - Error de Supabase
 * @param {string} defaultMsg - Mensaje por defecto
 * @returns {Error}
 */
const wrapSupabaseError = (error, defaultMsg) => {
  if (isSupabaseAuthError(error)) {
    const authError = new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    authError.code = "AUTH_EXPIRED";
    authError.status = 401;
    return authError;
  }
  const wrapped = new Error(error.message || defaultMsg);
  wrapped.code = error.code;
  wrapped.status = error.status;
  return wrapped;
};

/**
 * Asegura que el perfil del usuario exista antes de crear un evento
 * @param {string} userId - ID del usuario
 */
const ensureProfileExists = async (userId) => {
  try {
    // Verificar si el perfil existe
    const { data: profile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    // Si hay un error de auth, propagar inmediatamente
    if (checkError && isSupabaseAuthError(checkError)) {
      throw wrapSupabaseError(checkError, "Error verificando perfil");
    }

    // Si no existe el perfil, crearlo
    if (checkError?.code === "PGRST116" || !profile) {
      // Obtener datos del usuario desde auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn("No se pudo obtener datos del usuario para crear perfil:", authError);
        return; // No bloquear si no podemos crear perfil
      }
      
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
          // No bloquear el flujo por un error de perfil
        }
      }
    }
  } catch (error) {
    // Re-lanzar errores de auth, ignorar otros errores de perfil
    if (error.code === "AUTH_EXPIRED" || isSupabaseAuthError(error)) {
      throw error;
    }
    console.warn("Error no crítico en ensureProfileExists:", error);
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
    throw wrapSupabaseError(error, "Error al crear el evento");
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
 * Solo muestra eventos vigentes (fecha_fin >= hoy)
 * @returns {Promise<Array>} Lista de eventos publicados
 */
export const getPublishedEvents = async () => {
  // Obtener fecha actual en formato ISO (solo fecha, sin hora)
  const today = new Date().toISOString().split("T")[0];

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
    .gte("fecha_fin", today) // Solo eventos que no han terminado
    .order("fecha_evento", { ascending: true });

  if (error) {
    console.error("Error al obtener eventos:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene eventos publicados filtrados por ciudad/comuna
 * Solo muestra eventos vigentes (fecha_fin >= hoy)
 * @param {string} ciudad - Nombre de la ciudad o comuna a filtrar
 * @param {string} provincia - Nombre de la provincia (opcional)
 * @returns {Promise<Array>} Eventos filtrados por ubicación
 */
export const getEventsByCity = async (ciudad, provincia = null) => {
  // Obtener fecha actual en formato ISO (solo fecha, sin hora)
  const today = new Date().toISOString().split("T")[0];

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
    .eq("estado", "publicado")
    .gte("fecha_fin", today); // Solo eventos que no han terminado

  // Filtrar por comuna o provincia
  if (ciudad) {
    const safeCiudad = sanitizeFilterValue(ciudad);
    if (safeCiudad) {
      query = query.or(`comuna.ilike.%${safeCiudad}%,provincia.ilike.%${safeCiudad}%`);
    }
  }

  if (provincia) {
    const safeProvincia = sanitizeFilterValue(provincia);
    if (safeProvincia) {
      query = query.ilike("provincia", `%${safeProvincia}%`);
    }
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
  // Obtener fecha actual en formato ISO (solo fecha, sin hora)
  const today = new Date().toISOString().split("T")[0];

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
    .eq("estado", "publicado")
    .gte("fecha_fin", today); // Solo eventos que no han terminado

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
    const safeSearch = sanitizeFilterValue(filters.search);
    if (safeSearch) {
      query = query.or(
        `titulo.ilike.%${safeSearch}%,descripcion.ilike.%${safeSearch}%,comuna.ilike.%${safeSearch}%`,
      );
    }
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
 * Campos permitidos para actualizar un evento.
 * SEGURIDAD: Evita mass-assignment de 'estado', 'user_id', 'published_at'.
 */
const ALLOWED_EVENT_UPDATE_FIELDS = [
  'titulo', 'descripcion', 'organizador', 'category_id',
  'fecha_evento', 'fecha_fin', 'hora_inicio', 'hora_fin',
  'provincia', 'comuna', 'direccion', 'coordenadas',
  'imagenes', 'tipo_entrada', 'precio', 'url_venta',
  'redes_sociales', 'motivo_rechazo', 'sitio_web',
  'ubicacion_url', 'es_recurrente', 'tipo_recurrencia',
  'dias_recurrencia', 'fechas_recurrentes',
  'etiqueta_destacada', 'hashtags', 'mensaje_marketing',
  'titulo_marketing',
];

/**
 * Campos adicionales que solo un admin/moderador puede modificar.
 */
const ADMIN_ONLY_EVENT_FIELDS = ['estado', 'published_at'];

/**
 * Actualiza un evento
 * SEGURIDAD: Solo permite campos de la whitelist.
 * Si se necesita cambiar 'estado', pasar options.adminOverride = true.
 * @param {string} eventId - ID del evento
 * @param {Object} eventData - Datos a actualizar
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.adminOverride=false] - Permite campos admin (estado, published_at)
 * @returns {Promise<Object>} Evento actualizado
 */
export const updateEvent = async (eventId, eventData, options = {}) => {
  const { adminOverride = false } = options;

  // Determinar campos permitidos según contexto
  const allowedFields = adminOverride
    ? [...ALLOWED_EVENT_UPDATE_FIELDS, ...ADMIN_ONLY_EVENT_FIELDS]
    : ALLOWED_EVENT_UPDATE_FIELDS;

  // Sanitizar: solo permitir campos seguros
  const sanitized = {};
  for (const key of allowedFields) {
    if (eventData[key] !== undefined) {
      sanitized[key] = eventData[key];
    }
  }

  // Caso especial: usuarios normales pueden volver su evento a "pendiente"
  // (para re-revisión tras editar), pero NO pueden ponerlo en "publicado"
  if (!adminOverride && eventData.estado === "pendiente") {
    sanitized.estado = "pendiente";
  }

  sanitized.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .update(sanitized)
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar evento:", error);
    throw wrapSupabaseError(error, "Error al actualizar el evento");
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
