// Tipos de entrada disponibles para eventos
export const TIPOS_ENTRADA = [
  { value: "sin_entrada", label: "Pronto más información" },
  { value: "info_descripcion", label: "Info en Descripción" },
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

// ─────────────────────────────────────────────────
// TIPOS DE PUBLICACIÓN
// ─────────────────────────────────────────────────
// Los valores deben coincidir con el CHECK constraint de events.tipo_publicacion.
// Para agregar un nuevo tipo (ej: 'premium'):
//   1) Actualiza el CHECK en la migración (o crea una nueva).
//   2) Añade la entrada aquí (label + descripción).
//   3) Si requiere pago, ajusta la lógica en useEventSubmit + create-payment.
export const PUBLICATION_TYPES = {
  NORMAL: "normal",
  DESTACADA: "destacada",
};

export const DEFAULT_PUBLICATION_TYPE = PUBLICATION_TYPES.NORMAL;

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  // Plan elegido. Vive dentro de formData (y no en un useState aparte) para que
  // viaje con las tres capas de persistencia de borrador: draft de servidor,
  // sessionStorage["draftToLoad"] y localStorage["publicar_local_draft_v1"].
  // Default: el plan más restrictivo, para que un borrador antiguo sin este
  // campo no se convierta en uno de pago al restaurarse.
  tipo_publicacion: DEFAULT_PUBLICATION_TYPE,
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  // Campos de fecha
  fecha_evento: "",
  fecha_fin: "", // Nueva: fecha de finalización para eventos multi-día
  es_multidia: false, // Nueva: indica si el evento dura más de un día
  // Recurrencia
  es_recurrente: false, // Indica si el evento se repite ciertos días
  dia_recurrencia: "", // Día de la semana en que se repite
  cantidad_repeticiones: 2, // Cuántas veces se repite (2-8)
  fechas_recurrencia: [], // Array de fechas calculadas
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
  tipo_entrada: "",
  precio: "",
  url_venta: "",
  // Redes sociales
  redes_sociales: {
    instagram: "",
    facebook: "",
    whatsapp: "",
    tiktok: "",
    youtube: "",
    twitter: "",
    linkedin: "",
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

// ─────────────────────────────────────────────────
// CAMPOS HABILITADOS POR PLAN
// ─────────────────────────────────────────────────
// El plan gratuito expone un subconjunto del formulario; el destacado (de pago)
// lo expone completo. Esta lista es la ÚNICA fuente de verdad: de ella se
// derivan los campos visibles del wizard, los pasos que se muestran, lo que
// valida el submit y lo que se persiste.
export const FREE_PLAN_FIELDS = [
  "titulo",
  "descripcion",
  "category_id",
  "fecha_evento",
  "provincia",
  "comuna",
  "redes_sociales",
  "imagenes",
];

/** Redes sociales disponibles en el plan gratuito */
export const FREE_PLAN_SOCIAL_NETWORKS = ["facebook", "tiktok"];

/**
 * Decide si corresponde el formulario completo.
 *
 * Una suscripción activa de panoramas también da acceso al formulario completo:
 * el usuario ya pagó por publicar y limitarlo al set gratuito le quitaría algo
 * que compró. Para que SOLO las destacadas tengan el formulario completo,
 * elimina el segundo término de este OR.
 *
 * @param {Object} params
 * @param {string} params.tipoPublicacion - PUBLICATION_TYPES.*
 * @param {boolean} [params.hasActiveSubscription] - Si hay plan de panoramas activo
 * @returns {boolean}
 */
export const isFullFormPlan = ({ tipoPublicacion, hasActiveSubscription }) =>
  tipoPublicacion === PUBLICATION_TYPES.DESTACADA ||
  Boolean(hasActiveSubscription);

/**
 * Lista de campos habilitados, o null si están todos.
 * @param {Object} params - Ver isFullFormPlan
 * @returns {string[]|null}
 */
export const getEnabledFields = (params) =>
  isFullFormPlan(params) ? null : FREE_PLAN_FIELDS;

/**
 * ¿Este campo está habilitado con la lista dada?
 * @param {string} field - Nombre del campo
 * @param {string[]|null} [enabledFields] - null/undefined = todos habilitados
 * @returns {boolean}
 */
export const isFieldEnabled = (field, enabledFields) =>
  enabledFields === null ||
  enabledFields === undefined ||
  enabledFields.includes(field);
