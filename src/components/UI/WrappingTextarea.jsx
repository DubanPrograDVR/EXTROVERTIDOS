import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  MAX_LINE_LENGTH,
  normalizeLineEndings,
  sanitizePastedText,
  wrapTextWithCursor,
} from "../../lib/textWrap";

/**
 * Textarea con word-wrap automático tipo Word.
 *
 * - Inserta `\n` reales en el límite de palabra al alcanzar `maxLineLength`
 *   (por defecto 76).
 * - Preserva el caret aunque se inserten saltos.
 * - Respeta la composición IME (acentos en macOS, autosuggest móvil): NO
 *   reflowea hasta que la composición termina.
 * - Normaliza CRLF/CR a LF en input y paste; sanitiza NBSP/ZWSP en paste.
 * - Soporta auto-resize: la altura del textarea crece con el contenido
 *   (entre `min-height` del CSS y `maxHeight` opcional).
 *
 * Es controlado: recibe `value` y emite `onChange(nextValue, eventoOriginal)`.
 */
const WrappingTextarea = forwardRef(function WrappingTextarea(
  {
    value,
    onChange,
    maxLineLength = MAX_LINE_LENGTH,
    autoResize = true,
    maxHeight = 600,
    onCompositionStart,
    onCompositionEnd,
    onPaste,
    style,
    ...rest
  },
  forwardedRef,
) {
  const internalRef = useRef(null);
  const isComposingRef = useRef(false);

  // Permite que el padre obtenga el nodo aunque mantengamos uno interno.
  const setRefs = useCallback(
    (node) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  // Recalcular altura cuando cambia el valor controlado.
  const adjustHeight = useCallback(() => {
    const node = internalRef.current;
    if (!node || !autoResize) return;
    // Reset y volver a medir; el min-height lo aplica el CSS.
    node.style.height = "auto";
    const next = Math.min(node.scrollHeight, maxHeight);
    node.style.height = `${next}px`;
    node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [autoResize, maxHeight]);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    if (!autoResize) return undefined;
    const handler = () => adjustHeight();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [autoResize, adjustHeight]);

  const handleChange = useCallback(
    (e) => {
      const target = e.target;
      const raw = target.value;

      // Mientras componés (acento muerto, IME, autosuggest) no tocamos nada;
      // el navegador necesita los caracteres tal cual los está formando.
      if (isComposingRef.current || e.nativeEvent?.isComposing) {
        onChange?.(raw, e);
        return;
      }

      const sel =
        typeof target.selectionStart === "number"
          ? target.selectionStart
          : raw.length;

      const { text, cursor } = wrapTextWithCursor(raw, sel, maxLineLength);

      onChange?.(text, e);

      if (text !== raw && typeof window !== "undefined") {
        // Restaurar el caret tras el commit de React.
        window.setTimeout(() => {
          const node = internalRef.current;
          if (node && document.activeElement === node) {
            try {
              node.setSelectionRange(cursor, cursor);
            } catch {
              /* noop */
            }
          }
        }, 0);
      }
    },
    [onChange, maxLineLength],
  );

  const handleCompositionStart = useCallback(
    (e) => {
      isComposingRef.current = true;
      onCompositionStart?.(e);
    },
    [onCompositionStart],
  );

  const handleCompositionEnd = useCallback(
    (e) => {
      isComposingRef.current = false;
      onCompositionEnd?.(e);

      // Al terminar la composición, reflowear con el valor final.
      const node = internalRef.current;
      if (!node) return;
      const raw = node.value;
      const sel =
        typeof node.selectionStart === "number"
          ? node.selectionStart
          : raw.length;
      const { text, cursor } = wrapTextWithCursor(raw, sel, maxLineLength);
      if (text !== raw) {
        onChange?.(text, e);
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            if (document.activeElement === node) {
              try {
                node.setSelectionRange(cursor, cursor);
              } catch {
                /* noop */
              }
            }
          }, 0);
        }
      }
    },
    [onChange, onCompositionEnd, maxLineLength],
  );

  const handlePaste = useCallback(
    (e) => {
      onPaste?.(e);
      if (e.defaultPrevented) return;

      const clipboard = e.clipboardData;
      if (!clipboard) return;

      const pasted = clipboard.getData("text");
      if (!pasted) return;

      // Sanitización completa para texto pegado: CRLF/LS/PS → LF, NBSP →
      // espacio, zero-width invisibles fuera, colapsa 3+ saltos. Esto
      // arregla pasteos desde Word/Notion/Docs sin afectar el typing.
      const cleaned = sanitizePastedText(pasted);

      e.preventDefault();
      const node = internalRef.current;
      if (!node) return;

      const start = node.selectionStart ?? node.value.length;
      const end = node.selectionEnd ?? start;
      const before = node.value.slice(0, start);
      const after = node.value.slice(end);
      const merged = before + cleaned + after;
      const newCaret = before.length + cleaned.length;

      const { text, cursor } = wrapTextWithCursor(
        merged,
        newCaret,
        maxLineLength,
      );
      onChange?.(text, e);

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          if (document.activeElement === node) {
            try {
              node.setSelectionRange(cursor, cursor);
            } catch {
              /* noop */
            }
          }
        }, 0);
      }
    },
    [onChange, onPaste, maxLineLength],
  );

  // No tocar resize si el padre lo deshabilitó vía style; si autoResize está
  // activo, pasar overflow a 'hidden' por defecto para que el adjust se vea.
  const mergedStyle = autoResize
    ? { resize: "none", overflowY: "hidden", ...style }
    : style;

  return (
    <textarea
      {...rest}
      ref={setRefs}
      value={value ?? ""}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onPaste={handlePaste}
      style={mergedStyle}
    />
  );
});

// Re-export para conveniencia de quienes ya importan WrappingTextarea
export { normalizeLineEndings };
export default WrappingTextarea;
