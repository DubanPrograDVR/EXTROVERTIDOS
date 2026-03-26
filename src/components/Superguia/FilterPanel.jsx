import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faMapMarkerAlt,
  faLayerGroup,
  faTag,
  faCalendarAlt,
  faChevronDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import DateCalendar from "./DateCalendar";
import { resolveIcon } from "./iconMap";
import "./styles/FilterPanel.css";

/**
 * Panel de filtros con opciones siempre visibles
 * @param {boolean} showDateFilter - Mostrar filtro de fecha (default: true)
 * @param {boolean} showPriceFilter - Mostrar filtro de precio (default: true)
 * @param {boolean} showSubcategories - Mostrar subcategorías (default: true)
 * @param {boolean} showComunaFilter - Mostrar comuna como filtro separado (default: false)
 */
export default function FilterPanel({
  categories = [],
  subcategories = [],
  locations = {},
  selectedCategory,
  selectedSubcategory,
  selectedCity,
  selectedComuna,
  selectedDate,
  selectedPrice,
  searchQuery,
  eventsPerDay = {},
  recurringDates = new Set(),
  availableComunas = [],
  onCategoryChange,
  onSubcategoryChange,
  onCityChange,
  onComunaChange,
  onDateChange,
  onPriceChange,
  onSearchChange,
  onClearFilters,
  totalResults = 0,
  showDateFilter = true,
  showPriceFilter = true,
  showSubcategories = true,
  showComunaFilter = false,
  eventsCountByCity = {},
  eventsCountByComuna = {},
  eventsCountByCategory = {},
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const panelRef = useRef(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    selectedCity ||
    selectedComuna ||
    selectedDate ||
    selectedPrice;

  const priceOptions = useMemo(
    () => [
      { value: "gratis", label: "Gratis", icon: "🆓" },
      { value: "economico", label: "Económico", icon: "💵" },
      { value: "moderado", label: "Moderado", icon: "💵💵" },
      { value: "premium", label: "Premium", icon: "💵💵💵" },
    ],
    [],
  );

  const toggleDropdown = useCallback((dropdown) => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  }, []);

  // Memoizar labels para evitar recálculos innecesarios
  const categoryLabel = useMemo(() => {
    if (selectedSubcategory) {
      const subcat = subcategories.find((s) => s.id === selectedSubcategory);
      return subcat?.nombre || "Categoría";
    }
    if (!selectedCategory) return "Categoría";
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat?.nombre || "Categoría";
  }, [selectedCategory, selectedSubcategory, categories, subcategories]);

  // Filtrar subcategorías por la categoría seleccionada
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategories.filter((s) => s.category_id === selectedCategory);
  }, [selectedCategory, subcategories]);

  const locationLabel = useMemo(() => {
    if (!showComunaFilter && selectedComuna) return selectedComuna;
    if (selectedCity)
      return (
        locations[selectedCity]?.nombre ||
        (showComunaFilter ? "Ciudad" : "Ubicación")
      );
    return showComunaFilter ? "Ciudad" : "Ubicación";
  }, [selectedComuna, selectedCity, locations, showComunaFilter]);

  const comunaLabel = useMemo(() => {
    if (selectedComuna) return selectedComuna;
    return "Comuna";
  }, [selectedComuna]);

  const priceLabel = useMemo(() => {
    if (!selectedPrice) return "Precio";
    const price = priceOptions.find((p) => p.value === selectedPrice);
    return price?.label || "Precio";
  }, [selectedPrice, priceOptions]);

  const calendarLabel = useMemo(() => {
    if (!selectedDate) return "Calendario";
    return selectedDate.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
    });
  }, [selectedDate]);

  return (
    <div className="filter-panel" ref={panelRef}>
      {/* Barra de búsqueda */}
      <div className="filter-panel__search-row">
        <div className="filter-panel__search-box">
          <FontAwesomeIcon
            icon={faSearch}
            className="filter-panel__search-icon"
          />
          <input
            type="text"
            placeholder="Buscar eventos, lugares, actividades..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-panel__search-input"
          />
          {searchQuery && (
            <button
              className="filter-panel__search-clear"
              onClick={() => onSearchChange("")}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      {/* Fila de filtros y calendario */}
      <div className="filter-panel__main">
        {/* Filtros dropdown */}
        <div className="filter-panel__filters">
          {/* Categoría */}
          <div className="filter-panel__dropdown-wrapper">
            <button
              className={`filter-panel__filter-btn ${
                activeDropdown === "category" ? "active" : ""
              } ${selectedCategory ? "has-value" : ""}`}
              onClick={() => toggleDropdown("category")}>
              <FontAwesomeIcon icon={faLayerGroup} />
              <span>{categoryLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className="chevron" />
            </button>

            {activeDropdown === "category" && (
              <div className="filter-panel__dropdown">
                <div className="filter-panel__dropdown-header">
                  <span>Seleccionar categoría</span>
                  {(selectedCategory || selectedSubcategory) && (
                    <button
                      onClick={() => {
                        onCategoryChange(null);
                        onSubcategoryChange(null);
                      }}>
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="filter-panel__dropdown-list">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`filter-panel__dropdown-item ${
                        selectedCategory === cat.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        onCategoryChange(
                          selectedCategory === cat.id ? null : cat.id,
                        );
                        onSubcategoryChange && onSubcategoryChange(null);
                        setActiveDropdown(null);
                      }}>
                      {cat.icono && resolveIcon(cat.icono) && (
                        <FontAwesomeIcon
                          icon={resolveIcon(cat.icono)}
                          className="filter-panel__cat-icon"
                        />
                      )}
                      <span>{cat.nombre}</span>
                      {eventsCountByCategory[cat.id] != null && (
                        <span className="filter-panel__count-badge">
                          {eventsCountByCategory[cat.id] >= 100
                            ? "+99"
                            : eventsCountByCategory[cat.id]}
                        </span>
                      )}
                      {selectedCategory === cat.id && (
                        <FontAwesomeIcon icon={faCheck} className="check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="filter-panel__dropdown-wrapper">
            <button
              className={`filter-panel__filter-btn ${
                activeDropdown === "location" ? "active" : ""
              } ${selectedCity || selectedComuna ? "has-value" : ""}`}
              onClick={() => toggleDropdown("location")}>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{locationLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className="chevron" />
            </button>

            {activeDropdown === "location" && (
              <div className="filter-panel__dropdown">
                <div className="filter-panel__dropdown-header">
                  <span>Seleccionar ciudad</span>
                  {(selectedCity || selectedComuna) && (
                    <button
                      onClick={() => {
                        onCityChange(null);
                        onComunaChange(null);
                      }}>
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="filter-panel__dropdown-list">
                  {Object.entries(locations).map(([key, city]) => (
                    <button
                      key={key}
                      className={`filter-panel__dropdown-item ${
                        selectedCity === key ? "selected" : ""
                      }`}
                      onClick={() => {
                        onCityChange(selectedCity === key ? null : key);
                        onComunaChange(null);
                        if (showComunaFilter) setActiveDropdown(null);
                      }}>
                      <span>{city.nombre}</span>
                      {eventsCountByCity[key] != null && (
                        <span className="filter-panel__count-badge">
                          {eventsCountByCity[key] >= 100
                            ? "+99"
                            : eventsCountByCity[key]}
                        </span>
                      )}
                      {selectedCity === key && (
                        <FontAwesomeIcon icon={faCheck} className="check" />
                      )}
                    </button>
                  ))}

                  {!showComunaFilter && availableComunas.length > 0 && (
                    <>
                      <p className="filter-panel__dropdown-label">Comuna</p>
                      {availableComunas.map((comuna) => (
                        <button
                          key={comuna}
                          className={`filter-panel__dropdown-item ${
                            selectedComuna === comuna ? "selected" : ""
                          }`}
                          onClick={() => {
                            onComunaChange(
                              selectedComuna === comuna ? null : comuna,
                            );
                            setActiveDropdown(null);
                          }}>
                          <span>{comuna}</span>
                          {selectedComuna === comuna && (
                            <FontAwesomeIcon icon={faCheck} className="check" />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comuna (filtro separado) */}
          {showComunaFilter && availableComunas.length > 0 && (
            <div className="filter-panel__dropdown-wrapper">
              <button
                className={`filter-panel__filter-btn ${
                  activeDropdown === "comuna" ? "active" : ""
                } ${selectedComuna ? "has-value" : ""}`}
                onClick={() => toggleDropdown("comuna")}>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>{comunaLabel}</span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" />
              </button>

              {activeDropdown === "comuna" && (
                <div className="filter-panel__dropdown">
                  <div className="filter-panel__dropdown-header">
                    <span>Seleccionar comuna</span>
                    {selectedComuna && (
                      <button onClick={() => onComunaChange(null)}>
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="filter-panel__dropdown-list">
                    {availableComunas.map((comuna) => (
                      <button
                        key={comuna}
                        className={`filter-panel__dropdown-item ${
                          selectedComuna === comuna ? "selected" : ""
                        }`}
                        onClick={() => {
                          onComunaChange(
                            selectedComuna === comuna ? null : comuna,
                          );
                          setActiveDropdown(null);
                        }}>
                        <span>{comuna}</span>
                        {eventsCountByComuna[comuna] != null && (
                          <span className="filter-panel__count-badge">
                            {eventsCountByComuna[comuna] >= 100
                              ? "+99"
                              : eventsCountByComuna[comuna]}
                          </span>
                        )}
                        {selectedComuna === comuna && (
                          <FontAwesomeIcon icon={faCheck} className="check" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Precio */}
          {showPriceFilter && (
            <div className="filter-panel__dropdown-wrapper">
              <button
                className={`filter-panel__filter-btn ${
                  activeDropdown === "price" ? "active" : ""
                } ${selectedPrice ? "has-value" : ""}`}
                onClick={() => toggleDropdown("price")}>
                <FontAwesomeIcon icon={faTag} />
                <span>{priceLabel}</span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" />
              </button>

              {activeDropdown === "price" && (
                <div className="filter-panel__dropdown">
                  <div className="filter-panel__dropdown-header">
                    <span>Rango de precio</span>
                    {selectedPrice && (
                      <button onClick={() => onPriceChange(null)}>
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="filter-panel__dropdown-list">
                    {priceOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`filter-panel__dropdown-item ${
                          selectedPrice === option.value ? "selected" : ""
                        }`}
                        onClick={() => {
                          onPriceChange(
                            selectedPrice === option.value
                              ? null
                              : option.value,
                          );
                          setActiveDropdown(null);
                        }}>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        {selectedPrice === option.value && (
                          <FontAwesomeIcon icon={faCheck} className="check" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calendario */}
          {showDateFilter && (
            <div className="filter-panel__dropdown-wrapper filter-panel__dropdown-wrapper--calendar">
              <button
                className={`filter-panel__filter-btn ${
                  activeDropdown === "calendar" ? "active" : ""
                } ${selectedDate ? "has-value" : ""}`}
                onClick={() => toggleDropdown("calendar")}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>{calendarLabel}</span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" />
              </button>

              {activeDropdown === "calendar" && (
                <div className="filter-panel__dropdown filter-panel__dropdown--calendar">
                  <div className="filter-panel__dropdown-header">
                    <span>Seleccionar fecha</span>
                    {selectedDate && (
                      <button onClick={() => onDateChange(null)}>
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="filter-panel__calendar-content">
                    <DateCalendar
                      selectedDate={selectedDate}
                      onDateChange={(date) => {
                        onDateChange(date);
                        setActiveDropdown(null);
                      }}
                      eventsPerDay={eventsPerDay}
                      recurringDates={recurringDates}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subcategorías como chips visibles */}
      {showSubcategories &&
        selectedCategory &&
        filteredSubcategories.length > 0 && (
          <div className="filter-panel__subcategories">
            <span className="filter-panel__subcategories-label">
              <FontAwesomeIcon icon={faTag} />
              Subcategorías:
            </span>
            <div className="filter-panel__subcategories-list">
              {filteredSubcategories.map((subcat) => (
                <button
                  key={subcat.id}
                  className={`filter-panel__subcat-chip ${
                    selectedSubcategory === subcat.id
                      ? "filter-panel__subcat-chip--active"
                      : ""
                  }`}
                  onClick={() =>
                    onSubcategoryChange(
                      selectedSubcategory === subcat.id ? null : subcat.id,
                    )
                  }>
                  <span>{subcat.nombre}</span>
                  {selectedSubcategory === subcat.id && (
                    <FontAwesomeIcon
                      icon={faTimes}
                      className="filter-panel__subcat-chip-x"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Barra inferior con resultados y limpiar */}
      <div className="filter-panel__footer">
        <span className="filter-panel__results">
          {totalResults}{" "}
          {totalResults === 1 ? "evento encontrado" : "eventos encontrados"}
        </span>
        {hasActiveFilters && (
          <button className="filter-panel__clear-all" onClick={onClearFilters}>
            <FontAwesomeIcon icon={faTimes} />
            Ver todos
          </button>
        )}
      </div>
    </div>
  );
}
