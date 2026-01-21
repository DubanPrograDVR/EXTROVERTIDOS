/**
 * @fileoverview Funciones para gestión de imágenes en Supabase Storage
 * @module database/images
 *
 * CORRECCIONES APLICADAS:
 * - Desactivado Web Worker en compresión (causa cuelgues silenciosos)
 * - Mantiene formato original en vez de convertir a WebP (problemas con perfiles de color)
 * - Verificación de sesión antes de subir
 * - Timeout en upload a Supabase Storage
 * - Mensajes de error más específicos
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
 * Timeout para subida (60 segundos)
 */
const UPLOAD_TIMEOUT = 60000;

/**
 * Opciones de compresión de imágenes (CORREGIDAS)
 * - useWebWorker: false → Evita cuelgues silenciosos en algunos navegadores
 * - fileType: dinámico → Mantiene formato original para evitar problemas de conversión
 */
const getCompressionOptions = (file) => ({
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: false, // ⚠️ CRÍTICO: Desactivado para evitar cuelgues
  fileType: file.type === "image/png" ? "image/png" : "image/jpeg", // Mantener formato
  initialQuality: 0.85,
});

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
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
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
      `📷 Imagen pequeña (${(file.size / 1024).toFixed(2)}KB), saltando compresión`,
    );
    return file;
  }

  try {
    console.log(
      `📷 Comprimiendo imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    const compressionOptions = getCompressionOptions(file);

    // Comprimir con timeout para evitar que se cuelgue
    const compressedFile = await withTimeout(
      imageCompression(file, compressionOptions),
      COMPRESSION_TIMEOUT,
      `Timeout al comprimir la imagen "${file.name}". Intenta con una imagen más pequeña.`,
    );

    const originalSize = (file.size / 1024 / 1024).toFixed(2);
    const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);

    console.log(
      `✅ Imagen comprimida: ${originalSize}MB → ${compressedSize}MB`,
    );

    return compressedFile;
  } catch (error) {
    console.warn(
      "⚠️ Error al comprimir imagen, usando original:",
      error.message,
    );
    // Si falla la compresión, intentar subir el original
    return file;
  }
};

/**
 * Verifica que la sesión de Supabase esté activa
 * @returns {Promise<{session: object, error: Error|null}>}
 */
const verifySession = async () => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Error obteniendo sesión:", sessionError);
      return { session: null, error: sessionError };
    }

    if (!session) {
      console.warn("⚠️ No hay sesión activa, intentando refrescar...");

      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        console.error("❌ No se pudo refrescar la sesión:", refreshError);
        return {
          session: null,
          error: new Error(
            "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          ),
        };
      }

      console.log("✅ Sesión refrescada exitosamente");
      return { session: refreshData.session, error: null };
    }

    // Verificar si el token está por expirar (menos de 5 minutos)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry < 300) {
      // Menos de 5 minutos
      console.log("⚠️ Token por expirar, refrescando...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (!refreshError && refreshData.session) {
        console.log("✅ Token refrescado preventivamente");
        return { session: refreshData.session, error: null };
      }
    }

    return { session, error: null };
  } catch (error) {
    console.error("❌ Error verificando sesión:", error);
    return { session: null, error };
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
    `📤 Iniciando subida de imagen: ${file.name}, tipo: ${file.type}, tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
  );

  try {
    // 🔐 PASO 1: Verificar sesión antes de cualquier operación
    console.log("🔐 Verificando sesión...");
    const { session, error: sessionError } = await verifySession();

    if (!session || sessionError) {
      throw (
        sessionError ||
        new Error("No hay sesión activa. Por favor inicia sesión nuevamente.")
      );
    }
    console.log("✅ Sesión válida");

    // 🔍 PASO 2: Validar formato de imagen
    console.log("🔍 Validando formato...");
    validateImageFormat(file);
    console.log("✅ Formato válido");

    // 📦 PASO 3: Comprimir imagen si está habilitado
    let fileToUpload = file;

    if (compress) {
      console.log("📦 Iniciando compresión...");
      try {
        fileToUpload = await compressImage(file);
      } catch (compressError) {
        console.warn(
          "⚠️ Compresión falló, subiendo original:",
          compressError.message,
        );
        fileToUpload = file;
      }
    }

    // 📤 PASO 4: Preparar y subir a Supabase
    const fileExt =
      fileToUpload.type === "image/png"
        ? "png"
        : fileToUpload.type === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    console.log(`📤 Subiendo a Supabase: ${filePath}`);

    const uploadPromise = supabase.storage
      .from("Imagenes")
      .upload(filePath, fileToUpload, {
        cacheControl: "31536000",
        upsert: false,
        contentType: fileToUpload.type || "image/jpeg",
      });

    // Subir con timeout
    const { data, error } = await withTimeout(
      uploadPromise,
      UPLOAD_TIMEOUT,
      `Timeout al subir la imagen "${file.name}". Verifica tu conexión e intenta nuevamente.`,
    );

    if (error) {
      console.error("❌ Error al subir imagen:", error);

      // Mensajes de error más específicos
      if (error.message?.includes("JWT") || error.message?.includes("token")) {
        throw new Error(
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
        );
      }
      if (
        error.message?.includes("Policy") ||
        error.message?.includes("permission")
      ) {
        throw new Error(
          "No tienes permisos para subir imágenes. Contacta al administrador.",
        );
      }
      if (
        error.message?.includes("duplicate") ||
        error.message?.includes("already exists")
      ) {
        throw new Error(
          "Ya existe una imagen con ese nombre. Intenta nuevamente.",
        );
      }
      if (
        error.message?.includes("size") ||
        error.message?.includes("too large")
      ) {
        throw new Error("La imagen es demasiado grande. Máximo 10MB.");
      }

      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    // ✅ PASO 5: Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

    console.log(`✅ Imagen subida exitosamente: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error en uploadEventImage para ${file.name}:`, error);
    // Re-lanzar el error para que handleSubmit lo capture
    throw error;
  }
};

/**
 * Sube múltiples imágenes (secuencialmente para mejor manejo de errores)
 * @param {File[]} files - Array de archivos
 * @param {string} userId - ID del usuario
 * @param {function} onProgress - Callback de progreso (opcional)
 * @returns {Promise<string[]>} Array de URLs públicas
 */
export const uploadMultipleImages = async (
  files,
  userId,
  onProgress = null,
) => {
  const urls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: "uploading",
      });
    }

    try {
      const url = await uploadEventImage(file, userId);
      urls.push(url);

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          fileName: file.name,
          status: "completed",
        });
      }
    } catch (error) {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          fileName: file.name,
          status: "error",
          error: error.message,
        });
      }
      throw error; // Re-lanzar para detener el proceso
    }
  }

  return urls;
};

/**
 * Elimina una imagen del storage
 * @param {string} imageUrl - URL de la imagen a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteEventImage = async (imageUrl) => {
  try {
    // Extraer el path de la URL
    const urlParts = imageUrl.split("/storage/v1/object/public/Imagenes/");
    if (urlParts.length < 2) {
      console.warn("URL de imagen no válida para eliminar:", imageUrl);
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from("Imagenes")
      .remove([filePath]);

    if (error) {
      console.error("Error al eliminar imagen:", error);
      throw error;
    }

    console.log("✅ Imagen eliminada:", filePath);
    return true;
  } catch (error) {
    console.error("❌ Error en deleteEventImage:", error);
    throw error;
  }
};

/**
 * Sube una imagen de negocio al storage
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadBusinessImage = async (file, userId) => {
  console.log(`📤 Subiendo imagen de negocio: ${file.name}`);

  try {
    // Verificar sesión
    const { session, error: sessionError } = await verifySession();
    if (!session || sessionError) {
      throw sessionError || new Error("No hay sesión activa.");
    }

    // Validar formato
    validateImageFormat(file);

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `businesses/${fileName}`;

    const { data, error } = await withTimeout(
      supabase.storage.from("Imagenes").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      }),
      UPLOAD_TIMEOUT,
      "Timeout al subir imagen de negocio.",
    );

    if (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("Imagenes").getPublicUrl(filePath);

    console.log(`✅ Imagen de negocio subida: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error en uploadBusinessImage:", error);
    throw error;
  }
};
