import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faTag,
  faLayerGroup,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Sección de información básica del negocio
 */
const InformacionBasicaSection = ({
  formData,
  errors,
  categories,
  subcategorias,
  loadingCategories,
  onChange,
  onFieldFocus,
}) => {
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const catRef = useRef(null);
  const subRef = useRef(null);

  const selectedCategory = categories.find(
    (cat) => String(cat.id) === String(formData.category_id),
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
      if (subRef.current && !subRef.current.contains(e.target))
        setSubOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCategory = (catId) => {
    onChange({ target: { name: "category_id", value: String(catId) } });
    onChange({ target: { name: "subcategoria", value: "" } });
    setCatOpen(false);
  };

  const handleSelectSubcategoria = (sub) => {
    onChange({ target: { name: "subcategoria", value: sub } });
    setSubOpen(false);
  };

  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faBuilding} />
        Información del Negocio
      </h2>

      <div className="publicar-negocio__field">
        <label htmlFor="nombre">
          Nombre del Negocio
          <span className="publicar-negocio__label-required">Obligatorio</span>
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="Ej: Restaurante El Buen Sabor"
          className={errors.nombre ? "error" : ""}
        />
        {errors.nombre && (
          <span className="publicar-negocio__error">{errors.nombre}</span>
        )}
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="descripcion">
          Descripción
          <span className="publicar-negocio__label-hint">(Opcional)</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="Describe tu negocio, servicios que ofreces, especialidades..."
          rows={4}
          maxLength={2000}
          className={errors.descripcion ? "error" : ""}
        />
        <span className="publicar-negocio__char-count">
          {formData.descripcion.length}/2000
        </span>
        {errors.descripcion && (
          <span className="publicar-negocio__error">{errors.descripcion}</span>
        )}
      </div>

      {/* Categoría y Subcategoría en fila */}
      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="category_id">
            <FontAwesomeIcon icon={faTag} />
            Categoría
            <span className="publicar-negocio__label-required">
              Obligatorio
            </span>
          </label>
          {loadingCategories ? (
            <p>Cargando categorías...</p>
          ) : (
            <div
              className={`custom-dropdown ${catOpen ? "open" : ""} ${errors.category_id ? "error" : ""}`}
              ref={catRef}>
              <button
                type="button"
                id="category_id"
                className="custom-dropdown__trigger"
                onClick={() => setCatOpen((prev) => !prev)}>
                <span
                  className={`custom-dropdown__value ${!selectedCategory ? "placeholder" : ""}`}>
                  {selectedCategory
                    ? selectedCategory.nombre
                    : "Selecciona una categoría"}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`custom-dropdown__arrow ${catOpen ? "rotated" : ""}`}
                />
              </button>
              {catOpen && (
                <ul className="custom-dropdown__menu">
                  {categories.map((cat) => (
                    <li
                      key={cat.id}
                      className={`custom-dropdown__item ${String(cat.id) === String(formData.category_id) ? "selected" : ""}`}
                      onClick={() => handleSelectCategory(cat.id)}>
                      {cat.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {errors.category_id && (
            <span className="publicar-negocio__error">
              {errors.category_id}
            </span>
          )}
        </div>

        <div className="publicar-negocio__field">
          <label htmlFor="subcategoria">
            <FontAwesomeIcon icon={faLayerGroup} />
            Subcategoría
            <span className="publicar-negocio__label-required">
              Obligatorio
            </span>
          </label>
          <div
            className={`custom-dropdown ${subOpen ? "open" : ""} ${errors.subcategoria ? "error" : ""}`}
            ref={subRef}>
            <button
              type="button"
              id="subcategoria"
              className="custom-dropdown__trigger"
              onClick={() =>
                formData.category_id && setSubOpen((prev) => !prev)
              }
              disabled={!formData.category_id}>
              <span
                className={`custom-dropdown__value ${!formData.subcategoria ? "placeholder" : ""}`}>
                {formData.subcategoria ||
                  (formData.category_id
                    ? "Selecciona una subcategoría"
                    : "Primero selecciona categoría")}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`custom-dropdown__arrow ${subOpen ? "rotated" : ""}`}
              />
            </button>
            {subOpen && (
              <ul className="custom-dropdown__menu">
                {subcategorias.map((sub) => (
                  <li
                    key={sub}
                    className={`custom-dropdown__item ${sub === formData.subcategoria ? "selected" : ""}`}
                    onClick={() => handleSelectSubcategoria(sub)}>
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.subcategoria && (
            <span className="publicar-negocio__error">
              {errors.subcategoria}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default InformacionBasicaSection;
