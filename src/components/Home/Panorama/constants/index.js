// Tipos de entrada disponibles para eventos
export const TIPOS_ENTRADA = [
  { value: "sin_entrada", label: "Sin entrada" },
  { value: "gratuito", label: "Entrada gratuita" },
  { value: "pagado", label: "Entrada General" },
  { value: "venta_externa", label: "Venta externa" },
];

// Provincias de Chile (Región del Maule)
export const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  // Campos de fecha
  fecha_evento: "",
  fecha_fin: "", // Nueva: fecha de finalización para eventos multi-día
  es_multidia: false, // Nueva: indica si el evento dura más de un día
  // Horarios
  hora_inicio: "",
  hora_fin: "",
  mismo_horario: true, // Nueva: si el horario es igual todos los días
  // Ubicación
  provincia: "",
  comuna: "",
  direccion: "",
  ubicacion_url: "", // URL de Google Maps con coordenadas
  // Entrada
  tipo_entrada: "sin_entrada",
  precio: "",
  url_venta: "",
  // Redes sociales
  redes_sociales: {
    instagram: "",
    facebook: "",
    whatsapp: "",
  },
  imagenes: [],
};

// Configuración de imágenes
export const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: "image/*",
};
