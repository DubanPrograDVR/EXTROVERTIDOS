import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faLocationDot,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import Pagination from "../Superguia/Pagination";
import FilterPanel from "../Superguia/FilterPanel";
import PublicationModal from "../Superguia/PublicationModal";
import PublicationGrid from "../Superguia/PublicationGrid";
import Carousel from "../Superguia/Carousel";
import EmptyPanoramas from "../Superguia/EmptyPanoramas";
import { formatDateKey } from "../Superguia/DateCalendar";
import {
  getPublishedEvents,
  getEventsByCity,
  getCategories,
  getSubcategories,
} from "../../lib/database";
import { useCity } from "../../context/CityContext";
import { LOCATIONS, mapCategoriesToUI } from "../Superguia/data";
import "./styles/panoramas-page.css";

const ITEMS_PER_PAGE = 4;

export default function PanoramasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectCity } = useCity();

  // Estados de datos
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros (igual que SuperguiaContainer)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del carrusel
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Estado del modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Leer query params al cargar y sincronizar con CityContext y filtros
  useEffect(() => {
    const ciudadParam = searchParams.get("ciudad");
    if (ciudadParam) {
      // Sincronizar con CityContext
      selectCity(ciudadParam);

      // Buscar la key de la ciudad en LOCATIONS para el filtro
      const cityKey = Object.keys(LOCATIONS).find(
        (key) =>
          LOCATIONS[key].nombre.toLowerCase() === ciudadParam.toLowerCase() ||
          LOCATIONS[key].comunas.some(
            (comuna) => comuna.toLowerCase() === ciudadParam.toLowerCase(),
          ),
      );

      if (cityKey) {
        // Si encontramos la ciudad, seleccionarla en el filtro
        setSelectedCity(cityKey);
      } else {
        // Si no, usar como búsqueda de texto
        setSearchQuery(ciudadParam);
      }
    }
  }, [searchParams, selectCity]);

  // Cargar datos - filtrado por ciudad desde Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const ciudadParam = searchParams.get("ciudad");

        let eventsData;
        if (ciudadParam) {
          eventsData = await getEventsByCity(ciudadParam);
        } else {
          eventsData = await getPublishedEvents();
        }

        const [categoriesData, subcategoriesData] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ]);

        setEvents(eventsData || []);
        setCategories(mapCategoriesToUI(categoriesData || []));
        setSubcategories(subcategoriesData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Handlers para filtros
  const handleCityChange = useCallback(
    (city) => {
      setSelectedCity(city);
      setSelectedComuna(null);
      setCurrentPage(1);

      // Actualizar URL si se selecciona una ciudad
      if (city) {
        const cityName = LOCATIONS[city]?.nombre;
        if (cityName) {
          setSearchParams({ ciudad: cityName });
          selectCity(cityName);
        }
      } else {
        // Si se limpia la ciudad, remover el param
        setSearchParams({});
      }
    },
    [setSearchParams, selectCity],
  );

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null); // Limpiar subcategoría al cambiar categoría
    setCurrentPage(1);
  }, []);

  const handleSubcategoryChange = useCallback((subcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentPage(1);
  }, []);

  const handleComunaChange = useCallback((comuna) => {
    setSelectedComuna(comuna);
    setCurrentPage(1);
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  }, []);

  const handlePriceChange = useCallback((price) => {
    setSelectedPrice(price);
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
    setSelectedDate(null);
    setSelectedPrice(null);
    setSearchQuery("");
    setCurrentPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  // Handlers para el modal
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // Filtrar eventos (misma lógica que SuperguiaContainer)
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.titulo?.toLowerCase().includes(query) ||
          event.comuna?.toLowerCase().includes(query) ||
          event.provincia?.toLowerCase().includes(query) ||
          event.categories?.nombre?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory) {
      result = result.filter((event) => event.category_id === selectedCategory);
    }

    if (selectedSubcategory) {
      result = result.filter(
        (event) => event.subcategory_id === selectedSubcategory,
      );
    }

    if (selectedCity) {
      const cityName = LOCATIONS[selectedCity]?.nombre;
      if (cityName) {
        result = result.filter(
          (event) => event.provincia?.toLowerCase() === cityName.toLowerCase(),
        );
      }
    }

    if (selectedComuna) {
      result = result.filter(
        (event) => event.comuna?.toLowerCase() === selectedComuna.toLowerCase(),
      );
    }

    // Filtrar por fecha
    if (selectedDate) {
      const dateStr = formatDateKey(selectedDate);
      result = result.filter((event) => {
        if (!event.fecha_evento) return false;
        const eventDate = new Date(event.fecha_evento);
        return formatDateKey(eventDate) === dateStr;
      });
    }

    // Filtrar por precio
    if (selectedPrice) {
      result = result.filter((event) => {
        const precio = event.precio || 0;
        switch (selectedPrice) {
          case "gratis":
            return precio === 0 || event.tipo_entrada === "gratis";
          case "economico":
            return precio > 0 && precio <= 10000;
          case "moderado":
            return precio > 10000 && precio <= 30000;
          case "premium":
            return precio > 30000;
          default:
            return true;
        }
      });
    }

    return result;
  }, [
    events,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    selectedComuna,
    selectedDate,
    selectedPrice,
  ]);

  // Calcular eventos por día para el calendario
  const eventsPerDay = useMemo(() => {
    const counts = {};
    events.forEach((event) => {
      if (event.fecha_evento) {
        const dateStr = formatDateKey(new Date(event.fecha_evento));
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  // Comunas disponibles según ciudad seleccionada
  const availableComunas = useMemo(() => {
    if (!selectedCity) return [];
    return LOCATIONS[selectedCity]?.comunas || [];
  }, [selectedCity]);

  // Paginación
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    selectedCity ||
    selectedComuna ||
    selectedDate ||
    selectedPrice ||
    searchQuery.trim();

  // Eventos destacados (primeros 5)
  const featuredEvents = useMemo(() => {
    return events.slice(0, 5);
  }, [events]);

  // Navegación del carrusel
  const nextSlide = useCallback(() => {
    setCarouselIndex((prev) =>
      prev >= featuredEvents.length - 1 ? 0 : prev + 1,
    );
  }, [featuredEvents.length]);

  const prevSlide = useCallback(() => {
    setCarouselIndex((prev) =>
      prev <= 0 ? featuredEvents.length - 1 : prev - 1,
    );
  }, [featuredEvents.length]);

  // Auto-avance del carrusel
  useEffect(() => {
    if (featuredEvents.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredEvents.length, nextSlide]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Por confirmar";
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="panoramas-page">
      {/* Hero Banner con Carrusel */}
      <section className="panoramas-page__hero">
        {featuredEvents.length > 0 ? (
          <>
            <div className="panoramas-page__hero-slides">
              {featuredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`panoramas-page__hero-slide ${
                    index === carouselIndex ? "active" : ""
                  }`}
                  style={{
                    backgroundImage: `url(${
                      Array.isArray(event.imagenes) && event.imagenes.length > 0
                        ? event.imagenes[0]
                        : "/img/Home1.png"
                    })`,
                  }}>
                  <div className="panoramas-page__hero-overlay"></div>
                  <div className="panoramas-page__hero-content">
                    <span className="panoramas-page__hero-category">
                      {event.categories?.nombre || "Evento"}
                    </span>
                    <h1 className="panoramas-page__hero-title">
                      {event.titulo}
                    </h1>
                    <div className="panoramas-page__hero-info">
                      <span>
                        <FontAwesomeIcon icon={faCalendarDays} />
                        {formatDate(event.fecha_evento)}
                      </span>
                      <span>
                        <FontAwesomeIcon icon={faLocationDot} />
                        {event.comuna}, {event.provincia}
                      </span>
                    </div>
                    <button
                      className="panoramas-page__hero-btn"
                      onClick={() => handleEventClick(event)}>
                      Ver más
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Controles del carrusel */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  className="panoramas-page__hero-nav panoramas-page__hero-nav--prev"
                  onClick={prevSlide}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  className="panoramas-page__hero-nav panoramas-page__hero-nav--next"
                  onClick={nextSlide}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

                {/* Indicadores */}
                <div className="panoramas-page__hero-dots">
                  {featuredEvents.map((_, index) => (
                    <button
                      key={index}
                      className={`panoramas-page__hero-dot ${
                        index === carouselIndex ? "active" : ""
                      }`}
                      onClick={() => setCarouselIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="panoramas-page__hero-empty">
            <h1>Panoramas del Maule</h1>
            <p>Descubre los mejores eventos de la región</p>
          </div>
        )}
      </section>

      {/* Panel de filtros de Superguia */}
      <FilterPanel
        categories={categories}
        subcategories={subcategories}
        locations={LOCATIONS}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        selectedCity={selectedCity}
        selectedComuna={selectedComuna}
        selectedDate={selectedDate}
        selectedPrice={selectedPrice}
        searchQuery={searchQuery}
        eventsPerDay={eventsPerDay}
        availableComunas={availableComunas}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onCityChange={handleCityChange}
        onComunaChange={handleComunaChange}
        onDateChange={handleDateChange}
        onPriceChange={handlePriceChange}
        onSearchChange={handleSearch}
        onClearFilters={handleClearFilters}
        totalResults={filteredEvents.length}
      />

      {/* Lista de eventos */}
      <section className="panoramas-page__events">
        <div className="panoramas-page__events-header">
          <h2>
            {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "Panorama" : "Panoramas"} disponibles
          </h2>
          <button
            className="panoramas-page__add-btn"
            onClick={() => navigate("/publicar-panorama")}>
            <FontAwesomeIcon icon={faPlus} />
            Publicar Panorama
          </button>
        </div>

        {loading ? (
          <div className="panoramas-page__loading">
            <p>Cargando panoramas...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyPanoramas
            onClearFilters={handleClearFilters}
            hasFilters={hasActiveFilters}
          />
        ) : (
          <>
            {/* Grid de publicaciones usando el componente de Superguia */}
            <PublicationGrid
              publications={paginatedEvents}
              onPublicationClick={handleEventClick}
            />

            {/* Paginación */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </section>

      {/* Sección de Eventos Destacados con Carrusel Mejorado */}
      {events.length > 0 && (
        <section className="panoramas-page__featured">
          <div className="panoramas-page__featured-header">
            <div className="panoramas-page__featured-title">
              <FontAwesomeIcon
                icon={faFire}
                className="panoramas-page__featured-icon"
              />
              <h2>Descubre más panoramas</h2>
            </div>
            <p className="panoramas-page__featured-subtitle">
              Explora los eventos más populares de la región
            </p>
          </div>
          <Carousel
            publications={events.slice(0, 10)}
            onPublicationClick={handleEventClick}
          />
        </section>
      )}

      {/* CTA */}
      <section className="panoramas-page__cta">
        <div className="panoramas-page__cta-content">
          <h2>¿Tienes un evento?</h2>
          <p>
            Publica tu panorama y llega a miles de personas en la región del
            Maule
          </p>
          <button onClick={() => navigate("/publicar-panorama")}>
            <FontAwesomeIcon icon={faPlus} />
            Publicar Panorama
          </button>
        </div>
      </section>

      {/* Modal de publicación */}
      <PublicationModal
        publication={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <Footer />
    </div>
  );
}
