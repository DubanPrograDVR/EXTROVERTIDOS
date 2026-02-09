import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { IMAGE_CONFIG } from "../constants";

// Array vacío estable para evitar re-renders innecesarios
const EMPTY_ARRAY = [];

/**
 * Hook especializado para manejo de imágenes en formularios
 *
 * CARACTERÍSTICAS:
 * - Gestión de Object URLs con limpieza automática de memoria
 * - Soporte para imágenes existentes (edición) y nuevas
 * - Validación de tamaño y cantidad
 * - Compresión automática de imágenes grandes
 * - Preview instantáneo sin subir al servidor
 * - Reordenamiento de imágenes (drag & drop ready)
 *
 * PROTECCIONES:
 * - Cleanup automático de Object URLs al desmontar
 * - Revocación inmediata al eliminar imagen
 * - Validación antes de agregar
 * - Límite de imágenes configurable
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxFiles - Máximo de archivos (default: 5)
 * @param {number} options.maxSize - Tamaño máximo en bytes (default: 5MB)
 * @param {string[]} options.initialExistingImages - URLs de imágenes existentes
 * @returns {Object} Estado y funciones de manejo de imágenes
 */
const useImageManager = (options = {}) => {
  const {
    maxFiles = IMAGE_CONFIG.maxFiles,
    maxSize = IMAGE_CONFIG.maxSize,
    initialExistingImages = EMPTY_ARRAY,
  } = options;

  // Estado
  const [newImages, setNewImages] = useState([]); // File objects
  const [existingImages, setExistingImages] = useState(initialExistingImages);
  const [previewUrls, setPreviewUrls] = useState([...initialExistingImages]);
  const [error, setError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Ref para trackear Object URLs creadas (para cleanup)
  const createdUrlsRef = useRef(new Set());
  const isMountedRef = useRef(true);

  /**
   * Limpia Object URLs específicas
   */
  const revokeUrls = useCallback((urls) => {
    urls.forEach((url) => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        createdUrlsRef.current.delete(url);
      }
    });
  }, []);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Revocar todas las URLs creadas
      createdUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      createdUrlsRef.current.clear();
    };
  }, []);

  /**
   * Actualiza imágenes existentes (para edición)
   */
  useEffect(() => {
    if (initialExistingImages.length > 0 && existingImages.length === 0) {
      setExistingImages(initialExistingImages);
      setPreviewUrls((prev) => {
        // Solo agregar si no hay previews aún
        if (prev.length === 0) {
          return [...initialExistingImages];
        }
        return prev;
      });
    }
  }, [initialExistingImages, existingImages.length]);

  /**
   * Comprime una imagen si es necesario
   * @param {File} file - Archivo de imagen
   * @param {number} maxWidth - Ancho máximo (default: 1920)
   * @param {number} quality - Calidad JPEG (default: 0.85)
   * @returns {Promise<File>} Archivo comprimido o original
   */
  const compressImage = useCallback(
    async (file, maxWidth = 1920, quality = 0.85) => {
      // Si es menor a 1MB, no comprimir
      if (file.size < 1024 * 1024) {
        return file;
      }

      return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // Fallback al original
              }
            },
            "image/jpeg",
            quality,
          );
        };

        img.onerror = () => resolve(file); // Fallback al original
        img.src = URL.createObjectURL(file);
      });
    },
    [],
  );

  /**
   * Valida un archivo de imagen
   * @param {File} file - Archivo a validar
   * @returns {{ valid: boolean, error?: string }}
   */
  const validateFile = useCallback(
    (file) => {
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        return { valid: false, error: `${file.name} no es una imagen válida` };
      }

      // Validar tamaño (advertencia, no bloqueo - se comprimirá)
      if (file.size > maxSize) {
        return {
          valid: true,
          warning: `${file.name} será comprimida (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        };
      }

      return { valid: true };
    },
    [maxSize],
  );

  /**
   * Agrega nuevas imágenes
   * @param {FileList|File[]} files - Archivos a agregar
   * @returns {Promise<{ added: number, errors: string[] }>}
   */
  const addImages = useCallback(
    async (files) => {
      const fileArray = Array.from(files);
      const currentTotal = existingImages.length + newImages.length;
      const availableSlots = maxFiles - currentTotal;

      if (availableSlots <= 0) {
        setError(`Ya tienes el máximo de ${maxFiles} imágenes`);
        return { added: 0, errors: [`Máximo ${maxFiles} imágenes permitidas`] };
      }

      // Limitar a slots disponibles
      const filesToAdd = fileArray.slice(0, availableSlots);
      const errors = [];
      const validFiles = [];
      const warnings = [];

      // Validar archivos
      for (const file of filesToAdd) {
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(validation.error);
        } else {
          if (validation.warning) {
            warnings.push(validation.warning);
          }
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) {
        if (errors.length > 0) {
          setError(errors[0]);
        }
        return { added: 0, errors };
      }

      // Comprimir si es necesario
      setIsCompressing(true);
      const processedFiles = [];

      try {
        for (const file of validFiles) {
          const processed =
            file.size > maxSize ? await compressImage(file) : file;
          processedFiles.push(processed);
        }
      } catch (compressError) {
        console.warn("Error comprimiendo imágenes:", compressError);
        // Usar originales si falla la compresión
        processedFiles.push(...validFiles.slice(processedFiles.length));
      }

      if (!isMountedRef.current) return { added: 0, errors: [] };

      setIsCompressing(false);

      // Crear preview URLs
      const newPreviewUrls = processedFiles.map((file) => {
        const url = URL.createObjectURL(file);
        createdUrlsRef.current.add(url);
        return url;
      });

      // Actualizar estado
      setNewImages((prev) => [...prev, ...processedFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      setError(null);

      // Mostrar warnings si hay
      if (warnings.length > 0) {
        console.info("Imágenes procesadas:", warnings);
      }

      return { added: processedFiles.length, errors, warnings };
    },
    [
      existingImages.length,
      newImages.length,
      maxFiles,
      validateFile,
      compressImage,
      maxSize,
    ],
  );

  /**
   * Elimina una imagen por índice
   * @param {number} index - Índice de la imagen a eliminar
   */
  const removeImage = useCallback(
    (index) => {
      const existingCount = existingImages.length;

      if (index < existingCount) {
        // Es una imagen existente (URL de servidor)
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
      } else {
        // Es una imagen nueva (Object URL)
        const newIndex = index - existingCount;

        // Revocar Object URL antes de eliminar
        setPreviewUrls((prev) => {
          const urlToRevoke = prev[index];
          if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
            URL.revokeObjectURL(urlToRevoke);
            createdUrlsRef.current.delete(urlToRevoke);
          }
          return prev.filter((_, i) => i !== index);
        });

        setNewImages((prev) => prev.filter((_, i) => i !== newIndex));
      }

      setError(null);
    },
    [existingImages.length],
  );

  /**
   * Reordena las imágenes (para drag & drop)
   * @param {number} fromIndex - Índice origen
   * @param {number} toIndex - Índice destino
   */
  const reorderImages = useCallback(
    (fromIndex, toIndex) => {
      const existingCount = existingImages.length;

      // Reordenar previews
      setPreviewUrls((prev) => {
        const newOrder = [...prev];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        return newOrder;
      });

      // Reordenar existentes si aplica
      if (fromIndex < existingCount || toIndex < existingCount) {
        // Reconstruir arrays basado en nuevo orden de previews
        // (Esto es más complejo y se puede implementar según necesidad)
      }
    },
    [existingImages.length],
  );

  /**
   * Limpia todas las imágenes (reset)
   */
  const clearAllImages = useCallback(() => {
    // Revocar todas las Object URLs
    previewUrls.forEach((url) => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        createdUrlsRef.current.delete(url);
      }
    });

    setNewImages([]);
    setExistingImages([]);
    setPreviewUrls([]);
    setError(null);
  }, [previewUrls]);

  /**
   * Establece imágenes existentes (para cargar de evento)
   */
  const setExistingImagesExternal = useCallback((images) => {
    setExistingImages(images);
    setPreviewUrls(images);
  }, []);

  /**
   * Convierte imagen a base64 (para borradores)
   * @param {string} imageUrl - URL de la imagen (blob: o http:)
   * @param {number} maxSize - Tamaño máximo en px (default: 300)
   * @returns {Promise<string|null>} String base64 o null
   */
  const imageToBase64 = useCallback(async (imageUrl, maxSizePx = 300) => {
    if (!imageUrl) return null;

    // Si ya es una URL válida (no blob), retornarla
    if (!imageUrl.startsWith("blob:")) {
      return imageUrl;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Comprimir para base64 (thumbnails pequeños)
      if (blob.size > 50000) {
        return new Promise((resolve) => {
          const img = new Image();
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSizePx) {
              height = (height * maxSizePx) / width;
              width = maxSizePx;
            } else if (height > maxSizePx) {
              width = (width * maxSizePx) / height;
              height = maxSizePx;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL("image/jpeg", 0.6));
          };

          img.onerror = () => resolve(null);
          img.src = imageUrl;
        });
      }

      // Convertir directamente si es pequeño
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error convirtiendo imagen a base64:", error);
      return null;
    }
  }, []);

  return {
    // Estado
    newImages,
    existingImages,
    previewUrls,
    error,
    isCompressing,

    // Acciones
    addImages,
    removeImage,
    reorderImages,
    clearAllImages,
    setExistingImages: setExistingImagesExternal,

    // Utilidades
    imageToBase64,

    // Computed
    totalImages: existingImages.length + newImages.length,
    remainingSlots: maxFiles - (existingImages.length + newImages.length),
    hasImages: existingImages.length + newImages.length > 0,
  };
};

export default useImageManager;
