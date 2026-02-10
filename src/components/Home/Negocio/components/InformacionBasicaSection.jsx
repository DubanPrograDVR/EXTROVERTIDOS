import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faTag,
  faLayerGroup,
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
          <span className="publicar-negocio__label-required">Obligatorio</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="Describe tu negocio, servicios que ofreces, especialidades..."
          rows={4}
          className={errors.descripcion ? "error" : ""}
        />
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
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={onChange}
              onFocus={onFieldFocus}
              className={errors.category_id ? "error" : ""}>
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
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
          <select
            id="subcategoria"
            name="subcategoria"
            value={formData.subcategoria}
            onChange={onChange}
            onFocus={onFieldFocus}
            disabled={!formData.category_id}
            className={errors.subcategoria ? "error" : ""}>
            <option value="">
              {formData.category_id
                ? "Selecciona una subcategoría"
                : "Primero selecciona categoría"}
            </option>
            {subcategorias.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
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
