// Tipos de entrada disponibles para eventos
export const TIPOS_ENTRADA = [
  { value: "sin_entrada", label: "Sin entrada" },
  { value: "gratuito", label: "Entrada gratuita" },
  { value: "pagado", label: "Entrada General" },
  { value: "venta_externa", label: "Venta externa" },
];

// Provincias de Chile (Región del Maule)
export const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Comunas por Provincia (Región del Maule)
export const COMUNAS_POR_PROVINCIA = {
  Talca: [
    "Talca",
    "Constitución",
    "Curepto",
    "Empedrado",
    "Maule",
    "Pelarco",
    "Pencahue",
    "Río Claro",
    "San Clemente",
    "San Rafael",
  ],
  Curicó: [
    "Curicó",
    "Hualañé",
    "Licantén",
    "Molina",
    "Rauco",
    "Romeral",
    "Sagrada Familia",
    "Teno",
    "Vichuquén",
  ],
  Linares: [
    "Linares",
    "Colbún",
    "Longaví",
    "Parral",
    "Retiro",
    "San Javier",
    "Villa Alegre",
    "Yerbas Buenas",
  ],
  Cauquenes: ["Cauquenes", "Chanco", "Pelluhue"],
};

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
    tiktok: "",
    youtube: "", // Nuevo: enlace de YouTube
  },
  // Marketing
  titulo_marketing: "", // Título del primer mensaje de marketing
  mensaje_marketing: "",
  titulo_marketing_2: "", // Título del segundo mensaje de marketing
  mensaje_marketing_2: "", // Nuevo: segundo mensaje de marketing
  // Contacto
  telefono_contacto: "", // Nuevo: número de contacto directo
  sitio_web: "", // Nuevo: sitio web del evento
  // Etiquetas y hashtags
  hashtags: "", // Nuevo: hashtags personalizados
  etiqueta_directa: "", // Nuevo: etiqueta directa destacada
  imagenes: [],
};

// Configuración de imágenes
export const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: "image/*",
};
