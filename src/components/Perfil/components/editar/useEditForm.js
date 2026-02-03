import { useState, useEffect, useCallback } from "react";
import { INITIAL_EDIT_STATE } from "./constants";

/**
 * Hook personalizado para manejar el formulario de edición
 */
export const useEditForm = (event, isOpen) => {
  const [formData, setFormData] = useState(INITIAL_EDIT_STATE);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info");

  // Cargar datos del evento cuando se abre el modal
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        titulo: event.titulo || "",
        descripcion: event.descripcion || "",
        organizador: event.organizador || "",
        category_id: event.category_id || "",
        fecha_evento: event.fecha_evento || "",
        fecha_fin: event.fecha_fin || "",
        es_multidia: event.es_multidia || false,
        hora_inicio: event.hora_inicio?.slice(0, 5) || "",
        hora_fin: event.hora_fin?.slice(0, 5) || "",
        provincia: event.provincia || "",
        comuna: event.comuna || "",
        direccion: event.direccion || "",
        tipo_entrada: event.tipo_entrada || "sin_entrada",
        precio: event.precio || "",
        url_venta: event.url_venta || "",
        redes_sociales: {
          instagram: event.redes_sociales?.instagram || "",
          facebook: event.redes_sociales?.facebook || "",
          whatsapp: event.redes_sociales?.whatsapp || "",
        },
        imagenes: event.imagenes || [],
        ubicacion_url: event.ubicacion_url || "",
        mensaje_marketing: event.mensaje_marketing || "",
      });
      setErrors({});
      setActiveTab("info");
    }
  }, [event, isOpen]);

  // Manejar cambios en inputs
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("redes_sociales.")) {
      const socialKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Limpiar error del campo
    setErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  // Eliminar imagen
  const handleRemoveImage = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Preparar datos para guardar
  const prepareDataToSave = useCallback(() => {
    return {
      ...formData,
      precio:
        formData.tipo_entrada === "pagado"
          ? parseInt(formData.precio) || null
          : null,
      hora_inicio: formData.hora_inicio || null,
      hora_fin: formData.hora_fin || null,
      // Si no es multidia, fecha_fin debe ser igual a fecha_evento
      fecha_fin: formData.es_multidia
        ? formData.fecha_fin
        : formData.fecha_evento,
      // Cuando el usuario edita, el estado vuelve a pendiente para revisión
      estado: "pendiente",
    };
  }, [formData]);

  return {
    formData,
    errors,
    activeTab,
    setActiveTab,
    handleChange,
    handleRemoveImage,
    validateForm,
    prepareDataToSave,
  };
};
