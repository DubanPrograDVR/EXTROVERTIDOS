import { normalizeLineEndings } from "./textWrap";

/**
 * Regex para detectar URLs http/https y direcciones que empiezan por `www.`.
 * - Captura hasta encontrar un espacio o salto de línea.
 * - Quita signos de puntuación al final (`.`, `,`, `)`, `!`, `?`, `;`, `:`)
 *   para que "Visita https://foo.com." no incluya el punto en el link.
 */
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const TRAILING_PUNCT = /[.,)\]!?;:]+$/;

/**
 * Convierte un fragmento de texto plano en un array de nodos React,
 * reemplazando URLs por <a> clicables (target=_blank, rel seguro).
 */
function linkify(text, keyPrefix) {
  if (!text) return [text];

  const nodes = [];
  let lastIndex = 0;
  let match;
  let i = 0;
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;

    // Recortar puntuación final que no debería ser parte del link.
    let url = raw;
    let trailing = "";
    const trailMatch = url.match(TRAILING_PUNCT);
    if (trailMatch) {
      trailing = trailMatch[0];
      url = url.slice(0, -trailing.length);
    }

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const href = url.startsWith("http") ? url : `https://${url}`;
    nodes.push(
      <a
        key={`${keyPrefix}-link-${i}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="rich-text__link">
        {url}
      </a>,
    );

    if (trailing) nodes.push(trailing);
    lastIndex = start + raw.length;
    i += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Renderiza un texto plano con tres reglas:
 * - Líneas en blanco (`\n\n` o más) → nuevo párrafo (<p>).
 * - Saltos simples (`\n`) → <br /> dentro del párrafo.
 * - URLs (`http://`, `https://`, `www.`) → <a> clicable.
 *
 * Mantiene compatibilidad con `white-space: pre-wrap` (no requiere CSS especial),
 * pero queda más legible cuando hay listas o párrafos largos.
 *
 * @param {string|null|undefined} text
 * @param {{ keyPrefix?: string }} [options]
 * @returns {React.ReactNode}
 */
export function renderRichText(text, options = {}) {
  const { keyPrefix = "rt" } = options;
  if (text == null) return null;
  const normalized = normalizeLineEndings(String(text));
  if (!normalized) return null;

  const paragraphs = normalized.split(/\n{2,}/);

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n");
    const inner = [];
    lines.forEach((line, lIdx) => {
      const linked = linkify(line, `${keyPrefix}-${pIdx}-${lIdx}`);
      linked.forEach((node, nIdx) => {
        if (typeof node === "string") {
          inner.push(
            <span key={`${keyPrefix}-${pIdx}-${lIdx}-t-${nIdx}`}>{node}</span>,
          );
        } else {
          inner.push(node);
        }
      });
      if (lIdx < lines.length - 1) {
        inner.push(<br key={`${keyPrefix}-${pIdx}-${lIdx}-br`} />);
      }
    });
    return <p key={`${keyPrefix}-${pIdx}`}>{inner}</p>;
  });
}

/**
 * Versión "plana": devuelve un único nodo con saltos `<br>` y enlaces, sin
 * dividir en párrafos. Útil para campos cortos (marketing) donde no queremos
 * separación extra entre líneas.
 */
export function renderRichLine(text, options = {}) {
  const { keyPrefix = "rl" } = options;
  if (text == null) return null;
  const normalized = normalizeLineEndings(String(text));
  if (!normalized) return null;

  const lines = normalized.split("\n");
  const out = [];
  lines.forEach((line, lIdx) => {
    const linked = linkify(line, `${keyPrefix}-${lIdx}`);
    linked.forEach((node, nIdx) => {
      if (typeof node === "string") {
        out.push(<span key={`${keyPrefix}-${lIdx}-t-${nIdx}`}>{node}</span>);
      } else {
        out.push(node);
      }
    });
    if (lIdx < lines.length - 1) {
      out.push(<br key={`${keyPrefix}-${lIdx}-br`} />);
    }
  });
  return out;
}
