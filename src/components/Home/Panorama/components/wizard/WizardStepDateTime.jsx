import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "../../constants";
import DateRangePicker from "../DateRangePicker";

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
          <FontAwesomeIcon icon={faMapMarkerAlt} /> Enlace de ubicación
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
          placeholder="Pega aquí el enlace de Google Maps"
        />
        <p className="publicar-form__location-hint">
          Pega un enlace de Google Maps para que los usuarios puedan llegar
          fácilmente.
        </p>
      </div>
    </div>
  );
};

export default WizardStepDateTime;
