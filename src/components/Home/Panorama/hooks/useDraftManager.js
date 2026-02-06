import { useState, useCallback, useEffect, useRef } from "react";
import { saveDraft, deleteDraft } from "../../../../lib/database";

/**
 * Hook especializado para manejo de borradores
 *
 * CARACTERÍSTICAS:
 * - Auto-guardado con debounce configurable
 * - Carga desde sessionStorage
 * - Limpieza automática al publicar
 * - Recuperación de errores
 * - Estado de guardado visible
 *
 * PROTECCIONES:
 * - Debounce para evitar exceso de guardados
 * - Cleanup al desmontar
 * - Manejo seguro de sessionStorage
 * - Retry automático en errores transitorios
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.userId - ID del usuario
 * @param {boolean} options.isAuthenticated - Si el usuario está autenticado
 * @param {Function} options.showToast - Función para mostrar notificaciones
 * @param {number} options.autoSaveDelay - Delay en ms para auto-guardado (0 = desactivado)
 * @returns {Object} Estado y funciones de borradores
 */
const useDraftManager = (options = {}) => {
  const {
    userId = null,
    isAuthenticated = false,
    showToast = null,
    autoSaveDelay = 0, // 0 = sin auto-guardado, 30000 = cada 30 segundos con cambios
  } = options;

  // Estado
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loadedDraft, setLoadedDraft] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const showToastRef = useRef(showToast);
  const autoSaveTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Mantener refs actualizadas
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  /**
   * Carga un borrador desde sessionStorage
   * @returns {Object|null} Datos del borrador o null
   */
  const loadFromStorage = useCallback(() => {
    try {
      const draftJson = sessionStorage.getItem("draftToLoad");
      if (!draftJson) return null;

      const draft = JSON.parse(draftJson);
      if (!draft || !draft.data) return null;

      // Limpiar sessionStorage inmediatamente
      sessionStorage.removeItem("draftToLoad");

      // Guardar referencia al ID
      setCurrentDraftId(draft.id);
      setLoadedDraft(draft);

      return draft;
    } catch (error) {
      console.error("Error cargando borrador de storage:", error);
      return null;
    }
  }, []);

  /**
   * Guarda el borrador actual
   * @param {Object} formData - Datos del formulario
   * @param {Object} options - Opciones adicionales
   * @param {string} options.categoryName - Nombre de la categoría
   * @param {string} options.imagePreview - Imagen de preview en base64
   * @param {number} options.imageCount - Cantidad de imágenes
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  const saveDraftData = useCallback(
    async (
      formData,
      { categoryName = "", imagePreview = null, imageCount = 0 } = {},
    ) => {
      if (!isAuthenticated || !userId) {
        showToastRef.current?.(
          "Debes iniciar sesión para guardar borradores",
          "warning",
        );
        return false;
      }

      // Validar que haya datos suficientes
      const hasMinData =
        formData.titulo || formData.descripcion || formData.category_id;
      if (!hasMinData) {
        showToastRef.current?.(
          "Agrega al menos un título o descripción para guardar",
          "warning",
        );
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const draftPayload = {
          userId,
          tipo: "evento",
          data: {
            ...formData,
            categoria_nombre: categoryName,
            cantidad_imagenes: imageCount,
          },
          id: currentDraftId, // null si es nuevo
          imagenPreview: imagePreview,
        };

        const savedDraft = await saveDraft(draftPayload);

        if (!isMountedRef.current) return false;

        setCurrentDraftId(savedDraft.id);
        setLastSaved(new Date());
        retryCountRef.current = 0;

        showToastRef.current?.("Borrador guardado", "success");
        return true;
      } catch (error) {
        console.error("Error guardando borrador:", error);

        if (!isMountedRef.current) return false;

        setError(error.message || "Error al guardar borrador");

        // Retry automático (máximo 2 intentos)
        if (retryCountRef.current < 2) {
          retryCountRef.current++;
          console.log(
            `Reintentando guardar borrador (intento ${retryCountRef.current})`,
          );

          // Esperar un poco antes de reintentar
          await new Promise((r) => setTimeout(r, 1500));

          if (isMountedRef.current) {
            return saveDraftData(formData, {
              categoryName,
              imagePreview,
              imageCount,
            });
          }
        }

        showToastRef.current?.("Error al guardar el borrador", "error");
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [isAuthenticated, userId, currentDraftId],
  );

  /**
   * Programa un auto-guardado
   * @param {Object} formData - Datos del formulario
   * @param {Object} additionalData - Datos adicionales
   */
  const scheduleAutoSave = useCallback(
    (formData, additionalData = {}) => {
      if (autoSaveDelay <= 0) return;

      // Guardar datos pendientes
      pendingDataRef.current = { formData, additionalData };

      // Cancelar timer anterior
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Programar nuevo guardado
      autoSaveTimerRef.current = setTimeout(() => {
        if (pendingDataRef.current && isMountedRef.current) {
          const { formData, additionalData } = pendingDataRef.current;
          saveDraftData(formData, additionalData);
          pendingDataRef.current = null;
        }
      }, autoSaveDelay);
    },
    [autoSaveDelay, saveDraftData],
  );

  /**
   * Elimina el borrador actual
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  const deleteCurrentDraft = useCallback(async () => {
    if (!currentDraftId || !userId) return false;

    try {
      await deleteDraft(currentDraftId, userId);

      if (!isMountedRef.current) return true;

      setCurrentDraftId(null);
      setLastSaved(null);
      setLoadedDraft(null);

      return true;
    } catch (error) {
      console.warn("Error eliminando borrador:", error);
      // No mostrar toast para esto, es operación secundaria
      return false;
    }
  }, [currentDraftId, userId]);

  /**
   * Elimina el borrador después de publicar exitosamente
   * No muestra errores al usuario (es operación de limpieza)
   */
  const cleanupAfterPublish = useCallback(async () => {
    if (!currentDraftId || !userId) return;

    try {
      await deleteDraft(currentDraftId, userId);
      console.log("Borrador eliminado tras publicar");
    } catch (error) {
      console.warn("No se pudo eliminar el borrador:", error);
      // Silencioso - no afecta al usuario
    } finally {
      if (isMountedRef.current) {
        setCurrentDraftId(null);
        setLastSaved(null);
      }
    }
  }, [currentDraftId, userId]);

  /**
   * Cancela auto-guardado pendiente
   */
  const cancelAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    pendingDataRef.current = null;
  }, []);

  /**
   * Resetea el estado del draft manager
   */
  const reset = useCallback(() => {
    cancelAutoSave();
    setCurrentDraftId(null);
    setLastSaved(null);
    setLoadedDraft(null);
    setError(null);
    retryCountRef.current = 0;
  }, [cancelAutoSave]);

  return {
    // Estado
    currentDraftId,
    isSaving,
    lastSaved,
    loadedDraft,
    error,

    // Acciones
    loadFromStorage,
    saveDraftData,
    deleteCurrentDraft,
    cleanupAfterPublish,
    scheduleAutoSave,
    cancelAutoSave,
    reset,

    // Computed
    hasDraft: !!currentDraftId,
  };
};

export default useDraftManager;
