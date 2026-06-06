/**
 * @fileoverview Funciones para gestión de negocios
 * @module database/businesses
 */

import { supabase } from "../supabase";
import { isModerator } from "./roles";
import {
  refundBusinessPublication,
  validateAndConsumeBusinessPublication,
} from "./subscriptions";
import { MAX_DURACION_NEGOCIO } from "../planRules";

/**
 * Crea un nuevo negocio
 * @param {Object} businessData - Datos del negocio
 * @returns {Promise<Object>} Negocio creado
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
 * @returns {Promise<Array>} Lista de negocios publicados
 */
export const getPublishedBusinesses = async () => {
  const nowIso = new Date().toISOString();
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("estado", "publicado")
    .eq("is_paused", false)
    .or(`publication_expires_at.is.null,publication_expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener negocios:", error);
    throw error;
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  // Obtener los user_ids únicos
  const userIds = [...new Set(businesses.map((b) => b.user_id))];

  // Obtener perfiles de esos usuarios
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nombre, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.warn("Error al obtener perfiles:", profilesError);
    return businesses.map((b) => ({ ...b, profiles: null }));
  }

  // Mapear profiles a los negocios
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  return businesses.map((b) => ({
    ...b,
    profiles: profilesMap.get(b.user_id) || null,
  }));
};

/**
 * Obtiene negocios por usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Negocios del usuario
 */
export const getBusinessesByUser = async (userId) => {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener negocios del usuario:", error);
    throw error;
  }

  return data;
};

/**
 * Verifica si el usuario tiene un negocio pendiente de revisión
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si tiene un negocio pendiente
 */
export const hasUserPendingBusiness = async (userId) => {
  const { count, error } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("estado", "pendiente");

  if (error) {
    console.error("Error verificando negocio pendiente:", error);
    return false;
  }

  return count > 0;
};

/**
 * Obtiene todos los negocios pendientes de aprobación
 * @returns {Promise<Array>} Lista de negocios pendientes
 */
export const getPendingBusinesses = async () => {
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener negocios pendientes:", error);
    throw error;
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  // Obtener los user_ids únicos
  const userIds = [...new Set(businesses.map((b) => b.user_id))];

  // Obtener perfiles de esos usuarios
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nombre, avatar_url, email")
    .in("id", userIds);

  if (profilesError) {
    console.warn("Error al obtener perfiles:", profilesError);
    // Retornar negocios sin profiles si falla
    return businesses.map((b) => ({ ...b, profiles: null }));
  }

  // Mapear profiles a los negocios
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  return businesses.map((b) => ({
    ...b,
    profiles: profilesMap.get(b.user_id) || null,
  }));
};

/**
 * Obtiene todos los negocios en estado "en_revision"
 * (negocios ya publicados que fueron editados por su dueño y requieren nueva revisión).
 * @returns {Promise<Array>} Lista de negocios en revisión
 */
export const getInReviewBusinesses = async () => {
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("estado", "en_revision")
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("Error al obtener negocios en revisión:", error);
    throw error;
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  const userIds = [...new Set(businesses.map((b) => b.user_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nombre, avatar_url, email")
    .in("id", userIds);

  if (profilesError) {
    console.warn("Error al obtener perfiles:", profilesError);
    return businesses.map((b) => ({ ...b, profiles: null }));
  }

  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  return businesses.map((b) => ({
    ...b,
    profiles: profilesMap.get(b.user_id) || null,
  }));
};

/**
 * Obtiene todos los negocios (para admin)
 * @returns {Promise<Array>} Lista de todos los negocios
 */
export const getAllBusinesses = async () => {
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener todos los negocios:", error);
    throw error;
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  // Obtener los user_ids únicos
  const userIds = [...new Set(businesses.map((b) => b.user_id))];

  // Obtener perfiles de esos usuarios
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nombre, avatar_url, email")
    .in("id", userIds);

  if (profilesError) {
    console.warn("Error al obtener perfiles:", profilesError);
    // Retornar negocios sin profiles si falla
    return businesses.map((b) => ({ ...b, profiles: null }));
  }

  // Mapear profiles a los negocios
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  return businesses.map((b) => ({
    ...b,
    profiles: profilesMap.get(b.user_id) || null,
  }));
};

/**
 * Aprueba un negocio (cambia estado a publicado)
 * SEGURIDAD: Requiere permisos de moderador
 * @param {string} businessId - ID del negocio
 * @param {string} adminId - ID del administrador que aprueba
 * @returns {Promise<Object>} Negocio actualizado
 */
export const approveBusiness = async (businessId, adminId) => {
  const canModerate = await isModerator(adminId);
  if (!canModerate) {
    throw new Error("No tienes permisos para aprobar negocios");
  }

  // Obtener el user_id y la fecha de expiración actual del negocio
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("user_id, publication_expires_at")
    .eq("id", businessId)
    .single();

  if (fetchError || !business) {
    throw new Error("No se encontró el negocio");
  }

  // NOTA: El cupo ya fue consumido al momento del envío (useNegocioForm).
  // Si el negocio ya tiene una fecha de expiración vigente (re-aprobación tras edición),
  // se conserva para no reiniciar el contador. Solo se calcula nueva fecha si es
  // aprobación inicial o si la fecha ya expiró.
  const existingExpiry = business.publication_expires_at;
  const publicationExpiresAt =
    existingExpiry && new Date(existingExpiry) > new Date()
      ? existingExpiry
      : new Date(Date.now() + MAX_DURACION_NEGOCIO * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "publicado",
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      publication_expires_at: publicationExpiresAt,
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error al aprobar negocio:", error);
    throw error;
  }

  // Crear notificación in-app para el dueño del negocio
  try {
    await supabase.from("notifications").insert([
      {
        user_id: business.user_id,
        type: "publication_approved",
        title: "¡Negocio aprobado!",
        message: `Tu negocio "${data.nombre}" ha sido aprobado y ya está visible para todos.`,
        related_business_id: businessId,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (notifError) {
    console.warn("No se pudo crear la notificación de aprobación:", notifError);
  }

  return data;
};

/**
 * Rechaza un negocio
 * SEGURIDAD: Requiere permisos de moderador
 * @param {string} businessId - ID del negocio
 * @param {string} adminId - ID del admin que rechaza
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<Object>} Negocio actualizado
 */
export const rejectBusiness = async (businessId, adminId, reason = "") => {
  const canModerate = await isModerator(adminId);
  if (!canModerate) {
    throw new Error("No tienes permisos para rechazar negocios");
  }

  // Obtener revision_count actual y user_id para devolver cupo
  const { data: bizData, error: fetchError } = await supabase
    .from("businesses")
    .select("revision_count, user_id")
    .eq("id", businessId)
    .single();

  if (fetchError) {
    console.error("Error al obtener negocio:", fetchError);
    throw fetchError;
  }

  const newRevisionCount = (bizData.revision_count || 0) + 1;

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "rechazado",
      motivo_rechazo: reason,
      rejected_by: adminId,
      revision_count: newRevisionCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error al rechazar negocio:", error);
    throw error;
  }

  // Crear notificación in-app para el dueño del negocio
  try {
    const motivoTexto = reason ? ` Motivo: ${reason}` : "";
    await supabase.from("notifications").insert([
      {
        user_id: bizData.user_id,
        type: "publication_rejected",
        title: "Negocio rechazado",
        message: `Tu negocio "${data.nombre}" no ha sido aprobado.${motivoTexto}`,
        related_business_id: businessId,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (notifError) {
    console.warn("No se pudo crear la notificación de rechazo:", notifError);
  }

  // Devolver cupo de publicación si aún tiene intentos de revisión
  // En el 3er rechazo (revision_count = 3) el cupo se pierde definitivamente
  if (newRevisionCount < 3) {
    try {
      await refundBusinessPublication(bizData.user_id);
    } catch (refundError) {
      // No bloquear el rechazo si falla el refund (log para debugging)
      console.warn(
        "No se pudo devolver el cupo de publicación de negocio:",
        refundError,
      );
    }
  }

  return data;
};

const MAX_REVISION_ATTEMPTS = 3;

/**
 * Reenvía un negocio rechazado a revisión.
 * Máximo 3 intentos de revisión.
 * @param {string} businessId - ID del negocio
 * @returns {Promise<Object>} Negocio actualizado
 */
export const resubmitBusiness = async (businessId) => {
  const { data: biz, error: fetchError } = await supabase
    .from("businesses")
    .select("estado, revision_count, user_id")
    .eq("id", businessId)
    .single();

  if (fetchError) throw fetchError;

  if (biz.estado !== "rechazado") {
    throw new Error("Solo puedes reenviar negocios rechazados");
  }

  if ((biz.revision_count || 0) >= MAX_REVISION_ATTEMPTS) {
    throw new Error(
      "Has alcanzado el máximo de 3 intentos de revisión para este negocio",
    );
  }

  // Re-consumir cupo de publicación (fue devuelto al rechazar)
  const publishResult = await validateAndConsumeBusinessPublication(
    biz.user_id,
    false,
    false,
  );

  if (!publishResult?.allowed) {
    throw new Error(
      publishResult?.reason ||
        "No tienes cupo disponible para reenviar el negocio.",
    );
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "en_revision",
      motivo_rechazo: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina un negocio
 * SEGURIDAD: Requiere permisos de moderador
 * @param {string} businessId - ID del negocio
 * @param {string} adminId - ID del admin que elimina
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteBusiness = async (businessId, adminId) => {
  const canModerate = await isModerator(adminId);
  if (!canModerate) {
    throw new Error("No tienes permisos para eliminar negocios");
  }

  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (error) {
    console.error("Error al eliminar negocio:", error);
    throw error;
  }

  return true;
};

/**
 * Elimina un negocio del usuario autenticado.
 * Supabase RLS garantiza que solo el owner pueda eliminar.
 * @param {string} businessId - ID del negocio
 * @param {string} userId - ID del usuario dueño
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteOwnBusiness = async (businessId, userId) => {
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error al eliminar negocio:", error);
    throw error;
  }

  return true;
};

/**
 * Pausa o reactiva un negocio.
 * Un negocio pausado NO aparece en Superguía.
 * @param {string} businessId - ID del negocio
 * @param {boolean} paused - true para pausar, false para reactivar
 * @returns {Promise<boolean>}
 */
export const pauseBusiness = async (businessId, paused) => {
  const { error } = await supabase
    .from("businesses")
    .update({ is_paused: paused })
    .eq("id", businessId);

  if (error) {
    console.error("Error al pausar/reactivar negocio:", error);
    throw error;
  }

  return true;
};

/**
 * Campos permitidos para actualizar un negocio.
 * SEGURIDAD: Evita mass-assignment de campos protegidos.
 */
const ALLOWED_BUSINESS_UPDATE_FIELDS = [
  "nombre",
  "descripcion",
  "direccion",
  "comuna",
  "provincia",
  "telefono",
  "email",
  "sitio_web",
  "redes_sociales",
  "instagram",
  "facebook",
  "whatsapp",
  "tiktok",
  "twitter",
  "youtube",
  "linkedin",
  "horarios",
  "dias_atencion",
  "imagenes",
  "imagen_logo",
  "categoria",
  "subcategoria",
  "ubicacion_url",
  "coordenadas",
  "tags",
  "titulo_marketing",
  "mensaje_marketing",
  "titulo_marketing_2",
  "mensaje_marketing_2",
  "publication_expires_at",
];

/**
 * Actualiza un negocio
 * SEGURIDAD: Whitelist de campos + verificación de permisos
 * @param {string} businessId - ID del negocio
 * @param {Object} businessData - Datos a actualizar
 * @param {string} [userId] - ID del usuario que actualiza
 * @param {Object} [options]
 * @param {boolean} [options.adminOverride=false] - Si es admin/moderador (no auto-revierte estado)
 * @returns {Promise<Object>} Negocio actualizado
 */
export const updateBusiness = async (
  businessId,
  businessData,
  userId,
  options = {},
) => {
  const { adminOverride = false } = options;

  // Sanitizar: solo permitir campos seguros
  const sanitized = {};
  for (const key of ALLOWED_BUSINESS_UPDATE_FIELDS) {
    if (businessData[key] !== undefined) {
      sanitized[key] = businessData[key];
    }
  }

  // Auto-revert a revisión: si un usuario normal edita un negocio ya publicado
  // o uno rechazado, se envía a "en_revision" para que el administrador lo revise.
  if (!adminOverride) {
    const { data: current } = await supabase
      .from("businesses")
      .select("estado")
      .eq("id", businessId)
      .single();
    if (current?.estado === "publicado" || current?.estado === "rechazado") {
      sanitized.estado = "en_revision";
      sanitized.motivo_rechazo = null;
    }
  }

  sanitized.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update(sanitized)
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar negocio:", error);
    throw error;
  }

  return data;
};

// ═══════════════════════════════════════════════
// HELPERS DE EXPIRACIÓN
// ═══════════════════════════════════════════════

/**
 * Verifica si un negocio publicado expiró según su publication_expires_at.
 * @param {Object} business
 * @returns {boolean}
 */
export const isBusinessExpired = (business) => {
  if (!business) return false;
  if (business.estado !== "publicado") return false;
  if (!business.publication_expires_at) return false;
  return new Date(business.publication_expires_at).getTime() <= Date.now();
};

/**
 * Días restantes hasta la expiración (>=0). Null si no aplica.
 * @param {Object} business
 * @returns {number|null}
 */
export const getDiasRestantesNegocio = (business) => {
  if (!business?.publication_expires_at) return null;
  const diffMs =
    new Date(business.publication_expires_at).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.min(Math.ceil(diffMs / 86400000), MAX_DURACION_NEGOCIO);
};

/**
 * Reactivar/republicar un negocio expirado del usuario reutilizando todos los datos.
 *
 * Flujo:
 * 1. Verifica que el negocio sea del usuario y esté expirado.
 * 2. Consume un cupo de la suscripción superguía activa
 *    (RPC `validate_and_consume_business_publication`).
 * 3. Actualiza el negocio: estado='publicado', publication_expires_at=now+30d,
 *    is_paused=false. NO pasa por revisión admin (datos ya aprobados antes).
 * 4. Si la actualización falla, intenta hacer refund del cupo.
 *
 * @param {string} businessId - ID del negocio a republicar
 * @param {string} userId - ID del dueño (para validación)
 * @returns {Promise<Object>} Negocio actualizado
 */
export const republishBusiness = async (businessId, userId) => {
  if (!businessId) throw new Error("ID de negocio requerido");
  if (!userId) throw new Error("ID de usuario requerido");

  // 1. Cargar y validar el negocio
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("id, user_id, estado, publication_expires_at")
    .eq("id", businessId)
    .single();

  if (fetchError || !business) {
    throw new Error("No se encontró el negocio");
  }
  if (business.user_id !== userId) {
    throw new Error("No tienes permisos para reactivar este negocio");
  }
  if (!isBusinessExpired(business)) {
    throw new Error("Este negocio aún no ha expirado");
  }

  // 1b. Defensa: no permitir reactivar si el usuario tiene OTRO negocio
  // publicado y no expirado. Cada cupo Superguía sirve para un único
  // negocio activo a la vez.
  const nowIso = new Date().toISOString();
  const { count: otherActiveCount, error: countErr } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("estado", "publicado")
    .neq("id", businessId)
    .or(`publication_expires_at.is.null,publication_expires_at.gt.${nowIso}`);

  if (countErr) {
    console.error("Error al verificar otros negocios activos:", countErr);
  }
  if ((otherActiveCount ?? 0) > 0) {
    throw new Error(
      "Ya tenés otro negocio publicado y vigente. Esperá a que expire para reactivar este.",
    );
  }

  // 2. Consumir cupo
  await validateAndConsumeBusinessPublication(userId);

  // 3. Calcular nueva expiración y actualizar
  const publicationExpiresAt = new Date(
    Date.now() + MAX_DURACION_NEGOCIO * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "publicado",
      is_paused: false,
      publication_expires_at: publicationExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    // Intentar revertir el cupo consumido
    try {
      await refundBusinessPublication(userId);
    } catch (refundErr) {
      console.error(
        "Fallo el refund tras error al republicar negocio:",
        refundErr,
      );
    }
    console.error("Error al republicar negocio:", error);
    throw error;
  }

  return data;
};
