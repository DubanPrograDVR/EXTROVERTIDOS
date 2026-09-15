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

// Modalidades del formulario. No se persisten como tipo_publicacion: solo
// distinguen si el formulario es gratuito, usa una suscripción o es destacado.
export const MODOS_PUBLICACION = {
  GRATUITA: "gratuita",
  SUSCRIPCION: "suscripcion",
  DESTACADA: "destacada",
};

export const DEFAULT_PUBLICATION_MODE = MODOS_PUBLICACION.GRATUITA;

export const esModoPublicacionValido = (modo) =>
  Object.values(MODOS_PUBLICACION).includes(modo);

/**
 * Normaliza una modalidad existente. Un dato antiguo sin modalidad siempre
 * cae a gratuita, salvo que conserve explícitamente el tipo destacado.
 */
export const normalizarModoPublicacion = (
  modo,
  tipoPublicacion = DEFAULT_PUBLICATION_TYPE,
) => {
  if (esModoPublicacionValido(modo)) return modo;
  return tipoPublicacion === PUBLICATION_TYPES.DESTACADA
    ? MODOS_PUBLICACION.DESTACADA
    : DEFAULT_PUBLICATION_MODE;
};

export const obtenerTipoPublicacion = (modo) =>
  modo === MODOS_PUBLICACION.DESTACADA
    ? PUBLICATION_TYPES.DESTACADA
    : DEFAULT_PUBLICATION_TYPE;

export const obtenerEstadoPublicacion = (
  modo,
  tipoPublicacion = DEFAULT_PUBLICATION_TYPE,
) => {
  const modoNormalizado = normalizarModoPublicacion(modo, tipoPublicacion);
  return {
    modo_publicacion: modoNormalizado,
    tipo_publicacion: obtenerTipoPublicacion(modoNormalizado),
  };
};

// Estado inicial del formulario
export const INITIAL_FORM_STATE = {
  // La modalidad vive dentro de formData (y no en un useState aparte) para que
  // viaje con las tres capas de persistencia de borrador: draft de servidor,
  // sessionStorage["draftToLoad"] y localStorage["publicar_local_draft_v1"].
  // Default: la modalidad más restrictiva, para que un borrador antiguo sin
  // este campo no se convierta en uno de pago al restaurarse.
  modo_publicacion: DEFAULT_PUBLICATION_MODE,
  tipo_publicacion: DEFAULT_PUBLICATION_TYPE,
  titulo: "",
  descripcion: "",
  organizador: "",
  category_id: "",
  // Metadatos de importación con IA (procedencia, no contenido del formulario).
  // Ver IA_METADATA_FIELDS: quedan fuera del saneado por plan.
  fuente_url: "",
  generado_por_ia: false,
  ia_confianza: 0,
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
// CAMPOS HABILITADOS POR MODALIDAD
// ─────────────────────────────────────────────────
// La modalidad gratuita expone un subconjunto del formulario; suscripción y
// destacada lo exponen completo. Esta lista es la ÚNICA fuente de verdad: de ella se
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
export const FREE_PLAN_SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok"];

/**
 * Metadatos de procedencia de la importación con IA.
 *
 * NO son campos de contenido y por eso NO entran en FREE_PLAN_FIELDS: describen
 * de dónde salió la publicación, no qué puede escribir el usuario según su plan.
 * El saneado por plan (`applyPlanToFormData`) debe ignorarlos, o una importación
 * publicada en modalidad gratuita perdería su trazabilidad.
 */
export const IA_METADATA_FIELDS = [
  "fuente_url",
  "generado_por_ia",
  "ia_confianza",
];

/** Normaliza texto para comparar: minúsculas, sin tildes y sin espacios extra. */
const normalizarTexto = (valor) =>
  (valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Localidades, sectores y atractivos conocidos del Maule y su Comuna oficial
export const LOCALIDADES_MAULE = {
  "santa lucia": "Molina",
  "mx santa lucia": "Molina",
  "santalucia": "Molina",
  "radal": "Molina",
  "siete tazas": "Molina",
  "radal siete tazas": "Molina",
  "parque ingles": "Molina",
  "itahue": "Molina",
  "casablanca": "Molina",
  "buena fe": "Molina",
  "pichingal": "Molina",
  "los niches": "Curicó",
  "sarmiento": "Curicó",
  "tutuquen": "Curicó",
  "potrero grande": "Curicó",
  "la huerta": "Hualañé",
  "la huerta de mataquito": "Hualañé",
  "iloca": "Licantén",
  "duao": "Licantén",
  "lipimavida": "Licantén",
  "los quenes": "Romeral",
  "los queñes": "Romeral",
  "llico": "Vichuquén",
  "boyeruca": "Vichuquén",
  "lago vichuquen": "Vichuquén",
  "peteroa": "Sagrada Familia",
  "villa prat": "Sagrada Familia",
  "comalle": "Teno",
  "la montana": "Teno",
  "majadilla": "Rauco",
  "las rastras": "Talca",
  "huilquilemu": "Talca",
  "vilches": "San Clemente",
  "altos de vilches": "San Clemente",
  "armerillo": "San Clemente",
  "paso nevado": "San Clemente",
  "laguna del maule": "San Clemente",
  "putu": "Constitución",
  "dunas de putu": "Constitución",
  "pellines": "Constitución",
  "cumpeo": "Río Claro",
  "gualleco": "Curepto",
  "colin": "Maule",
  "chacarillas": "Maule",
  "botalcura": "Pencahue",
  "achibueno": "Linares",
  "cajon del achibueno": "Linares",
  "ancoa": "Linares",
  "panimavida": "Colbún",
  "quinamavida": "Colbún",
  "termas de panimavida": "Colbún",
  "termas de quinamavida": "Colbún",
  "lago colbun": "Colbún",
  "rari": "Colbún",
  "catillo": "Parral",
  "termas de catillo": "Parral",
  "copihue": "Retiro",
  "melozal": "San Javier",
  "huerta de maule": "San Javier",
  "nirivilo": "San Javier",
  "putagan": "Villa Alegre",
  "santa ana de queri": "Yerbas Buenas",
  "sauzal": "Cauquenes",
  "pilen": "Cauquenes",
  "pahuil": "Chanco",
  "curanipe": "Pelluhue",
  "tregualemu": "Pelluhue",
  "mariscadero": "Pelluhue",
};

/**
 * Resuelve la provincia a partir de una comuna escrita en texto libre.
 *
 * La IA devuelve la comuna sin normalizar ("talca", "Villa Alegre, Maule"), pero
 * el wizard necesita la comuna EXACTA de COMUNAS_POR_PROVINCIA y su provincia:
 * sin provincia el selector de comuna queda deshabilitado y el dato se pierde.
 *
 * @param {string} comunaLibre - Comuna tal como la devolvió la IA
 * @returns {{provincia: string, comuna: string}|null} null si no es del Maule
 */
export const resolverUbicacionPorComuna = (comunaLibre) => {
  const objetivo = normalizarTexto(comunaLibre);
  if (!objetivo) return null;

  const entradas = Object.entries(COMUNAS_POR_PROVINCIA);

  // 1. Coincidencia exacta de Comuna
  for (const [provincia, comunas] of entradas) {
    const exacta = comunas.find((c) => normalizarTexto(c) === objetivo);
    if (exacta) return { provincia, comuna: exacta };
  }

  // 2. Coincidencia con Localidades/Sectores conocidos del Maule
  for (const [loc, comOficial] of Object.entries(LOCALIDADES_MAULE)) {
    if (objetivo.includes(normalizarTexto(loc))) {
      for (const [provincia, comunas] of entradas) {
        const encontrada = comunas.find((c) => c === comOficial);
        if (encontrada) return { provincia, comuna: encontrada };
      }
    }
  }

  // 3. Coincidencia parcial dentro de un texto mayor ("Plaza de Villa Alegre")
  const candidatas = entradas
    .flatMap(([provincia, comunas]) =>
      comunas.map((comuna) => ({ provincia, comuna })),
    )
    .sort((a, b) => b.comuna.length - a.comuna.length);

  const parcial = candidatas.find(({ comuna }) => {
    const n = normalizarTexto(comuna);
    return new RegExp(`(^|[^a-z])${n}([^a-z]|$)`).test(objetivo);
  });

  return parcial || null;
};

/**
 * Decide si corresponde el formulario completo.
 *
 * Suscripción y destacada usan el formulario completo. Una modalidad gratuita
 * explícita conserva el formulario reducido aunque el usuario tenga otro plan.
 *
 * @param {Object} params
 * @param {string} params.modoPublicacion - MODOS_PUBLICACION.*
 * @param {string} [params.tipoPublicacion] - Compatibilidad con datos antiguos
 * @param {boolean} [params.hasActiveSubscription] - Si hay plan de panoramas activo
 * @returns {boolean}
 */
export const isFullFormPlan = ({
  modoPublicacion,
  tipoPublicacion,
  hasActiveSubscription,
}) => {
  if (esModoPublicacionValido(modoPublicacion)) {
    return modoPublicacion !== MODOS_PUBLICACION.GRATUITA;
  }

  return (
    tipoPublicacion === PUBLICATION_TYPES.DESTACADA ||
    Boolean(hasActiveSubscription)
  );
};

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
