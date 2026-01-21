/**
 * @fileoverview Funciones para gestión de imágenes en Supabase Storage
 * @module database/images
 */

import { supabase } from "../supabase";
import imageCompression from "browser-image-compression";

/**
 * Formatos de imagen soportados
 */
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Formatos NO soportados (común en Mac/iPhone)
 */
const UNSUPPORTED_FORMATS = ["image/heic", "image/heif", "image/tiff"];

/**
 * Tamaño máximo de archivo (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Timeout para compresión (30 segundos)
 */
const COMPRESSION_TIMEOUT = 30000;

/**
 * Opciones de compresión de imágenes
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Máximo 1MB después de comprimir
  maxWidthOrHeight: 1920, // Máximo 1920px de ancho o alto
  useWebWorker: true, // Usar Web Worker para no bloquear UI
  fileType: "image/webp", // Convertir a WebP para mejor compresión
  initialQuality: 0.8, // Calidad inicial 80%
};

/**
 * Valida que el archivo sea una imagen soportada
 * @param {File} file - Archivo a validar
 * @throws {Error} Si el formato no es soportado
 */
const validateImageFormat = (file) => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Detectar HEIC por extensión (a veces el MIME type no es correcto)
  if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
    throw new Error(
      `Formato HEIC/HEIF no soportado. Por favor convierte la imagen a JPG o PNG antes de subirla. ` +
        `En iPhone: Ajustes → Cámara → Formatos → Más compatible.`,
    );
  }

  // Verificar formatos no soportados
  if (UNSUPPORTED_FORMATS.includes(fileType)) {
    throw new Error(`Formato "${fileType}" no soportado. Usa JPG, PNG o WebP.`);
  }

  // Verificar que sea un formato soportado
  if (!SUPPORTED_FORMATS.includes(fileType) && !fileType.startsWith("image/")) {
    throw new Error(
      `El archivo "${file.name}" no es una imagen válida. Usa JPG, PNG o WebP.`,
    );
  }

  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `La imagen "${file.name}" es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        `El máximo es 10MB.`,
    );
  }
};

/**
 * Ejecuta una promesa con timeout
 * @param {Promise} promise - Promesa a ejecutar
 * @param {number} ms - Tiempo máximo en milisegundos
 * @param {string} errorMessage - Mensaje de error si se excede el tiempo
 * @returns {Promise} Resultado de la promesa o error por timeout
 */
const withTimeout = (promise, ms, errorMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms),
    ),
  ]);
};

/**
 * Comprime una imagen antes de subirla
 * @param {File} file - Archivo de imagen original
 * @returns {Promise<File>} Archivo comprimido
 */
const compressImage = async (file) => {
  // Si el archivo es muy pequeño (< 200KB), no comprimir
  if (file.size < 200 * 1024) {
    console.log(
      `Imagen pequeña (${(file.size / 1024).toFixed(2)}KB), saltando compresión`,
    );
    return file;
  }

  try {
    console.log(
      `Comprimiendo imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    // Comprimir con timeout para evitar que se cuelgue
    const compressedFile = await withTimeout(
      imageCompression(file, COMPRESSION_OPTIONS),
      COMPRESSION_TIMEOUT,
      `Timeout al comprimir la imagen "${file.name}". Intenta con una imagen más pequeña.`,
    );

    console.log(
      `Imagen comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(
        compressedFile.size /
        1024 /
        1024
      ).toFixed(2)}MB`,
    );
    return compressedFile;
  } catch (error) {
    console.warn("Error al comprimir imagen, usando original:", error.message);
    // Si falla la compresión, intentar subir el original
    return file;
  }
};

/**
 * Sube una imagen de evento al storage de Supabase
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @param {boolean} compress - Si comprimir o no (default: true)
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadEventImage = async (file, userId, compress = true) => {
  console.log(
    `Iniciando subida de imagen: ${file.name}, tipo: ${file.type}, tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
  );

  try {
    // VALIDAR FORMATO ANTES DE PROCESAR
    validateImageFormat(file);

    // Comprimir imagen si está habilitado
    const fileToUpload = compress ? await compressImage(file) : file;

    const fileExt =
      fileToUpload.type === "image/webp" ? "webp" : file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    console.log(`Subiendo a Supabase: ${filePath}`);

    const { data, error } = await supabase.storage
      .from("Imagenes")
      .upload(filePath, fileToUpload, {
        cacheControl: "31536000", // Cache por 1 año
        upsert: false,
        contentType: fileToUpload.type || "image/jpeg",
      });

    if (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

    console.log(`Imagen subida exitosamente: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error en uploadEventImage para ${file.name}:`, error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes
 * @param {File[]} files - Array de archivos
 * @param {string} userId - ID del usuario
 * @returns {Promise<string[]>} Array de URLs públicas
 */
export const uploadMultipleImages = async (files, userId) => {
  const uploadPromises = files.map((file) => uploadEventImage(file, userId));
  return Promise.all(uploadPromises);
};

/**
 * Elimina una imagen del storage
 * @param {string} imageUrl - URL de la imagen a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteEventImage = async (imageUrl) => {
  // Extraer el path de la URL
  const urlParts = imageUrl.split("/storage/v1/object/public/Imagenes/");
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage.from("Imagenes").remove([filePath]);

  if (error) {
    console.error("Error al eliminar imagen:", error);
    throw error;
  }

  return true;
};

/**
 * Sube una imagen de negocio al storage
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadBusinessImage = async (file, userId) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `businesses/${fileName}`;

  const { data, error } = await supabase.storage
    .from("Imagenes")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

  return publicUrl;
};
