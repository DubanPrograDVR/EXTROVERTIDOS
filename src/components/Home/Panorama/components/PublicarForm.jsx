import { useState } from "react";
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
  faMapMarkerAlt,
  faEye,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "../constants";
import SocialInputs from "./SocialInputs";
import ImageUpload from "./ImageUpload";
import DateRangePicker from "./DateRangePicker";
import TicketModal from "./TicketModal";
import LocationPicker from "./LocationPicker";
import DraftPreview from "./DraftPreview";
import "../styles/draft-preview.css";

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
  isSavingDraft,
  onSubmit,
  onChange,
  onFieldFocus,
  onImageChange,
  onRemoveImage,
  onSaveDraft,
}) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);

  // Helper para mostrar el texto del tipo de entrada seleccionado
  const getTicketDisplayText = () => {
    const tipos = {
      sin_entrada: "Sin entrada",
      gratuito: "Entrada gratuita",
      pagado: formData.precio
        ? `Entrada General - $${formData.precio} CLP`
        : "Entrada General",
      venta_externa: "Venta externa",
    };
    return tipos[formData.tipo_entrada] || "Configurar entradas";
  };

  // Handler para guardar desde el modal de tickets
  const handleTicketSave = (ticketData) => {
    // Simular eventos de cambio para actualizar formData
    onChange({
      target: { name: "tipo_entrada", value: ticketData.tipo_entrada },
    });
    onChange({ target: { name: "precio", value: ticketData.precio } });
    onChange({ target: { name: "url_venta", value: ticketData.url_venta } });
  };

  // Handler para guardar la ubicación del mapa
  const handleLocationSave = (locationUrl) => {
    onChange({ target: { name: "ubicacion_url", value: locationUrl } });
  };

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
        <div className="publicar-form__group publicar-form__group--full">
          <DateRangePicker
            fechaEvento={formData.fecha_evento}
            fechaFin={formData.fecha_fin}
            esMultidia={formData.es_multidia}
            mismoHorario={formData.mismo_horario}
            horaInicio={formData.hora_inicio}
            horaFin={formData.hora_fin}
            onChange={onChange}
            errors={errors}
          />
        </div>

        {/* Horarios */}
        <div className="publicar-form__row">
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="hora_inicio">
              <FontAwesomeIcon icon={faClock} /> Hora Inicio
              {formData.es_multidia && formData.mismo_horario && (
                <span className="publicar-form__label-hint">
                  {" "}
                  (todos los días)
                </span>
              )}
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
            <select
              id="comuna"
              name="comuna"
              className={`publicar-form__select ${errors.comuna ? "error" : ""}`}
              value={formData.comuna}
              onChange={onChange}
              disabled={!formData.provincia}>
              <option value="">
                {formData.provincia
                  ? "Selecciona una comuna"
                  : "Primero selecciona provincia"}
              </option>
              {formData.provincia &&
                COMUNAS_POR_PROVINCIA[formData.provincia]?.map((comuna) => (
                  <option key={comuna} value={comuna}>
                    {comuna}
                  </option>
                ))}
            </select>
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

        {/* Ubicación en Mapa - Opcional */}
        <div className="publicar-form__group publicar-form__group--location">
          <label className="publicar-form__label">
            <span className="publicar-form__label-hint">(Opcional)</span>
            <FontAwesomeIcon icon={faMapMarkerAlt} /> Ubicación en Mapa
          </label>

          {/* Input para pegar link de Google Maps */}
          <input
            type="text"
            id="ubicacion_url"
            name="ubicacion_url"
            className="publicar-form__input publicar-form__input--location"
            value={formData.ubicacion_url || ""}
            onChange={onChange}
            placeholder="Pega aquí el enlace de Google Maps o selecciona en el mapa"
          />

          <div className="publicar-form__location-wrapper">
            <div className="publicar-form__location-icon">
              <svg viewBox="0 0 64 80" fill="currentColor">
                <path d="M32 8c-11 0-20 9-20 20 0 15 20 36 20 36s20-21 20-36c0-11-9-20-20-20zm0 27c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
                <circle cx="32" cy="60" r="3" />
              </svg>
            </div>
            <button
              type="button"
              className="publicar-form__location-btn"
              onClick={() => setIsLocationPickerOpen(true)}>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {formData.ubicacion_url
                ? "Ver/Cambiar en mapa"
                : "Elegir en mapa"}
            </button>
            <p className="publicar-form__location-hint">
              Pega un enlace de Google Maps o selecciona la ubicación
              manualmente.
            </p>
          </div>
        </div>

        {/* Opciones de Entrada - Botón que abre modal */}
        <div className="publicar-form__group">
          <label className="publicar-form__label">
            <FontAwesomeIcon icon={faTicket} /> *Opciones de Entrada
          </label>
          <button
            type="button"
            className="publicar-form__ticket-btn"
            onClick={() => setIsTicketModalOpen(true)}>
            <FontAwesomeIcon icon={faTicket} />
            {getTicketDisplayText()}
          </button>
          {errors.tipo_entrada && (
            <span className="publicar-form__error">{errors.tipo_entrada}</span>
          )}
        </div>

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

        {/* Botones de acción */}
        <div className="publicar-form__actions">
          {/* Botón Ver Borrador */}
          <button
            type="button"
            className="publicar-form__draft-btn"
            onClick={() => setIsDraftPreviewOpen(true)}>
            <FontAwesomeIcon icon={faEye} />
            Ver Borrador
          </button>

          {/* Botón Guardar Borrador - solo si no estamos editando */}
          {!isEditing && onSaveDraft && (
            <button
              type="button"
              className="publicar-form__save-draft-btn"
              onClick={onSaveDraft}
              disabled={isSavingDraft || isSubmitting}>
              {isSavingDraft ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Guardando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Guardar Borrador
                </>
              )}
            </button>
          )}

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
        </div>
      </form>

      {/* Modal de configuración de entradas */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        currentValues={{
          tipo_entrada: formData.tipo_entrada,
          precio: formData.precio,
          url_venta: formData.url_venta,
        }}
        onSave={handleTicketSave}
      />

      {/* Modal de selección de ubicación */}
      <LocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocation={formData.ubicacion_url}
        onSave={handleLocationSave}
      />

      {/* Vista previa del borrador */}
      <DraftPreview
        isOpen={isDraftPreviewOpen}
        onClose={() => setIsDraftPreviewOpen(false)}
        formData={formData}
        previewImages={previewImages}
        categories={categories}
      />
    </section>
  );
};

export default PublicarForm;
