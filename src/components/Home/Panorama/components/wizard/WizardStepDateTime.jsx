import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "../../constants";
import DateRangePicker from "../DateRangePicker";
import LocationPicker from "../LocationPicker";

/**
 * Wizard Step 2: Fecha y Ubicación
 * DateRangePicker, Provincia, Comuna, Dirección, Ubicación Mapa
 */
const WizardStepDateTime = ({
  formData,
  errors,
  onChange,
  enabledCalendarModes,
}) => {
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleLocationSave = (locationUrl) => {
    onChange({ target: { name: "ubicacion_url", value: locationUrl } });
  };

  return (
    <div className="wizard-step">
      {/* Fecha y Horas */}
      <div className="publicar-form__group publicar-form__group--full">
        <DateRangePicker
          fechaEvento={formData.fecha_evento}
          fechaFin={formData.fecha_fin}
          esMultidia={formData.es_multidia}
          esRecurrente={formData.es_recurrente}
          cantidadRepeticiones={formData.cantidad_repeticiones}
          fechasRecurrencia={formData.fechas_recurrencia}
          mismoHorario={formData.mismo_horario}
          horaInicio={formData.hora_inicio}
          horaFin={formData.hora_fin}
          onChange={onChange}
          errors={errors}
          enabledModes={enabledCalendarModes}
        />
      </div>

      {/* Ubicación */}
      <div className="publicar-form__row">
        <div className="publicar-form__group">
          <label className="publicar-form__label" htmlFor="provincia">
            <FontAwesomeIcon icon={faLocationDot} /> Provincia
            <span className="publicar-form__label-required">Obligatorio</span>
          </label>
          <select
            id="provincia"
            name="provincia"
            className={`publicar-form__select ${errors.provincia ? "error" : ""}`}
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
            Comuna
            <span className="publicar-form__label-required">Obligatorio</span>
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
          <FontAwesomeIcon icon={faLocationDot} /> Dirección/Lugar
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          className={`publicar-form__input ${errors.direccion ? "error" : ""}`}
          placeholder="Ej: Av. Principal 123, Local 5"
          value={formData.direccion}
          onChange={onChange}
        />
        {errors.direccion && (
          <span className="publicar-form__error">{errors.direccion}</span>
        )}
      </div>

      {/* Ubicación en Mapa */}
      <div className="publicar-form__group publicar-form__group--location">
        <label className="publicar-form__label">
          <span className="publicar-form__label-hint">(Opcional)</span>
          <FontAwesomeIcon icon={faMapMarkerAlt} /> Ubicación en Mapa
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Facilita que te encuentren
          </span>
        </label>
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
            {formData.ubicacion_url ? "Ver/Cambiar en mapa" : "Elegir en mapa"}
          </button>
          <p className="publicar-form__location-hint">
            Pega un enlace de Google Maps o selecciona la ubicación manualmente.
          </p>
        </div>
      </div>

      {/* Modal de selección de ubicación */}
      <LocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocation={formData.ubicacion_url}
        onSave={handleLocationSave}
      />
    </div>
  );
};

export default WizardStepDateTime;
