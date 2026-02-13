import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";
import {
  createBusiness,
  uploadBusinessImage,
  saveDraft,
  deleteDraft,
} from "../../../../../lib/database";
import { INITIAL_FORM_STATE, IMAGE_CONFIG } from "../constants";
import { BUSINESS_CATEGORIES } from "../../../../Superguia/businessCategories";

const LOCAL_DRAFT_KEY = "negocio_local_draft_v1";

/**
 * Hook personalizado para manejar el formulario de publicar negocio
 */
export const useNegocioForm = () => {
  const { user, isAuthenticated, isAdmin, showToast } = useAuth();
  const navigate = useNavigate();

  // Estados - Categorías cargadas desde archivo local
  const [categories] = useState(BUSINESS_CATEGORIES);
  const [loadingCategories] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Borrador
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Subcategorías derivadas de la categoría seleccionada
  const subcategorias = formData.category_id
    ? BUSINESS_CATEGORIES.find((c) => c.id === parseInt(formData.category_id))
        ?.subcategorias || []
    : [];

  // === CARGAR AUTO-GUARDADO LOCAL al montar ===
  useEffect(() => {
    try {
      const localDraftJson = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!localDraftJson) return;

      const localDraft = JSON.parse(localDraftJson);
      if (localDraft?.data) {
        setFormData((prev) => ({
          ...prev,
          ...localDraft.data,
          imagenes: [], // Las imágenes no se persisten
        }));
      }
    } catch (error) {
      console.warn("Error cargando local draft negocio:", error);
    }
  }, []);

  // === AUTO-GUARDADO LOCAL cuando cambian los datos ===
  useEffect(() => {
    const hasMinData =
      formData.nombre || formData.descripcion || formData.category_id;

    if (!hasMinData) {
      try {
        localStorage.removeItem(LOCAL_DRAFT_KEY);
      } catch {}
      return;
    }

    const { imagenes, ...dataToSave } = formData;
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          LOCAL_DRAFT_KEY,
          JSON.stringify({
            data: { ...dataToSave, imagenes: [] },
            savedAt: Date.now(),
          }),
        );
      } catch (error) {
        console.warn("Error guardando local draft negocio:", error);
      }
    }, 300);

    return () => clearTimeout(saveTimer);
  }, [formData]);

  // === SNAPSHOT ANTES DE SALIR ===
  useEffect(() => {
    const handleSnapshot = () => {
      const currentData = formDataRef.current;
      const hasMinData =
        currentData.nombre ||
        currentData.descripcion ||
        currentData.category_id;

      if (!hasMinData) {
        try {
          localStorage.removeItem(LOCAL_DRAFT_KEY);
        } catch {}
        return;
      }

      const { imagenes, ...dataToSave } = currentData;
      try {
        localStorage.setItem(
          LOCAL_DRAFT_KEY,
          JSON.stringify({
            data: { ...dataToSave, imagenes: [] },
            savedAt: Date.now(),
          }),
        );
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleSnapshot();
    };

    window.addEventListener("beforeunload", handleSnapshot);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleSnapshot);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch {}
  }, []);

  // Verificar autenticación al hacer foco en campos
  const handleFieldFocus = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  // Manejar cambios en inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // Manejar campos anidados (redes_sociales)
    if (name.startsWith("redes_")) {
      const socialNetwork = name.replace("redes_", "");
      setFormData((prev) => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialNetwork]: value,
        },
      }));
    } else {
      setFormData((prev) => {
        const updates = { ...prev, [name]: value };
        // Al cambiar categoría, resetear subcategoría
        if (name === "category_id") {
          updates.subcategoria = "";
        }
        return updates;
      });
    }

    // Limpiar error del campo
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Manejar cambio de días de atención (toggle)
  const handleDiaChange = useCallback((dia) => {
    setFormData((prev) => {
      const isRemoving = prev.dias_atencion.includes(dia);
      const newDias = isRemoving
        ? prev.dias_atencion.filter((d) => d !== dia)
        : [...prev.dias_atencion, dia];

      // Limpiar horarios del día si se desmarca
      const newHorarios = { ...prev.horarios_detalle };
      if (isRemoving) {
        delete newHorarios[dia];
      }

      return {
        ...prev,
        dias_atencion: newDias,
        horarios_detalle: newHorarios,
      };
    });
  }, []);

  // Guardar horarios configurados desde el modal
  const handleSaveHorarios = useCallback((horarios, abierto24h) => {
    setFormData((prev) => ({
      ...prev,
      horarios_detalle: horarios,
      abierto_24h: abierto24h,
    }));
  }, []);

  // Manejar cambio de imágenes
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);

    setFormData((prev) => {
      if (prev.imagenes.length + files.length > IMAGE_CONFIG.maxFiles) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          imagenes: `Máximo ${IMAGE_CONFIG.maxFiles} imágenes permitidas`,
        }));
        return prev;
      }

      const validFiles = [];
      const newPreviews = [];

      for (const file of files) {
        if (file.size > IMAGE_CONFIG.maxSize) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            imagenes: `La imagen ${file.name} supera los 5MB`,
          }));
          continue;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setPreviewImages((prevPreviews) => [...prevPreviews, ...newPreviews]);
      setErrors((prevErrors) => ({ ...prevErrors, imagenes: "" }));

      return {
        ...prev,
        imagenes: [...prev.imagenes, ...validFiles],
      };
    });
  }, []);

  // Eliminar imagen
  const removeImage = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del negocio es obligatorio";
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Selecciona una categoría";
    }
    if (!formData.subcategoria) {
      newErrors.subcategoria = "Selecciona una subcategoría";
    }
    if (!formData.provincia) {
      newErrors.provincia = "Selecciona una provincia";
    }
    if (!formData.comuna.trim()) {
      newErrors.comuna = "La comuna es obligatoria";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
    }
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = "Sube al menos una imagen";
    }
    if (formData.dias_atencion.length === 0) {
      newErrors.horarios = "Selecciona al menos un día de atención";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setPreviewImages([]);
    setCurrentDraftId(null);
  }, []);

  // Guardar borrador en Supabase
  const handleSaveDraft = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }

    const hasMinData =
      formData.nombre || formData.descripcion || formData.category_id;
    if (!hasMinData) {
      if (showToast)
        showToast(
          "Agrega al menos un nombre o descripción para guardar",
          "warning",
        );
      return false;
    }

    setIsSavingDraft(true);
    try {
      const selectedCategory = categories.find(
        (c) => c.id === parseInt(formData.category_id),
      );

      const { imagenes, ...dataWithoutImages } = formData;

      const savedDraft = await saveDraft({
        userId: user.id,
        tipo: "negocio",
        data: {
          ...dataWithoutImages,
          categoria_nombre: selectedCategory?.nombre || "",
        },
        id: currentDraftId,
      });

      setCurrentDraftId(savedDraft.id);
      if (showToast) showToast("Borrador guardado", "success");
      return true;
    } catch (error) {
      console.error("Error guardando borrador:", error);
      if (showToast) showToast("Error al guardar el borrador", "error");
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  }, [isAuthenticated, formData, categories, user, currentDraftId, showToast]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }

      if (!validateForm()) {
        if (showToast)
          showToast(
            "Por favor completa todos los campos obligatorios",
            "error",
          );
        return;
      }

      setIsSubmitting(true);

      try {
        // 1. Subir imágenes
        const imageUrls = [];
        for (const file of formData.imagenes) {
          const url = await uploadBusinessImage(file, user.id);
          imageUrls.push(url);
        }

        // 2. Preparar datos del negocio
        // Si es admin, se publica automáticamente sin revisión

        // Construir JSONB de horarios para la BD
        const horarios = {};
        if (formData.abierto_24h) {
          horarios.abierto_24h = true;
        }
        formData.dias_atencion.forEach((dia) => {
          horarios[dia] = formData.horarios_detalle[dia] || [
            { apertura: "09:00", cierre: "18:00" },
          ];
        });

        // Resolver nombre de categoría desde el ID local
        const selectedCat = BUSINESS_CATEGORIES.find(
          (c) => c.id === parseInt(formData.category_id),
        );

        const businessData = {
          user_id: user.id,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          categoria: selectedCat?.nombre || null,
          subcategoria: formData.subcategoria || null,
          provincia: formData.provincia,
          comuna: formData.comuna.trim(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim(),
          email: formData.email.trim() || null,
          sitio_web: formData.sitio_web.trim() || null,
          horarios: Object.keys(horarios).length > 0 ? horarios : {},
          redes_sociales: formData.redes_sociales,
          // Mapear redes sociales a columnas individuales de la BD
          instagram: formData.redes_sociales.instagram?.trim() || null,
          facebook: formData.redes_sociales.facebook?.trim() || null,
          whatsapp: formData.redes_sociales.whatsapp?.trim() || null,
          tiktok: formData.redes_sociales.tiktok?.trim() || null,
          twitter: formData.redes_sociales.twitter?.trim() || null,
          youtube: formData.redes_sociales.youtube?.trim() || null,
          linkedin: formData.redes_sociales.linkedin?.trim() || null,
          ubicacion_url: formData.ubicacion_url.trim() || null,
          imagen_url: imageUrls[0] || null,
          imagenes: imageUrls,
          estado: isAdmin ? "publicado" : "pendiente",
          titulo_marketing: formData.titulo_marketing?.trim() || null,
          mensaje_marketing: formData.mensaje_marketing?.trim() || null,
          titulo_marketing_2: formData.titulo_marketing_2?.trim() || null,
          mensaje_marketing_2: formData.mensaje_marketing_2?.trim() || null,
        };

        // 3. Crear negocio en la BD
        await createBusiness(businessData);

        if (showToast)
          showToast(
            isAdmin
              ? "¡Negocio publicado exitosamente!"
              : "¡Negocio creado exitosamente! Será revisado pronto.",
            "success",
          );

        // Limpiar borrador de Supabase si existe
        if (currentDraftId && user?.id) {
          try {
            await deleteDraft(currentDraftId, user.id);
          } catch (draftError) {
            console.warn("No se pudo eliminar el borrador:", draftError);
          }
        }

        // Limpiar localStorage
        clearLocalDraft();

        // Resetear formulario
        resetForm();

        // Redirigir: admin siempre vuelve al panel, usuarios normales al perfil
        navigate(isAdmin ? "/admin" : "/perfil");
      } catch (error) {
        console.error("Error al crear negocio:", error);
        if (showToast) showToast("Error al crear el negocio", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isAuthenticated,
      isAdmin,
      formData,
      user,
      showToast,
      validateForm,
      resetForm,
      navigate,
      currentDraftId,
      clearLocalDraft,
    ],
  );

  return {
    // Estados
    formData,
    errors,
    categories,
    subcategorias,
    loadingCategories,
    isSubmitting,
    previewImages,
    showAuthModal,
    isSavingDraft,

    // Acciones
    handleChange,
    handleDiaChange,
    handleSaveHorarios,
    handleImageChange,
    removeImage,
    handleFieldFocus,
    handleSubmit,
    handleSaveDraft,
    setShowAuthModal,
  };
};
