import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRealtimeRefetch } from "./useRealtimeRefetch";

/**
 * Cuenta en tiempo real las notificaciones no leídas del usuario.
 * Se actualiza por WebSocket cuando hay INSERT/UPDATE/DELETE en `notifications`
 * del propio usuario.
 *
 * @param {string|undefined|null} userId - ID del usuario autenticado.
 * @returns {number} Cantidad de notificaciones no leídas.
 */
export function useUnreadNotificationsCount(userId) {
  const [count, setCount] = useState(0);
  const enabled = Boolean(userId);

  const loadCount = useCallback(async () => {
    if (!userId) return;
    const { count: total, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      console.warn("Error contando notificaciones:", error);
      return;
    }
    setCount(total || 0);
  }, [userId]);

  useEffect(() => {
    if (enabled) loadCount();
    else setCount(0);
  }, [enabled, loadCount]);

  useRealtimeRefetch({
    table: "notifications",
    event: "*",
    enabled,
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onChange: loadCount,
  });

  return count;
}

export default useUnreadNotificationsCount;
