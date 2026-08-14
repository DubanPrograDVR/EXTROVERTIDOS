import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import FilterPanel from "../Superguia/FilterPanel";
import BusinessGrid from "../Superguia/BusinessGrid";
import Pagination from "../Superguia/Pagination";
import { LOCATIONS } from "../Superguia/data";
import { useHighlightCard } from "../../hooks/useHighlightCard";
import { crearSubcategorias, filtrarNegocios } from "./homeUtils";

const ITEMS_PER_PAGE = 16;
const PARAMETROS_PROPIOS = [
  "sg_ciudad",
  "sg_comuna",
  "sg_categoria",
  "sg_subcategoria",
  "sg_busqueda",
  "sg_highlight",
];

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/\s+/g, " ")
    .trim();

const encontrarCiudad = (valor) => {
  const normalizado = normalizarTexto(valor);
  return Object.entries(LOCATIONS).find(
    ([clave, ciudad]) =>
      normalizado &&
      (normalizado === normalizarTexto(clave) ||
        normalizado === normalizarTexto(ciudad.nombre)),
  )?.[1];
};

const coincideId = (valor, id) =>
  valor !== undefined && valor !== null && valor !== "" && String(valor) === String(id);

const coincideCategoria = (negocio, categoria) => {
  const idNegocio = negocio.category_id ?? negocio.categoria_id;
  const tieneId = idNegocio !== undefined && idNegocio !== null && idNegocio !== "";
  return tieneId
    ? coincideId(idNegocio, categoria.id)
    : normalizarTexto(negocio.categoria) === normalizarTexto(categoria.nombre);
};

const coincideSubcategoria = (negocio, subcategoria) => {
  const idNegocio = negocio.subcategory_id ?? negocio.subcategoria_id;
  const tieneId = idNegocio !== undefined && idNegocio !== null && idNegocio !== "";
  return tieneId
    ? coincideId(idNegocio, subcategoria.id)
    : normalizarTexto(negocio.subcategoria) ===
        normalizarTexto(subcategoria.nombre);
};

export default function HomeSuperguia({
  negocios,
  categorias,
  parametros,
  actualizarParametros,
  cargando,
  error,
  recargar,
  onNegocioClick,
  onPublicar,
  semillaOrden = 0,
}) {
  const [paginaActual, setPaginaActual] = useState(1);
  const referenciaFiltros = useRef(null);
  const debeDesplazarRef = useRef(false);

  const subcategorias = useMemo(() => crearSubcategorias(categorias), [categorias]);
  const filtros = useMemo(
    () => ({
      ciudad: parametros.get("sg_ciudad"),
      comuna: parametros.get("sg_comuna"),
      categoria: parametros.get("sg_categoria"),
      subcategoria: parametros.get("sg_subcategoria"),
      busqueda: parametros.get("sg_busqueda") || "",
    }),
    [parametros],
  );
  const ciudadSeleccionada = useMemo(
    () => encontrarCiudad(filtros.ciudad),
    [filtros.ciudad],
  );

  const negociosFiltrados = useMemo(
    () =>
      filtrarNegocios(
        negocios,
        filtros,
        categorias,
        subcategorias,
        LOCATIONS,
        { semillaOrden },
      ),
    [categorias, filtros, negocios, semillaOrden, subcategorias],
  );

  const conteos = useMemo(() => {
    const baseCiudades = filtrarNegocios(
      negocios,
      filtros,
      categorias,
      subcategorias,
      LOCATIONS,
      { excluir: ["ciudad", "comuna"], semillaOrden },
    );
    const baseComunas = filtrarNegocios(
      negocios,
      filtros,
      categorias,
      subcategorias,
      LOCATIONS,
      { excluir: ["comuna"], semillaOrden },
    );
    const baseCategorias = filtrarNegocios(
      negocios,
      filtros,
      categorias,
      subcategorias,
      LOCATIONS,
      { excluir: ["categoria", "subcategoria"], semillaOrden },
    );
    const baseSubcategorias = filtrarNegocios(
      negocios,
      filtros,
      categorias,
      subcategorias,
      LOCATIONS,
      { excluir: ["subcategoria"], semillaOrden },
    );

    const negociosCountByCity = {};
    Object.entries(LOCATIONS).forEach(([clave, ciudad]) => {
      negociosCountByCity[clave] = baseCiudades.filter(
        (negocio) =>
          normalizarTexto(negocio.provincia) === normalizarTexto(ciudad.nombre),
      ).length;
    });

    const negociosCountByComuna = {};
    if (ciudadSeleccionada) {
      ciudadSeleccionada.comunas.forEach((comuna) => {
        negociosCountByComuna[comuna] = baseComunas.filter(
          (negocio) =>
            normalizarTexto(negocio.comuna) === normalizarTexto(comuna),
        ).length;
      });
    }

    const negociosCountByCategory = {};
    categorias.forEach((categoria) => {
      negociosCountByCategory[categoria.id] = baseCategorias.filter(
        (negocio) => coincideCategoria(negocio, categoria),
      ).length;
    });

    const negociosCountBySubcategory = {};
    subcategorias.forEach((subcategoria) => {
      negociosCountBySubcategory[subcategoria.id] = baseSubcategorias.filter(
        (negocio) => coincideSubcategoria(negocio, subcategoria),
      ).length;
    });

    return {
      negociosCountByCity,
      negociosCountByComuna,
      negociosCountByCategory,
      negociosCountBySubcategory,
    };
  }, [
    categorias,
    ciudadSeleccionada,
    filtros,
    negocios,
    semillaOrden,
    subcategorias,
  ]);

  const comunasDisponibles = filtros.ciudad
    ? ciudadSeleccionada?.comunas || []
    : [];
  const totalPaginas = Math.ceil(negociosFiltrados.length / ITEMS_PER_PAGE);
  const paginaVisible = totalPaginas > 0 ? Math.min(paginaActual, totalPaginas) : 1;
  const negociosPaginados = useMemo(() => {
    const inicio = (paginaVisible - 1) * ITEMS_PER_PAGE;
    return negociosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [negociosFiltrados, paginaVisible]);

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
    (ciudad) => cambiarParametro({ sg_ciudad: ciudad, sg_comuna: null }),
    [cambiarParametro],
  );

  const cambiarCategoria = useCallback(
    (categoria) => cambiarParametro({ sg_categoria: categoria, sg_subcategoria: null }),
    [cambiarParametro],
  );

  const cambiarSubcategoria = useCallback(
    (subcategoria) => cambiarParametro({ sg_subcategoria: subcategoria }),
    [cambiarParametro],
  );

  const cambiarComuna = useCallback(
    (comuna) => cambiarParametro({ sg_comuna: comuna }),
    [cambiarParametro],
  );

  const cambiarBusqueda = useCallback(
    (busqueda) => cambiarParametro({ sg_busqueda: busqueda || null }),
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
    prefix: "business-card",
    queryParam: "sg_highlight",
    rawItems: negocios,
    filteredItems: negociosFiltrados,
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
      filtros.subcategoria ||
      filtros.busqueda.trim(),
  );

  return (
    <section
      id="superguia"
      className="home-consolidado__section home-consolidado__section--superguia"
      aria-labelledby="home-superguia-title">
      <div className="home-consolidado__section-heading">
        <div>
          <p className="home-consolidado__eyebrow">Servicios y negocios locales</p>
          <h2 id="home-superguia-title">Superguía</h2>
          <p>Busca negocios por rubro, ciudad y comuna, con resultados en un solo lugar.</p>
        </div>
        <button
          type="button"
          className="home-consolidado__section-action home-consolidado__section-action--dark"
          onClick={onPublicar}>
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Publicar negocio
        </button>
      </div>

      <div ref={referenciaFiltros} className="home-consolidado__filters">
        <FilterPanel
          categoryIcon="/img/SG_Extro_v2.png"
          categories={categorias}
          subcategories={subcategorias}
          locations={LOCATIONS}
          selectedCategory={filtros.categoria}
          selectedSubcategory={filtros.subcategoria}
          selectedCity={filtros.ciudad}
          selectedComuna={filtros.comuna}
          searchQuery={filtros.busqueda}
          searchPlaceholder="Buscar negocios y servicios..."
          availableComunas={comunasDisponibles}
          onCategoryChange={cambiarCategoria}
          onSubcategoryChange={cambiarSubcategoria}
          onCityChange={cambiarCiudad}
          onComunaChange={cambiarComuna}
          onSearchChange={cambiarBusqueda}
          onClearFilters={limpiarFiltros}
          totalResults={negociosFiltrados.length}
          showDateFilter={false}
          showPriceFilter={false}
          showSubcategories={true}
          showComunaFilter={true}
          eventsCountByCity={conteos.negociosCountByCity}
          eventsCountByComuna={conteos.negociosCountByComuna}
          eventsCountByCategory={conteos.negociosCountByCategory}
          eventsCountBySubcategory={conteos.negociosCountBySubcategory}
        />
      </div>

      <div className="home-consolidado__results" aria-live="polite">
        {cargando ? (
          <div className="home-consolidado__state" role="status">
            <p>Cargando negocios...</p>
          </div>
        ) : error ? (
          <div className="home-consolidado__state home-consolidado__state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={recargar}>
              Reintentar
            </button>
          </div>
        ) : negociosFiltrados.length === 0 ? (
          <div className="home-consolidado__empty" role="status">
            <img src="/img/SG_Extro_v2.png" alt="" aria-hidden="true" />
            <h3>No encontramos negocios con estos filtros</h3>
            <p>
              Prueba con otra ciudad, categoría o término de búsqueda.
            </p>
            <div className="home-consolidado__empty-actions">
              {tieneFiltros && (
                <button type="button" onClick={limpiarFiltros}>
                  Ver todos
                </button>
              )}
              <button type="button" onClick={onPublicar}>
                Publicar negocio
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="home-consolidado__results-heading">
              <h3>
                {negociosFiltrados.length} {negociosFiltrados.length === 1 ? "negocio" : "negocios"}
              </h3>
              {totalPaginas > 1 && (
                <Pagination
                  currentPage={paginaActual}
                  totalPages={totalPaginas}
                  onPageChange={cambiarPagina}
                />
              )}
            </div>
            <BusinessGrid
              businesses={negociosPaginados}
              onBusinessClick={onNegocioClick}
              categories={categorias}
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
