import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./styles/SuperguiaContainer.css";
import FilterPanel from "./FilterPanel";
import { formatDateKey } from "./DateCalendar";
import Carousel from "./Carousel";
import PublicationGrid from "./PublicationGrid";
import PublicationModal from "./PublicationModal";
import Pagination from "./Pagination";
import Footer from "../Home/Footer";
import { LOCATIONS, mapCategoriesToUI } from "./data";
import {
  getPublishedEvents,
  getEventsByCity,
  getCategories,
} from "../../lib/database";
import { useCity } from "../../context/CityContext";

const ITEMS_PER_PAGE = 16;

export default function SuperguiaContainer() {
  const [searchParams] = useSearchParams();
  const { cityName, selectCity } = useCity();

  // Estados de datos
  const [publications, setPublications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del modal
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sincronizar con query params
  useEffect(() => {
    const ciudadParam = searchParams.get("ciudad");
    if (ciudadParam) {
      selectCity(ciudadParam);
    }
  }, [searchParams, selectCity]);

  // Cargar datos desde Supabase (filtrado por ciudad si hay param)
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const ciudadParam = searchParams.get("ciudad");

        let eventsData;
        if (ciudadParam) {
          eventsData = await getEventsByCity(ciudadParam);
        } else {
          eventsData = await getPublishedEvents();
        }

        const categoriesData = await getCategories();

        setPublications(eventsData || []);
        // Mapear categorías para agregar iconos de FontAwesome
        setCategories(mapCategoriesToUI(categoriesData || []));
      } catch (error) {
        console.error("Error cargando datos:", error);
        setPublications([]);
        setCategories([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Handlers para el modal
  const handlePublicationClick = useCallback((publication) => {
    setSelectedPublication(publication);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPublication(null);
  }, []);

  // Handlers
  const handleCityChange = useCallback((city) => {
    setSelectedCity(city);
    setSelectedComuna(null);
    setCurrentPage(1);
  }, []);

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
  }, []);

  // Filtrar publicaciones
  const filteredPublications = useMemo(() => {
    let result = [...publications];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pub) =>
          pub.titulo?.toLowerCase().includes(query) ||
          pub.comuna?.toLowerCase().includes(query) ||
          pub.provincia?.toLowerCase().includes(query) ||
          pub.categories?.nombre?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter((pub) => pub.category_id === selectedCategory);
    }

    if (selectedCity) {
      result = result.filter((pub) => pub.provincia === selectedCity);
    }

    if (selectedComuna) {
      result = result.filter((pub) => pub.comuna === selectedComuna);
    }

    // Filtrar por fecha
    if (selectedDate) {
      const dateStr = formatDateKey(selectedDate);
      result = result.filter((pub) => {
        if (!pub.fecha_evento) return false;
        const eventDate = new Date(pub.fecha_evento);
        return formatDateKey(eventDate) === dateStr;
      });
    }

    // Filtrar por precio
    if (selectedPrice) {
      result = result.filter((pub) => {
        const precio = pub.precio || 0;
        switch (selectedPrice) {
          case "gratis":
            return precio === 0 || pub.tipo_entrada === "gratis";
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
    selectedCategory,
    selectedCity,
    selectedComuna,
    selectedDate,
    selectedPrice,
    searchQuery,
    publications,
  ]);

  // Calcular eventos por día para el calendario
  const eventsPerDay = useMemo(() => {
    const counts = {};
    publications.forEach((pub) => {
      if (pub.fecha_evento) {
        const dateStr = formatDateKey(new Date(pub.fecha_evento));
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [publications]);

  // Paginación
  const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE);
  const paginatedPublications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPublications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPublications, currentPage]);

  const availableComunas = useMemo(() => {
    if (!selectedCity) return [];
    return LOCATIONS[selectedCity]?.comunas || [];
  }, [selectedCity]);

  return (
    <>
      <section className="superguia">
        {/* Hero Banner con imagen de fondo */}
        <div className="superguia__hero">
          <img
            src="/img/banner.png"
            alt="¿Qué hacemos hoy?"
            className="superguia__hero-img"
          />
          <div className="superguia__hero-overlay"></div>
          <div className="superguia__hero-content">
            <img
              src="/img/Logo_extrovertidos.png"
              alt="Extrovertidos"
              className="superguia__hero-logo"
            />
            <h1 className="superguia__hero-title">¿QUÉ HACEMOS HOY?</h1>
            <p className="superguia__hero-subtitle">
              Descubre los mejores eventos y panoramas cerca de ti
            </p>
          </div>
        </div>

        {/* Panel de filtros rediseñado */}
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
          availableComunas={availableComunas}
          onCategoryChange={handleCategoryChange}
          onCityChange={handleCityChange}
          onComunaChange={handleComunaChange}
          onDateChange={handleDateChange}
          onPriceChange={handlePriceChange}
          onSearchChange={handleSearch}
          onClearFilters={handleClearFilters}
          totalResults={filteredPublications.length}
        />

        {/* Contenedor principal */}
        <div className="superguia__container">
          {/* Loading state */}
          {loadingData ? (
            <div className="superguia__loading">
              <div className="superguia__loading-spinner"></div>
              <p>Cargando eventos...</p>
            </div>
          ) : (
            <>
              {/* Grid de publicaciones */}
              <PublicationGrid
                publications={paginatedPublications}
                onPublicationClick={handlePublicationClick}
              />

              {/* Paginación */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}

              {/* Estado vacío */}
              {filteredPublications.length === 0 && (
                <div className="superguia__empty">
                  <div className="superguia__empty-icon">🔍</div>
                  <h3>No encontramos resultados</h3>
                  <p>Intenta ajustar los filtros o buscar algo diferente</p>
                  <button onClick={handleClearFilters}>Limpiar filtros</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Sección de destacados */}
      {publications.length > 0 && (
        <div className="superguia__carousel-section">
          <h3 className="superguia__carousel-title">Destacados</h3>
          <Carousel
            publications={publications}
            onPublicationClick={handlePublicationClick}
          />
        </div>
      )}

      {/* Modal de publicación */}
      <PublicationModal
        publication={selectedPublication}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <Footer />
    </>
  );
}
