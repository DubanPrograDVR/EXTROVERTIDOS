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
import "./styles/FilterPanel.css";

const normalizarId = (valor) => String(valor ?? "");

const coincidenIds = (primero, segundo) =>
  normalizarId(primero) === normalizarId(segundo);

const normalizarUbicacion = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/\s+/g, " ")
    .trim();

const coincidenUbicaciones = (primero, segundo) =>
  normalizarUbicacion(primero) === normalizarUbicacion(segundo);

const coincideCiudad = (valor, clave, ciudad) => {
  const normalizado = normalizarUbicacion(valor);
  return (
    normalizado &&
    (normalizado === normalizarUbicacion(clave) ||
      normalizado === normalizarUbicacion(ciudad?.nombre))
  );
};

const encontrarCiudad = (locations, valor) =>
  Object.entries(locations).find(([clave, ciudad]) =>
    coincideCiudad(valor, clave, ciudad),
  );

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
  eventsCountBySubcategory = {},
  searchPlaceholder = "Buscar eventos, lugares, actividades...",
  categoryIcon = null,
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
    selectedPrice ||
    searchQuery?.trim();

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
      const subcat = subcategories.find((s) =>
        coincidenIds(s.id, selectedSubcategory),
      );
      return subcat?.nombre || "Categoría";
    }
    if (!selectedCategory) return "Categoría";
    const cat = categories.find((c) => coincidenIds(c.id, selectedCategory));
    return cat?.nombre || "Categoría";
  }, [selectedCategory, selectedSubcategory, categories, subcategories]);

  // Filtrar subcategorías por la categoría seleccionada
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategories.filter((s) =>
      coincidenIds(s.category_id, selectedCategory),
    );
  }, [selectedCategory, subcategories]);

  const ubicacionSeleccionada = useMemo(
    () => encontrarCiudad(locations, selectedCity),
    [locations, selectedCity],
  );

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

  const shouldShowCountBadge = useCallback((count) => Number(count) > 0, []);

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
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-panel__search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="filter-panel__search-clear"
              onClick={() => onSearchChange("")}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      {/* Fila principal: Filtros + Calendario */}
      <div className="filter-panel__main">
        {/* === Barra de ciudades (Pills) === */}
        <div className="filter-panel__cities-bar">
          <button
            type="button"
            className={`filter-panel__city-pill ${!selectedCity ? "active" : ""}`}
            onClick={() => onCityChange(null)}>
            Todas
          </button>
          {Object.entries(locations).map(([key, city]) => (
            <button
              type="button"
              key={key}
              className={`filter-panel__city-pill ${
                coincideCiudad(selectedCity, key, city) ? "active" : ""
              }`}
              onClick={() => onCityChange(key)}>
              {city.nombre}
            </button>
          ))}
        </div>

        {/* Filtros dropdown */}
        <div className="filter-panel__filters">
          {/* Categoría */}
          <div className="filter-panel__dropdown-wrapper">
            <button
              type="button"
              className={`filter-panel__filter-btn ${
                activeDropdown === "category" ? "active" : ""
              } ${selectedCategory ? "has-value" : ""}`}
              aria-expanded={activeDropdown === "category"}
              onClick={() => toggleDropdown("category")}>
              {categoryIcon ? (
                <img src={categoryIcon} alt="" className="filter-panel__btn-icon" />
              ) : (
                <FontAwesomeIcon icon={faLayerGroup} />
              )}
              <span>{categoryLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className="chevron" />
            </button>

            {activeDropdown === "category" && (
              <div className="filter-panel__dropdown">
                <div className="filter-panel__dropdown-header">
                  <span>Seleccionar categoría</span>
                  {(selectedCategory || selectedSubcategory) && (
                    <button
                      type="button"
                      onClick={() => {
                        onCategoryChange(null);
                      }}>
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="filter-panel__dropdown-list">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      className={`filter-panel__dropdown-item ${
                        coincidenIds(selectedCategory, cat.id) ? "selected" : ""
                      }`}
                      onClick={() => {
                        onCategoryChange(
                          coincidenIds(selectedCategory, cat.id) ? null : cat.id,
                        );
                        setActiveDropdown(null);
                      }}>
                      {categoryIcon && (
                        <img
                          src={categoryIcon}
                          alt=""
                          className="filter-panel__cat-icon"
                        />
                      )}
                      <span>{cat.nombre}</span>
                      {shouldShowCountBadge(eventsCountByCategory[cat.id]) && (
                        <span className="filter-panel__count-badge">
                          {eventsCountByCategory[cat.id] >= 100
                            ? "+99"
                            : eventsCountByCategory[cat.id]}
                        </span>
                      )}
                      {coincidenIds(selectedCategory, cat.id) && (
                        <FontAwesomeIcon icon={faCheck} className="check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comuna (filtro separado, siempre visible si hay comunas) */}
          {availableComunas.length > 0 && (
            <div className="filter-panel__dropdown-wrapper">
              <button
                type="button"
                className={`filter-panel__filter-btn ${
                  activeDropdown === "comuna" ? "active" : ""
                } ${selectedComuna ? "has-value" : ""}`}
                aria-expanded={activeDropdown === "comuna"}
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
                      <button type="button" onClick={() => onComunaChange(null)}>
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="filter-panel__dropdown-list">
                    {availableComunas.map((comuna) => (
                    <button
                      type="button"
                      key={comuna}
                        className={`filter-panel__dropdown-item ${
                          coincidenUbicaciones(selectedComuna, comuna)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          onComunaChange(
                            coincidenUbicaciones(selectedComuna, comuna)
                              ? null
                              : comuna,
                          );
                          setActiveDropdown(null);
                        }}>
                        <span>{comuna}</span>
                        {shouldShowCountBadge(eventsCountByComuna[comuna]) && (
                          <span className="filter-panel__count-badge">
                            {eventsCountByComuna[comuna] >= 100
                              ? "+99"
                              : eventsCountByComuna[comuna]}
                          </span>
                        )}
                        {coincidenUbicaciones(selectedComuna, comuna) && (
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
                type="button"
                className={`filter-panel__filter-btn ${
                  activeDropdown === "price" ? "active" : ""
                } ${selectedPrice ? "has-value" : ""}`}
                aria-expanded={activeDropdown === "price"}
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
                      <button type="button" onClick={() => onPriceChange(null)}>
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="filter-panel__dropdown-list">
                    {priceOptions.map((option) => (
                      <button
                        type="button"
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
                type="button"
                className={`filter-panel__filter-btn ${
                  activeDropdown === "calendar" ? "active" : ""
                } ${selectedDate ? "has-value" : ""}`}
                aria-expanded={activeDropdown === "calendar"}
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
                      <button type="button" onClick={() => onDateChange(null)}>
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
                  type="button"
                  key={subcat.id}
                  className={`filter-panel__subcat-chip ${
                    coincidenIds(selectedSubcategory, subcat.id)
                      ? "filter-panel__subcat-chip--active"
                      : ""
                  }`}
                  onClick={() =>
                    onSubcategoryChange(
                      coincidenIds(selectedSubcategory, subcat.id)
                        ? null
                        : subcat.id,
                    )
                  }>
                  {categoryIcon && (
                    <img
                      src={categoryIcon}
                      alt=""
                      className="filter-panel__subcat-chip-icon"
                    />
                  )}
                  <span>{subcat.nombre}</span>
                  {shouldShowCountBadge(
                    eventsCountBySubcategory[subcat.id],
                  ) && (
                    <span className="filter-panel__count-badge">
                      {eventsCountBySubcategory[subcat.id] >= 100
                        ? "+99"
                        : eventsCountBySubcategory[subcat.id]}
                    </span>
                  )}
                  {coincidenIds(selectedSubcategory, subcat.id) && (
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
          <button
            type="button"
            className="filter-panel__clear-all"
            onClick={onClearFilters}>
            <FontAwesomeIcon icon={faTimes} />
            Ver todos
          </button>
        )}
      </div>
    </div>
  );
}
