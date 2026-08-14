import { useCallback, useEffect, useState } from "react";
import {
  getBusinessCategories,
  getCategories,
  getPublishedBusinesses,
  getPublishedEvents,
} from "../lib/database";
import {
  getChangedColumns,
  useRealtimeRefetch,
} from "./useRealtimeRefetch";
import { crearSemillaOrden } from "../components/Home/homeUtils";

const SOLO_CAMPOS_SOCIALES = new Set(["share_count", "updated_at"]);

const esCambioVisual = (carga) => {
  if (carga?.eventType !== "UPDATE") return true;

  const columnas = getChangedColumns(carga);
  return (
    columnas.length === 0 ||
    columnas.some((columna) => !SOLO_CAMPOS_SOCIALES.has(columna))
  );
};

/**
 * Contenido compartido de la portada consolidada.
 * La carga inicial evita que cada sección cree su propia consulta y suscripción.
 */
export function useHomeContent() {
  const [semillaOrden] = useState(crearSemillaOrden);
  const [eventos, setEventos] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [categoriasPanoramas, setCategoriasPanoramas] = useState([]);
  const [categoriasNegocios, setCategoriasNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarContenido = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) {
      setCargando(true);
      setError(null);
    }

    try {
      const [eventosData, negociosData, categoriasEventosData, categoriasNegociosData] =
        await Promise.all([
          getPublishedEvents(),
          getPublishedBusinesses(),
          getCategories(),
          getBusinessCategories(),
        ]);

      setEventos(eventosData || []);
      setNegocios(negociosData || []);
      setCategoriasPanoramas(categoriasEventosData || []);
      setCategoriasNegocios(categoriasNegociosData || []);
    } catch (cargaError) {
      console.error("Error cargando contenido del Home:", cargaError);
      if (!silencioso) {
        setError("No se pudo cargar el contenido. Intenta nuevamente.");
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  const recargarEventos = useCallback(async () => {
    try {
      const eventosData = await getPublishedEvents();
      setEventos(eventosData || []);
    } catch (cargaError) {
      console.error("Error actualizando panoramas en tiempo real:", cargaError);
    }
  }, []);

  const recargarNegocios = useCallback(async () => {
    try {
      const negociosData = await getPublishedBusinesses();
      setNegocios(negociosData || []);
    } catch (cargaError) {
      console.error("Error actualizando negocios en tiempo real:", cargaError);
    }
  }, []);

  useEffect(() => {
    cargarContenido();
  }, [cargarContenido]);

  useRealtimeRefetch({
    table: "events",
    event: "*",
    onChange: (carga) => {
      if (esCambioVisual(carga)) recargarEventos();
    },
  });

  useRealtimeRefetch({
    table: "businesses",
    event: "*",
    onChange: (carga) => {
      if (esCambioVisual(carga)) recargarNegocios();
    },
  });

  return {
    eventos,
    negocios,
    categoriasPanoramas,
    categoriasNegocios,
    semillaOrden,
    cargando,
    error,
    recargar: cargarContenido,
  };
}

export default useHomeContent;
