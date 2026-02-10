/**
 * Constantes para el formulario de Publicar Negocio
 */

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

// Abreviaturas para los pills circulares
export const DIAS_SEMANA_SHORT = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIE",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SAB",
  Domingo: "DOM",
};

// Turno por defecto al agregar un día
export const DEFAULT_TURNO = { apertura: "09:00", cierre: "18:00" };

// Horas y minutos para los selectores del modal
export const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
export const MINUTES = ["00", "15", "30", "45"];

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  nombre: "",
  descripcion: "",
  category_id: "",
  subcategoria: "",
  provincia: "",
  comuna: "",
  direccion: "",
  telefono: "",
  email: "",
  sitio_web: "",
  dias_atencion: [],
  horarios_detalle: {},
  abierto_24h: false,
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
