import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS } from "./constants";

/**
 * Sección de ubicación del negocio
 */
const UbicacionSection = ({
  formData,
  errors,
  onChange,
  onFieldFocus,
}) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faLocationDot} />
        Ubicación
      </h2>

      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="provincia">
            Provincia <span className="required">*</span>
          </label>
          <select
            id="provincia"
            name="provincia"
            value={formData.provincia}
            onChange={onChange}
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
            Comuna <span className="required">*</span>
          </label>
          <input
            type="text"
            id="comuna"
            name="comuna"
            value={formData.comuna}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="Ej: Talca"
            className={errors.comuna ? "error" : ""}
          />
          {errors.comuna && (
            <span className="publicar-negocio__error">{errors.comuna}</span>
          )}
        </div>
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="direccion">
          Dirección <span className="required">*</span>
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

      <div className="publicar-negocio__field">
        <label htmlFor="ubicacion_url">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          Enlace Google Maps (opcional)
        </label>
        <input
          type="url"
          id="ubicacion_url"
          name="ubicacion_url"
          value={formData.ubicacion_url}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://maps.google.com/..."
        />
      </div>
    </section>
  );
};

export default UbicacionSection;
