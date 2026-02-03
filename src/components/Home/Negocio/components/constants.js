/**
 * Constantes para el formulario de Publicar Negocio
 */

// Provincias de Chile (Región del Maule)
export const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Días de la semana
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  nombre: "",
  descripcion: "",
  category_id: "",
  provincia: "",
  comuna: "",
  direccion: "",
  telefono: "",
  email: "",
  sitio_web: "",
  horario_apertura: "",
  horario_cierre: "",
  dias_atencion: [],
  redes_sociales: {
    instagram: "",
    facebook: "",
    whatsapp: "",
  },
  ubicacion_url: "",
  imagenes: [],
};

// Configuración de imágenes
export const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024, // 5MB
};
