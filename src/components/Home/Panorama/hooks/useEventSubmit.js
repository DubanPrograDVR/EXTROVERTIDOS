import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEvent,
  updateEvent,
  uploadEventImage,
  deleteDraft,
} from "../../../../lib/database";

/**
 * Hook especializado para manejar el proceso de envío de eventos
 *
 * RESPONSABILIDADES:
 * - Validar formulario antes de envío
 * - Subir imágenes con control de errores
 * - Crear/actualizar eventos en la base de datos
 * - Manejar borradores después de publicación
 * - Controlar redirección post-submit
 *
 * PROTECCIONES:
 * - AbortController para cancelar uploads en desmontaje
 * - Flag para prevenir double-submit
 * - Ref para showToast evitando dependencias inestables
 * - Validación de auth antes de cada operación crítica
 * - Rollback de estado en caso de error
 *
 * @param {Object} options - Opciones del hook
 * @param {Object} options.user - Usuario actual
 * @param {boolean} options.isAuthenticated - Si el usuario está autenticado
 * @param {boolean} options.isAdmin - Si el usuario es admin
 * @param {boolean} options.isModerator - Si el usuario es moderador
 * @param {Function} options.showToast - Función para mostrar notificaciones
 * @param {Function} options.validateForm - Función de validación del formulario
 * @param {Function} options.setShowAuthModal - Función para mostrar modal de auth
 * @returns {Object} Estado y funciones de submit
 */
const useEventSubmit = ({
  user,
  isAuthenticated,
  isAdmin,
  isModerator,
  showToast,
  validateForm,
  setShowAuthModal,
}) => {
  const navigate = useNavigate();

  // Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Refs para evitar problemas de timing y dependencias
  const showToastRef = useRef(showToast);
  const isSubmittingRef = useRef(false); // Para proteger contra double-submit
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Mantener refs actualizadas
  const updateRefs = useCallback((newShowToast) => {
    showToastRef.current = newShowToast;
  }, []);

  // Actualizar ref de showToast cuando cambie (sin causar re-renders)
  if (showToast !== showToastRef.current) {
    showToastRef.current = showToast;
  }

  /**
   * Sube imágenes secuencialmente con control de errores
   * @param {File[]} images - Array de archivos de imagen
   * @param {string} userId - ID del usuario
   * @returns {Promise<string[]>} URLs de las imágenes subidas
   */
  const uploadImages = useCallback(async (images, userId) => {
    const uploadedUrls = [];
    setUploadProgress({ current: 0, total: images.length });

    for (let i = 0; i < images.length; i++) {
      // Verificar si se debe abortar
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Upload cancelled");
      }

      const file = images[i];

      try {
        const url = await uploadEventImage(file, userId);
        uploadedUrls.push(url);

        if (isMountedRef.current) {
          setUploadProgress({ current: i + 1, total: images.length });
        }
      } catch (error) {
        console.error(`Error subiendo imagen ${i + 1}:`, error);
        throw new Error(`Error al subir la imagen ${file.name}`);
      }
    }

    return uploadedUrls;
  }, []);

  /**
   * Prepara los datos del evento para envío
   * @param {Object} formData - Datos del formulario
   * @param {string[]} allImageUrls - Todas las URLs de imágenes
   * @returns {Object} Datos del evento formateados
   */
  const prepareEventData = useCallback(
    (formData, allImageUrls) => {
      // Limpiar redes sociales (eliminar valores vacíos)
      const redesLimpias = {};
      Object.entries(formData.redes_sociales || {}).forEach(([key, value]) => {
        if (value && value.trim()) {
          redesLimpias[key] = value.trim();
        }
      });

      return {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        titulo_marketing: formData.titulo_marketing?.trim() || null,
        mensaje_marketing: formData.mensaje_marketing?.trim() || null,
        titulo_marketing_2: formData.titulo_marketing_2?.trim() || null,
        mensaje_marketing_2: formData.mensaje_marketing_2?.trim() || null,
        organizador:
          formData.organizador.trim() ||
          user?.user_metadata?.full_name ||
          "Organizador",
        category_id: parseInt(formData.category_id),
        fecha_evento: formData.fecha_evento,
        fecha_fin: formData.es_multidia
          ? formData.fecha_fin
          : formData.fecha_evento,
        es_multidia: formData.es_multidia,
        mismo_horario: formData.mismo_horario,
        hora_inicio: formData.hora_inicio || null,
        hora_fin: formData.hora_fin || null,
        provincia: formData.provincia,
        comuna: formData.comuna.trim(),
        direccion: formData.direccion.trim(),
        ubicacion_url: formData.ubicacion_url?.trim() || null,
        tipo_entrada: formData.tipo_entrada,
        precio:
          formData.tipo_entrada === "pagado" ? parseInt(formData.precio) : null,
        url_venta: formData.url_venta?.trim() || null,
        telefono_contacto: formData.telefono_contacto?.trim() || null,
        sitio_web: formData.sitio_web?.trim() || null,
        hashtags: formData.hashtags?.trim() || null,
        etiqueta_directa: formData.etiqueta_directa?.trim() || null,
        redes_sociales: redesLimpias,
        imagenes: allImageUrls,
      };
    },
    [user],
  );

  /**
   * Maneja el envío del formulario
   * @param {Object} options - Opciones de submit
   * @param {Object} options.formData - Datos del formulario
   * @param {string[]} options.existingImages - URLs de imágenes existentes
   * @param {string|null} options.editEventId - ID del evento si estamos editando
   * @param {string|null} options.currentDraftId - ID del borrador actual
   * @param {Function} options.onSuccess - Callback en caso de éxito
   * @returns {Promise<boolean>} true si fue exitoso
   */
  const handleSubmit = useCallback(
    async ({
      formData,
      existingImages = [],
      editEventId = null,
      currentDraftId = null,
      onSuccess,
    }) => {
      // === PROTECCIÓN CONTRA DOUBLE-SUBMIT ===
      if (isSubmittingRef.current) {
        console.warn("Submit ya en progreso, ignorando...");
        return false;
      }

      // === VERIFICACIÓN DE AUTENTICACIÓN ===
      if (!isAuthenticated) {
        setShowAuthModal?.(true);
        return false;
      }

      // Capturar valores actuales de auth para usar durante todo el submit
      // Esto previene problemas si el usuario se desloguea durante el proceso
      const currentUser = user;
      const currentIsAdmin = isAdmin;
      const currentIsModerator = isModerator;

      if (!currentUser?.id) {
        showToastRef.current?.("Error: Usuario no válido", "error");
        return false;
      }

      // === VALIDACIÓN DEL FORMULARIO ===
      if (!validateForm?.()) {
        showToastRef.current?.(
          "Por favor completa todos los campos obligatorios",
          "error",
        );
        return false;
      }

      // === INICIO DEL SUBMIT ===
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      isMountedRef.current = true;

      // Crear AbortController para poder cancelar
      abortControllerRef.current = new AbortController();

      try {
        // 1. SUBIR NUEVAS IMÁGENES
        let newImageUrls = [];
        if (formData.imagenes && formData.imagenes.length > 0) {
          newImageUrls = await uploadImages(formData.imagenes, currentUser.id);
        }

        // Verificar si se canceló durante la subida
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Operación cancelada");
        }

        // 2. COMBINAR IMÁGENES
        const allImageUrls = [...existingImages, ...newImageUrls];

        // 3. PREPARAR DATOS DEL EVENTO
        const eventData = prepareEventData(formData, allImageUrls);

        // 4. CREAR O ACTUALIZAR EVENTO
        const isEditing = !!editEventId;

        if (isEditing) {
          // === ACTUALIZAR EVENTO EXISTENTE ===
          await updateEvent(editEventId, eventData);

          if (isMountedRef.current) {
            showToastRef.current?.(
              "¡Publicación actualizada exitosamente!",
              "success",
            );
          }
        } else {
          // === CREAR NUEVO EVENTO ===
          eventData.user_id = currentUser.id;

          // Admins y Moderadores publican directamente
          const canPublishDirectly = currentIsAdmin || currentIsModerator;
          eventData.estado = canPublishDirectly ? "publicado" : "pendiente";

          await createEvent(eventData);

          if (isMountedRef.current) {
            showToastRef.current?.(
              canPublishDirectly
                ? "¡Publicación creada y publicada exitosamente!"
                : "¡Evento creado exitosamente! Será revisado pronto.",
              "success",
            );
          }
        }

        // 5. ELIMINAR BORRADOR SI EXISTE
        if (currentDraftId && currentUser.id) {
          try {
            await deleteDraft(currentDraftId, currentUser.id);
          } catch (draftError) {
            console.warn("No se pudo eliminar el borrador:", draftError);
            // No fallar el submit por esto
          }
        }

        // 6. CALLBACK DE ÉXITO
        if (onSuccess && isMountedRef.current) {
          onSuccess();
        }

        // 7. REDIRECCIÓN
        if (isMountedRef.current) {
          const redirectPath =
            currentIsAdmin || currentIsModerator ? "/admin" : "/perfil";
          navigate(redirectPath);
        }

        return true;
      } catch (error) {
        // Ignorar errores de abort
        if (
          error.name === "AbortError" ||
          error.message === "Operación cancelada"
        ) {
          console.log("Submit cancelado");
          return false;
        }

        console.error("Error en submit:", error);

        if (isMountedRef.current) {
          const errorMessage =
            error?.message ||
            `Error al ${editEventId ? "actualizar" : "crear"} el evento. Intenta nuevamente.`;
          showToastRef.current?.(errorMessage, "error");
        }

        return false;
      } finally {
        // === LIMPIEZA GARANTIZADA ===
        isSubmittingRef.current = false;

        if (isMountedRef.current) {
          setIsSubmitting(false);
          setUploadProgress({ current: 0, total: 0 });
        }
      }
    },
    [
      isAuthenticated,
      user,
      isAdmin,
      isModerator,
      validateForm,
      setShowAuthModal,
      uploadImages,
      prepareEventData,
      navigate,
    ],
  );

  /**
   * Cancela el submit en progreso
   */
  const cancelSubmit = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Cleanup function para usar en useEffect del componente padre
   */
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    cancelSubmit();
  }, [cancelSubmit]);

  return {
    // Estados
    isSubmitting,
    uploadProgress,

    // Acciones
    handleSubmit,
    cancelSubmit,
    cleanup,
    updateRefs,
  };
};

export default useEventSubmit;
