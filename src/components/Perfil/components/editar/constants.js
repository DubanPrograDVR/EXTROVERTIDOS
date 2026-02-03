/**
 * Constantes para el modal de edición de publicaciones
 */

// Provincias del Maule
export const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Tipos de entrada
export const TIPOS_ENTRADA = [
  { value: "sin_entrada", label: "Sin entrada" },
  { value: "gratuito", label: "Entrada gratuita" },
  { value: "pagado", label: "Entrada pagada" },
  { value: "venta_externa", label: "Venta externa" },
];

// Estado inicial del formulario de edición
export const INITIAL_EDIT_STATE = {
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  fecha_evento: "",
  fecha_fin: "",
  es_multidia: false,
  hora_inicio: "",
  hora_fin: "",
  provincia: "",
  comuna: "",
  direccion: "",
  tipo_entrada: "sin_entrada",
  precio: "",
  url_venta: "",
  redes_sociales: {
    instagram: "",
    facebook: "",
    whatsapp: "",
  },
  imagenes: [],
  ubicacion_url: "",
  mensaje_marketing: "",
};

// Tabs disponibles
export const EDIT_TABS = {
  INFO: "info",
  LOCATION: "location",
  DETAILS: "details",
  MEDIA: "media",
};
