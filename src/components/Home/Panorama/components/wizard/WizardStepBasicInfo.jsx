import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faTag,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Wizard Step 1: Información Básica
 * Título, Organizador, Descripción, Categoría
 */
const WizardStepBasicInfo = ({
  formData,
  categories,
  loadingCategories,
  errors,
  onChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCategory = categories.find(
    (cat) => String(cat.id) === String(formData.category_id),
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCategory = (catId) => {
    onChange({ target: { name: "category_id", value: String(catId) } });
    setDropdownOpen(false);
  };

  return (
    <div className="wizard-step">
      {/* Título */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="titulo">
          Título del Evento
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          className={`publicar-form__input ${errors.titulo ? "error" : ""}`}
          placeholder="Ej: Festival de Música 2025"
          value={formData.titulo}
          onChange={onChange}
          maxLength={100}
        />
        {errors.titulo && (
          <span className="publicar-form__error">{errors.titulo}</span>
        )}
      </div>

      {/* Organizador */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="organizador">
          <FontAwesomeIcon icon={faBuilding} /> Organizador
          <span className="publicar-form__label-hint"> (Opcional)</span>
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Negocio, Persona, Entidad
          </span>
        </label>
        <input
          type="text"
          id="organizador"
          name="organizador"
          className="publicar-form__input"
          placeholder="Nombre del organizador (opcional)"
          value={formData.organizador}
          onChange={onChange}
          maxLength={100}
        />
      </div>

      {/* Descripción */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="descripcion">
          Descripción
          <span className="publicar-form__label-hint"> (Opcional)</span>
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Detalla tu evento
          </span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className={`publicar-form__textarea ${errors.descripcion ? "error" : ""}`}
          placeholder="Describe tu evento en detalle: qué actividades habrá, qué pueden esperar los asistentes..."
          value={formData.descripcion}
          onChange={(e) => {
            const lines = e.target.value.split("\n");
            const wrapped = lines
              .map((line) => {
                if (line.length <= 70) return line;
                let result = "";
                for (let i = 0; i < line.length; i += 70) {
                  if (result) result += "\n";
                  result += line.slice(i, i + 70);
                }
                return result;
              })
              .join("\n");
            onChange({ target: { name: "descripcion", value: wrapped } });
          }}
          rows={5}
          maxLength={2000}
        />
        <span className="publicar-form__char-count">
          {formData.descripcion.length}/2000
        </span>
        {errors.descripcion && (
          <span className="publicar-form__error">{errors.descripcion}</span>
        )}
      </div>

      {/* Categoría */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="category_id">
          <FontAwesomeIcon icon={faTag} /> Categoría
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <div
          className={`custom-dropdown ${dropdownOpen ? "open" : ""} ${errors.category_id ? "error" : ""}`}
          ref={dropdownRef}>
          <button
            type="button"
            className="custom-dropdown__trigger"
            onClick={() =>
              !loadingCategories && setDropdownOpen((prev) => !prev)
            }
            disabled={loadingCategories}>
            <span
              className={`custom-dropdown__value ${!selectedCategory ? "placeholder" : ""}`}>
              {loadingCategories
                ? "Cargando categorías..."
                : selectedCategory
                  ? selectedCategory.nombre
                  : "Selecciona una categoría"}
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`custom-dropdown__arrow ${dropdownOpen ? "rotated" : ""}`}
            />
          </button>
          {dropdownOpen && (
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
        {errors.category_id && (
          <span className="publicar-form__error">{errors.category_id}</span>
        )}
      </div>
    </div>
  );
};

export default WizardStepBasicInfo;
