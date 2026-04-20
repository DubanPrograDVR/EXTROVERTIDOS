import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Resalta una card cuando se llega con ?highlight=<id>.
 *
 * Rastreo persistente: durante ~8 segundos, cada vez que los datos o la página
 * cambian, recalcula la posición del item y lo sigue. Si un shuffle/realtime
 * lo mueve a otra página, navega ahí automáticamente y vuelve a hacer scroll.
 */
export function useHighlightCard({
  prefix,
  rawItems,
  filteredItems,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  onResetFilters,
  enabled = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Refs mutables (no generan re-runs)
  const stateRef = useRef({});
  stateRef.current = {
    rawItems,
    filteredItems,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    onResetFilters,
  };

  // activeId: id que estamos rastreando; lastScrolledPage: última página a la que scrolleamos (para evitar bounce repetido)
  const activeIdRef = useRef(null);
  const trackUntilRef = useRef(0);
  const lastScrolledPageRef = useRef(null);
  const cleanupTimerRef = useRef(null);

  // Detectar id cuando cambia el querystring
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(location.search);
    const id = params.get("highlight");
    if (!id) return;
    if (activeIdRef.current === id) return;
    activeIdRef.current = id;
    lastScrolledPageRef.current = null;
    trackUntilRef.current = Date.now() + 8000; // rastrear durante 8s
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = setTimeout(() => {
      activeIdRef.current = null;
      lastScrolledPageRef.current = null;
      // Limpiar ?highlight de la URL al terminar la ventana
      const params2 = new URLSearchParams(window.location.search);
      if (params2.has("highlight")) {
        params2.delete("highlight");
        const qs = params2.toString();
        navigate(`${window.location.pathname}${qs ? `?${qs}` : ""}`, {
          replace: true,
        });
      }
    }, 8000);
  }, [enabled, location.search, navigate]);

  // Rastrear: recomputar posición cuando cambian datos/página
  useEffect(() => {
    if (!enabled) return;
    const id = activeIdRef.current;
    if (!id) return;
    if (Date.now() > trackUntilRef.current) return;

    const {
      rawItems: raw,
      filteredItems: filtered,
      currentPage: page,
      itemsPerPage: perPage,
      setCurrentPage: setPage,
      onResetFilters: resetFilters,
    } = stateRef.current;

    if (!raw || raw.length === 0) return;

    const existsInRaw = raw.some((item) => String(item.id) === String(id));
    if (!existsInRaw) {
      activeIdRef.current = null;
      return;
    }

    const index = filtered.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      if (resetFilters) resetFilters();
      return;
    }

    const targetPage = Math.floor(index / perPage) + 1;
    if (targetPage !== page) {
      setPage(targetPage);
      return;
    }

    // Ya estamos en la página correcta — scroll
    let cancelled = false;
    let attempts = 0;
    let timerId;

    const attempt = () => {
      if (cancelled) return;
      const el = document.getElementById(`${prefix}-${id}`);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Solo aplicar bounce la primera vez o si cambió la página
          if (lastScrolledPageRef.current !== targetPage) {
            el.classList.add("is-highlighted");
            setTimeout(() => el.classList.remove("is-highlighted"), 2500);
            lastScrolledPageRef.current = targetPage;
          }
          // Limpiar ?highlight de la URL inmediatamente tras resaltar
          // para que un refresh no vuelva a disparar el efecto.
          const p = new URLSearchParams(window.location.search);
          if (p.has("highlight")) {
            p.delete("highlight");
            const qs = p.toString();
            navigate(`${window.location.pathname}${qs ? `?${qs}` : ""}`, {
              replace: true,
            });
          }
        });
        return;
      }
      if (attempts++ < 40) {
        timerId = setTimeout(attempt, 150);
      }
    };
    timerId = setTimeout(attempt, 100);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [enabled, prefix, rawItems, filteredItems, currentPage]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);
}
