// Tipos de entrada disponibles para eventos
export const TIPOS_ENTRADA = [
  { value: "gratuito", label: "Gratuito" },
  { value: "pagado", label: "Pagado" },
  { value: "por_confirmar", label: "Por confirmar" },
];

// Provincias de Chile (Región del Maule)
export const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  fecha_evento: "",
  hora_inicio: "",
  hora_fin: "",
  provincia: "",
  comuna: "",
  direccion: "",
  tipo_entrada: "gratuito",
  precio: "",
  url_venta: "",
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
