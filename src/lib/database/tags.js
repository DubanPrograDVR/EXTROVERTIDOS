/**
 * @fileoverview Funciones para gestión de tags/etiquetas
 * @module database/tags
 */

import { supabase } from "../supabase";

/**
 * Obtiene todos los tags
 * @returns {Promise<Array>} Lista de tags ordenados por nombre
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
 * @param {string} eventId - ID del evento
 * @param {string[]} tagIds - Array de IDs de tags
 * @returns {Promise<boolean>} true si se asociaron correctamente
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
