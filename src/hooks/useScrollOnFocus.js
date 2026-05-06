import { useCallback } from "react";

const FOCUSABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Devuelve un handler `onFocus` para colocar en un contenedor de formulario.
 * Cuando el usuario enfoca un input / textarea / select / custom-dropdown__trigger
 * dentro del contenedor, hace scroll automático para que el campo quede visible.
 *
 * Uso en formularios de página completa (block: 'center' por defecto):
 *   const onFocusScroll = useScrollOnFocus();
 *   <form onFocus={onFocusScroll}>
 *
 * Uso en modales (sólo scrollea si el campo no es visible):
 *   const onFocusScroll = useScrollOnFocus({ block: 'nearest' });
 *   <div onFocus={onFocusScroll}>
 *
 * @param {object} [options]
 * @param {'center'|'nearest'|'start'|'end'} [options.block='center']
 */
export function useScrollOnFocus({ block = "center" } = {}) {
  return useCallback(
    (e) => {
      const el = e.target;
      if (
        FOCUSABLE_TAGS.has(el.tagName) ||
        el.classList.contains("custom-dropdown__trigger")
      ) {
        el.scrollIntoView({ behavior: "smooth", block });
      }
    },
    [block],
  );
}
