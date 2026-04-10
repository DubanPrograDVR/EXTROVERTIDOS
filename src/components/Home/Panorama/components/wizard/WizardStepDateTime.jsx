import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMapMarkerAlt,
  faChevronDown,
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
  const [provOpen, setProvOpen] = useState(false);
  const [comOpen, setComOpen] = useState(false);
  const provRef = useRef(null);
  const comRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (provRef.current && !provRef.current.contains(e.target))
        setProvOpen(false);
      if (comRef.current && !comRef.current.contains(e.target))
        setComOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProv = (prov) => {
    onChange({ target: { name: "provincia", value: prov } });
    // Reset comuna when province changes
    onChange({ target: { name: "comuna", value: "" } });
    setProvOpen(false);
  };

  const handleSelectCom = (comuna) => {
    onChange({ target: { name: "comuna", value: comuna } });
    setComOpen(false);
  };

  const comunas = formData.provincia
    ? COMUNAS_POR_PROVINCIA[formData.provincia] || []
    : [];

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
          <div
            className={`custom-dropdown ${provOpen ? "open" : ""} ${errors.provincia ? "error" : ""}`}
            ref={provRef}>
            <button
              type="button"
              id="provincia"
              className="custom-dropdown__trigger"
              onClick={() => setProvOpen((prev) => !prev)}>
              <span
                className={`custom-dropdown__value ${!formData.provincia ? "placeholder" : ""}`}>
                {formData.provincia || "Selecciona una provincia"}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`custom-dropdown__arrow ${provOpen ? "rotated" : ""}`}
              />
            </button>
            {provOpen && (
              <ul className="custom-dropdown__menu">
                {PROVINCIAS.map((prov) => (
                  <li
                    key={prov}
                    className={`custom-dropdown__item ${prov === formData.provincia ? "selected" : ""}`}
                    onClick={() => handleSelectProv(prov)}>
                    {prov}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.provincia && (
            <span className="publicar-form__error">{errors.provincia}</span>
          )}
        </div>

        <div className="publicar-form__group">
          <label className="publicar-form__label" htmlFor="comuna">
            Comuna
            <span className="publicar-form__label-required">Obligatorio</span>
          </label>
          <div
            className={`custom-dropdown ${comOpen ? "open" : ""} ${errors.comuna ? "error" : ""}`}
            ref={comRef}>
            <button
              type="button"
              id="comuna"
              className="custom-dropdown__trigger"
              onClick={() => formData.provincia && setComOpen((prev) => !prev)}
              disabled={!formData.provincia}>
              <span
                className={`custom-dropdown__value ${!formData.comuna ? "placeholder" : ""}`}>
                {formData.comuna ||
                  (formData.provincia
                    ? "Selecciona una comuna"
                    : "Primero selecciona provincia")}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`custom-dropdown__arrow ${comOpen ? "rotated" : ""}`}
              />
            </button>
            {comOpen && (
              <ul className="custom-dropdown__menu">
                {comunas.map((comuna) => (
                  <li
                    key={comuna}
                    className={`custom-dropdown__item ${comuna === formData.comuna ? "selected" : ""}`}
                    onClick={() => handleSelectCom(comuna)}>
                    {comuna}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          <span style={{ color: "#fff", fontSize: "12px", marginTop: "5px" }}>
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
