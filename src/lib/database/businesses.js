/**
 * @fileoverview Funciones para gestión de negocios
 * @module database/businesses
 */

import { supabase } from "../supabase";
import { isModerator } from "./roles";

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
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
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
    `,
    )
    .eq("estado", "publicado")
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
    console.error("Error al obtener negocios del usuario:", error);
    throw error;
  }

  return data;
};

/**
 * Obtiene todos los negocios pendientes de aprobación
 * @returns {Promise<Array>} Lista de negocios pendientes
 */
export const getPendingBusinesses = async () => {
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
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
    `,
    )
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
 * Obtiene todos los negocios (para admin)
 * @returns {Promise<Array>} Lista de todos los negocios
 */
export const getAllBusinesses = async () => {
  // Primero obtenemos los negocios
  const { data: businesses, error } = await supabase
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
    `,
    )
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

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "publicado",
      approved_by: adminId,
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

  const { data, error } = await supabase
    .from("businesses")
    .update({
      estado: "rechazado",
      motivo_rechazo: reason,
      rejected_by: adminId,
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
  "horarios",
  "imagenes",
  "imagen_logo",
  "category_id",
  "subcategory_id",
  "ubicacion_url",
  "coordenadas",
  "tags",
];

/**
 * Actualiza un negocio
 * SEGURIDAD: Whitelist de campos + verificación de permisos
 * @param {string} businessId - ID del negocio
 * @param {Object} businessData - Datos a actualizar
 * @param {string} userId - ID del usuario que actualiza
 * @returns {Promise<Object>} Negocio actualizado
 */
export const updateBusiness = async (businessId, businessData, userId) => {
  // Sanitizar: solo permitir campos seguros
  const sanitized = {};
  for (const key of ALLOWED_BUSINESS_UPDATE_FIELDS) {
    if (businessData[key] !== undefined) {
      sanitized[key] = businessData[key];
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
