import { useState, useEffect, useCallback } from "react";

const DIAS_SEMANA_KEYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

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
  dias_atencion: [],
  horarios_detalle: {},
  abierto_24h: false,
};

/**
 * Parsea el JSONB de horarios de la BD a dias_atencion + horarios_detalle + abierto_24h
 */
const parseHorariosFromDB = (horarios) => {
  if (!horarios || typeof horarios !== "object") {
    return { dias_atencion: [], horarios_detalle: {}, abierto_24h: false };
  }
  const abierto_24h = !!horarios.abierto_24h;
  const dias_atencion = [];
  const horarios_detalle = {};
  for (const key of Object.keys(horarios)) {
    if (key === "abierto_24h") continue;
    if (DIAS_SEMANA_KEYS.includes(key)) {
      dias_atencion.push(key);
      horarios_detalle[key] = Array.isArray(horarios[key])
        ? horarios[key]
        : [
            {
              apertura: horarios[key]?.apertura || "09:00",
              cierre: horarios[key]?.cierre || "18:00",
            },
          ];
    }
  }
  return { dias_atencion, horarios_detalle, abierto_24h };
};

/**
 * Hook para manejar el formulario de edición de negocios
 */
export const useBusinessEditForm = (business, isOpen) => {
  const [formData, setFormData] = useState(INITIAL_BUSINESS_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (business && isOpen) {
      const { dias_atencion, horarios_detalle, abierto_24h } =
        parseHorariosFromDB(business.horarios);
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
        dias_atencion,
        horarios_detalle,
        abierto_24h,
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

  const handleDiaChange = useCallback((dia) => {
    setFormData((prev) => {
      const isRemoving = prev.dias_atencion.includes(dia);
      const newDias = isRemoving
        ? prev.dias_atencion.filter((d) => d !== dia)
        : [...prev.dias_atencion, dia];
      const newHorarios = { ...prev.horarios_detalle };
      if (isRemoving) {
        delete newHorarios[dia];
      }
      return { ...prev, dias_atencion: newDias, horarios_detalle: newHorarios };
    });
  }, []);

  const handleSaveHorarios = useCallback((horarios, abierto24h) => {
    setFormData((prev) => ({
      ...prev,
      horarios_detalle: horarios,
      abierto_24h: abierto24h,
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
    // Construir JSONB de horarios
    const horarios = {};
    if (formData.abierto_24h) {
      horarios.abierto_24h = true;
    }
    formData.dias_atencion.forEach((dia) => {
      horarios[dia] = formData.horarios_detalle[dia] || [
        { apertura: "09:00", cierre: "18:00" },
      ];
    });

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
      horarios: Object.keys(horarios).length > 0 ? horarios : {},
      dias_atencion: formData.dias_atencion,
    };
  }, [formData]);

  return {
    formData,
    errors,
    handleChange,
    handleRemoveImage,
    handleDiaChange,
    handleSaveHorarios,
    validateForm,
    prepareDataToSave,
  };
};
