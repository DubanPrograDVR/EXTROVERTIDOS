import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBorderAll,
  faLayerGroup,
  faLocationDot,
  faCalendar,
  faTag,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/FilterBar.css";

export default function FilterBar({
  categories = [],
  locations = {},
  selectedCategory,
  selectedCity,
  selectedComuna,
  availableComunas = [],
  activeCategoriesCount = 0,
  onCategoryChange,
  onCityChange,
  onComunaChange,
  onClearFilters,
  onApplyFilters,
}) {
  const [openFilter, setOpenFilter] = useState(null);

  const toggleFilter = (filter) => {
    setOpenFilter(openFilter === filter ? null : filter);
  };

  const closeDropdowns = () => {
    setOpenFilter(null);
  };

  const hasActiveFilters = selectedCategory || selectedCity || selectedComuna;

  return (
    <div className="filter-bar">
      <div className="filter-bar__filters">
        {/* Todos */}
        <button
          className={`filter-bar__btn ${
            !hasActiveFilters ? "filter-bar__btn--active" : ""
          }`}
          onClick={onClearFilters}>
          <FontAwesomeIcon icon={faBorderAll} />
          TODOS
        </button>

        {/* Categorías */}
        <div className="filter-bar__dropdown">
          <button
            className={`filter-bar__btn ${
              selectedCategory ? "filter-bar__btn--active" : ""
            }`}
            onClick={() => toggleFilter("categoria")}>
            <FontAwesomeIcon icon={faLayerGroup} />
            CATEGORÍAS
            <FontAwesomeIcon icon={openFilter === "categoria" ? faChevronUp : faChevronDown} />
          </button>
          {openFilter === "categoria" && (
            <div className="filter-bar__menu">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-bar__option ${
                    selectedCategory === cat.id
                      ? "filter-bar__option--active"
                      : ""
                  }`}
                  onClick={() => {
                    onCategoryChange(
                      selectedCategory === cat.id ? null : cat.id
                    );
                    closeDropdowns();
                  }}>
                  <FontAwesomeIcon icon={cat.icon} />
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ciudad */}
        <div className="filter-bar__dropdown">
          <button
            className={`filter-bar__btn ${
              selectedCity ? "filter-bar__btn--active" : ""
            }`}
            onClick={() => toggleFilter("ciudad")}>
            <FontAwesomeIcon icon={faLocationDot} />
            CIUDAD
            <FontAwesomeIcon icon={openFilter === "ciudad" ? faChevronUp : faChevronDown} />
          </button>
          {openFilter === "ciudad" && (
            <div className="filter-bar__menu">
              {Object.entries(locations).map(([key, city]) => (
                <button
                  key={key}
                  className={`filter-bar__option ${
                    selectedCity === key ? "filter-bar__option--active" : ""
                  }`}
                  onClick={() => {
                    onCityChange(selectedCity === key ? null : key);
                    closeDropdowns();
                  }}>
                  {city.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comunas (solo si hay ciudad seleccionada) */}
        {availableComunas.length > 0 && (
          <div className="filter-bar__dropdown">
            <button
              className={`filter-bar__btn ${
                selectedComuna ? "filter-bar__btn--active" : ""
              }`}
              onClick={() => toggleFilter("comuna")}>
              COMUNAS
              <FontAwesomeIcon icon={openFilter === "comuna" ? faChevronUp : faChevronDown} />
            </button>
            {openFilter === "comuna" && (
              <div className="filter-bar__menu">
                {availableComunas.map((comuna) => (
                  <button
                    key={comuna}
                    className={`filter-bar__option ${
                      selectedComuna === comuna
                        ? "filter-bar__option--active"
                        : ""
                    }`}
                    onClick={() => {
                      onComunaChange(selectedComuna === comuna ? null : comuna);
                      closeDropdowns();
                    }}>
                    {comuna}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fecha */}
        <div className="filter-bar__dropdown">
          <button
            className="filter-bar__btn"
            onClick={() => toggleFilter("fecha")}>
            <FontAwesomeIcon icon={faCalendar} />
            FECHA
            <FontAwesomeIcon icon={openFilter === "fecha" ? faChevronUp : faChevronDown} />
          </button>
          {openFilter === "fecha" && (
            <div className="filter-bar__menu">
              <button className="filter-bar__option">Hoy</button>
              <button className="filter-bar__option">Esta semana</button>
              <button className="filter-bar__option">Este mes</button>
            </div>
          )}
        </div>

        {/* Precio */}
        <div className="filter-bar__dropdown">
          <button
            className="filter-bar__btn"
            onClick={() => toggleFilter("precio")}>
            <FontAwesomeIcon icon={faTag} />
            PRECIO
            <FontAwesomeIcon icon={openFilter === "precio" ? faChevronUp : faChevronDown} />
          </button>
          {openFilter === "precio" && (
            <div className="filter-bar__menu">
              <button className="filter-bar__option">Gratis</button>
              <button className="filter-bar__option">$ - Económico</button>
              <button className="filter-bar__option">$$ - Moderado</button>
              <button className="filter-bar__option">$$$ - Premium</button>
            </div>
          )}
        </div>
      </div>

      {/* Contador y botones */}
      <div className="filter-bar__actions">
        <span className="filter-bar__count">
          {activeCategoriesCount} categorías activas
        </span>
        <button className="filter-bar__apply" onClick={onApplyFilters}>
          APLICAR FILTROS
        </button>
      </div>
    </div>
  );
}
