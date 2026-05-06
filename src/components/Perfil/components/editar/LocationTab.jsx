import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { PROVINCIAS, COMUNAS_POR_PROVINCIA } from "./constants";

/**
 * Tab de ubicación del evento
 */
export default function LocationTab({ formData, errors, onChange }) {
  const comunas = formData.provincia
    ? COMUNAS_POR_PROVINCIA[formData.provincia] || []
    : [];

  return (
    <div className="user-edit-modal__content">
      <div className="user-edit-modal__row">
        <div className="user-edit-modal__field">
          <label htmlFor="provincia">
            Provincia <span className="required">*</span>
          </label>
          <select
            id="provincia"
            name="provincia"
            value={formData.provincia}
            onChange={onChange}
            className={errors.provincia ? "error" : ""}>
            <option value="">Selecciona</option>
            {PROVINCIAS.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          {errors.provincia && (
            <span className="user-edit-modal__error">{errors.provincia}</span>
          )}
        </div>

        <div className="user-edit-modal__field">
          <label htmlFor="comuna">
            Comuna <span className="required">*</span>
          </label>
          <select
            id="comuna"
            name="comuna"
            value={formData.comuna}
            onChange={onChange}
            disabled={!formData.provincia}
            className={errors.comuna ? "error" : ""}>
            <option value="">
              {formData.provincia
                ? "Selecciona una comuna"
                : "Primero selecciona provincia"}
            </option>
            {comunas.map((comuna) => (
              <option key={comuna} value={comuna}>
                {comuna}
              </option>
            ))}
          </select>
          {errors.comuna && (
            <span className="user-edit-modal__error">{errors.comuna}</span>
          )}
        </div>
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="direccion">Dirección</label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={onChange}
          placeholder="Dirección del evento"
        />
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="ubicacion_url">
          <FontAwesomeIcon icon={faLink} />
          Enlace Google Maps
        </label>
        <input
          type="url"
          id="ubicacion_url"
          name="ubicacion_url"
          value={formData.ubicacion_url}
          onChange={onChange}
          placeholder="https://maps.google.com/..."
        />
      </div>
    </div>
  );
}
