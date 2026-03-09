import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faTag } from "@fortawesome/free-solid-svg-icons";

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
          onChange={onChange}
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
        <select
          id="category_id"
          name="category_id"
          className={`publicar-form__select ${errors.category_id ? "error" : ""}`}
          value={formData.category_id}
          onChange={onChange}
          disabled={loadingCategories}>
          <option value="">
            {loadingCategories
              ? "Cargando categorías..."
              : "Selecciona una categoría"}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <span className="publicar-form__error">{errors.category_id}</span>
        )}
      </div>
    </div>
  );
};

export default WizardStepBasicInfo;
