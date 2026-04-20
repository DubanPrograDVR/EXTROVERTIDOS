import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRealtimeRefetch } from "./useRealtimeRefetch";

/**
 * Cuenta en tiempo real las solicitudes pendientes del panel de administración:
 * - Panoramas con estado "pendiente"
 * - Panoramas con estado "en_revision"
 * - Negocios con estado "pendiente"
 * - Negocios con estado "en_revision"
 *
 * Se actualiza vía WebSocket (Supabase Realtime) cuando hay cambios en
 * las tablas `events` o `businesses`.
 *
 * @param {boolean} enabled - Si false, no ejecuta consultas ni suscripciones.
 * @returns {{ total: number, pendingEvents: number, reviewEvents: number,
 *             pendingBusinesses: number, reviewBusinesses: number }}
 */
export function useAdminPendingCount(enabled) {
  const [counts, setCounts] = useState({
    pendingEvents: 0,
    reviewEvents: 0,
    pendingBusinesses: 0,
    reviewBusinesses: 0,
  });

  const loadCounts = useCallback(async () => {
    if (!enabled) return;
    try {
      const [evPending, evReview, bizPending, bizReview] = await Promise.all([
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente"),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("estado", "en_revision"),
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente"),
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("estado", "en_revision"),
      ]);

      setCounts({
        pendingEvents: evPending.count || 0,
        reviewEvents: evReview.count || 0,
        pendingBusinesses: bizPending.count || 0,
        reviewBusinesses: bizReview.count || 0,
      });
    } catch (err) {
      console.warn("Error cargando contadores admin:", err);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) loadCounts();
  }, [enabled, loadCounts]);

  useRealtimeRefetch({
    table: "events",
    event: "*",
    enabled,
    onChange: loadCounts,
  });
  useRealtimeRefetch({
    table: "businesses",
    event: "*",
    enabled,
    onChange: loadCounts,
  });

  return {
    ...counts,
    total:
      counts.pendingEvents +
      counts.reviewEvents +
      counts.pendingBusinesses +
      counts.reviewBusinesses,
  };
}

export default useAdminPendingCount;
