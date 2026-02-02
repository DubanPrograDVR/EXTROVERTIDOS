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

/**
 * Obtiene todas las subcategorías activas
 * OPTIMIZADO: Con caché de 5 minutos
 * @returns {Promise<Array>} Lista de subcategorías activas
 */
export const getSubcategories = async () => {
  // Verificar caché
  const cached = cache.get("subcategories");
  if (cached) return cached;

  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, nombre, icono, orden")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }

  // Guardar en caché
  cache.set("subcategories", data);
  return data;
};

/**
 * Obtiene subcategorías por categoría ID
 * @param {number} categoryId - ID de la categoría padre
 * @returns {Promise<Array>} Subcategorías de la categoría
 */
export const getSubcategoriesByCategoryId = async (categoryId) => {
  const cacheKey = `subcategories_${categoryId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("subcategories")
    .select("id, category_id, nombre, icono, orden")
    .eq("category_id", categoryId)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }

  cache.set(cacheKey, data);
  return data;
};

/**
 * Obtiene categorías con sus subcategorías
 * @returns {Promise<Array>} Categorías con subcategorías anidadas
 */
export const getCategoriesWithSubcategories = async () => {
  const cacheKey = "categories_with_subcategories";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Obtener categorías y subcategorías en paralelo
  const [categories, subcategories] = await Promise.all([
    getCategories(),
    getSubcategories(),
  ]);

  // Agrupar subcategorías por categoría
  const result = categories.map((category) => ({
    ...category,
    subcategories: subcategories.filter(
      (sub) => sub.category_id === category.id
    ),
  }));

  cache.set(cacheKey, result);
  return result;
};
