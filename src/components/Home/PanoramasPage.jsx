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
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import Pagination from "../Superguia/Pagination";
import FilterPanel from "../Superguia/FilterPanel";
import PublicationModal from "../Superguia/PublicationModal";
import PublicationGrid from "../Superguia/PublicationGrid";
import Carousel from "../Superguia/Carousel";
import BusinessModal from "../Superguia/BusinessModal";
import EmptyPanoramas from "../Superguia/EmptyPanoramas";
import { formatDateKey } from "../Superguia/DateCalendar";
import {
  getPublishedEvents,
  getCategories,
  getPublishedBusinesses,
} from "../../lib/database";
import { useCity } from "../../context/CityContext";
import { LOCATIONS, mapCategoriesToUI } from "../Superguia/data";
import "./styles/panoramas-page.css";

const ITEMS_PER_PAGE = 16;

export default function PanoramasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectCity } = useCity();

  // Estados de datos
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  // Estados de filtros (igual que SuperguiaContainer)
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  // Estado para negocios (carrusel cruzado)
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);

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

  // Cargar todos los datos (el filtro de ciudad es client-side)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsData, categoriesData, businessesData] = await Promise.all([
          getPublishedEvents(),
          getCategories(),
          getPublishedBusinesses(),
        ]);

        setEvents(eventsData || []);
        setCategories(mapCategoriesToUI(categoriesData || []));
        setBusinesses(businessesData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handlers para filtros
  const handleCityChange = useCallback(
    (city) => {
      setSelectedCity(city);
      setSelectedComuna(null);
      setCurrentPage(1);

      // Actualizar URL para compartir/navegar (sin recargar datos)
      if (city) {
        const cityName = LOCATIONS[city]?.nombre;
        if (cityName) {
          setSearchParams({ ciudad: cityName }, { replace: true });
          selectCity(cityName);
        }
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams, selectCity],
  );

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
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

  // Handlers para carrusel de negocios
  const handleBusinessClick = useCallback((business) => {
    setSelectedBusiness(business);
    setIsBusinessModalOpen(true);
  }, []);

  const handleCloseBusinessModal = useCallback(() => {
    setIsBusinessModalOpen(false);
    setSelectedBusiness(null);
  }, []);

  // Filtrar eventos (misma lógica que SuperguiaContainer)
  const filteredEvents = useMemo(() => {
    // Primero filtrar eventos pasados (respaldo del filtro de BD)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    let result = events.filter((event) => {
      // Usar fecha_fin si existe, sino fecha_evento
      const eventEndDate = event.fecha_fin || event.fecha_evento;
      if (!eventEndDate) return true; // Si no hay fecha, mostrar el evento

      const endDate = new Date(eventEndDate + "T23:59:59");

      return endDate >= today; // Solo eventos que no han terminado
    });

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

    // Filtrar por fecha (incluye fechas de recurrencia y rango multi-día)
    if (selectedDate) {
      const dateStr = formatDateKey(selectedDate);
      result = result.filter((event) => {
        if (!event.fecha_evento) return false;

        // Coincide con fecha principal
        const eventDateStr = formatDateKey(
          new Date(event.fecha_evento + "T00:00:00"),
        );
        if (eventDateStr === dateStr) return true;

        // Coincide con alguna fecha de recurrencia
        if (event.es_recurrente && Array.isArray(event.fechas_recurrencia)) {
          const matchRecurring = event.fechas_recurrencia.some(
            (fecha) => formatDateKey(new Date(fecha + "T00:00:00")) === dateStr,
          );
          if (matchRecurring) return true;
        }

        // Coincide dentro del rango multi-día
        if (event.es_multidia && event.fecha_fin) {
          const inicio = new Date(event.fecha_evento + "T00:00:00");
          const fin = new Date(event.fecha_fin + "T00:00:00");
          const selected = new Date(dateStr + "T00:00:00");
          if (selected >= inicio && selected <= fin) return true;
        }

        return false;
      });
    }

    // Filtrar por precio
    if (selectedPrice) {
      result = result.filter((event) => {
        const precio = event.precio || 0;
        switch (selectedPrice) {
          case "gratis":
            return (
              precio === 0 ||
              event.tipo_entrada === "gratis" ||
              event.tipo_entrada === "gratuito" ||
              event.tipo_entrada === "sin_entrada"
            );
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

    // Agrupar por fecha
    const groups = {};
    result.forEach((event) => {
      const key = event.fecha_evento || "9999-12-31";
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    // Ordenar fechas ascendente (las más próximas primero, sin fecha al final)
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    // Mezclar aleatoriamente dentro de cada grupo del mismo día
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const sorted = [];
    for (const date of sortedDates) {
      sorted.push(...shuffle(groups[date]));
    }

    return sorted;
  }, [
    events,
    searchQuery,
    selectedCategory,
    selectedCity,
    selectedComuna,
    selectedDate,
    selectedPrice,
  ]);

  // Contadores dinámicos basados en filtros activos
  const eventsCountByCity = useMemo(() => {
    let base = filteredEvents;
    if (selectedCity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      base = events.filter((event) => {
        const eventEndDate = event.fecha_fin || event.fecha_evento;
        if (!eventEndDate) return true;
        return new Date(eventEndDate + "T23:59:59") >= today;
      });
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        base = base.filter(
          (e) =>
            e.titulo?.toLowerCase().includes(query) ||
            e.comuna?.toLowerCase().includes(query) ||
            e.provincia?.toLowerCase().includes(query) ||
            e.categories?.nombre?.toLowerCase().includes(query),
        );
      }
      if (selectedCategory) {
        base = base.filter((e) => e.category_id === selectedCategory);
      }
      if (selectedDate) {
        const dateStr = formatDateKey(selectedDate);
        base = base.filter((e) => {
          if (!e.fecha_evento) return false;
          if (formatDateKey(new Date(e.fecha_evento + "T00:00:00")) === dateStr)
            return true;
          if (e.es_recurrente && Array.isArray(e.fechas_recurrencia)) {
            if (
              e.fechas_recurrencia.some(
                (f) => formatDateKey(new Date(f + "T00:00:00")) === dateStr,
              )
            )
              return true;
          }
          if (e.es_multidia && e.fecha_fin) {
            const inicio = new Date(e.fecha_evento + "T00:00:00");
            const fin = new Date(e.fecha_fin + "T00:00:00");
            const sel = new Date(dateStr + "T00:00:00");
            if (sel >= inicio && sel <= fin) return true;
          }
          return false;
        });
      }
    }
    const counts = {};
    Object.entries(LOCATIONS).forEach(([key, city]) => {
      counts[key] = base.filter(
        (e) => e.provincia?.toLowerCase() === city.nombre.toLowerCase(),
      ).length;
    });
    return counts;
  }, [
    filteredEvents,
    events,
    selectedCity,
    selectedCategory,
    selectedDate,
    searchQuery,
  ]);

  const eventsCountByCategory = useMemo(() => {
    let base = filteredEvents;
    if (selectedCategory) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      base = events.filter((event) => {
        const eventEndDate = event.fecha_fin || event.fecha_evento;
        if (!eventEndDate) return true;
        return new Date(eventEndDate + "T23:59:59") >= today;
      });
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        base = base.filter(
          (e) =>
            e.titulo?.toLowerCase().includes(query) ||
            e.comuna?.toLowerCase().includes(query) ||
            e.provincia?.toLowerCase().includes(query) ||
            e.categories?.nombre?.toLowerCase().includes(query),
        );
      }
      if (selectedCity) {
        const cityName = LOCATIONS[selectedCity]?.nombre;
        if (cityName) {
          base = base.filter(
            (e) => e.provincia?.toLowerCase() === cityName.toLowerCase(),
          );
        }
      }
      if (selectedComuna) {
        base = base.filter(
          (e) => e.comuna?.toLowerCase() === selectedComuna.toLowerCase(),
        );
      }
      if (selectedDate) {
        const dateStr = formatDateKey(selectedDate);
        base = base.filter((e) => {
          if (!e.fecha_evento) return false;
          if (formatDateKey(new Date(e.fecha_evento + "T00:00:00")) === dateStr)
            return true;
          if (e.es_recurrente && Array.isArray(e.fechas_recurrencia)) {
            if (
              e.fechas_recurrencia.some(
                (f) => formatDateKey(new Date(f + "T00:00:00")) === dateStr,
              )
            )
              return true;
          }
          if (e.es_multidia && e.fecha_fin) {
            const inicio = new Date(e.fecha_evento + "T00:00:00");
            const fin = new Date(e.fecha_fin + "T00:00:00");
            const sel = new Date(dateStr + "T00:00:00");
            if (sel >= inicio && sel <= fin) return true;
          }
          return false;
        });
      }
    }
    const counts = {};
    categories.forEach((cat) => {
      counts[cat.id] = base.filter((e) => e.category_id === cat.id).length;
    });
    return counts;
  }, [
    filteredEvents,
    events,
    categories,
    selectedCategory,
    selectedCity,
    selectedComuna,
    selectedDate,
    searchQuery,
  ]);

  const eventsCountByComuna = useMemo(() => {
    const counts = {};
    filteredEvents.forEach((e) => {
      if (e.comuna) {
        const key = e.comuna;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [filteredEvents]);

  // Calcular eventos por día para el calendario (basado en filtros activos, excluyendo fecha)
  const { eventsPerDay, recurringDates } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let base = events.filter((event) => {
      const eventEndDate = event.fecha_fin || event.fecha_evento;
      if (!eventEndDate) return true;
      return new Date(eventEndDate + "T23:59:59") >= today;
    });
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      base = base.filter(
        (e) =>
          e.titulo?.toLowerCase().includes(query) ||
          e.comuna?.toLowerCase().includes(query) ||
          e.provincia?.toLowerCase().includes(query) ||
          e.categories?.nombre?.toLowerCase().includes(query),
      );
    }
    if (selectedCategory) {
      base = base.filter((e) => e.category_id === selectedCategory);
    }
    if (selectedCity) {
      const cityName = LOCATIONS[selectedCity]?.nombre;
      if (cityName) {
        base = base.filter(
          (e) => e.provincia?.toLowerCase() === cityName.toLowerCase(),
        );
      }
    }
    if (selectedComuna) {
      base = base.filter(
        (e) => e.comuna?.toLowerCase() === selectedComuna.toLowerCase(),
      );
    }

    const counts = {};
    const recurring = new Set();
    base.forEach((event) => {
      if (event.fecha_evento) {
        const dateStr = formatDateKey(
          new Date(event.fecha_evento + "T00:00:00"),
        );
        counts[dateStr] = (counts[dateStr] || 0) + 1;

        // Contar cada día intermedio de eventos multi-día
        if (event.es_multidia && event.fecha_fin) {
          const inicio = new Date(event.fecha_evento + "T00:00:00");
          const fin = new Date(event.fecha_fin + "T00:00:00");
          const current = new Date(inicio);
          current.setDate(current.getDate() + 1);
          while (current <= fin) {
            const dayStr = formatDateKey(current);
            counts[dayStr] = (counts[dayStr] || 0) + 1;
            current.setDate(current.getDate() + 1);
          }
        }
      }
      if (
        event.es_recurrente &&
        Array.isArray(event.fechas_recurrencia) &&
        event.fechas_recurrencia.length > 0
      ) {
        event.fechas_recurrencia.forEach((fecha) => {
          const dateStr = formatDateKey(new Date(fecha + "T00:00:00"));
          counts[dateStr] = (counts[dateStr] || 0) + 1;
          recurring.add(dateStr);
        });
      }
    });

    return { eventsPerDay: counts, recurringDates: recurring };
  }, [events, searchQuery, selectedCategory, selectedCity, selectedComuna]);

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
    selectedCity ||
    selectedComuna ||
    selectedDate ||
    selectedPrice ||
    searchQuery.trim();

  // Eventos destacados (todos los eventos vigentes)
  const featuredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const eventEndDate = event.fecha_fin || event.fecha_evento;
      if (!eventEndDate) return true;
      const endDate = new Date(eventEndDate + "T23:59:59");
      return endDate >= today;
    });
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
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-CL", {
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
            <h1>Panoramas</h1>
            <p>
              Descubre los mejores panoramas, actividades y eventos de tu ciudad
            </p>
          </div>
        )}
      </section>

      {/* Panel de filtros de Superguia */}
      <FilterPanel
        categories={categories}
        locations={LOCATIONS}
        selectedCategory={selectedCategory}
        selectedCity={selectedCity}
        selectedComuna={selectedComuna}
        selectedDate={selectedDate}
        selectedPrice={selectedPrice}
        searchQuery={searchQuery}
        eventsPerDay={eventsPerDay}
        recurringDates={recurringDates}
        availableComunas={availableComunas}
        onCategoryChange={handleCategoryChange}
        onCityChange={handleCityChange}
        onComunaChange={handleComunaChange}
        onDateChange={handleDateChange}
        onPriceChange={handlePriceChange}
        onSearchChange={handleSearch}
        onClearFilters={handleClearFilters}
        totalResults={filteredEvents.length}
        showPriceFilter={false}
        showSubcategories={false}
        showComunaFilter={true}
        eventsCountByCity={eventsCountByCity}
        eventsCountByComuna={eventsCountByComuna}
        eventsCountByCategory={eventsCountByCategory}
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

      {/* Sección de Negocios Destacados con Carrusel */}
      {businesses.length > 0 && (
        <section className="panoramas-page__featured">
          <div className="panoramas-page__featured-header">
            <div className="panoramas-page__featured-title">
              <FontAwesomeIcon
                icon={faStore}
                className="panoramas-page__featured-icon"
              />
              <h2>Descubre negocios</h2>
            </div>
            <p className="panoramas-page__featured-subtitle">
              Explora los mejores negocios y servicios de la región
            </p>
          </div>
          <Carousel
            publications={businesses.slice(0, 10)}
            onPublicationClick={handleBusinessClick}
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
        modalVariant="panoramas"
      />

      {/* Modal de negocio */}
      <BusinessModal
        business={selectedBusiness}
        isOpen={isBusinessModalOpen}
        onClose={handleCloseBusinessModal}
      />

      <Footer />
    </div>
  );
}
