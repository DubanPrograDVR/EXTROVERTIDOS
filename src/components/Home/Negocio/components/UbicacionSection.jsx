import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMapMarkerAlt,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "./constants";

/**
 * Sección de ubicación del negocio
 */
const UbicacionSection = ({ formData, errors, onChange, onFieldFocus }) => {
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
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faLocationDot} />
        Ubicación
      </h2>

      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="provincia">
            <FontAwesomeIcon icon={faLocationDot} /> Provincia
            <span className="publicar-negocio__label-required">
              Obligatorio
            </span>
          </label>
          <div
            className={`custom-dropdown ${provOpen ? "open" : ""} ${errors.provincia ? "error" : ""}`}
            ref={provRef}>
            <button
              type="button"
              className="custom-dropdown__trigger"
              onClick={() => setProvOpen((prev) => !prev)}>
              <span
                className={`custom-dropdown__value ${!formData.provincia ? "placeholder" : ""}`}>
                {formData.provincia || "Selecciona provincia"}
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
            <span className="publicar-negocio__error">{errors.provincia}</span>
          )}
        </div>

        <div className="publicar-negocio__field">
          <label htmlFor="comuna">
            Comuna
            <span className="publicar-negocio__label-required">
              Obligatorio
            </span>
          </label>
          <div
            className={`custom-dropdown ${comOpen ? "open" : ""} ${errors.comuna ? "error" : ""}`}
            ref={comRef}>
            <button
              type="button"
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
            <span className="publicar-negocio__error">{errors.comuna}</span>
          )}
        </div>
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="direccion">
          <FontAwesomeIcon icon={faLocationDot} /> Dirección
          <span className="publicar-negocio__label-required">Obligatorio</span>
        </label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="Ej: Av. Principal 123, Local 5"
          className={errors.direccion ? "error" : ""}
        />
        {errors.direccion && (
          <span className="publicar-negocio__error">{errors.direccion}</span>
        )}
      </div>

      {/* Ubicación en Mapa */}
      <div className="publicar-negocio__field publicar-negocio__field--location">
        <label>
          <span className="publicar-negocio__label-hint">(Opcional)</span>
          <FontAwesomeIcon icon={faMapMarkerAlt} /> Ubicación en Mapa
        </label>

        <input
          type="text"
          id="ubicacion_url"
          name="ubicacion_url"
          value={formData.ubicacion_url || ""}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="Pega aquí el enlace de Google Maps"
        />
        <p className="publicar-negocio__location-hint-text">
          Pega un enlace de Google Maps con la ubicación de tu negocio.
        </p>
      </div>
    </section>
  );
};

export default UbicacionSection;
