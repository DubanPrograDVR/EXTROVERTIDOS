/**
 * @fileoverview Funciones para gestión de borradores (drafts)
 * @module database/drafts
 */

import { supabase } from "../supabase";

/**
 * Guarda o actualiza un borrador
 * @param {Object} draftData - Datos del borrador
 * @param {string} draftData.userId - ID del usuario
 * @param {string} draftData.tipo - Tipo: 'evento' o 'negocio'
 * @param {Object} draftData.data - Datos del formulario
 * @param {string} [draftData.id] - ID del borrador (para actualizar)
 * @param {string} [draftData.imagenPreview] - URL de imagen preview
 * @returns {Promise<Object>} Borrador guardado
 */
export const saveDraft = async ({
  userId,
  tipo,
  data,
  id = null,
  imagenPreview = null,
}) => {
  const titulo =
    data.titulo ||
    `Borrador ${tipo} - ${new Date().toLocaleDateString("es-CL")}`;

  const draftPayload = {
    user_id: userId,
    tipo,
    titulo,
    data,
    imagen_preview: imagenPreview,
  };

  let result;

  if (id) {
    // Actualizar borrador existente
    const { data: updatedDraft, error } = await supabase
      .from("drafts")
      .update(draftPayload)
      .eq("id", id)
      .eq("user_id", userId) // Seguridad adicional
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar borrador:", error);
      throw error;
    }
    result = updatedDraft;
  } else {
    // Crear nuevo borrador
    const { data: newDraft, error } = await supabase
      .from("drafts")
      .insert([draftPayload])
      .select()
      .single();

    if (error) {
      console.error("Error al crear borrador:", error);
      throw error;
    }
    result = newDraft;
  }

  return result;
};

/**
 * Obtiene todos los borradores de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} [tipo] - Filtrar por tipo (opcional)
 * @returns {Promise<Array>} Lista de borradores
 */
export const getDrafts = async (userId, tipo = null) => {
  let query = supabase
    .from("drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener borradores:", error);
    throw error;
  }

  return data || [];
};

/**
 * Obtiene un borrador por ID
 * @param {string} draftId - ID del borrador
 * @param {string} userId - ID del usuario (para verificación)
 * @returns {Promise<Object|null>} Borrador o null
 */
export const getDraftById = async (draftId, userId) => {
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No encontrado
    }
    console.error("Error al obtener borrador:", error);
    throw error;
  }

  return data;
};

/**
 * Elimina un borrador
 * @param {string} draftId - ID del borrador
 * @param {string} userId - ID del usuario (para verificación)
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteDraft = async (draftId, userId) => {
  const { error } = await supabase
    .from("drafts")
    .delete()
    .eq("id", draftId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error al eliminar borrador:", error);
    throw error;
  }

  return true;
};

/**
 * Cuenta los borradores de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Cantidad de borradores
 */
export const countDrafts = async (userId) => {
  const { count, error } = await supabase
    .from("drafts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error al contar borradores:", error);
    return 0;
  }

  return count || 0;
};

/**
 * Elimina todos los borradores de un tipo específico para un usuario
 * @param {string} userId - ID del usuario
 * @param {string} tipo - Tipo de borrador
 * @returns {Promise<boolean>} true si se eliminaron correctamente
 */
export const deleteAllDraftsByType = async (userId, tipo) => {
  const { error } = await supabase
    .from("drafts")
    .delete()
    .eq("user_id", userId)
    .eq("tipo", tipo);

  if (error) {
    console.error("Error al eliminar borradores:", error);
    throw error;
  }

  return true;
};
