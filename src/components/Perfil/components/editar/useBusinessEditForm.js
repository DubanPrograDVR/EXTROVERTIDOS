import { useState, useEffect, useCallback } from "react";

const INITIAL_BUSINESS_STATE = {
  nombre: "",
  descripcion: "",
  categoria: "",
  subcategoria: "",
  category_id: "",
  direccion: "",
  comuna: "",
  provincia: "",
  telefono: "",
  email: "",
  sitio_web: "",
  ubicacion_url: "",
  instagram: "",
  facebook: "",
  whatsapp: "",
  tiktok: "",
  titulo_marketing: "",
  mensaje_marketing: "",
  imagenes: [],
};

/**
 * Hook para manejar el formulario de edición de negocios
 */
export const useBusinessEditForm = (business, isOpen) => {
  const [formData, setFormData] = useState(INITIAL_BUSINESS_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (business && isOpen) {
      setFormData({
        nombre: business.nombre || "",
        descripcion: business.descripcion || "",
        categoria: business.categoria || "",
        subcategoria: business.subcategoria || "",
        category_id: business.category_id || "",
        direccion: business.direccion || "",
        comuna: business.comuna || "",
        provincia: business.provincia || "",
        telefono: business.telefono || "",
        email: business.email || "",
        sitio_web: business.sitio_web || "",
        ubicacion_url: business.ubicacion_url || "",
        instagram: business.instagram || "",
        facebook: business.facebook || "",
        whatsapp: business.whatsapp || "",
        tiktok: business.tiktok || "",
        titulo_marketing: business.titulo_marketing || "",
        mensaje_marketing: business.mensaje_marketing || "",
        imagenes: business.imagenes || business.galeria || [],
      });
      setErrors({});
    }
  }, [business, isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
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

  const prepareDataToSave = useCallback(() => {
    return {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      subcategoria: formData.subcategoria,
      direccion: formData.direccion,
      comuna: formData.comuna,
      provincia: formData.provincia,
      telefono: formData.telefono,
      email: formData.email,
      sitio_web: formData.sitio_web,
      ubicacion_url: formData.ubicacion_url,
      instagram: formData.instagram,
      facebook: formData.facebook,
      whatsapp: formData.whatsapp,
      tiktok: formData.tiktok,
      titulo_marketing: formData.titulo_marketing,
      mensaje_marketing: formData.mensaje_marketing,
      imagenes: formData.imagenes,
    };
  }, [formData]);

  return {
    formData,
    errors,
    handleChange,
    handleRemoveImage,
    validateForm,
    prepareDataToSave,
  };
};
