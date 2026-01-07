import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  getCategories,
  createEvent,
  uploadEventImage,
  getEventById,
  updateEvent,
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
            "error"
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

  // Manejar cambio de imágenes (múltiples)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const { maxFiles, maxSize } = IMAGE_CONFIG;

    // Validar cantidad
    if (formData.imagenes.length + files.length > maxFiles) {
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
          imagenes: `La imagen ${file.name} supera los 5MB`,
        }));
        continue;
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
  };

  // Eliminar imagen
  const removeImage = (index) => {
    // Determinar si es una imagen existente o una nueva
    const totalExisting = existingImages.length;

    if (index < totalExisting) {
      // Es una imagen existente
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Es una imagen nueva
      const newIndex = index - totalExisting;
      setFormData((prev) => ({
        ...prev,
        imagenes: prev.imagenes.filter((_, i) => i !== newIndex),
      }));
      setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

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
    if (formData.tipo_entrada === "pagado" && !formData.precio) {
      newErrors.precio = "Indica el precio del evento";
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
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar autenticación
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Validar formulario
    if (!validateForm()) {
      if (showToast)
        showToast("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Subir nuevas imágenes si hay
      const newImageUrls = [];
      for (const file of formData.imagenes) {
        const url = await uploadEventImage(file, user.id);
        newImageUrls.push(url);
      }

      // Combinar imágenes existentes con las nuevas
      const allImageUrls = [...existingImages, ...newImageUrls];

      // 2. Preparar datos del evento
      const eventData = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
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
        tipo_entrada: formData.tipo_entrada,
        precio:
          formData.tipo_entrada === "pagado" ? parseInt(formData.precio) : null,
        url_venta: formData.url_venta.trim() || null,
        redes_sociales: formData.redes_sociales,
        imagenes: allImageUrls,
      };

      if (isEditing) {
        // Actualizar evento existente
        await updateEvent(editEventId, eventData);
        if (showToast)
          showToast("¡Publicación actualizada exitosamente!", "success");
      } else {
        // Crear nuevo evento
        eventData.user_id = user.id;
        eventData.estado = "pendiente";
        await createEvent(eventData);
        if (showToast)
          showToast(
            "¡Evento creado exitosamente! Será revisado pronto.",
            "success"
          );
      }

      // Resetear formulario
      resetForm();
      setExistingImages([]);

      // Redirigir
      navigate(isEditing && isAdmin ? "/admin" : "/perfil");
    } catch (error) {
      console.error(
        `Error al ${isEditing ? "actualizar" : "crear"} evento:`,
        error
      );
      if (showToast)
        showToast(
          `Error al ${
            isEditing ? "actualizar" : "crear"
          } el evento. Intenta nuevamente.`,
          "error"
        );
    } finally {
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
    // Handlers
    handleFieldFocus,
    handleGoogleLogin,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
    closeAuthModal,
  };
};

export default usePublicarForm;
