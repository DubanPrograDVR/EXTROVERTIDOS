import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import FilterPanel from "../Superguia/FilterPanel";
import EmptyPanoramas from "../Superguia/EmptyPanoramas";
import Pagination from "../Superguia/Pagination";
import PublicationGrid from "../Superguia/PublicationGrid";
import Carousel from "../Superguia/Carousel";
import { LOCATIONS } from "../Superguia/data";
import { formatDateKey } from "../Superguia/DateCalendar";
import { useHighlightCard } from "../../hooks/useHighlightCard";
import { usePlansVisibility } from "../../hooks/usePlansVisibility";
import {
  construirCalendarioEventos,
  filtrarEventos,
  ordenarEventos,
} from "./homeUtils";

const ITEMS_PER_PAGE = 16;
const PARAMETROS_PROPIOS = [
  "p_ciudad",
  "p_comuna",
  "p_categoria",
  "p_busqueda",
  "p_fecha",
  "p_precio",
  "p_highlight",
];

const normalizarUbicacion = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/\s+/g, " ")
    .trim();

const encontrarCiudad = (valor) => {
  const normalizado = normalizarUbicacion(valor);
  return Object.entries(LOCATIONS).find(
    ([clave, ciudad]) =>
      normalizado &&
      (normalizado === normalizarUbicacion(clave) ||
        normalizado === normalizarUbicacion(ciudad.nombre)),
  )?.[1];
};

const leerFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export default function HomePanoramas({
  eventos,
  categorias,
  parametros,
  actualizarParametros,
  cargando,
  error,
  recargar,
  onEventoClick,
  onNegocioClick,
  carouselItems = [],
  onPublicar,
  semillaOrden = 0,
}) {
  const { destacadasEnabled } = usePlansVisibility();
  const [paginaActual, setPaginaActual] = useState(1);
  const referenciaFiltros = useRef(null);
  const debeDesplazarRef = useRef(false);

  const carruselLleno = useMemo(() => {
    if (!carouselItems) return [];
    
    // Filtrar solo panoramas destacados y limitar a 20
    let destacados = carouselItems
      .filter((item) => item.tipo_publicacion === "destacada")
      .slice(0, 20);

    // Si hay menos de 5, agregar un banner dummy
    if (destacados.length < 5) {
      destacados.push({
        id: "banner-destaca-panorama",
        isBanner: true,
        titulo: "¡Destaca tu Panorama!",
        nombre: "¡Destaca tu Panorama!",
        imagen_url: "/img/banner_destaca_panorama.png",
        tipo_publicacion: "destacada",
      });
    }

    // Llenar para el efecto tren si aún hay menos de 5
    let items = [...destacados];
    while (items.length > 0 && items.length < 5) {
      items = [...items, ...destacados];
    }
    return items;
  }, [carouselItems]);


  const filtros = useMemo(
    () => ({
      ciudad: parametros.get("p_ciudad"),
      comuna: parametros.get("p_comuna"),
      categoria: parametros.get("p_categoria"),
      busqueda: parametros.get("p_busqueda") || "",
      fecha: leerFecha(parametros.get("p_fecha")),
      precio: parametros.get("p_precio"),
    }),
    [parametros],
  );
  const ciudadSeleccionada = useMemo(
    () => encontrarCiudad(filtros.ciudad),
    [filtros.ciudad],
  );

  const eventosFiltrados = useMemo(
    () =>
      ordenarEventos(
        filtrarEventos(eventos, filtros, LOCATIONS),
        destacadasEnabled,
        semillaOrden,
      ),
    [destacadasEnabled, eventos, filtros, semillaOrden],
  );

  const conteos = useMemo(() => {
    const baseCiudades = filtrarEventos(eventos, filtros, LOCATIONS, {
      excluir: ["ciudad", "comuna"],
    });
    const baseComunas = filtrarEventos(eventos, filtros, LOCATIONS, {
      excluir: ["comuna"],
    });
    const baseCategorias = filtrarEventos(eventos, filtros, LOCATIONS, {
      excluir: ["categoria"],
    });

    const eventosCountByCity = {};
    Object.entries(LOCATIONS).forEach(([clave, ciudad]) => {
      eventosCountByCity[clave] = baseCiudades.filter(
        (evento) =>
          normalizarUbicacion(evento.provincia) ===
          normalizarUbicacion(ciudad.nombre),
      ).length;
    });

    const eventosCountByComuna = {};
    if (ciudadSeleccionada) {
      ciudadSeleccionada.comunas.forEach((comuna) => {
        eventosCountByComuna[comuna] = baseComunas.filter(
          (evento) =>
            normalizarUbicacion(evento.comuna) === normalizarUbicacion(comuna),
        ).length;
      });
    }

    const eventosCountByCategory = {};
    categorias.forEach((categoria) => {
      eventosCountByCategory[categoria.id] = baseCategorias.filter(
        (evento) => String(evento.category_id) === String(categoria.id),
      ).length;
    });

    return { eventosCountByCity, eventosCountByComuna, eventosCountByCategory };
  }, [categorias, ciudadSeleccionada, eventos, filtros]);

  const calendario = useMemo(() => {
    const base = filtrarEventos(eventos, filtros, LOCATIONS, {
      excluir: ["fecha"],
    });
    return construirCalendarioEventos(base);
  }, [eventos, filtros]);

  const comunasDisponibles = filtros.ciudad
    ? ciudadSeleccionada?.comunas || []
    : [];
  const totalPaginas = Math.ceil(eventosFiltrados.length / ITEMS_PER_PAGE);
  const paginaVisible = totalPaginas > 0 ? Math.min(paginaActual, totalPaginas) : 1;
  const eventosPaginados = useMemo(() => {
    const inicio = (paginaVisible - 1) * ITEMS_PER_PAGE;
    return eventosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [eventosFiltrados, paginaVisible]);

  useEffect(() => {
    if (!debeDesplazarRef.current) return;
    referenciaFiltros.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    debeDesplazarRef.current = false;
  }, [paginaActual]);

  const cambiarPagina = useCallback(
    (pagina) => {
      if (pagina === paginaVisible) return;
      debeDesplazarRef.current = true;
      setPaginaActual(pagina);
    },
    [paginaVisible],
  );

  const cambiarParametro = useCallback(
    (cambios) => {
      setPaginaActual(1);
      actualizarParametros(cambios);
    },
    [actualizarParametros],
  );

  const cambiarCiudad = useCallback(
    (ciudad) => {
      cambiarParametro({ p_ciudad: ciudad, p_comuna: null });
    },
    [cambiarParametro],
  );

  const cambiarCategoria = useCallback(
    (categoria) => cambiarParametro({ p_categoria: categoria }),
    [cambiarParametro],
  );

  const cambiarComuna = useCallback(
    (comuna) => cambiarParametro({ p_comuna: comuna }),
    [cambiarParametro],
  );

  const cambiarFecha = useCallback(
    (fecha) => cambiarParametro({ p_fecha: fecha ? formatDateKey(fecha) : null }),
    [cambiarParametro],
  );

  const cambiarPrecio = useCallback(
    (precio) => cambiarParametro({ p_precio: precio }),
    [cambiarParametro],
  );

  const cambiarBusqueda = useCallback(
    (busqueda) => cambiarParametro({ p_busqueda: busqueda || null }),
    [cambiarParametro],
  );

  const limpiarFiltros = useCallback(() => {
    const cambios = {};
    PARAMETROS_PROPIOS.forEach((parametro) => {
      cambios[parametro] = null;
    });
    cambiarParametro(cambios);
  }, [cambiarParametro]);

  useHighlightCard({
    prefix: "publication-card",
    queryParam: "p_highlight",
    rawItems: eventos,
    filteredItems: eventosFiltrados,
    currentPage: paginaVisible,
    itemsPerPage: ITEMS_PER_PAGE,
    setCurrentPage: setPaginaActual,
    onResetFilters: limpiarFiltros,
    enabled: !cargando && !error,
  });

  const tieneFiltros = Boolean(
    filtros.ciudad ||
      filtros.comuna ||
      filtros.categoria ||
      filtros.busqueda.trim() ||
      filtros.fecha ||
      filtros.precio,
  );

  return (
    <section
      id="panoramas"
      className="home-consolidado__section home-consolidado__section--panoramas"
      aria-labelledby="home-panoramas-title">
      <div className="home-consolidado__section-heading">
        <div>
          <p className="home-consolidado__eyebrow">Cartelera local</p>
          <h2 id="home-panoramas-title">Panoramas</h2>
          <p>Filtra por ciudad, comuna, fecha o categoría y encuentra tu próximo plan.</p>
        </div>
        <button
          type="button"
          className="home-consolidado__section-action"
          onClick={onPublicar}>
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Publicar panorama
        </button>
      </div>

      {carruselLleno.length > 0 && (
        <Carousel
          publications={carruselLleno}
          onPublicationClick={onEventoClick}
          badgeUrl="/img/P_Extro_v2.png"
        />
      )}

      <div ref={referenciaFiltros} className="home-consolidado__filters">
        <FilterPanel
          categoryIcon="/img/P_Extro_v2.png"
          categories={categorias}
          locations={LOCATIONS}
          selectedCategory={filtros.categoria}
          selectedCity={filtros.ciudad}
          selectedComuna={filtros.comuna}
          selectedDate={filtros.fecha}
          selectedPrice={filtros.precio}
          searchQuery={filtros.busqueda}
          searchPlaceholder="Buscar panoramas, actividades..."
          eventsPerDay={calendario.eventosPorDia}
          recurringDates={calendario.fechasRecurrentes}
          availableComunas={comunasDisponibles}
          onCategoryChange={cambiarCategoria}
          onCityChange={cambiarCiudad}
          onComunaChange={cambiarComuna}
          onDateChange={cambiarFecha}
          onPriceChange={cambiarPrecio}
          onSearchChange={cambiarBusqueda}
          onClearFilters={limpiarFiltros}
          totalResults={eventosFiltrados.length}
          showPriceFilter={true}
          showSubcategories={false}
          showComunaFilter={true}
          eventsCountByCity={conteos.eventosCountByCity}
          eventsCountByComuna={conteos.eventosCountByComuna}
          eventsCountByCategory={conteos.eventosCountByCategory}
        />
      </div>

      <div className="home-consolidado__results" aria-live="polite">
        {cargando ? (
          <div className="home-consolidado__state" role="status">
            <p>Cargando panoramas...</p>
          </div>
        ) : error ? (
          <div className="home-consolidado__state home-consolidado__state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={recargar}>
              Reintentar
            </button>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <EmptyPanoramas
            hasFilters={tieneFiltros}
            onClearFilters={limpiarFiltros}
            onPublishClick={onPublicar}
          />
        ) : (
          <>
            <div className="home-consolidado__results-heading">
              <h3>
                {eventosFiltrados.length} {eventosFiltrados.length === 1 ? "panorama" : "panoramas"}
              </h3>
              {totalPaginas > 1 && (
                <Pagination
                  currentPage={paginaActual}
                  totalPages={totalPaginas}
                  onPageChange={cambiarPagina}
                />
              )}
            </div>
            <PublicationGrid
              publications={eventosPaginados}
              onPublicationClick={onEventoClick}
            />
            {totalPaginas > 1 && (
              <Pagination
                currentPage={paginaActual}
                totalPages={totalPaginas}
                onPageChange={cambiarPagina}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
