import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * Compara dos valores de columna por VALOR (no por referencia).
 *
 * Los campos array/JSONB (ej: imagenes, redes_sociales, galeria) llegan en cada
 * payload de Realtime como referencias nuevas, por lo que `!==` los marcaría
 * como cambiados aunque su contenido sea idéntico. JSON.stringify los compara
 * por contenido; los primitivos caen en el `===` inicial.
 */
function valuesEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Devuelve los nombres de columnas que REALMENTE cambiaron entre `payload.old`
 * y `payload.new` de un evento UPDATE de Supabase Realtime, comparando por valor.
 *
 * Necesario porque las tablas usan REPLICA IDENTITY FULL: el payload trae todas
 * las columnas, y las de tipo array/JSONB siempre tendrían referencias distintas
 * en una comparación ingenua con `!==`, produciendo falsos positivos.
 *
 * @param {Object} payload - Payload de postgres_changes (eventType "UPDATE").
 * @returns {string[]} Columnas cuyo valor cambió de verdad.
 */
export function getChangedColumns(payload) {
  const next = payload?.new ?? {};
  const prev = payload?.old ?? {};
  return Object.keys(next).filter((key) => !valuesEqual(next[key], prev[key]));
}

/**
 * Hook que suscribe a cambios en tiempo real de una tabla de Supabase
 * y ejecuta un refetch (debounced) cuando hay cambios relevantes.
 *
 * Usa Supabase Realtime (WebSocket) bajo el capó. Respeta RLS.
 *
 * @param {Object} params
 * @param {string} params.table - Nombre de la tabla a observar (ej: "events").
 * @param {Function} params.onChange - Callback a ejecutar cuando hay un cambio.
 * @param {string} [params.event] - "INSERT" | "UPDATE" | "DELETE" | "*" (default: "*").
 * @param {string} [params.filter] - Filtro opcional Postgres (ej: "user_id=eq.xxx").
 * @param {boolean} [params.enabled] - Si la suscripción está activa (default: true).
 * @param {number} [params.debounceMs] - Tiempo de debounce en ms (default: 500).
 */
export function useRealtimeRefetch({
  table,
  onChange,
  event = "*",
  filter,
  enabled = true,
  debounceMs = 500,
}) {
  // Mantener referencia estable al callback sin mutar durante el render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled || !table) return undefined;

    let debounceTimer = null;
    const triggerRefetch = (payload) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onChangeRef.current?.(payload);
      }, debounceMs);
    };

    const channelName = `realtime:${table}:${filter || "all"}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);

    const config = {
      event,
      schema: "public",
      table,
    };
    if (filter) config.filter = filter;

    channel.on("postgres_changes", config, triggerRefetch).subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, enabled, debounceMs]);
}
