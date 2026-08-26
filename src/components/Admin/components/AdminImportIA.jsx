import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faSpinner,
  faArrowRight,
  faTimesCircle,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faRepeat,
  faImage,
  faExternalLinkAlt,
  faInfoCircle,
  faPaperPlane,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../../lib/supabase";
import {
  getCategories,
  createEvent,
  uploadEventImage,
} from "../../../lib/database";
import { resolverUbicacionPorComuna } from "../../Home/Panorama/constants";
import {
  normalizeSocialLinks,
  normalizeOptionalChileanPhone,
} from "../../../lib/textWrap";
import "../styles/admin.css";
import "./AdminImportIA.css";

/**
 * Importador de panoramas desde Instagram usando IA.
 *
 * Flujo:
 *   1. El admin pega la URL de una publicación pública de Instagram.
 *   2. Se invoca la edge function `analyze-instagram`, que extrae el contenido
 *      y lo estructura con Gemini.
 *   3. El resultado se muestra en un formulario EDITABLE para que el admin
 *      corrija lo que la IA no dedujo bien.
 *   4. El admin elige:
 *      - "Publicar ahora": crea el panorama directamente (estado publicado),
 *        sin pasar por el wizard.
 *      - "Continuar y revisar": navega al wizard con los datos en
 *        `location.state.iaData` para afinar más campos.
 *
 * La IA nunca publica sola: siempre pasa por la revisión del admin.
 */

// El servidor ahora reintenta hasta 3 veces ante un 503/429 de Gemini
// (sobrecarga pasajera, no un fallo real del contenido): en el peor caso son
// tres intentos de hasta 40s más las pausas de retroceso, ~125s. El límite
// anterior de 45s cortaba la conexión antes de que el servidor pudiera
// terminar esos reintentos, y el admin veía "tardó demasiado" incluso cuando
// el siguiente intento iba a funcionar. 150s deja al límite propio de
// Supabase (150s en el plan gratuito) ser el que corte, no este cliente.
/** Tiempo máximo de espera del análisis antes de abortar (ms). */
const ANALYSIS_TIMEOUT_MS = 150000;

/** Pasos mostrados durante el análisis (solo informativos). */
const ANALYSIS_STEPS = [
  "Leyendo la publicación de Instagram",
  "Extrayendo el texto y la imagen",
  "Interpretando el contenido con IA",
  "Validando fecha, lugar y comuna",
];

/** Campos editables del resultado, en el orden en que se muestran. */
const EDITABLE_FIELDS = [
  { key: "titulo", label: "Título", full: true },
  { key: "descripcion", label: "Descripción", full: true, textarea: true },
  { key: "fecha", label: "Fecha", type: "date" },
  { key: "hora_inicio", label: "Hora de inicio", type: "time" },
  { key: "hora_fin", label: "Hora de término", type: "time" },
  { key: "ubicacion", label: "Lugar", full: true },
  { key: "comuna", label: "Comuna" },
  { key: "precio", label: "Precio" },
  { key: "organizador", label: "Organizador" },
  { key: "instagram", label: "Instagram" },
  { key: "telefono", label: "Teléfono", full: true },
];

/**
 * Códigos de error del servidor que merecen un botón de reintento.
 *
 * El resto (enlace de perfil, historia, dominio ajeno) son fallos del enlace:
 * reintentar con el mismo dato daría exactamente el mismo resultado.
 */
// Deliberadamente NO incluye "cuota_agotada" ni "ia_cuota_agotada": ambas son
// cupos diarios (el nuestro y el de Gemini respectivamente), y reintentar
// segundos después no los restablece. Ofrecer "Reintentar" ahí sería engañoso.
const CODIGOS_REINTENTABLES = new Set([
  "instagram_no_disponible",
  "ia_no_disponible",
]);

/** Traduce un puntaje 0-100 a nivel semántico. */
const getConfidenceLevel = (score) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : 0;
  if (value >= 80) return { key: "high", label: "Alta confianza", value };
  if (value >= 60) return { key: "medium", label: "Requiere revisión", value };
  return { key: "low", label: "Baja confianza", value };
};

/**
 * Normaliza el enlace pegado antes de enviarlo.
 *
 * Se acepta cualquier forma razonable: sin `https://`, con `www` o sin él, con
 * parámetros de seguimiento, como enlace de compartir. La comprobación de que
 * la ruta corresponde a una publicación la hace el servidor, que es la única
 * fuente de verdad; validar de más aquí solo provocaba rechazar enlaces que el
 * servidor sí sabe resolver.
 *
 * @returns {{url: string}|{error: string}}
 */
const normalizarUrlInstagram = (rawUrl) => {
  const value = (rawUrl || "").trim().replace(/^[<"'\s]+|[>"'\s.,]+$/g, "");
  if (!value) return { error: "Pega el enlace de una publicación de Instagram." };

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { error: "Ese texto no parece un enlace. Revísalo e inténtalo de nuevo." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!/(^|\.)(instagram\.com|instagr\.am)$/.test(host)) {
    return { error: "El enlace debe ser de Instagram." };
  }

  // Se envía ya normalizado (con protocolo); antes se validaba la versión
  // normalizada pero se enviaba la cruda, y el servidor la rechazaba.
  return { url: parsed.toString() };
};

/** Normaliza texto para comparar nombres de categoría (minúsculas sin tildes). */
const normalizarTexto = (valor) =>
  (valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Empareja la categoría sugerida por la IA (texto libre) con una categoría real.
 * Se necesita el id numérico para el insert; el nombre suelto no basta.
 */
const matchCategoriaId = (sugerida, categorias) => {
  const objetivo = normalizarTexto(sugerida);
  if (!objetivo || !categorias.length) return "";

  const exacta = categorias.find((c) => normalizarTexto(c.nombre) === objetivo);
  if (exacta) return String(exacta.id);

  const parcial = categorias.find((c) => {
    const n = normalizarTexto(c.nombre);
    return n.includes(objetivo) || objetivo.includes(n);
  });
  return parcial ? String(parcial.id) : "";
};

/**
 * Deriva el tipo de entrada y el precio a partir de lo que devolvió la IA.
 *
 * `precio_numero` viene del modelo: -1 si no se menciona precio, 0 si es
 * liberado, y el valor en pesos si es pagado. Antes esto se descartaba y
 * `tipo_entrada` quedaba fijo en "sin_entrada", así que el precio que el
 * administrador corregía a mano no llegaba nunca a la base de datos.
 */
const derivarEntrada = (draft) => {
  const crudo = draft?.precio_numero;
  // Number(null) es 0, y eso publicaría como "entrada gratuita" un evento cuyo
  // precio el modelo simplemente no devolvió. Anunciar como gratis algo que se
  // cobra llega al público, así que la ausencia se trata como desconocido.
  const valor =
    crudo === null || crudo === undefined || crudo === ""
      ? Number.NaN
      : Number(crudo);

  if (Number.isFinite(valor) && valor > 0) {
    return { tipo_entrada: "pagado", precio: Math.round(valor) };
  }
  if (valor === 0) {
    return { tipo_entrada: "gratuito", precio: null };
  }
  // Sin dato numérico pero con texto ("consultar por interno"): que el precio
  // se lea en la descripción en vez de afirmar que no hay información.
  if (draft?.precio?.trim()) {
    return { tipo_entrada: "info_descripcion", precio: null };
  }
  return { tipo_entrada: "sin_entrada", precio: null };
};

/** Convierte la imagen base64 (traída por el servidor) en un File subible. */
const base64ToFile = (base64, mime) => {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return new File([bytes], `instagram-${Date.now()}.${ext}`, {
    type: mime || "image/jpeg",
  });
};

export default function AdminImportIA({ onGoToPublications } = {}) {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState(null);

  // Publicación directa (sin pasar por el wizard).
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [published, setPublished] = useState(false);

  const abortRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Categorías para el selector de la publicación directa.
  useEffect(() => {
    let active = true;
    getCategories()
      .then((data) => {
        if (active) setCategories(data || []);
      })
      .catch((err) => console.error("Error cargando categorías:", err));
    return () => {
      active = false;
    };
  }, []);

  // Avance visual de los pasos mientras dura el análisis.
  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
    }, 2500);
    return () => clearInterval(timer);
  }, [loading]);

  const handleAnalyze = useCallback(async (urlDirecta) => {
    setError(null);
    setResult(null);
    setDraft(null);

    // El buscador pasa la URL directamente: si dependiera del estado `url`,
    // este callback leería el valor anterior en el mismo ciclo de render.
    const objetivo = typeof urlDirecta === "string" ? urlDirecta : url;
    const normalizada = normalizarUrlInstagram(objetivo);
    if (normalizada.error) {
      setError({ mensaje: normalizada.error, reintentable: false });
      return;
    }

    setLoading(true);
    setStepIndex(0);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-instagram`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: normalizada.url }),
          signal: controller.signal,
        },
      );

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          `El servidor respondió de forma inesperada (código ${response.status}).`,
        );
      }

      if (!response.ok || !data?.success) {
        // Detalle técnico del backend (p. ej. el error real de GLM). Se envía a
        // consola para diagnóstico sin ensuciar el mensaje que ve el usuario.
        if (data?.detalle) {
          console.error("[analyze-instagram] Detalle del error:", data.detalle);
        }
        const fallo = new Error(
          data?.error || data?.message || "No se pudo analizar la publicación.",
        );
        // El servidor distingue entre "el enlace está mal" (400, no sirve
        // reintentar) y "Instagram o la IA fallaron" (502/429, sí sirve).
        fallo.codigo = data?.codigo || "";
        fallo.reintentable = CODIGOS_REINTENTABLES.has(fallo.codigo);
        throw fallo;
      }

      if (!isMountedRef.current) return;
      setResult(data.data);
      setDraft({ ...data.data });
      setPublished(false);
      setPublishError(null);
      setCategoryId(matchCategoriaId(data.data?.categoria, categories));
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === "AbortError") {
        setError({
          mensaje:
            "El análisis tardó demasiado. Instagram puede estar lento en este momento.",
          reintentable: true,
        });
      } else {
        setError({ mensaje: err.message, reintentable: Boolean(err.reintentable) });
      }
    } finally {
      clearTimeout(timeoutId);
      abortRef.current = null;
      if (isMountedRef.current) setLoading(false);
    }
  }, [url, categories]);

  const handleFieldChange = useCallback((key, value) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const handleReset = useCallback(() => {
    setUrl("");
    setError(null);
    setResult(null);
    setDraft(null);
    setCategoryId("");
    setPublishError(null);
    setPublished(false);
  }, []);

  /**
   * Lleva el borrador al wizard para revisarlo paso a paso.
   *
   * El afiche se sube al storage ANTES de navegar, y se pasa la URL pública en
   * vez del base64. Dos motivos: `history.state` tiene un tope de unos pocos MB
   * en Chrome y Safari, y un base64 de 3 MB puede hacer fallar la navegación
   * entera; y el wizard ya sabe trabajar con URLs de imagen, no con base64.
   */
  const handleContinue = useCallback(async () => {
    if (!draft || continuing) return;
    setPublishError(null);
    setContinuing(true);

    let imagenSubida = "";
    try {
      if (draft.imagen_base64) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const file = base64ToFile(
            draft.imagen_base64,
            draft.imagen_mime || "image/jpeg",
          );
          imagenSubida = await uploadEventImage(file, user.id);
        }
      }
    } catch (imgErr) {
      // No bloquea la revisión: el admin puede subir la imagen en el wizard.
      console.warn("No se pudo subir el afiche antes de revisar:", imgErr);
    }

    if (!isMountedRef.current) return;
    setContinuing(false);

    // Se envía el borrador editado por el admin, no la salida cruda de la IA.
    // `imagen_base64` se excluye a propósito: ya está subida y pesa demasiado
    // para viajar en el state de la navegación.
    const { imagen_base64: _b64, imagen_mime: _mime, ...limpio } = draft;

    navigate("/publicar-panorama", {
      state: {
        iaData: {
          ...limpio,
          imagen_subida: imagenSubida,
          // La categoría que el admin eligió a mano gana sobre el match difuso
          // que el wizard haría por su cuenta con el texto de la IA.
          category_id_elegida: categoryId || "",
        },
      },
    });
  }, [draft, categoryId, continuing, navigate]);

  /**
   * Publica el panorama directamente, sin pasar por el wizard.
   *
   * Replica el flujo de admin de useEventSubmit: estado 'publicado', metadatos
   * de IA y expiración a 30 días. La imagen la trae la edge function en base64
   * (el CDN de Instagram bloquea CORS en el navegador) y se sube al storage
   * para que quede permanente.
   */
  const handlePublishDirect = useCallback(async () => {
    if (!draft || publishing) return;
    setPublishError(null);

    // Columnas NOT NULL de events: sin estos datos el insert falla.
    if (!draft.titulo?.trim()) {
      setPublishError("Falta el título del panorama.");
      return;
    }
    if (!categoryId) {
      setPublishError("Selecciona una categoría antes de publicar.");
      return;
    }
    if (!draft.fecha) {
      setPublishError(
        "Falta la fecha del panorama; complétala arriba antes de publicar.",
      );
      return;
    }

    const ubicacion = resolverUbicacionPorComuna(draft.comuna);
    if (!ubicacion) {
      setPublishError(
        "No se pudo determinar una comuna válida de la Región del Maule.",
      );
      return;
    }

    // El flujo normal exige al menos una imagen y el home se ve roto sin ella.
    if (!draft.imagen_base64) {
      setPublishError(
        "No se pudo recuperar el afiche de la publicación, y un panorama sin imagen se ve incompleto. Usa “Continuar y revisar” para subir una imagen a mano.",
      );
      return;
    }

    setPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
      }

      // Si la subida falla se aborta la publicación. Antes solo se registraba
      // un console.warn y el panorama se publicaba sin imagen mientras el
      // administrador veía "publicado con éxito".
      const file = base64ToFile(
        draft.imagen_base64,
        draft.imagen_mime || "image/jpeg",
      );
      let imagenes;
      try {
        imagenes = [await uploadEventImage(file, user.id)];
      } catch (imgErr) {
        console.error("No se pudo subir la imagen del panorama:", imgErr);
        throw new Error(
          `No se pudo subir el afiche al servidor, así que no se publicó nada. ${imgErr.message || "Inténtalo de nuevo."}`,
        );
      }

      const confianza = Number(draft.confianza);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const eventData = {
        user_id: user.id,
        titulo: draft.titulo.trim(),
        descripcion: draft.descripcion?.trim() || "",
        organizador: draft.organizador?.trim() || "Organizador",
        category_id: parseInt(categoryId, 10),
        fecha_evento: draft.fecha,
        fecha_fin: draft.fecha,
        hora_inicio: draft.hora_inicio || null,
        hora_fin: draft.hora_fin || null,
        provincia: ubicacion.provincia,
        comuna: ubicacion.comuna,
        direccion: draft.ubicacion?.trim() || null,
        // Deriva el tipo de entrada del precio en vez de fijarlo siempre en
        // "sin_entrada", que descartaba el precio que la IA sí había leído.
        ...derivarEntrada(draft),
        // Mismos normalizadores que el flujo del wizard: sin ellos el teléfono
        // y el Instagram se guardaban tal como los escupió el modelo.
        redes_sociales: normalizeSocialLinks({
          instagram: draft.instagram || "",
        }),
        telefono_contacto: normalizeOptionalChileanPhone(draft.telefono) || null,
        imagenes,
        estado: "publicado",
        tipo_publicacion: "normal",
        origen_publicacion: "gratuita",
        publication_expires_at: expiresAt.toISOString(),
        generado_por_ia: true,
        fuente_url: draft.url_original || null,
        ia_confianza: Number.isFinite(confianza)
          ? Math.min(100, Math.max(0, Math.round(confianza)))
          : null,
        ia_fecha_analisis: new Date().toISOString(),
      };

      // Sin esta opción no se crea ninguna notificación al publicar directo,
      // porque el estado ya es "publicado" y no hay nada pendiente que avisar.
      await createEvent(eventData, { notifyPublishedApproval: true });

      if (!isMountedRef.current) return;
      setPublished(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      setPublishError(err.message || "No se pudo publicar el panorama.");
    } finally {
      if (isMountedRef.current) setPublishing(false);
    }
  }, [draft, categoryId, publishing]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !loading) {
        e.preventDefault();
        handleAnalyze();
      }
    },
    [handleAnalyze, loading],
  );

  const confidence = useMemo(
    () => getConfidenceLevel(draft?.confianza),
    [draft?.confianza],
  );

  // Se filtra contra `draft`, no contra `result`: si el admin ya rellenó a mano
  // un dato que la IA no encontró, el aviso debe desaparecer.
  const missingInfo = (
    Array.isArray(result?.informacion_faltante)
      ? result.informacion_faltante.filter(Boolean)
      : []
  ).filter((aviso) => {
    const campo = EDITABLE_FIELDS.find(({ label }) =>
      normalizarTexto(aviso).startsWith(normalizarTexto(label)),
    );
    return !campo || !String(draft?.[campo.key] || "").trim();
  });

  const isRejected = Boolean(result) && !result.es_panorama;

  // El volcado de depuración excluye el afiche: son megabytes de base64 que se
  // regeneraban en cada pulsación de tecla, aunque el <details> esté cerrado.
  const resultParaDepurar = useMemo(() => {
    if (!result) return "";
    const { imagen_base64: b64, imagen_mime: mime, ...resto } = result;
    return JSON.stringify(
      { ...resto, imagen_base64: b64 ? `<${b64.length} caracteres>` : "", imagen_mime: mime },
      null,
      2,
    );
  }, [result]);

  return (
    <div className="admin-import-ia">
      <div className="admin-header">
        <div className="admin-header__content">
          <h1 className="admin-header__title">
            <FontAwesomeIcon icon={faRobot} />
            Importar panorama con IA
          </h1>
          <p className="admin-header__subtitle">
            Pega el enlace de una publicación pública de Instagram. La IA extrae
            los datos y tú los revisas antes de publicar.
          </p>
        </div>
      </div>

      {/* ===== Entrada de URL ===== */}
      <div className="admin-import-ia__panel">
        <label className="admin-import-ia__label" htmlFor="ia-url">
          URL de la publicación
          <span className="admin-import-ia__hint">
            Debe ser un post o reel público, por ejemplo
            https://www.instagram.com/p/AbC123/
          </span>
        </label>

        <div className="admin-import-ia__input-row">
          <div className="admin-import-ia__input-wrap">
            <input
              id="ia-url"
              className="admin-import-ia__input"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.instagram.com/p/XXXXXXXX/"
              disabled={loading}
            />
            {url && !loading && (
              <button
                type="button"
                className="admin-import-ia__clear"
                onClick={() => setUrl("")}
                aria-label="Limpiar URL">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="admin-import-ia__btn admin-import-ia__btn--primary"
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}>
            <FontAwesomeIcon icon={loading ? faSpinner : faRobot} spin={loading} />
            {loading ? "Analizando…" : "Analizar publicación"}
          </button>
        </div>

        {error && (
          <div
            className="admin-import-ia__alert admin-import-ia__alert--error"
            role="alert">
            <FontAwesomeIcon
              icon={faTimesCircle}
              className="admin-import-ia__alert-icon"
            />
            <div className="admin-import-ia__alert-body">
              <span>{error.mensaje}</span>
              {error.reintentable && (
                <button
                  type="button"
                  className="admin-import-ia__retry"
                  onClick={handleAnalyze}
                  disabled={loading}>
                  <FontAwesomeIcon icon={faRepeat} />
                  Reintentar
                </button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <ul className="admin-import-ia__steps" aria-live="polite">
            {ANALYSIS_STEPS.map((step, i) => {
              const state =
                i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
              return (
                <li
                  key={step}
                  className={`admin-import-ia__step admin-import-ia__step--${state}`}>
                  <span className="admin-import-ia__step-icon">
                    {state === "done" ? (
                      <FontAwesomeIcon icon={faCheck} />
                    ) : state === "active" ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {step}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ===== Resultado ===== */}
      {result && isRejected && (
        <div className="admin-import-ia__result">
          <div className="admin-import-ia__rejected">
            <FontAwesomeIcon
              icon={faTimesCircle}
              className="admin-import-ia__rejected-icon"
            />
            <h3>Esta publicación no es un panorama válido</h3>
            <p>
              {result.motivo_rechazo ||
                "La IA no encontró un evento o actividad en esta publicación."}
            </p>
            <button
              type="button"
              className="admin-import-ia__btn admin-import-ia__btn--ghost"
              onClick={handleReset}>
              <FontAwesomeIcon icon={faRepeat} />
              Analizar otra publicación
            </button>
          </div>
        </div>
      )}

      {draft && !isRejected && (
        <div className="admin-import-ia__result">
          <div className="admin-import-ia__result-head">
            <h2 className="admin-import-ia__result-title">
              <FontAwesomeIcon icon={faCheck} />
              Datos extraídos
            </h2>
            <span
              className={`admin-import-ia__badge admin-import-ia__badge--${confidence.key}`}>
              {confidence.value}% · {confidence.label}
            </span>
          </div>

          <div className="admin-import-ia__result-body">
            {/* Columna izquierda: imagen y enlace original */}
            <div className="admin-import-ia__preview">
              {draft.imagen_url ? (
                <img
                  className="admin-import-ia__preview-img"
                  src={draft.imagen_url}
                  alt="Imagen de la publicación de Instagram"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="admin-import-ia__preview-empty">
                  <FontAwesomeIcon icon={faImage} size="2x" />
                  <span>Sin imagen detectada</span>
                </div>
              )}

              {draft.url_original && (
                <a
                  className="admin-import-ia__source-link"
                  href={draft.url_original}
                  target="_blank"
                  rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  Ver publicación original
                </a>
              )}
            </div>

            {/* Columna derecha: confianza + campos editables */}
            <div>
              <div className="admin-import-ia__confidence">
                <div className="admin-import-ia__confidence-head">
                  <span className="admin-import-ia__confidence-label">
                    Confianza de la extracción
                  </span>
                  <span className="admin-import-ia__confidence-value">
                    {confidence.value}%
                  </span>
                </div>
                <div
                  className="admin-import-ia__confidence-track"
                  role="progressbar"
                  aria-valuenow={confidence.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Confianza de la extracción">
                  <div
                    className={`admin-import-ia__confidence-fill admin-import-ia__confidence-fill--${confidence.key}`}
                    style={{ width: `${Math.min(100, Math.max(0, confidence.value))}%` }}
                  />
                </div>
              </div>

              {result.ya_publicado && (
                <div className="admin-import-ia__alert admin-import-ia__alert--warning">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="admin-import-ia__alert-icon"
                  />
                  <div>
                    <strong className="admin-import-ia__alert-title">
                      Esta publicación ya se importó antes
                    </strong>
                    <span>
                      Existe el panorama “{result.ya_publicado.titulo}”
                      {result.ya_publicado.fecha
                        ? ` para el ${result.ya_publicado.fecha}`
                        : ""}
                      {result.ya_publicado.estado
                        ? ` (${result.ya_publicado.estado})`
                        : ""}
                      . Si continúas, quedarán dos panoramas del mismo evento.
                    </span>
                  </div>
                </div>
              )}

              {missingInfo.length > 0 && (
                <div className="admin-import-ia__alert admin-import-ia__alert--warning">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="admin-import-ia__alert-icon"
                  />
                  <div>
                    <strong className="admin-import-ia__alert-title">
                      La IA no encontró estos datos
                    </strong>
                    <ul>
                      {missingInfo.map((item, i) => (
                        <li key={`${item}-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="admin-import-ia__alert admin-import-ia__alert--info">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="admin-import-ia__alert-icon"
                />
                <span>
                  Puedes corregir cualquier campo aquí mismo. Al publicar
                  directamente se usan estos datos; con "Continuar y revisar"
                  se llevan al formulario.
                </span>
              </div>

              <div className="admin-import-ia__field" style={{ marginTop: 18 }}>
                <label
                  className="admin-import-ia__field-label"
                  htmlFor="ia-field-categoria">
                  Categoría
                  {!categoryId && (
                    <span className="admin-import-ia__field-missing">
                      requerida para publicar
                    </span>
                  )}
                </label>
                <select
                  id="ia-field-categoria"
                  className={`admin-import-ia__field-input${
                    !categoryId ? " admin-import-ia__field-input--empty" : ""
                  }`}
                  value={categoryId}
                  disabled={publishing || published}
                  onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {draft.categoria && (
                  <span className="admin-import-ia__hint">
                    Sugerencia de la IA: {draft.categoria}
                  </span>
                )}
              </div>

              <div className="admin-import-ia__fields" style={{ marginTop: 18 }}>
                {EDITABLE_FIELDS.map((field) => {
                  const value = draft[field.key] ?? "";
                  const isEmpty = !String(value).trim();
                  const inputId = `ia-field-${field.key}`;
                  return (
                    <div
                      key={field.key}
                      className={`admin-import-ia__field${
                        field.full ? " admin-import-ia__field--full" : ""
                      }`}>
                      <label
                        className="admin-import-ia__field-label"
                        htmlFor={inputId}>
                        {field.label}
                        {isEmpty && (
                          <span className="admin-import-ia__field-missing">
                            sin detectar
                          </span>
                        )}
                      </label>
                      {field.textarea ? (
                        <textarea
                          id={inputId}
                          className={`admin-import-ia__field-textarea${
                            isEmpty ? " admin-import-ia__field-textarea--empty" : ""
                          }`}
                          value={value}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          disabled={publishing || published}
                        />
                      ) : (
                        <input
                          id={inputId}
                          type={field.type || "text"}
                          className={`admin-import-ia__field-input${
                            isEmpty ? " admin-import-ia__field-input--empty" : ""
                          }`}
                          value={value}
                          onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                          }
                          disabled={publishing || published}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="admin-import-ia__result-foot">
            {published ? (
              <>
                <div className="admin-import-ia__alert admin-import-ia__alert--success">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="admin-import-ia__alert-icon"
                  />
                  <span>
                    ¡Panorama publicado! Ya está visible para todos.
                  </span>
                </div>
                <div className="admin-import-ia__foot-actions">
                  <button
                    type="button"
                    className="admin-import-ia__btn admin-import-ia__btn--ghost"
                    onClick={handleReset}>
                    <FontAwesomeIcon icon={faRepeat} />
                    Importar otra
                  </button>
                  {onGoToPublications && (
                    <button
                      type="button"
                      className="admin-import-ia__btn admin-import-ia__btn--primary"
                      onClick={onGoToPublications}>
                      Ver en publicaciones
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="admin-import-ia__foot-note">
                  Publica directamente con los datos de arriba, o llévalos al
                  formulario completo para afinar más detalles.
                </p>

                {publishError && (
                  <div
                    className="admin-import-ia__alert admin-import-ia__alert--error"
                    role="alert">
                    <FontAwesomeIcon
                      icon={faTimesCircle}
                      className="admin-import-ia__alert-icon"
                    />
                    <span>{publishError}</span>
                  </div>
                )}

                <div className="admin-import-ia__foot-actions">
                  <button
                    type="button"
                    className="admin-import-ia__btn admin-import-ia__btn--ghost"
                    onClick={handleReset}
                    disabled={publishing}>
                    <FontAwesomeIcon icon={faRepeat} />
                    Analizar otra
                  </button>
                  <button
                    type="button"
                    className="admin-import-ia__btn admin-import-ia__btn--secondary"
                    onClick={handleContinue}
                    disabled={publishing}>
                    Continuar y revisar
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                  <button
                    type="button"
                    className="admin-import-ia__btn admin-import-ia__btn--primary"
                    onClick={handlePublishDirect}
                    disabled={publishing}>
                    <FontAwesomeIcon
                      icon={publishing ? faSpinner : faPaperPlane}
                      spin={publishing}
                    />
                    {publishing ? "Publicando…" : "Publicar ahora"}
                  </button>
                </div>
              </>
            )}
          </div>

          <details className="admin-import-ia__raw">
            <summary>Ver respuesta completa de la IA (depuración)</summary>
            <pre>{resultParaDepurar}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
