import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  getCategories,
  createEvent,
  uploadEventImage,
} from "../../../../lib/database";
import { INITIAL_FORM_STATE, IMAGE_CONFIG } from "../constants";

/**
 * Hook personalizado para manejar la lógica del formulario de publicación
 */
const usePublicarForm = () => {
  const { user, isAuthenticated, signInWithGoogle, showToast } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
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
      newErrors.fecha_evento = "La fecha es obligatoria";
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
    if (formData.imagenes.length === 0) {
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
      // 1. Subir imágenes
      const imageUrls = [];
      for (const file of formData.imagenes) {
        const url = await uploadEventImage(file, user.id);
        imageUrls.push(url);
      }

      // 2. Preparar datos del evento
      const eventData = {
        user_id: user.id,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        organizador:
          formData.organizador.trim() ||
          user.user_metadata?.full_name ||
          "Organizador",
        category_id: parseInt(formData.category_id),
        fecha_evento: formData.fecha_evento,
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
        imagenes: imageUrls,
        estado: "pendiente",
      };

      // 3. Crear evento en la BD
      await createEvent(eventData);

      if (showToast)
        showToast(
          "¡Evento creado exitosamente! Será revisado pronto.",
          "success"
        );

      // Resetear formulario
      resetForm();

      // Redirigir al perfil
      navigate("/perfil");
    } catch (error) {
      console.error("Error al crear evento:", error);
      if (showToast)
        showToast("Error al crear el evento. Intenta nuevamente.", "error");
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
    showAuthModal,
    errors,
    isSubmitting,
    previewImages,
    isGoogleLoading,
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
