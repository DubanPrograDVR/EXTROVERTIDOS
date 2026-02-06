import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";
import {
  getCategories,
  createBusiness,
  uploadBusinessImage,
} from "../../../../../lib/database";
import { INITIAL_FORM_STATE, IMAGE_CONFIG } from "../constants";

/**
 * Hook personalizado para manejar el formulario de publicar negocio
 */
export const useNegocioForm = () => {
  const { user, isAuthenticated, isAdmin, showToast } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setPreviewImages([]);
  }, []);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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

      const businessData = {
        user_id: user.id,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        category_id: parseInt(formData.category_id),
        provincia: formData.provincia,
        comuna: formData.comuna.trim(),
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim() || null,
        sitio_web: formData.sitio_web.trim() || null,
        horarios: Object.keys(horarios).length > 0 ? horarios : {},
        redes_sociales: formData.redes_sociales,
        ubicacion_url: formData.ubicacion_url.trim() || null,
        imagen_url: imageUrls[0] || null,
        imagenes: imageUrls,
        estado: isAdmin ? "publicado" : "pendiente",
      };

      // 3. Crear negocio en la BD
      await createBusiness(businessData);

      if (showToast)
        showToast(
          isAdmin
            ? "¡Negocio publicado exitosamente!"
            : "¡Negocio creado exitosamente! Será revisado pronto.",
          "success"
        );

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
  }, [isAuthenticated, isAdmin, formData, user, showToast, validateForm, resetForm, navigate]);

  return {
    // Estados
    formData,
    errors,
    categories,
    loadingCategories,
    isSubmitting,
    previewImages,
    showAuthModal,
    
    // Acciones
    handleChange,
    handleDiaChange,
    handleSaveHorarios,
    handleImageChange,
    removeImage,
    handleFieldFocus,
    handleSubmit,
    setShowAuthModal,
  };
};
