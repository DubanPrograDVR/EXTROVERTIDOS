import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { getCategories } from "../../../../lib/database";
import { supabase } from "../../../../lib/supabase";
import { INITIAL_FORM_STATE } from "../constants";

// Hooks especializados
import useFormValidation from "./useFormValidation";
import useImageManager from "./useImageManager";
import useDraftManager from "./useDraftManager";
import useEventEditor from "./useEventEditor";
import useEventSubmit from "./useEventSubmit";

/**
 * Hook principal para el formulario de publicación de eventos
 *
 * ARQUITECTURA MODULAR:
 * Este hook orquesta varios hooks especializados:
 * - useFormValidation: Validación de campos
 * - useImageManager: Gestión de imágenes
 * - useDraftManager: Borradores
 * - useEventEditor: Carga de eventos para edición
 * - useEventSubmit: Envío del formulario
 *
 * PROTECCIONES:
 * - AbortController para operaciones cancelables
 * - Refs estables para funciones de callback
 * - Cleanup automático al desmontar
 * - Detección de sesión expirada
 * - Protección contra double-submit
 *
 * ESCALABILIDAD:
 * - Fácil de extender con nuevos campos
 * - Validación declarativa via schema
 * - Hooks independientes y testeables
 *
 * @returns {Object} Estado y funciones del formulario
 */
const usePublicarFormV2 = () => {
  const LOCAL_DRAFT_KEY = "publicar_local_draft_v1";

  // === CONTEXTO Y NAVEGACIÓN ===
  const {
    user,
    isAuthenticated,
    isAdmin,
    isModerator,
    signInWithGoogle,
    showToast,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // === REFS ESTABLES ===
  const showToastRef = useRef(showToast);
  const isMountedRef = useRef(true);

  // Mantener refs actualizadas
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // === ESTADO DEL FORMULARIO ===
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // === HOOKS ESPECIALIZADOS ===

  // Hook de validación
  const {
    errors,
    validateForm,
    clearFieldError,
    clearAllErrors,
    setFieldError,
    touchField,
    validateFieldDebounced,
  } = useFormValidation();

  // Hook de imágenes
  const {
    newImages,
    existingImages,
    previewUrls,
    error: imageError,
    isCompressing,
    addImages,
    removeImage: removeImageFromManager,
    clearAllImages,
    setExistingImages,
    imageToBase64,
    totalImages,
    remainingSlots,
  } = useImageManager();

  // Hook de borradores
  const draftManager = useDraftManager({
    userId: user?.id,
    isAuthenticated,
    showToast,
  });

  // Hook de edición
  const {
    isEditing,
    editEventId,
    loadingEvent,
    eventFormData,
    existingImages: editorExistingImages,
    resetEditState,
  } = useEventEditor({
    user,
    isAuthenticated,
    isAdmin,
    showToast,
  });

  // Ref estable para formData (evita recrear validateFormForSubmit en cada keystroke)
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const existingImagesLenRef = useRef(existingImages.length);
  existingImagesLenRef.current = existingImages.length;

  const newImagesLenRef = useRef(newImages.length);
  newImagesLenRef.current = newImages.length;

  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;

  const hasSessionDraftRef = useRef(false);
  const localDraftLoadedRef = useRef(false);

  const buildLocalDraftData = useCallback((data) => {
    if (!data) return null;
    const { imagenes, ...rest } = data;
    return { ...rest, imagenes: [] };
  }, []);

  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch (error) {
      console.warn("Error limpiando local draft:", error);
    }
  }, [LOCAL_DRAFT_KEY]);

  const persistLocalDraft = useCallback(
    (data) => {
      try {
        localStorage.setItem(
          LOCAL_DRAFT_KEY,
          JSON.stringify({ data, savedAt: Date.now() }),
        );
      } catch (error) {
        console.warn("Error guardando local draft:", error);
      }
    },
    [LOCAL_DRAFT_KEY],
  );

  // Función de validación para el submit hook
  // Usa refs para evitar recrearse en cada cambio de formData
  const validateFormForSubmit = useCallback(() => {
    const result = validateForm(formDataRef.current, {
      checkImages: true,
      existingImagesCount: existingImagesLenRef.current,
      newImagesCount: newImagesLenRef.current,
      isEditing: isEditingRef.current,
    });
    return result.isValid;
  }, [validateForm]);

  // Hook de submit
  const {
    isSubmitting,
    uploadProgress,
    handleSubmit: submitEvent,
    cancelSubmit,
    cleanup: cleanupSubmit,
  } = useEventSubmit({
    user,
    isAuthenticated,
    isAdmin,
    isModerator,
    showToast,
    validateForm: validateFormForSubmit,
    setShowAuthModal,
  });

  // === CARGA INICIAL DE CATEGORÍAS ===
  useEffect(() => {
    let isCancelled = false;

    // Safety timeout: si getCategories() nunca resuelve (ej: conexión
    // degradada tras cambio de pestaña), asegurar que loadingCategories
    // se ponga en false para no bloquear el formulario indefinidamente.
    const safetyTimer = setTimeout(() => {
      if (!isCancelled && isMountedRef.current) {
        setLoadingCategories(false);
      }
    }, 10000); // 10 s máximo

    const loadCategories = async () => {
      try {
        // Añadir timeout a la query para evitar que quede colgada
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout cargando categorías")),
            8000,
          ),
        );
        const data = await Promise.race([getCategories(), timeoutPromise]);
        if (!isCancelled && isMountedRef.current) {
          setCategories(data || []);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
        if (!isCancelled && isMountedRef.current) {
          showToastRef.current?.("Error al cargar categorías", "error");
        }
      } finally {
        clearTimeout(safetyTimer);
        if (!isCancelled && isMountedRef.current) {
          setLoadingCategories(false);
        }
      }
    };

    loadCategories();
    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Ref estable para loadFromStorage (evitar dependencia inestable)
  const loadFromStorageRef = useRef(draftManager.loadFromStorage);
  loadFromStorageRef.current = draftManager.loadFromStorage;

  // === CARGAR BORRADOR DESDE STORAGE ===
  useEffect(() => {
    const draft = loadFromStorageRef.current();
    if (draft?.data) {
      hasSessionDraftRef.current = true;
      setFormData((prev) => ({
        ...prev,
        ...draft.data,
        imagenes: [], // Las imágenes se manejan separadamente
      }));

      // Cargar preview de imágenes si existe
      if (draft.data.imagenes_preview?.length > 0) {
        // Las imágenes del borrador son URLs o base64
        // No las cargamos como nuevas imágenes, solo como preview
      }

      showToastRef.current?.("Borrador cargado exitosamente", "success");
    }
  }, []); // Solo ejecutar al montar

  // === CARGAR AUTO-GUARDADO LOCAL ===
  useEffect(() => {
    if (localDraftLoadedRef.current) return;
    if (isEditing) {
      localDraftLoadedRef.current = true;
      return;
    }
    if (hasSessionDraftRef.current) {
      localDraftLoadedRef.current = true;
      return;
    }
    if (draftManager.loadedDraft?.data) {
      localDraftLoadedRef.current = true;
      return;
    }

    try {
      const localDraftJson = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!localDraftJson) {
        localDraftLoadedRef.current = true;
        return;
      }

      const localDraft = JSON.parse(localDraftJson);
      if (localDraft?.data) {
        setFormData((prev) => ({
          ...prev,
          ...localDraft.data,
          imagenes: [],
        }));
      }
    } catch (error) {
      console.warn("Error cargando local draft:", error);
    } finally {
      localDraftLoadedRef.current = true;
    }
  }, [isEditing, draftManager.loadedDraft, LOCAL_DRAFT_KEY]);

  // === SINCRONIZAR DATOS DE EVENTO EN EDICIÓN ===
  useEffect(() => {
    if (eventFormData) {
      setFormData({
        ...INITIAL_FORM_STATE,
        ...eventFormData,
      });
    }
  }, [eventFormData]);

  // === AUTO-GUARDADO LOCAL ===
  useEffect(() => {
    if (isEditing) return;

    const hasMinData =
      formData.titulo || formData.descripcion || formData.category_id;

    if (!hasMinData) {
      clearLocalDraft();
      return;
    }

    const dataToSave = buildLocalDraftData(formData);
    if (!dataToSave) return;

    const saveTimer = setTimeout(() => {
      persistLocalDraft(dataToSave);
    }, 300);

    return () => clearTimeout(saveTimer);
  }, [
    formData,
    isEditing,
    buildLocalDraftData,
    clearLocalDraft,
    persistLocalDraft,
  ]);

  // === GUARDAR SNAPSHOT ANTES DE SALIR ===
  useEffect(() => {
    const handleSnapshot = () => {
      if (isEditingRef.current) return;

      const currentData = buildLocalDraftData(formDataRef.current);
      if (!currentData) return;

      const hasMinData =
        currentData.titulo ||
        currentData.descripcion ||
        currentData.category_id;

      if (!hasMinData) {
        clearLocalDraft();
        return;
      }

      persistLocalDraft(currentData);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSnapshot();
      }
    };

    window.addEventListener("beforeunload", handleSnapshot);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleSnapshot);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [buildLocalDraftData, clearLocalDraft, persistLocalDraft]);

  // Sincronizar imágenes existentes desde editor
  useEffect(() => {
    if (editorExistingImages?.length > 0) {
      setExistingImages(editorExistingImages);
    }
  }, [editorExistingImages, setExistingImages]);

  // === HANDLERS ===

  /**
   * Verifica autenticación al enfocar campos
   */
  const handleFieldFocus = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  /**
   * Login con Google
   */
  const handleGoogleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        showToastRef.current?.("Error al iniciar sesión con Google", "error");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMountedRef.current) {
        setIsGoogleLoading(false);
      }
    }
  }, [signInWithGoogle]);

  /**
   * Maneja cambios en inputs del formulario
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type } = e.target;

      // Manejar checkboxes
      if (type === "checkbox") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
        return;
      }

      // Manejar redes sociales (campos anidados)
      if (name.startsWith("redes_")) {
        const socialNetwork = name.replace("redes_", "");
        setFormData((prev) => ({
          ...prev,
          redes_sociales: {
            ...prev.redes_sociales,
            [socialNetwork]: value,
          },
        }));
        clearFieldError(name);
        return;
      }

      // Actualizar campo normal
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };

        // Lógica especial para provincia -> comuna
        if (name === "provincia") {
          newData.comuna = "";
        }

        // Lógica especial para fecha_evento -> fecha_fin
        if (name === "fecha_evento" && prev.fecha_fin) {
          if (new Date(value) > new Date(prev.fecha_fin)) {
            newData.fecha_fin = "";
          }
        }

        return newData;
      });

      // Limpiar error del campo
      clearFieldError(name);
    },
    [clearFieldError],
  );

  /**
   * Maneja cambio de imágenes
   */
  const handleImageChange = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files?.length) return;

      const result = await addImages(files);

      if (result.errors?.length > 0) {
        setFieldError("imagenes", result.errors[0]);
      } else {
        clearFieldError("imagenes");
      }
    },
    [addImages, setFieldError, clearFieldError],
  );

  /**
   * Elimina una imagen
   */
  const handleRemoveImage = useCallback(
    (index) => {
      removeImageFromManager(index);
      clearFieldError("imagenes");
    },
    [removeImageFromManager, clearFieldError],
  );

  // Refs estables para propiedades de draftManager (evitar obj inestable en deps)
  const draftCurrentIdRef = useRef(draftManager.currentDraftId);
  const draftCleanupRef = useRef(draftManager.cleanupAfterPublish);
  const draftResetRef = useRef(draftManager.reset);
  const draftSaveRef = useRef(draftManager.saveDraftData);
  draftCurrentIdRef.current = draftManager.currentDraftId;
  draftCleanupRef.current = draftManager.cleanupAfterPublish;
  draftResetRef.current = draftManager.reset;
  draftSaveRef.current = draftManager.saveDraftData;

  /**
   * Guarda borrador manualmente
   */
  const handleSaveDraft = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }

    const selectedCategory = categories.find(
      (c) => c.id === parseInt(formData.category_id),
    );

    // Obtener preview de imagen
    let imagePreview = null;
    if (previewUrls.length > 0) {
      imagePreview = await imageToBase64(previewUrls[0]);
    }

    return draftSaveRef.current?.(formData, {
      categoryName: selectedCategory?.nombre || "",
      imagePreview,
      imageCount: totalImages,
    });
  }, [
    isAuthenticated,
    categories,
    formData,
    previewUrls,
    imageToBase64,
    totalImages,
  ]);

  /**
   * Resetea el formulario
   */
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    clearAllImages();
    clearAllErrors();
    draftResetRef.current?.();
    resetEditState();
  }, [clearAllImages, clearAllErrors, resetEditState]);

  /**
   * Envía el formulario
   */
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      // Preparar datos para submit
      const submitResult = await submitEvent({
        formData: {
          ...formData,
          imagenes: newImages,
        },
        existingImages,
        editEventId,
        currentDraftId: draftCurrentIdRef.current,
        onSuccess: () => {
          // Limpiar después de éxito
          resetForm();
          draftCleanupRef.current?.();
          clearLocalDraft();
        },
      });

      return submitResult;
    },
    [
      formData,
      newImages,
      existingImages,
      editEventId,
      submitEvent,
      resetForm,
      clearLocalDraft,
    ],
  );

  /**
   * Cierra modal de autenticación
   */
  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  // === COMPUTED VALUES ===

  // Combinar errores del formulario y de imágenes
  const allErrors = useMemo(
    () => ({
      ...errors,
      ...(imageError ? { imagenes: imageError } : {}),
    }),
    [errors, imageError],
  );

  // Estado de carga combinado
  const isLoading = loadingCategories || loadingEvent;

  // === CLEANUP AL DESMONTAR ===
  useEffect(() => {
    return () => {
      // Solo cancelar requests en vuelo, no llamar cleanupSubmit
      // ya que useEventSubmit maneja su propio isMountedRef via useEffect
      cancelSubmit();
    };
  }, [cancelSubmit]);

  // === RETORNO ===
  return {
    // Estado del formulario
    formData,
    categories,
    errors: allErrors,

    // Estados de carga
    loadingCategories,
    loadingEvent,
    isLoading,
    isSubmitting,
    isCompressing,
    isSavingDraft: draftManager.isSaving,
    isGoogleLoading,

    // Estado de edición
    isEditing,
    editEventId,

    // Estado de imágenes
    previewImages: previewUrls,
    uploadProgress,
    totalImages,
    remainingSlots,

    // Estado de UI
    showAuthModal,

    // Estado de borradores
    currentDraftId: draftManager.currentDraftId,
    lastSaved: draftManager.lastSaved,

    // Handlers principales
    handleFieldFocus,
    handleGoogleLogin,
    handleChange,
    handleImageChange,
    removeImage: handleRemoveImage,
    handleSubmit,
    handleSaveDraft,
    closeAuthModal,
    resetForm,

    // Validación
    touchField,
    validateFieldDebounced,

    // Cancelación
    cancelSubmit,
  };
};

export default usePublicarFormV2;
