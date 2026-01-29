import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faPlus,
  faSearch,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../Home/Footer";
import Pagination from "./Pagination";
import FilterPanel from "./FilterPanel";
import BusinessGrid from "./BusinessGrid";
import BusinessModal from "./BusinessModal";
import { getPublishedBusinesses, getCategories } from "../../lib/database";
import { LOCATIONS, mapCategoriesToUI } from "./data";
import "./styles/SuperguiaContainer.css";

const ITEMS_PER_PAGE = 8;

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
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del modal
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [businessesData, categoriesData] = await Promise.all([
          getPublishedBusinesses(),
          getCategories(),
        ]);

        setBusinesses(businessesData || []);
        setCategories(mapCategoriesToUI(categoriesData || []));
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("No se pudieron cargar los negocios");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handlers para filtros
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

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory(null);
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
          business.categories?.nombre?.toLowerCase().includes(query) ||
          business.slogan?.toLowerCase().includes(query),
      );
    }

    // Filtro de categoría
    if (selectedCategory) {
      result = result.filter(
        (business) => business.category_id === selectedCategory,
      );
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

    return result;
  }, [businesses, searchQuery, selectedCategory, selectedCity, selectedComuna]);

  // Comunas disponibles según ciudad seleccionada
  const availableComunas = useMemo(() => {
    if (!selectedCity) return [];
    return LOCATIONS[selectedCity]?.comunas || [];
  }, [selectedCity]);

  // Paginación
  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBusinesses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBusinesses, currentPage]);

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedCategory || selectedCity || selectedComuna || searchQuery.trim();

  return (
    <>
      <section className="superguia">
        {/* Hero Banner */}
        <div className="superguia__hero">
          <img
            src="/img/banner.png"
            alt="Superguía Extrovertidos"
            className="superguia__hero-img"
          />
          <div className="superguia__hero-overlay"></div>
          <div className="superguia__hero-content">
            <img
              src="/img/Logo_extrovertidos.png"
              alt="Extrovertidos"
              className="superguia__hero-logo"
            />
            <h1 className="superguia__hero-title">SUPERGUÍA EXTROVERTIDOS</h1>
            <p className="superguia__hero-subtitle">
              Descubre los mejores negocios y servicios de la región
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
          <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
            selectedComuna={selectedComuna}
            onComunaChange={handleComunaChange}
            availableComunas={availableComunas}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onClearFilters={handleClearFilters}
            showDateFilter={false}
            showPriceFilter={false}
          />

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
                  <div className="superguia__empty-icon">
                    <FontAwesomeIcon icon={faStore} />
                  </div>
                  <h3>
                    {hasActiveFilters
                      ? "No se encontraron negocios"
                      : "Aún no hay negocios publicados"}
                  </h3>
                  <p>
                    {hasActiveFilters
                      ? "Intenta con otros filtros de búsqueda"
                      : "¡Sé el primero en publicar tu negocio!"}
                  </p>
                  {hasActiveFilters ? (
                    <button onClick={handleClearFilters}>
                      Limpiar filtros
                    </button>
                  ) : (
                    <button onClick={() => navigate("/publicar-negocio")}>
                      Publicar Negocio
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <BusinessGrid
                    businesses={paginatedBusinesses}
                    onBusinessClick={handleBusinessClick}
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
            </>
          )}
        </div>
      </section>

      {/* Modal de negocio */}
      <BusinessModal
        business={selectedBusiness}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <Footer />
    </>
  );
}
