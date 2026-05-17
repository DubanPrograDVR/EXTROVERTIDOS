/**
 * Utilidad de "word wrap" tipo Word para campos de texto largos.
 *
 * Reglas:
 * - Cada línea (delimitada por saltos manuales `\n`) se reflowea para que
 *   ningún renglón supere `MAX_LINE_LENGTH` caracteres.
 * - El corte se intenta SIEMPRE en un espacio (no parte palabras).
 * - Si una palabra es más larga que el límite, se rompe forzosamente
 *   (ej. una URL de 200 caracteres pegada sin espacios).
 * - Los saltos de línea manuales que escribió el usuario se respetan.
 * - CRLF (`\r\n`) y CR (`\r`) se normalizan a `\n` (texto pegado desde Word
 *   o Windows).
 *
 * Esto evita que el navegador parta palabras a mitad ("co" / "rrer") en el
 * textarea y garantiza que el valor guardado en BD se vea idéntico en el
 * borrador y en la publicación final, siempre que se renderice con
 * `white-space: pre-wrap`.
 */

export const MAX_LINE_LENGTH = 0;

/**
 * Normaliza saltos de línea a `\n`. Único punto de verdad para sanitizar
 * entrada que puede venir de paste, BD legada o del SO.
 *
 * Además remueve caracteres invisibles (zero-width space/joiner, BOM) y
 * convierte los separadores Unicode `\u2028` y `\u2029` a `\n`. NO toca
 * el NBSP (`\u00A0`) ni colapsa saltos consecutivos: para limpieza más
 * agresiva (texto pegado desde Word/Notion) usar `sanitizePastedText`.
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeLineEndings(text) {
  if (typeof text !== "string" || text.length === 0) return text ?? "";
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/**
 * Limpieza más agresiva pensada para texto pegado desde Word/Notion/Docs:
 * - Normaliza saltos de línea (CRLF/CR/LS/PS → LF).
 * - Convierte NBSP (`\u00A0`) y otros espacios "raros" a un espacio normal.
 * - Colapsa 3+ saltos de línea consecutivos a 2 (máximo un párrafo en blanco).
 * - Recorta espacios al final de cada línea.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizePastedText(text) {
  if (typeof text !== "string" || text.length === 0) return text ?? "";
  return normalizeLineEndings(text)
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Campos del formulario a los que se les aplica el wrap automático.
 * Ajustar aquí si se quiere agregar o quitar algún campo.
 */
export const WRAP_FIELDS = new Set([
  "descripcion",
  "mensaje_marketing",
  "mensaje_marketing_2",
]);

/**
 * Envuelve una sola línea (sin `\n` interno) respetando palabras.
 * Devuelve un array de líneas.
 */
function wrapSingleLine(line, maxLen) {
  if (line.length <= maxLen) return [line];

  const out = [];
  let remaining = line;

  while (remaining.length > maxLen) {
    // Buscar el último espacio dentro del límite para cortar ahí.
    const breakAt = remaining.lastIndexOf(" ", maxLen);

    if (breakAt <= 0) {
      // No hay espacio aprovechable: la palabra es más larga que maxLen.
      // Corte duro en maxLen.
      out.push(remaining.slice(0, maxLen));
      remaining = remaining.slice(maxLen);
    } else {
      // Corte en el espacio: el espacio se "consume" como salto.
      out.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt + 1);
    }
  }

  out.push(remaining);
  return out;
}

/**
 * Aplica el wrap a un texto completo, preservando los `\n` que ya existían.
 * Normaliza CRLF a LF antes de procesar.
 *
 * @param {string} text
 * @param {number} [maxLen=MAX_LINE_LENGTH]
 * @returns {string}
 */
export function wrapText(text, maxLen = MAX_LINE_LENGTH) {
  if (typeof text !== "string" || text.length === 0) return text ?? "";

  // Siempre normalizamos CRLF/CR a LF aunque el wrap esté deshabilitado.
  // Si no, un `\r\n` pegado desde Word/Windows hace que `white-space: pre-wrap`
  // pinte DOS saltos de línea (rompe la coherencia entre borrador y publicación).
  const normalized = normalizeLineEndings(text);

  if (!Number.isFinite(maxLen) || maxLen <= 0) return normalized;

  return normalized
    .split("\n")
    .flatMap((line) => wrapSingleLine(line, maxLen))
    .join("\n");
}

/**
 * Aplica el wrap y además calcula la nueva posición del cursor para que
 * al escribir en vivo el caret no salte al final del textarea.
 *
 * @param {string} text
 * @param {number} cursor Posición original del caret (selectionStart).
 * @param {number} [maxLen=MAX_LINE_LENGTH]
 * @returns {{ text: string, cursor: number }}
 */
export function wrapTextWithCursor(text, cursor, maxLen = MAX_LINE_LENGTH) {
  if (typeof text !== "string" || text.length === 0) {
    return { text: text ?? "", cursor: cursor ?? 0 };
  }

  // Normalizar CRLF antes de procesar; ajusta el cursor en la diferencia.
  // Lo hacemos SIEMPRE, incluso si el wrap por largo está deshabilitado, para
  // evitar que un `\r\n` se renderice como dos saltos de línea.
  const normalized = normalizeLineEndings(text);
  const removed = text.length - normalized.length;
  const safeCursor = (() => {
    const raw =
      typeof cursor === "number" && cursor >= 0 ? cursor : text.length;
    // Cuenta cuántos `\r` había antes del caret y restalos.
    if (removed === 0) return raw;
    let crBefore = 0;
    for (let i = 0; i < Math.min(raw, text.length); i++) {
      if (text.charCodeAt(i) === 13 /* \r */) crBefore++;
    }
    return Math.max(0, raw - crBefore);
  })();

  if (!Number.isFinite(maxLen) || maxLen <= 0) {
    return { text: normalized, cursor: safeCursor };
  }

  let result = "";
  let newCursor = safeCursor;
  let pos = 0; // posición en el texto NORMALIZADO ya consumida

  const lines = normalized.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let remaining = lines[i];

    while (remaining.length > maxLen) {
      const breakAt = remaining.lastIndexOf(" ", maxLen);

      if (breakAt <= 0) {
        // Corte duro: insertamos un `\n` extra → +1 carácter.
        result += remaining.slice(0, maxLen) + "\n";
        const insertOriginalPos = pos + maxLen;
        if (safeCursor >= insertOriginalPos) newCursor++;
        remaining = remaining.slice(maxLen);
        pos += maxLen;
      } else {
        // Corte blando: el espacio se reemplaza por `\n` → mismo largo.
        result += remaining.slice(0, breakAt) + "\n";
        remaining = remaining.slice(breakAt + 1);
        pos += breakAt + 1;
      }
    }

    result += remaining;
    pos += remaining.length;

    if (i < lines.length - 1) {
      result += "\n";
      pos += 1; // el `\n` original
    }
  }

  // Clamp final por seguridad
  if (newCursor < 0) newCursor = 0;
  if (newCursor > result.length) newCursor = result.length;

  return { text: result, cursor: newCursor };
}

/**
 * Helper para usarse dentro de `handleChange` de inputs/textareas.
 *
 * - Si el campo no requiere wrap, devuelve el valor original.
 * - Si requiere wrap: devuelve el valor envuelto y agenda un
 *   `setSelectionRange` para restaurar el caret tras el re-render.
 *
 * Uso:
 *   const handleChange = (e) => {
 *     const { name, value } = applyWrapToInputEvent(e);
 *     setFormData((prev) => ({ ...prev, [name]: value }));
 *   };
 *
 * @param {Event & { target: HTMLTextAreaElement | HTMLInputElement }} e
 * @param {Set<string>} [fields=WRAP_FIELDS]
 * @param {number} [maxLen=MAX_LINE_LENGTH]
 */
export function applyWrapToInputEvent(
  e,
  fields = WRAP_FIELDS,
  maxLen = MAX_LINE_LENGTH,
) {
  const target = e?.target;
  if (!target) return { name: undefined, value: undefined, type: undefined };

  const { name, value, type } = target;

  if (!name || !fields.has(name) || typeof value !== "string") {
    return { name, value, type };
  }

  // No tocar el valor mientras el usuario está componiendo (IME / dead keys
  // para acentos en macOS, autosuggest móvil, etc.). Reflowear ahí rompe el
  // input. Cuando termina la composición, React vuelve a disparar `onChange`
  // con `isComposing=false` y ahí sí aplicamos el wrap.
  if (e?.nativeEvent?.isComposing || target.isComposing) {
    return { name, value, type };
  }

  const sel =
    typeof target.selectionStart === "number"
      ? target.selectionStart
      : value.length;

  const { text, cursor } = wrapTextWithCursor(value, sel, maxLen);

  if (text === value) {
    return { name, value, type };
  }

  // Restaurar caret tras el flush de React.
  // setTimeout(0) corre después de que React aplica el nuevo `value` al DOM.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      try {
        if (document.activeElement === target) {
          target.setSelectionRange(cursor, cursor);
        }
      } catch {
        /* noop */
      }
    }, 0);
  }

  return { name, value: text, type };
}

/**
 * Variante para inputs no-controlados via evento (usada en onChange inline).
 * Devuelve sólo el valor (envuelto si corresponde).
 */
export function maybeWrapFieldValue(name, value, maxLen = MAX_LINE_LENGTH) {
  if (!name || !WRAP_FIELDS.has(name) || typeof value !== "string") {
    return value;
  }
  return wrapText(value, maxLen);
}

/**
 * Capa defensiva: aplica `wrapText` a todos los campos definidos en
 * `WRAP_FIELDS` justo antes de persistir el objeto en BD. Garantiza que
 * el valor guardado siempre cumple la regla aunque haya entrado por una
 * ruta no controlada (paste programático, datos legados, hidratación de
 * borrador, etc.).
 *
 * @template {Record<string, unknown>} T
 * @param {T} payload
 * @param {Set<string>} [fields=WRAP_FIELDS]
 * @param {number} [maxLen=MAX_LINE_LENGTH]
 * @returns {T}
 */
const SOCIAL_BASE_URLS = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/",
  twitter: "https://x.com/",
  linkedin: "https://linkedin.com/company/",
};

const SOCIAL_PROFILE_KEYS = new Set([
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "twitter",
  "linkedin",
]);

const SOCIAL_DOMAIN_PATTERN = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i;

const normalizeHostname = (hostname) =>
  String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");

const looksLikeUrlWithoutProtocol = (value) =>
  SOCIAL_DOMAIN_PATTERN.test(value);

const buildAbsoluteUrlCandidate = (value) => {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (looksLikeUrlWithoutProtocol(value)) return `https://${value}`;
  return null;
};

const removeDuplicateHostSegments = (url) => {
  const host = normalizeHostname(url.hostname);
  const segments = url.pathname.split("/").filter(Boolean);

  while (segments.length > 0 && normalizeHostname(segments[0]) === host) {
    segments.shift();
  }

  url.pathname = segments.length > 0 ? `/${segments.join("/")}` : "/";
  return url;
};

const normalizeAbsoluteSocialUrl = (value) => {
  const candidate = buildAbsoluteUrlCandidate(value);
  if (!candidate) return "";

  try {
    const url = removeDuplicateHostSegments(new URL(candidate));
    url.hash = "";
    return url.toString();
  } catch {
    return candidate;
  }
};

const normalizeSocialHandle = (value) =>
  value.trim().replace(/^@+/, "").replace(/^\/+/, "");

const getChileanPhoneDigits = (value) => {
  if (typeof value !== "string") return "";
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0056")) digits = digits.slice(4);
  else if (digits.startsWith("56")) digits = digits.slice(2);
  return digits.slice(0, 9);
};

const isPhonePrefixOnly = (value) => {
  const digits = getChileanPhoneDigits(value);
  return digits === "" || digits === "9";
};

/**
 * Construye una URL completa para un perfil de red social.
 *
 * - Si ya es URL absoluta, la normaliza y la usa tal cual.
 * - Si es URL sin protocolo, por ejemplo "facebook.com/pagina", antepone
 *   "https://" sin volver a agregar el dominio base.
 * - Si ya viene duplicada como "facebook.com/facebook.com/pagina", elimina el
 *   segmento repetido del host.
 * - En caso contrario se trata como handle/username y se combina con baseUrl.
 *
 * @param {string} value   - Valor almacenado (handle o URL completa).
 * @param {string} baseUrl - URL base para handles, ej. "https://facebook.com/".
 * @returns {string}
 */
export function buildSocialUrl(value, baseUrl) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const absoluteUrl = normalizeAbsoluteSocialUrl(trimmed);
  if (absoluteUrl) return absoluteUrl;

  return `${baseUrl}${normalizeSocialHandle(trimmed)}`;
}

/**
 * Normaliza un valor de red social antes de persistirlo.
 * Acepta handles, URLs completas y URLs sin protocolo, evitando dominios
 * duplicados como "facebook.com/facebook.com".
 */
export function normalizeSocialProfileValue(value, network) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (network === "whatsapp") {
    if (isPhonePrefixOnly(trimmed)) return "";
    return formatChileanPhone(trimmed);
  }

  if (!SOCIAL_PROFILE_KEYS.has(network)) return trimmed;

  const absoluteUrl = normalizeAbsoluteSocialUrl(trimmed);
  if (absoluteUrl) return absoluteUrl;

  return normalizeSocialHandle(trimmed);
}

export function normalizeSocialLinks(links, { preserveEmpty = false } = {}) {
  if (!links || typeof links !== "object") return {};
  return Object.entries(links).reduce((acc, [network, value]) => {
    const normalized = normalizeSocialProfileValue(value, network);
    if (normalized || preserveEmpty) acc[network] = normalized;
    return acc;
  }, {});
}

export function wrapPersistedFields(
  payload,
  fields = WRAP_FIELDS,
  maxLen = MAX_LINE_LENGTH,
) {
  if (!payload || typeof payload !== "object") return payload;
  const out = { ...payload };
  for (const key of fields) {
    const v = out[key];
    if (typeof v === "string" && v.length > 0) {
      out[key] = wrapText(v, maxLen);
    }
  }
  return out;
}

/**
 * Formatea un número de teléfono como número móvil chileno: +56 9 XXXX XXXX
 *
 * - Extrae solo dígitos del valor ingresado.
 * - Elimina el prefijo de país si el usuario lo escribió (56 o 0056).
 * - Limita a 9 dígitos (prefijo 9 + 8 dígitos del número).
 * - Retorna el número formateado en tiempo real conforme el usuario escribe.
 *
 * Ejemplos:
 *   ""            → ""
 *   "9"           → "+56 9"
 *   "912345"      → "+56 9 1234 5"
 *   "912345678"   → "+56 9 1234 5678"
 *
 * @param {string} raw - Valor tal cual viene del input.
 * @returns {string}
 */
export function formatChileanPhone(raw) {
  if (typeof raw !== "string") return "";
  const digits = getChileanPhoneDigits(raw);
  if (digits.length === 0) return "";
  let result = "+56 ";
  if (digits.length <= 1) {
    result += digits;
  } else if (digits.length <= 5) {
    result += digits[0] + " " + digits.slice(1);
  } else {
    result += digits[0] + " " + digits.slice(1, 5) + " " + digits.slice(5);
  }
  return result;
}

export function normalizeOptionalChileanPhone(raw) {
  if (typeof raw !== "string") return "";
  const digits = getChileanPhoneDigits(raw);
  if (digits.length !== 9) return "";
  return formatChileanPhone(digits).trim();
}
