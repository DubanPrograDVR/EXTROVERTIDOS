import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faLocationDot,
  faSearch,
  faFilter,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import Pagination from "../Superguia/Pagination";
import {
  getPublishedEvents,
  getEventsByCity,
  getCategories,
} from "../../lib/database";
import { useCity } from "../../context/CityContext";
import { mapCategoriesToUI } from "../Superguia/data";
import "./styles/panoramas-page.css";

const ITEMS_PER_PAGE = 4;

export default function PanoramasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cityName, selectCity, cities } = useCity();

  // Estados de datos
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del carrusel
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Leer query params al cargar y sincronizar con CityContext
  useEffect(() => {
    const ciudadParam = searchParams.get("ciudad");
    if (ciudadParam) {
      // Actualizar el contexto global de ciudad
      selectCity(ciudadParam);
      setSearchQuery(ciudadParam);
    }
  }, [searchParams, selectCity]);

  // Cargar datos - filtrado por ciudad desde Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const ciudadParam = searchParams.get("ciudad");

        // Si hay una ciudad en los params, hacer query filtrada
        let eventsData;
        if (ciudadParam) {
          eventsData = await getEventsByCity(ciudadParam);
        } else {
          eventsData = await getPublishedEvents();
        }

        const categoriesData = await getCategories();

        setEvents(eventsData || []);
        setCategories(mapCategoriesToUI(categoriesData || []));
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.titulo?.toLowerCase().includes(query) ||
          event.comuna?.toLowerCase().includes(query) ||
          event.provincia?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory) {
      result = result.filter((event) => event.category_id === selectedCategory);
    }

    if (selectedCity) {
      result = result.filter((event) => event.provincia === selectedCity);
    }

    return result;
  }, [events, searchQuery, selectedCategory, selectedCity]);

  // Paginación
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCity]);

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

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCity(null);
    setSearchQuery("");
    setCurrentPage(1);
    setSearchParams({}); // Limpiar query params de la URL
  };

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
                      onClick={() => navigate("/superguia")}>
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

      {/* Sección de filtros */}
      <section className="panoramas-page__filters">
        <div className="panoramas-page__filters-container">
          {/* Buscador */}
          <div className="panoramas-page__search">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Buscar panoramas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por ciudad */}
          <div className="panoramas-page__filter-select">
            <FontAwesomeIcon icon={faLocationDot} />
            <select
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(e.target.value || null)}>
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city.id} value={city.nombre}>
                  {city.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por categoría */}
          <div className="panoramas-page__filter-select">
            <FontAwesomeIcon icon={faFilter} />
            <select
              value={selectedCategory || ""}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }>
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar */}
          {(selectedCategory || selectedCity || searchQuery) && (
            <button
              className="panoramas-page__clear-btn"
              onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

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
          <div className="panoramas-page__empty">
            <p>No se encontraron panoramas con los filtros seleccionados.</p>
            <button onClick={clearFilters}>Ver todos los panoramas</button>
          </div>
        ) : (
          <>
            <div className="panoramas-page__grid">
              {paginatedEvents.map((event) => {
                // Obtener la primera imagen del array o usar placeholder
                const imageUrl =
                  Array.isArray(event.imagenes) && event.imagenes.length > 0
                    ? event.imagenes[0]
                    : "/img/Home1.png";

                return (
                  <article
                    key={event.id}
                    className="panoramas-page__card"
                    onClick={() => navigate("/superguia")}>
                    <div className="panoramas-page__card-image">
                      <img
                        src={imageUrl}
                        alt={event.titulo}
                        onError={(e) => {
                          e.target.src = "/img/Home1.png";
                        }}
                      />
                      <span className="panoramas-page__card-category">
                        {event.categories?.nombre || "Evento"}
                      </span>
                    </div>
                    <div className="panoramas-page__card-content">
                      <h3 className="panoramas-page__card-title">
                        {event.titulo}
                      </h3>
                      <div className="panoramas-page__card-info">
                        <span>
                          <FontAwesomeIcon icon={faCalendarDays} />
                          {formatDate(event.fecha_evento)}
                        </span>
                        <span>
                          <FontAwesomeIcon icon={faLocationDot} />
                          {event.comuna}
                        </span>
                      </div>
                      {event.profiles && (
                        <div className="panoramas-page__card-author">
                          {event.profiles.avatar_url && (
                            <img
                              src={event.profiles.avatar_url}
                              alt={event.profiles.nombre}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span>{event.profiles.nombre || "Usuario"}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

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

      <Footer />
    </div>
  );
}
