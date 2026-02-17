/**
 * @fileoverview Funciones CRUD para categorías de negocio
 * @module database/businessCategories
 */

import { supabase } from "../supabase";
import cache from "./cache";

// ============ LECTURA ============

/**
 * Obtiene todas las categorías de negocio activas
 * @returns {Promise<Array>} Lista de categorías activas
 */
export const getBusinessCategories = async () => {
  const cached = cache.get("business_categories");
  if (cached) return cached;

  const { data, error } = await supabase
    .from("business_categories")
    .select("id, nombre, icono, color, orden, subcategorias")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías de negocio:", error);
    throw error;
  }

  cache.set("business_categories", data);
  return data;
};

/**
 * Obtiene una categoría de negocio por ID
 * @param {number} id - ID de la categoría
 * @returns {Promise<Object>} Categoría encontrada
 */
export const getBusinessCategoryById = async (id) => {
  const { data, error } = await supabase
    .from("business_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener categoría de negocio:", error);
    throw error;
  }

  return data;
};

// ============ ADMIN: CRUD ============

/**
 * Obtiene TODAS las categorías de negocio (incluidas inactivas) para admin
 * @returns {Promise<Array>} Lista completa de categorías
 */
export const getAllBusinessCategories = async () => {
  const { data, error } = await supabase
    .from("business_categories")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener todas las categorías de negocio:", error);
    throw error;
  }

  return data;
};

/**
 * Crea una nueva categoría de negocio
 * @param {Object} categoryData - Datos de la categoría
 * @param {string} categoryData.nombre - Nombre de la categoría
 * @param {string} [categoryData.icono] - Nombre del ícono FontAwesome
 * @param {string} [categoryData.color] - Color hex
 * @param {number} [categoryData.orden] - Orden de visualización
 * @param {boolean} [categoryData.activo] - Si está activa
 * @param {string[]} [categoryData.subcategorias] - Lista de subcategorías
 * @returns {Promise<Object>} Categoría creada
 */
export const createBusinessCategory = async (categoryData) => {
  const { nombre, icono, color, orden, activo, subcategorias } = categoryData;

  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  const { data, error } = await supabase
    .from("business_categories")
    .insert([
      {
        nombre: nombre.trim(),
        icono: icono?.trim() || null,
        color: color || "#FF6600",
        orden: orden ?? 0,
        activo: activo ?? true,
        subcategorias: subcategorias || [],
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `Ya existe una categoría de negocio con el nombre "${nombre.trim()}"`,
      );
    }
    console.error("Error al crear categoría de negocio:", error);
    throw error;
  }

  cache.invalidate("business_categories");
  return data;
};

/**
 * Actualiza una categoría de negocio
 * @param {number} categoryId - ID de la categoría
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Categoría actualizada
 */
export const updateBusinessCategory = async (categoryId, updates) => {
  if (!categoryId) {
    throw new Error("ID de categoría requerido");
  }

  const allowedFields = [
    "nombre",
    "icono",
    "color",
    "orden",
    "activo",
    "subcategorias",
  ];
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
    .from("business_categories")
    .update(sanitized)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Ya existe una categoría de negocio con ese nombre`);
    }
    console.error("Error al actualizar categoría de negocio:", error);
    throw error;
  }

  cache.invalidate("business_categories");
  return data;
};

/**
 * Elimina una categoría de negocio
 * @param {number} categoryId - ID de la categoría
 * @returns {Promise<boolean>} true si se eliminó
 */
export const deleteBusinessCategory = async (categoryId) => {
  if (!categoryId) {
    throw new Error("ID de categoría requerido");
  }

  const { error } = await supabase
    .from("business_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar esta categoría porque tiene negocios asociados. " +
          "Desactívala en su lugar.",
      );
    }
    console.error("Error al eliminar categoría de negocio:", error);
    throw error;
  }

  cache.invalidate("business_categories");
  return true;
};
