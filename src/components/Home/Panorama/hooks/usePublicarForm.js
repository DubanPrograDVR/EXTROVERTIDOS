import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  getCategories,
  createEvent,
  uploadEventImage,
  getEventById,
  updateEvent,
  saveDraft,
  deleteDraft,
} from "../../../../lib/database";
import { INITIAL_FORM_STATE, IMAGE_CONFIG } from "../constants";

/**
 * Hook personalizado para manejar la lógica del formulario de publicación
 * Soporta creación y edición de eventos
 */
const usePublicarForm = () => {
  const { user, isAuthenticated, isAdmin, signInWithGoogle, showToast } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get("editar");
  const isEditing = !!editEventId;

  // Estados
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [existingImages, setExistingImages] = useState([]); // URLs de imágenes existentes en edición
  const [currentDraftId, setCurrentDraftId] = useState(null); // ID del borrador actual
  const [isSavingDraft, setIsSavingDraft] = useState(false); // Estado de guardado de borrador

  // Cargar categorías al montar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (error) {
        console.error("Error cargando categorías:", error);
        if (showToast) showToast("Error al cargar categorías", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [showToast]);

  // Cargar borrador desde sessionStorage si existe
  useEffect(() => {
    const loadDraftFromStorage = () => {
      try {
        const draftJson = sessionStorage.getItem("draftToLoad");
        if (!draftJson) return;

        const draft = JSON.parse(draftJson);
        if (!draft || !draft.data) return;

        // Limpiar sessionStorage inmediatamente
        sessionStorage.removeItem("draftToLoad");

        // Guardar el ID del borrador para eliminarlo al publicar
        setCurrentDraftId(draft.id);

        // Cargar datos del formulario
        const draftData = draft.data;
        setFormData({
          titulo: draftData.titulo || "",
          descripcion: draftData.descripcion || "",
          mensaje_marketing: draftData.mensaje_marketing || "",
          organizador: draftData.organizador || "",
          category_id: draftData.category_id || "",
          fecha_evento: draftData.fecha_evento || "",
          fecha_fin: draftData.fecha_fin || "",
          es_multidia: draftData.es_multidia || false,
          mismo_horario: draftData.mismo_horario !== false,
          hora_inicio: draftData.hora_inicio || "",
          hora_fin: draftData.hora_fin || "",
          provincia: draftData.provincia || "",
          comuna: draftData.comuna || "",
          direccion: draftData.direccion || "",
          tipo_entrada: draftData.tipo_entrada || "gratuito",
          precio: draftData.precio || "",
          url_venta: draftData.url_venta || "",
          redes_sociales: draftData.redes_sociales || {
            instagram: "",
            facebook: "",
            whatsapp: "",
            tiktok: "",
          },
          imagenes: [], // Las imágenes del borrador son previews, no archivos
        });

        // Cargar imágenes preview del borrador
        if (draftData.imagenes_preview?.length > 0) {
          setPreviewImages(draftData.imagenes_preview);
        }

        if (showToast) {
          showToast("Borrador cargado exitosamente", "success");
        }
      } catch (error) {
        console.error("Error cargando borrador:", error);
      }
    };

    loadDraftFromStorage();
  }, [showToast]);

  // Cargar evento si estamos editando
  useEffect(() => {
    const loadEventForEdit = async () => {
      if (!editEventId || !isAuthenticated) return;

      setLoadingEvent(true);
      try {
        const event = await getEventById(editEventId);
        if (!event) {
          showToast?.("No se encontró la publicación", "error");
          navigate("/");
          return;
        }

        // Solo admin o el autor pueden editar
        if (!isAdmin && event.user_id !== user?.id) {
          showToast?.(
            "No tienes permisos para editar esta publicación",
            "error",
          );
          navigate("/");
          return;
        }

        // Mapear datos del evento al formulario
        // Determinar si es multi-día basado en si tiene fecha_fin diferente a fecha_evento
        const esMultidia =
          event.fecha_fin && event.fecha_fin !== event.fecha_evento;

        setFormData({
          titulo: event.titulo || "",
          descripcion: event.descripcion || "",
          mensaje_marketing: event.mensaje_marketing || "",
          organizador: event.organizador || "",
          category_id: event.category_id || "",
          fecha_evento: event.fecha_evento || "",
          fecha_fin: event.fecha_fin || "",
          es_multidia: esMultidia,
          mismo_horario: event.mismo_horario !== false, // Por defecto true
          hora_inicio: event.hora_inicio || "",
          hora_fin: event.hora_fin || "",
          provincia: event.provincia || "",
          comuna: event.comuna || "",
          direccion: event.direccion || "",
          tipo_entrada: event.tipo_entrada || "gratuito",
          precio: event.precio || "",
          url_venta: event.url_venta || "",
          redes_sociales: event.redes_sociales || {
            instagram: "",
            facebook: "",
            whatsapp: "",
            tiktok: "",
          },
          imagenes: [], // Las nuevas imágenes se agregan aquí
        });

        // Guardar las imágenes existentes
        if (event.imagenes && event.imagenes.length > 0) {
          setExistingImages(event.imagenes);
          setPreviewImages(event.imagenes);
        }
      } catch (error) {
        console.error("Error cargando evento para editar:", error);
        showToast?.("Error al cargar la publicación", "error");
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEventForEdit();
  }, [editEventId, isAuthenticated, isAdmin, user?.id, navigate, showToast]);

  // Verificar autenticación al hacer foco en campos
  const handleFieldFocus = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        if (showToast) showToast("Error al iniciar sesión con Google", "error");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Manejar checkboxes (para es_multidia y mismo_horario)
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // El valor ya viene como boolean desde DateRangePicker
      }));
      return;
    }

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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Si cambia la provincia, limpiar la comuna seleccionada
      if (name === "provincia") {
        setFormData((prev) => ({
          ...prev,
          provincia: value,
          comuna: "", // Resetear comuna al cambiar provincia
        }));
      }

      // Si se cambia la fecha_evento y hay fecha_fin, validar que fecha_fin sea posterior
      if (name === "fecha_evento" && formData.fecha_fin) {
        if (new Date(value) > new Date(formData.fecha_fin)) {
          // Si la nueva fecha inicio es posterior a fecha fin, limpiar fecha fin
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            fecha_fin: "",
          }));
        }
      }
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Manejar cambio de imágenes (múltiples) - con limpieza de memory leaks
  const handleImageChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      const { maxFiles, maxSize } = IMAGE_CONFIG;

      // Validar cantidad total (existentes + nuevas + las que se van a agregar)
      const totalImages =
        existingImages.length + formData.imagenes.length + files.length;
      if (totalImages > maxFiles) {
        setErrors((prev) => ({
          ...prev,
          imagenes: `Máximo ${maxFiles} imágenes permitidas`,
        }));
        return;
      }

      // Validar tamaño y agregar
      const validFiles = [];
      const newPreviews = [];

      for (const file of files) {
        if (file.size > maxSize) {
          setErrors((prev) => ({
            ...prev,
            imagenes: `La imagen ${file.name} supera los 5MB (será comprimida automáticamente)`,
          }));
          // Ahora aceptamos archivos grandes porque serán comprimidos
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setFormData((prev) => ({
        ...prev,
        imagenes: [...prev.imagenes, ...validFiles],
      }));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
      setErrors((prev) => ({ ...prev, imagenes: "" }));
    },
    [existingImages.length, formData.imagenes.length],
  );

  // Eliminar imagen - con limpieza de Object URLs para evitar memory leaks
  const removeImage = useCallback(
    (index) => {
      // Determinar si es una imagen existente o una nueva
      const totalExisting = existingImages.length;

      if (index < totalExisting) {
        // Es una imagen existente (URL de Supabase, no necesita revocar)
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewImages((prev) => prev.filter((_, i) => i !== index));
      } else {
        // Es una imagen nueva (Object URL, revocar para liberar memoria)
        const newIndex = index - totalExisting;

        // Revocar Object URL para liberar memoria
        setPreviewImages((prev) => {
          const urlToRevoke = prev[index];
          if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
            URL.revokeObjectURL(urlToRevoke);
          }
          return prev.filter((_, i) => i !== index);
        });

        setFormData((prev) => ({
          ...prev,
          imagenes: prev.imagenes.filter((_, i) => i !== newIndex),
        }));
      }
    },
    [existingImages.length],
  );

  // Limpiar Object URLs al desmontar el componente
  useEffect(() => {
    return () => {
      // Cleanup: revocar todas las Object URLs al desmontar
      previewImages.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Selecciona una categoría";
    }
    if (!formData.fecha_evento) {
      newErrors.fecha_evento = "La fecha de inicio es obligatoria";
    }

    // Validaciones para eventos multi-día
    if (formData.es_multidia) {
      if (!formData.fecha_fin) {
        newErrors.fecha_fin =
          "La fecha de fin es obligatoria para eventos multi-día";
      } else if (
        new Date(formData.fecha_fin) < new Date(formData.fecha_evento)
      ) {
        newErrors.fecha_fin =
          "La fecha de fin debe ser posterior a la fecha de inicio";
      }
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
    // Validación de entrada pagada requiere precio
    if (formData.tipo_entrada === "pagado" && !formData.precio) {
      newErrors.precio = "Indica el precio del evento";
    }
    // Validación de venta externa requiere URL
    if (
      formData.tipo_entrada === "venta_externa" &&
      !formData.url_venta?.trim()
    ) {
      newErrors.url_venta = "Proporciona el enlace de venta de entradas";
    }
    // Solo requerir imágenes si es nuevo evento y no hay existentes
    if (
      !isEditing &&
      formData.imagenes.length === 0 &&
      existingImages.length === 0
    ) {
      newErrors.imagenes = "Sube al menos una imagen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setPreviewImages([]);
    setErrors({});
    setCurrentDraftId(null);
  };

  // Convertir imagen a base64 (para guardar en borrador)
  const imageToBase64 = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith("blob:")) {
      return imageUrl; // Ya es una URL válida
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Comprimir si es muy grande (máximo 100KB para base64)
      if (blob.size > 100000) {
        // Crear canvas para redimensionar
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        return new Promise((resolve) => {
          img.onload = () => {
            // Calcular nuevo tamaño (máximo 300px)
            const maxSize = 300;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
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
  };

  // Guardar borrador
  const handleSaveDraft = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }

    // Validar que haya al menos un campo con datos
    const hasData =
      formData.titulo || formData.descripcion || formData.category_id;
    if (!hasData) {
      if (showToast)
        showToast(
          "Agrega al menos un título o descripción para guardar el borrador",
          "warning",
        );
      return false;
    }

    setIsSavingDraft(true);

    try {
      // Obtener nombre de la categoría para mostrar en la lista
      const selectedCategory = categories.find(
        (c) => c.id === parseInt(formData.category_id),
      );

      // Convertir la primera imagen a base64 para preview (si existe)
      let imagenPreviewBase64 = null;
      if (previewImages.length > 0) {
        imagenPreviewBase64 = await imageToBase64(previewImages[0]);
      } else if (existingImages.length > 0) {
        imagenPreviewBase64 = existingImages[0]; // Ya es URL válida
      }

      // Preparar datos del borrador
      const draftData = {
        ...formData,
        categoria_nombre: selectedCategory?.nombre || "",
        // Guardar referencia a cantidad de imágenes (las blob URLs no persisten)
        cantidad_imagenes: previewImages.length + existingImages.length,
      };

      const savedDraft = await saveDraft({
        userId: user.id,
        tipo: "evento",
        data: draftData,
        id: currentDraftId, // null si es nuevo, ID si estamos actualizando
        imagenPreview: imagenPreviewBase64,
      });

      setCurrentDraftId(savedDraft.id);

      if (showToast) {
        showToast("Borrador guardado exitosamente", "success");
      }

      return true;
    } catch (error) {
      console.error("Error guardando borrador:", error);
      if (showToast) {
        showToast("Error al guardar el borrador", "error");
      }
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== INICIO SUBMIT ===");

    // Verificar autenticación
    if (!isAuthenticated) {
      console.log("Usuario no autenticado");
      setShowAuthModal(true);
      return;
    }

    // Validar formulario
    console.log("Validando formulario...");
    if (!validateForm()) {
      console.log("Validación fallida:", errors);
      if (showToast)
        showToast("Por favor completa todos los campos obligatorios", "error");
      return;
    }
    console.log("Validación exitosa");

    setIsSubmitting(true);
    console.log("isSubmitting = true");

    try {
      // 1. Subir nuevas imágenes (secuencialmente para mejor manejo de errores)
      console.log(`Subiendo ${formData.imagenes.length} imágenes...`);
      const newImageUrls = [];

      for (let i = 0; i < formData.imagenes.length; i++) {
        const file = formData.imagenes[i];
        console.log(
          `Subiendo imagen ${i + 1} de ${formData.imagenes.length}: ${
            file.name
          }`,
        );
        try {
          const url = await uploadEventImage(file, user.id);
          newImageUrls.push(url);
        } catch (uploadError) {
          console.error(`Error subiendo imagen ${i + 1}:`, uploadError);
          throw new Error(`Error al subir la imagen ${file.name}`);
        }
      }

      // Combinar imágenes existentes con las nuevas
      const allImageUrls = [...existingImages, ...newImageUrls];
      console.log(`Total de imágenes: ${allImageUrls.length}`);

      // 2. Preparar datos del evento
      // Limpiar redes sociales (eliminar valores vacíos)
      const redesLimpias = {};
      Object.entries(formData.redes_sociales).forEach(([key, value]) => {
        if (value && value.trim()) {
          redesLimpias[key] = value.trim();
        }
      });

      const eventData = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        mensaje_marketing: formData.mensaje_marketing?.trim() || null,
        organizador:
          formData.organizador.trim() ||
          user.user_metadata?.full_name ||
          "Organizador",
        category_id: parseInt(formData.category_id),
        fecha_evento: formData.fecha_evento,
        // Si es multi-día, incluir fecha_fin; si no, fecha_fin es igual a fecha_evento
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
        url_venta: formData.url_venta.trim() || null,
        redes_sociales: redesLimpias,
        imagenes: allImageUrls,
      };

      console.log(
        "Datos del evento a enviar:",
        JSON.stringify(eventData, null, 2),
      );

      if (isEditing) {
        // Actualizar evento existente
        console.log("Actualizando evento existente...", editEventId);
        await updateEvent(editEventId, eventData);
        console.log("Evento actualizado exitosamente");
        if (showToast)
          showToast("¡Publicación actualizada exitosamente!", "success");
      } else {
        // Crear nuevo evento
        eventData.user_id = user.id;
        // Admins publican directamente, usuarios normales van a cola de aprobación
        eventData.estado = isAdmin ? "publicado" : "pendiente";

        const createdEvent = await createEvent(eventData);
        console.log("Evento creado exitosamente:", createdEvent?.id);

        if (showToast)
          showToast(
            isAdmin
              ? "¡Publicación creada y publicada exitosamente!"
              : "¡Evento creado exitosamente! Será revisado pronto.",
            "success",
          );
      }

      // Si había un borrador, eliminarlo después de publicar exitosamente
      if (currentDraftId) {
        try {
          await deleteDraft(currentDraftId, user.id);
          console.log("Borrador eliminado tras publicar");
        } catch (draftError) {
          console.warn("No se pudo eliminar el borrador:", draftError);
        }
      }

      // Resetear formulario
      resetForm();
      setExistingImages([]);

      // Redirigir: admin siempre vuelve al panel, usuarios normales al perfil
      navigate(isAdmin ? "/admin" : "/perfil");
    } catch (error) {
      console.error("=== ERROR EN SUBMIT ===");
      console.error(
        `Error al ${isEditing ? "actualizar" : "crear"} evento:`,
        error,
      );
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);

      // Mostrar mensaje de error específico si está disponible
      const errorMessage =
        error?.message ||
        `Error al ${isEditing ? "actualizar" : "crear"} el evento. Intenta nuevamente.`;

      if (showToast) showToast(errorMessage, "error");
    } finally {
      console.log("=== FINALLY: Setting isSubmitting = false ===");
      setIsSubmitting(false);
    }
  };

  // Cerrar modal de autenticación
  const closeAuthModal = () => setShowAuthModal(false);

  return {
    // Estados
    formData,
    categories,
    loadingCategories,
    loadingEvent,
    showAuthModal,
    errors,
    isSubmitting,
    previewImages,
    isGoogleLoading,
    isEditing,
    isSavingDraft,
    currentDraftId,
    // Handlers
    handleFieldFocus,
    handleGoogleLogin,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
    handleSaveDraft,
    closeAuthModal,
  };
};

export default usePublicarForm;
