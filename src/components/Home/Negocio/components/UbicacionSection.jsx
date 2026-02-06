import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "./constants";
import LocationPicker from "../../Panorama/components/LocationPicker";

/**
 * Sección de ubicación del negocio
 */
const UbicacionSection = ({
  formData,
  errors,
  onChange,
  onFieldFocus,
}) => {
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleLocationSave = (locationUrl) => {
    onChange({ target: { name: "ubicacion_url", value: locationUrl } });
  };

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
            <span className="publicar-negocio__label-required">Obligatorio</span>
          </label>
          <select
            id="provincia"
            name="provincia"
            value={formData.provincia}
            onChange={(e) => {
              onChange(e);
              // Limpiar comuna al cambiar provincia
              onChange({ target: { name: "comuna", value: "" } });
            }}
            onFocus={onFieldFocus}
            className={errors.provincia ? "error" : ""}
          >
            <option value="">Selecciona provincia</option>
            {PROVINCIAS.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          {errors.provincia && (
            <span className="publicar-negocio__error">{errors.provincia}</span>
          )}
        </div>

        <div className="publicar-negocio__field">
          <label htmlFor="comuna">
            Comuna
            <span className="publicar-negocio__label-required">Obligatorio</span>
          </label>
          <select
            id="comuna"
            name="comuna"
            value={formData.comuna}
            onChange={onChange}
            onFocus={onFieldFocus}
            className={errors.comuna ? "error" : ""}
            disabled={!formData.provincia}
          >
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
          placeholder="Pega aquí el enlace de Google Maps o selecciona en el mapa"
        />

        <div className="publicar-negocio__location-wrapper">
          <div className="publicar-negocio__location-icon">
            <svg viewBox="0 0 64 80" fill="currentColor">
              <path d="M32 8c-11 0-20 9-20 20 0 15 20 36 20 36s20-21 20-36c0-11-9-20-20-20zm0 27c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
              <circle cx="32" cy="60" r="3" />
            </svg>
          </div>
          <button
            type="button"
            className="publicar-negocio__location-btn"
            onClick={() => setIsLocationPickerOpen(true)}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            {formData.ubicacion_url
              ? "Ver/Cambiar en mapa"
              : "Elegir en mapa"}
          </button>
          <p className="publicar-negocio__location-hint-text">
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
    </section>
  );
};

export default UbicacionSection;
