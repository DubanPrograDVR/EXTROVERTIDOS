/**
 * Constantes para el modal de edición de publicaciones
 */

import {
  PROVINCIAS,
  COMUNAS_POR_PROVINCIA,
  TIPOS_ENTRADA,
} from "../../../Home/Panorama/constants";

export { PROVINCIAS, COMUNAS_POR_PROVINCIA, TIPOS_ENTRADA };

// Estado inicial del formulario de edición
export const INITIAL_EDIT_STATE = {
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  fecha_evento: "",
  fecha_fin: "",
  es_multidia: false,
  es_recurrente: false,
  dia_recurrencia: "",
  cantidad_repeticiones: 2,
  fechas_recurrencia: [],
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
    tiktok: "",
    youtube: "",
    twitter: "",
    linkedin: "",
  },
  imagenes: [],
  ubicacion_url: "",
  sitio_web: "",
  telefono_contacto: "",
  etiqueta_directa: "",
  subtitulo: "",
  titulo_marketing: "",
  mensaje_marketing: "",
  titulo_marketing_2: "",
  mensaje_marketing_2: "",
  hashtags: "",
};

// Tabs disponibles
export const EDIT_TABS = {
  INFO: "info",
  LOCATION: "location",
  DETAILS: "details",
  MEDIA: "media",
};
