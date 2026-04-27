import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner, faFire } from "@fortawesome/free-solid-svg-icons";
import Footer from "../Home/Footer";
import Pagination from "./Pagination";
import FilterPanel from "./FilterPanel";
import BusinessGrid from "./BusinessGrid";
import BusinessModal from "./BusinessModal";
import Carousel from "./Carousel";
import PublicationModal from "./PublicationModal";
import {
  getPublishedBusinesses,
  getBusinessCategories,
  getPublishedEvents,
} from "../../lib/database";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import { useHighlightCard } from "../../hooks/useHighlightCard";
import { LOCATIONS } from "./data";
import "./styles/SuperguiaContainer.css";

const ITEMS_PER_PAGE = 16;

const parseLocalDate = (dateValue, endOfDay = false) => {
  if (!dateValue) return null;

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;

  if (endOfDay) {
    parsedDate.setHours(23, 59, 59, 999);
  }

  return parsedDate;
};

const getCurrentWeekBounds = (referenceDate = new Date()) => {
  const weekStart = new Date(referenceDate);
  const dayIndex = weekStart.getDay();
  const daysToMonday = (dayIndex + 6) % 7;

  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

const getWeekOffsetLabel = (weekOffset) => {
  if (weekOffset === 0) return "esta semana";
  if (weekOffset === 1) return "la próxima semana";

  return `en ${weekOffset} semanas`;
};

const panoramaOccursThisWeek = (event, weekStart, weekEnd) => {
  const startDate = parseLocalDate(event.fecha_evento);
  if (!startDate) return false;

  if (event.es_recurrente && Array.isArray(event.fechas_recurrencia)) {
    const matchesRecurringDate = event.fechas_recurrencia.some((fecha) => {
      const occurrenceDate = parseLocalDate(fecha);
      return (
        occurrenceDate &&
        occurrenceDate >= weekStart &&
        occurrenceDate <= weekEnd
      );
    });

    if (matchesRecurringDate) return true;
  }

  const endDate = parseLocalDate(event.fecha_fin, true) || startDate;
  return startDate <= weekEnd && endDate >= weekStart;
};

const getPanoramaDisplayDate = (event, weekStart, weekEnd) => {
  if (event.es_recurrente && Array.isArray(event.fechas_recurrencia)) {
    const matchingOccurrences = event.fechas_recurrencia
      .map((fecha) => parseLocalDate(fecha))
      .filter((date) => date && date >= weekStart && date <= weekEnd);

    if (matchingOccurrences.length > 0) {
      return matchingOccurrences.reduce((earliest, current) =>
        current < earliest ? current : earliest,
      );
    }
  }

  return parseLocalDate(event.fecha_evento);
};

/**
 * SuperguiaContainer - Página para mostrar negocios publicados
 */
export default function SuperguiaContainer() {
  const navigate = useNavigate();

  // Estados de datos
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef(null);
  const shouldScrollToFiltersRef = useRef(false);

  const handlePageChange = useCallback(
    (page) => {
      if (page === currentPage) return;
      shouldScrollToFiltersRef.current = true;
      setCurrentPage(page);
    },
    [currentPage],
  );

  // Scroll a los filtros cuando la paginación cambia de página
  useEffect(() => {
    if (!shouldScrollToFiltersRef.current) return;

    filterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    shouldScrollToFiltersRef.current = false;
  }, [currentPage]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Clave para forzar reordenamiento aleatorio
  const [shuffleKey, setShuffleKey] = useState(0);

  // Estado para panoramas (carrusel cruzado)
  const [panoramas, setPanoramas] = useState([]);
  const [weekRefreshKey, setWeekRefreshKey] = useState(0);

  // Panoramas filtrados por ciudad activa
  const featuredPanoramaWindow = useMemo(() => {
    const { weekStart: currentWeekStart } = getCurrentWeekBounds();
    const cityName = selectedCity ? LOCATIONS[selectedCity]?.nombre : null;

    const cityFilteredPanoramas =
      selectedCity && cityName
        ? panoramas.filter(
            (event) =>
              event.provincia?.toLowerCase() === cityName.toLowerCase(),
          )
        : panoramas;

    for (let weekOffset = 0; weekOffset < 6; weekOffset += 1) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const items = [...cityFilteredPanoramas]
        .filter((event) => panoramaOccursThisWeek(event, weekStart, weekEnd))
        .sort((a, b) => {
          const aDate = getPanoramaDisplayDate(a, weekStart, weekEnd);
          const bDate = getPanoramaDisplayDate(b, weekStart, weekEnd);

          return (
            (aDate?.getTime() || Number.MAX_SAFE_INTEGER) -
            (bDate?.getTime() || Number.MAX_SAFE_INTEGER)
          );
        });

      if (items.length > 0) {
        return {
          items,
          weekLabel: getWeekOffsetLabel(weekOffset),
        };
      }
    }

    return {
      items: [],
      weekLabel: getWeekOffsetLabel(0),
    };
  }, [panoramas, selectedCity, weekRefreshKey]);
  const filteredPanoramas = featuredPanoramaWindow.items;
  const [selectedPanorama, setSelectedPanorama] = useState(null);
  const [isPanoramaModalOpen, setIsPanoramaModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;

    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 5, 0);

    const delay = Math.max(nextMonday.getTime() - now.getTime(), 60_000);
    const timeoutId = window.setTimeout(() => {
      setWeekRefreshKey((value) => value + 1);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [weekRefreshKey]);

  // Cargar datos
  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [businessesData, categoriesData, eventsData] = await Promise.all([
        getPublishedBusinesses(),
        getBusinessCategories(),
        getPublishedEvents(),
      ]);
      // Mezclar negocios en orden aleatorio cada vez que se carga
      const shuffled = (businessesData || []).sort(() => Math.random() - 0.5);
      setBusinesses(shuffled);
      setCategories(categoriesData || []);
      setPanoramas(eventsData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      if (!silent) setError("No se pudieron cargar los negocios");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tiempo real: actualizar cuando se publica/actualiza un negocio o evento
  useRealtimeRefetch({
    table: "businesses",
    event: "*",
    onChange: () => loadData({ silent: true }),
  });
  useRealtimeRefetch({
    table: "events",
    event: "*",
    onChange: () => loadData({ silent: true }),
  });

  // Construir subcategorías planas para el FilterPanel
  const flatSubcategories = useMemo(() => {
    const result = [];
    let idCounter = 1;
    categories.forEach((cat) => {
      if (cat.subcategorias) {
        cat.subcategorias.forEach((sub) => {
          result.push({
            id: idCounter++,
            nombre: sub,
            category_id: cat.id,
          });
        });
      }
    });
    return result;
  }, [categories]);

  // Handlers para filtros
  const handleCityChange = useCallback((city) => {
    setSelectedCity(city);
    setSelectedComuna(null);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setCurrentPage(1);
    setShuffleKey((k) => k + 1);
  }, []);

  const handleSubcategoryChange = useCallback((subcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentPage(1);
    setShuffleKey((k) => k + 1);
  }, []);

  const handleComunaChange = useCallback((comuna) => {
    setSelectedComuna(comuna);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedCity(null);
    setSelectedComuna(null);
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  // Handlers para el modal
  const handleBusinessClick = useCallback((business) => {
    setSelectedBusiness(business);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBusiness(null);
  }, []);

  // Handlers para carrusel de panoramas
  const handlePanoramaClick = useCallback((panorama) => {
    setSelectedPanorama(panorama);
    setIsPanoramaModalOpen(true);
  }, []);

  const handleClosePanoramaModal = useCallback(() => {
    setIsPanoramaModalOpen(false);
    setSelectedPanorama(null);
  }, []);

  // Filtrar negocios
  const filteredBusinesses = useMemo(() => {
    let result = [...businesses];

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (business) =>
          business.nombre?.toLowerCase().includes(query) ||
          business.comuna?.toLowerCase().includes(query) ||
          business.provincia?.toLowerCase().includes(query) ||
          business.categoria?.toLowerCase().includes(query) ||
          business.subcategoria?.toLowerCase().includes(query) ||
          business.slogan?.toLowerCase().includes(query) ||
          business.descripcion?.toLowerCase().includes(query),
      );
    }

    // Filtro de categoría (buscar por nombre de categoría)
    if (selectedCategory) {
      const selectedCat = categories.find((c) => c.id === selectedCategory);
      if (selectedCat) {
        result = result.filter(
          (business) =>
            business.categoria?.toLowerCase() ===
            selectedCat.nombre.toLowerCase(),
        );
      }
    }

    // Filtro de subcategoría
    if (selectedSubcategory) {
      const subcat = flatSubcategories.find(
        (s) => s.id === selectedSubcategory,
      );
      if (subcat) {
        result = result.filter(
          (business) =>
            business.subcategoria?.toLowerCase() ===
            subcat.nombre.toLowerCase(),
        );
      }
    }

    // Filtro de ciudad (provincia)
    if (selectedCity) {
      const cityName = LOCATIONS[selectedCity]?.nombre;
      if (cityName) {
        result = result.filter(
          (business) =>
            business.provincia?.toLowerCase() === cityName.toLowerCase(),
        );
      }
    }

    // Filtro de comuna
    if (selectedComuna) {
      result = result.filter(
        (business) =>
          business.comuna?.toLowerCase() === selectedComuna.toLowerCase(),
      );
    }

    // Mezclar en orden aleatorio estable hasta que cambie shuffleKey
    let seed = shuffleKey + result.length * 9973;
    const nextRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }, [
    businesses,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    selectedComuna,
    categories,
    flatSubcategories,
    shuffleKey,
  ]);

  // Comunas disponibles según ciudad seleccionada
  const availableComunas = useMemo(() => {
    if (!selectedCity) return [];
    return LOCATIONS[selectedCity]?.comunas || [];
  }, [selectedCity]);

  // Helper: aplica filtros seleccionados excepto los indicados en `exclude`
  const applyFilters = useCallback(
    (exclude = {}) => {
      let result = businesses;

      if (!exclude.search && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (b) =>
            b.nombre?.toLowerCase().includes(query) ||
            b.comuna?.toLowerCase().includes(query) ||
            b.provincia?.toLowerCase().includes(query) ||
            b.categoria?.toLowerCase().includes(query) ||
            b.subcategoria?.toLowerCase().includes(query) ||
            b.slogan?.toLowerCase().includes(query) ||
            b.descripcion?.toLowerCase().includes(query),
        );
      }

      if (!exclude.category && selectedCategory) {
        const selectedCat = categories.find((c) => c.id === selectedCategory);
        if (selectedCat) {
          result = result.filter(
            (b) =>
              b.categoria?.toLowerCase() === selectedCat.nombre.toLowerCase(),
          );
        }
      }

      if (!exclude.subcategory && selectedSubcategory) {
        const subcat = flatSubcategories.find(
          (s) => s.id === selectedSubcategory,
        );
        if (subcat) {
          result = result.filter(
            (b) =>
              b.subcategoria?.toLowerCase() === subcat.nombre.toLowerCase(),
          );
        }
      }

      if (!exclude.city && selectedCity) {
        const cityName = LOCATIONS[selectedCity]?.nombre;
        if (cityName) {
          result = result.filter(
            (b) => b.provincia?.toLowerCase() === cityName.toLowerCase(),
          );
        }
      }

      if (!exclude.comuna && selectedComuna) {
        result = result.filter(
          (b) => b.comuna?.toLowerCase() === selectedComuna.toLowerCase(),
        );
      }

      return result;
    },
    [
      businesses,
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedCity,
      selectedComuna,
      categories,
      flatSubcategories,
    ],
  );

  // Conteo de negocios por categoría (todos los filtros excepto categoría y subcategoría)
  const businessesCountByCategory = useMemo(() => {
    const base = applyFilters({ category: true, subcategory: true });
    const counts = {};
    categories.forEach((cat) => {
      counts[cat.id] = base.filter(
        (b) => b.categoria?.toLowerCase() === cat.nombre.toLowerCase(),
      ).length;
    });
    return counts;
  }, [applyFilters, categories]);

  // Conteo de negocios por ciudad (todos los filtros excepto ciudad y comuna)
  const businessesCountByCity = useMemo(() => {
    const base = applyFilters({ city: true, comuna: true });
    const counts = {};
    Object.entries(LOCATIONS).forEach(([key, city]) => {
      counts[key] = base.filter(
        (b) => b.provincia?.toLowerCase() === city.nombre.toLowerCase(),
      ).length;
    });
    return counts;
  }, [applyFilters]);

  // Conteo de negocios por comuna (todos los filtros excepto comuna)
  const businessesCountByComuna = useMemo(() => {
    const counts = {};
    if (!selectedCity) return counts;
    const base = applyFilters({ comuna: true });
    const cityName = LOCATIONS[selectedCity]?.nombre;
    availableComunas.forEach((comuna) => {
      counts[comuna] = base.filter(
        (b) =>
          b.provincia?.toLowerCase() === cityName?.toLowerCase() &&
          b.comuna?.toLowerCase() === comuna.toLowerCase(),
      ).length;
    });
    return counts;
  }, [applyFilters, selectedCity, availableComunas]);

  // Conteo de negocios por subcategoría (todos los filtros excepto subcategoría)
  const businessesCountBySubcategory = useMemo(() => {
    const base = applyFilters({ subcategory: true });
    const counts = {};
    flatSubcategories.forEach((sub) => {
      counts[sub.id] = base.filter(
        (b) => b.subcategoria?.toLowerCase() === sub.nombre.toLowerCase(),
      ).length;
    });
    return counts;
  }, [applyFilters, flatSubcategories]);

  // Paginación
  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBusinesses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBusinesses, currentPage]);

  // Resaltar card cuando venimos con ?highlight=<id>
  useHighlightCard({
    prefix: "business-card",
    rawItems: businesses,
    filteredItems: filteredBusinesses,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    setCurrentPage,
    onResetFilters: handleClearFilters,
    enabled: !loading,
  });

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    selectedCity ||
    selectedComuna ||
    searchQuery.trim();

  return (
    <>
      <section className="superguia">
        {/* Hero Banner */}
        <div className="superguia__hero">
          <div className="superguia__hero-overlay"></div>
          <div className="superguia__hero-content">
            <img
              src="/img/Logo_con_r.png"
              alt="Extrovertidos"
              className="superguia__hero-logo"
            />
            <h1 className="superguia__hero-title">superguía extrovertidos</h1>
            <p className="superguia__hero-subtitle">
              descubre los mejores negocios y servicios de la región
            </p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="superguia__container">
          {/* Header con título y botón */}
          <div className="superguia__header">
            <div className="superguia__header-left">
              <h2>Negocios</h2>
              <span className="superguia__count">
                {filteredBusinesses.length} resultado
                {filteredBusinesses.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              className="superguia__new-btn"
              onClick={() => navigate("/publicar-negocio")}>
              <FontAwesomeIcon icon={faPlus} />
              Publicar Negocio
            </button>
          </div>

          {/* Panel de filtros */}
          <div ref={filterRef}>
            <FilterPanel
              categories={categories}
              subcategories={flatSubcategories}
              locations={LOCATIONS}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategoryChange={handleCategoryChange}
              onSubcategoryChange={handleSubcategoryChange}
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              selectedComuna={selectedComuna}
              onComunaChange={handleComunaChange}
              availableComunas={availableComunas}
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onClearFilters={handleClearFilters}
              totalResults={filteredBusinesses.length}
              showDateFilter={false}
              showPriceFilter={false}
              showSubcategories={true}
              showComunaFilter={true}
              eventsCountByCategory={businessesCountByCategory}
              eventsCountByCity={businessesCountByCity}
              eventsCountByComuna={businessesCountByComuna}
              eventsCountBySubcategory={businessesCountBySubcategory}
            />
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="superguia__loading">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Cargando negocios...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="superguia__error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          )}

          {/* Lista de negocios */}
          {!loading && !error && (
            <>
              {filteredBusinesses.length === 0 ? (
                <div className="superguia__empty">
                  {/* Logo SG */}
                  <div className="superguia__empty-logo">
                    <img src="/img/SG_Extro.png" alt="Superguía" />
                  </div>

                  <h2 className="superguia__empty-title">
                    UPS.... AUN NO HAY UNA PUBLICACIÓN
                  </h2>
                  <p className="superguia__empty-subtitle">
                    {hasActiveFilters
                      ? "TE INVITAMOS A SEGUIR TU BÚSQUEDA EN OTRA CATEGORÍA"
                      : "TE INVITAMOS A SEGUIR TU BÚSQUEDA EN OTRA CATEGORÍA"}
                  </p>

                  <h3 className="superguia__empty-cta">
                    ¡PUBLICA AHORA TU NEGOCIO!
                  </h3>

                  <p className="superguia__empty-description">
                    EXPERIMENTA UNA NUEVA FORMA PARA QUE LOS CLIENTES
                    <br />
                    TE ENCUENTREN
                  </p>

                  <p className="superguia__empty-tagline">
                    SE PARTE DE EXTROVERTIDOS
                  </p>

                  {/* Logo Extrovertidos */}
                  <div className="superguia__empty-brand">
                    <img src="/img/Logo_con_r.png" alt="Extrovertidos" />
                  </div>

                  {/* Botones de acción */}
                  <div className="superguia__empty-actions">
                    {hasActiveFilters && (
                      <button
                        className="superguia__empty-btn superguia__empty-btn--secondary"
                        onClick={handleClearFilters}>
                        Ver todos
                      </button>
                    )}
                    <button
                      className="superguia__empty-btn superguia__empty-btn--primary"
                      onClick={() => navigate("/publicar-negocio")}>
                      Publicar Negocio
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <BusinessGrid
                    businesses={paginatedBusinesses}
                    onBusinessClick={handleBusinessClick}
                    categories={categories}
                  />

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Carrusel de Panoramas */}
      {filteredPanoramas.length > 0 && (
        <section className="superguia__featured">
          <div className="superguia__featured-header">
            <div className="superguia__featured-title">
              <FontAwesomeIcon
                icon={faFire}
                className="superguia__featured-icon"
              />
              <h2>Descubre panoramas</h2>
            </div>
            <p className="superguia__featured-subtitle">
              {selectedCity
                ? `Eventos de ${featuredPanoramaWindow.weekLabel} en ${LOCATIONS[selectedCity]?.nombre || selectedCity}`
                : `Explora los eventos de ${featuredPanoramaWindow.weekLabel} en la región`}
            </p>
          </div>
          <Carousel
            publications={filteredPanoramas}
            onPublicationClick={handlePanoramaClick}
            autoPlayInterval={2000}
          />
        </section>
      )}

      {/* Modal de negocio */}
      <BusinessModal
        business={selectedBusiness}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Modal de panorama */}
      <PublicationModal
        publication={selectedPanorama}
        isOpen={isPanoramaModalOpen}
        onClose={handleClosePanoramaModal}
        modalVariant="panoramas"
      />

      <Footer />
    </>
  );
}
