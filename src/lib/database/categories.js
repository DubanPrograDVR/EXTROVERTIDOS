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
      (sub) => sub.category_id === category.id,
    ),
  }));

  cache.set(cacheKey, result);
  return result;
};

// ============ ADMIN: CRUD de categorías ============

/**
 * Obtiene TODAS las categorías (incluidas inactivas) para el admin
 * @returns {Promise<Array>} Lista completa de categorías
 */
export const getAllCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener todas las categorías:", error);
    throw error;
  }

  return data;
};

/**
 * Crea una nueva categoría
 * @param {Object} categoryData - Datos de la categoría
 * @param {string} categoryData.nombre - Nombre de la categoría
 * @param {string} [categoryData.icono] - Nombre del ícono
 * @param {string} [categoryData.color] - Color hex (#FF6600)
 * @param {number} [categoryData.orden] - Orden de visualización
 * @param {boolean} [categoryData.activo] - Si está activa
 * @returns {Promise<Object>} Categoría creada
 */
export const createCategory = async (categoryData) => {
  const { nombre, icono, color, orden, activo } = categoryData;

  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        nombre: nombre.trim(),
        icono: icono?.trim() || null,
        color: color || "#FF6600",
        orden: orden ?? 0,
        activo: activo ?? true,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `Ya existe una categoría con el nombre "${nombre.trim()}"`,
      );
    }
    console.error("Error al crear categoría:", error);
    throw error;
  }

  // Invalidar caché
  cache.invalidate("categories");

  return data;
};

/**
 * Actualiza una categoría existente
 * @param {number} categoryId - ID de la categoría
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Categoría actualizada
 */
export const updateCategory = async (categoryId, updates) => {
  if (!categoryId) {
    throw new Error("ID de categoría requerido");
  }

  const allowedFields = ["nombre", "icono", "color", "orden", "activo"];
  const sanitized = {};

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sanitized[key] =
        key === "nombre" && typeof value === "string" ? value.trim() : value;
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error("No hay campos válidos para actualizar");
  }

  const { data, error } = await supabase
    .from("categories")
    .update(sanitized)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Ya existe una categoría con ese nombre`);
    }
    console.error("Error al actualizar categoría:", error);
    throw error;
  }

  // Invalidar caché
  cache.invalidate("categories");

  return data;
};

/**
 * Elimina una categoría
 * @param {number} categoryId - ID de la categoría
 * @returns {Promise<boolean>} true si se eliminó
 */
export const deleteCategory = async (categoryId) => {
  if (!categoryId) {
    throw new Error("ID de categoría requerido");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar esta categoría porque tiene eventos asociados. " +
          "Desactívala en su lugar.",
      );
    }
    console.error("Error al eliminar categoría:", error);
    throw error;
  }

  // Invalidar caché
  cache.invalidate("categories");

  return true;
};
