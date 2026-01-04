/**
 * @fileoverview Funciones para gestión de categorías
 * @module database/categories
 */

import { supabase } from "../supabase";
import cache from "./cache";

/**
 * Obtiene todas las categorías activas
 * OPTIMIZADO: Con caché de 5 minutos
 * @returns {Promise<Array>} Lista de categorías activas
 */
export const getCategories = async () => {
  // Verificar caché
  const cached = cache.get("categories");
  if (cached) return cached;

  const { data, error } = await supabase
    .from("categories")
    .select("id, nombre, icono, color, orden")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }

  // Guardar en caché
  cache.set("categories", data);
  return data;
};

/**
 * Obtiene una categoría por ID
 * @param {string} id - ID de la categoría
 * @returns {Promise<Object>} Categoría encontrada
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
