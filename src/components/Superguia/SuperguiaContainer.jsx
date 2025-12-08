import { useState, useCallback, useMemo } from "react";
import "./styles/SuperguiaContainer.css";
import FilterBar from "./FilterBar";
import SearchBar from "./SearchBar";
import Carousel from "./Carousel";
import PublicationGrid from "./PublicationGrid";
import PublicationModal from "./PublicationModal";
import Pagination from "./Pagination";
import Footer from "../Home/Footer";
import { CATEGORIES, LOCATIONS, MOCK_PUBLICATIONS } from "./data";

const ITEMS_PER_PAGE = 16;

export default function SuperguiaContainer() {
  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del modal
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Filtrar publicaciones
  const filteredPublications = useMemo(() => {
    let result = [...MOCK_PUBLICATIONS];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pub) =>
          pub.titulo.toLowerCase().includes(query) ||
          pub.ciudad.toLowerCase().includes(query) ||
          pub.categoria.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter((pub) => pub.categoria === selectedCategory);
    }

    if (selectedCity) {
      const cityData = LOCATIONS[selectedCity];
      if (cityData) {
        result = result.filter((pub) => cityData.comunas.includes(pub.ciudad));
      }
    }

    if (selectedComuna) {
      result = result.filter((pub) => pub.ciudad === selectedComuna);
    }

    return result;
  }, [selectedCategory, selectedCity, selectedComuna, searchQuery]);

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
        {/* Header naranja */}
        <header className="superguia__header">
          <h1 className="superguia__title">SUPERGUIA EXTROVERTIDOS</h1>
        </header>

        {/* Barra de filtros */}
        <FilterBar
          categories={CATEGORIES}
          locations={LOCATIONS}
          selectedCategory={selectedCategory}
          selectedCity={selectedCity}
          selectedComuna={selectedComuna}
          availableComunas={availableComunas}
          activeCategoriesCount={CATEGORIES.length}
          onCategoryChange={handleCategoryChange}
          onCityChange={handleCityChange}
          onComunaChange={handleComunaChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Banner Hero */}
        <div className="superguia__hero">
          <div className="superguia__hero-overlay"></div>
          <div className="superguia__hero-text">
            <h2>¿QUÉ HACEMOS HOY?</h2>
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="superguia__container">
          {/* Buscador */}
          <SearchBar value={searchQuery} onChange={handleSearch} />

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
              <p>No se encontraron publicaciones.</p>
              <button onClick={handleClearFilters}>Limpiar filtros</button>
            </div>
          )}
        </div>
      </section>

      {MOCK_PUBLICATIONS.length > 0 && (
        <div className="superguia__carousel-section">
          <h3 className="superguia__carousel-title">Destacados</h3>
          <Carousel
            publications={MOCK_PUBLICATIONS}
            onPublicationClick={handlePublicationClick}
          />
        </div>
      )}

      {/* Carrusel de publicaciones destacadas */}

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
