/**
 * @fileoverview Hook React para obtener la visibilidad combinada de planes.
 * Lee los tres toggles (global, Panoramas, Superguía) desde app_settings y
 * expone la visibilidad efectiva ya derivada según la invariante mutuamente
 * excluyente:
 *
 *   panoramasVisible = planes_enabled || panoramas_enabled
 *   superguiaVisible = planes_enabled || superguia_enabled
 *
 * Cualquier consumidor que antes leía `isPlanesEnabled()` debería migrar a
 * este hook (o a `getPlansVisibility()` para código fuera de React).
 */

import { useEffect, useState } from "react";
import { getPlansVisibility } from "../lib/database";

const INITIAL_STATE = {
  globalEnabled: true,
  panoramasEnabled: false,
  superguiaEnabled: false,
  panoramasVisible: true,
  superguiaVisible: true,
  anyVisible: true,
};

export function usePlansVisibility() {
  const [state, setState] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const visibility = await getPlansVisibility();
        if (!cancelled) setState(visibility);
      } catch (err) {
        console.warn("[usePlansVisibility] Error al obtener visibilidad:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, loading };
}

export default usePlansVisibility;
