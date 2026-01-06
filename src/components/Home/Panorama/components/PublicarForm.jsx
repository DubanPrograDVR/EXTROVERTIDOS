import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faLocationDot,
  faTag,
  faBuilding,
  faTicket,
  faLink,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { TIPOS_ENTRADA, PROVINCIAS } from "../constants";
import SocialInputs from "./SocialInputs";
import ImageUpload from "./ImageUpload";

/**
 * Formulario principal de publicación de eventos
 */
const PublicarForm = ({
  formData,
  categories,
  loadingCategories,
  errors,
  isSubmitting,
  previewImages,
  isEditing,
  onSubmit,
  onChange,
  onFieldFocus,
  onImageChange,
  onRemoveImage,
}) => {
  return (
    <section className="publicar-form-section">
      <form
        className="publicar-form"
        onSubmit={onSubmit}
        onFocus={onFieldFocus}>
        {/* Título */}
        <div className="publicar-form__group">
          <label className="publicar-form__label" htmlFor="titulo">
            Título del Evento *
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
            Descripción *
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            className={`publicar-form__textarea ${
              errors.descripcion ? "error" : ""
            }`}
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
            <FontAwesomeIcon icon={faTag} /> Categoría *
          </label>
          <select
            id="category_id"
            name="category_id"
            className={`publicar-form__select ${
              errors.category_id ? "error" : ""
            }`}
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

        {/* Fecha y Horas */}
        <div className="publicar-form__row publicar-form__row--three">
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="fecha_evento">
              <FontAwesomeIcon icon={faCalendarDays} /> Fecha *
            </label>
            <input
              type="date"
              id="fecha_evento"
              name="fecha_evento"
              className={`publicar-form__input ${
                errors.fecha_evento ? "error" : ""
              }`}
              value={formData.fecha_evento}
              onChange={onChange}
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.fecha_evento && (
              <span className="publicar-form__error">
                {errors.fecha_evento}
              </span>
            )}
          </div>

          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="hora_inicio">
              <FontAwesomeIcon icon={faClock} /> Hora Inicio
            </label>
            <input
              type="time"
              id="hora_inicio"
              name="hora_inicio"
              className="publicar-form__input"
              value={formData.hora_inicio}
              onChange={onChange}
            />
          </div>

          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="hora_fin">
              <FontAwesomeIcon icon={faClock} /> Hora Fin
            </label>
            <input
              type="time"
              id="hora_fin"
              name="hora_fin"
              className="publicar-form__input"
              value={formData.hora_fin}
              onChange={onChange}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="publicar-form__row">
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="provincia">
              <FontAwesomeIcon icon={faLocationDot} /> Provincia *
            </label>
            <select
              id="provincia"
              name="provincia"
              className={`publicar-form__select ${
                errors.provincia ? "error" : ""
              }`}
              value={formData.provincia}
              onChange={onChange}>
              <option value="">Selecciona una provincia</option>
              {PROVINCIAS.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {errors.provincia && (
              <span className="publicar-form__error">{errors.provincia}</span>
            )}
          </div>

          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="comuna">
              Comuna *
            </label>
            <input
              type="text"
              id="comuna"
              name="comuna"
              className={`publicar-form__input ${errors.comuna ? "error" : ""}`}
              placeholder="Ej: Talca"
              value={formData.comuna}
              onChange={onChange}
            />
            {errors.comuna && (
              <span className="publicar-form__error">{errors.comuna}</span>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="publicar-form__group">
          <label className="publicar-form__label" htmlFor="direccion">
            <FontAwesomeIcon icon={faLocationDot} /> Dirección *
          </label>
          <input
            type="text"
            id="direccion"
            name="direccion"
            className={`publicar-form__input ${
              errors.direccion ? "error" : ""
            }`}
            placeholder="Ej: Av. Principal 123, Local 5"
            value={formData.direccion}
            onChange={onChange}
          />
          {errors.direccion && (
            <span className="publicar-form__error">{errors.direccion}</span>
          )}
        </div>

        {/* Tipo de Entrada y Precio */}
        <div className="publicar-form__row">
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="tipo_entrada">
              <FontAwesomeIcon icon={faTicket} /> Tipo de Entrada *
            </label>
            <select
              id="tipo_entrada"
              name="tipo_entrada"
              className="publicar-form__select"
              value={formData.tipo_entrada}
              onChange={onChange}>
              {TIPOS_ENTRADA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {formData.tipo_entrada === "pagado" && (
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="precio">
                Precio (CLP) *
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                className={`publicar-form__input ${
                  errors.precio ? "error" : ""
                }`}
                placeholder="Ej: 10000"
                value={formData.precio}
                onChange={onChange}
                min="0"
              />
              {errors.precio && (
                <span className="publicar-form__error">{errors.precio}</span>
              )}
            </div>
          )}
        </div>

        {/* URL de Venta */}
        {formData.tipo_entrada === "pagado" && (
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="url_venta">
              <FontAwesomeIcon icon={faLink} /> URL de Venta de Entradas
            </label>
            <input
              type="url"
              id="url_venta"
              name="url_venta"
              className="publicar-form__input"
              placeholder="https://ejemplo.com/entradas"
              value={formData.url_venta}
              onChange={onChange}
            />
          </div>
        )}

        {/* Redes Sociales */}
        <SocialInputs
          redes_sociales={formData.redes_sociales}
          onChange={onChange}
        />

        {/* Imágenes */}
        <ImageUpload
          previewImages={previewImages}
          onImageChange={onImageChange}
          onRemoveImage={onRemoveImage}
          error={errors.imagenes}
        />

        {/* Botón de envío */}
        <button
          type="submit"
          className="publicar-form__submit"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              {isEditing ? "Guardando..." : "Publicando..."}
            </>
          ) : isEditing ? (
            "Guardar Cambios"
          ) : (
            "Publicar Evento"
          )}
        </button>
      </form>
    </section>
  );
};

export default PublicarForm;
