import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
