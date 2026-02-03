import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faTicketAlt,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { TIPOS_ENTRADA } from "./constants";

/**
 * Tab de detalles del evento (fechas, horarios, entrada, redes)
 */
export default function DetailsTab({ formData, errors, onChange }) {
  return (
    <div className="user-edit-modal__content">
      {/* Checkbox multidía */}
      <div className="user-edit-modal__field user-edit-modal__field--checkbox">
        <label>
          <input
            type="checkbox"
            name="es_multidia"
            checked={formData.es_multidia}
            onChange={onChange}
          />
          <span>Evento de varios días</span>
        </label>
      </div>

      {/* Fechas */}
      <div className="user-edit-modal__row">
        <div className="user-edit-modal__field">
          <label htmlFor="fecha_evento">
            <FontAwesomeIcon icon={faCalendarAlt} />
            {formData.es_multidia ? "Fecha inicio" : "Fecha"}{" "}
            <span className="required">*</span>
          </label>
          <input
            type="date"
            id="fecha_evento"
            name="fecha_evento"
            value={formData.fecha_evento}
            onChange={onChange}
            className={errors.fecha_evento ? "error" : ""}
          />
          {errors.fecha_evento && (
            <span className="user-edit-modal__error">
              {errors.fecha_evento}
            </span>
          )}
        </div>

        {formData.es_multidia && (
          <div className="user-edit-modal__field">
            <label htmlFor="fecha_fin">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Fecha fin
            </label>
            <input
              type="date"
              id="fecha_fin"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={onChange}
            />
          </div>
        )}
      </div>

      {/* Horarios */}
      <div className="user-edit-modal__row">
        <div className="user-edit-modal__field">
          <label htmlFor="hora_inicio">Hora inicio</label>
          <input
            type="time"
            id="hora_inicio"
            name="hora_inicio"
            value={formData.hora_inicio}
            onChange={onChange}
          />
        </div>

        <div className="user-edit-modal__field">
          <label htmlFor="hora_fin">Hora fin</label>
          <input
            type="time"
            id="hora_fin"
            name="hora_fin"
            value={formData.hora_fin}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Tipo de entrada */}
      <div className="user-edit-modal__field">
        <label htmlFor="tipo_entrada">
          <FontAwesomeIcon icon={faTicketAlt} />
          Tipo de entrada
        </label>
        <select
          id="tipo_entrada"
          name="tipo_entrada"
          value={formData.tipo_entrada}
          onChange={onChange}>
          {TIPOS_ENTRADA.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      {/* Precio (solo si es pagado) */}
      {formData.tipo_entrada === "pagado" && (
        <div className="user-edit-modal__field">
          <label htmlFor="precio">Precio (CLP)</label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={onChange}
            placeholder="5000"
          />
        </div>
      )}

      {/* URL de venta (solo si es venta externa) */}
      {formData.tipo_entrada === "venta_externa" && (
        <div className="user-edit-modal__field">
          <label htmlFor="url_venta">
            <FontAwesomeIcon icon={faLink} />
            URL de venta
          </label>
          <input
            type="url"
            id="url_venta"
            name="url_venta"
            value={formData.url_venta}
            onChange={onChange}
            placeholder="https://..."
          />
        </div>
      )}

      {/* Redes sociales */}
      <div className="user-edit-modal__section-title">
        <h4>Redes Sociales</h4>
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="redes_sociales.instagram">
          <FontAwesomeIcon icon={faInstagram} />
          Instagram
        </label>
        <input
          type="url"
          id="redes_sociales.instagram"
          name="redes_sociales.instagram"
          value={formData.redes_sociales.instagram}
          onChange={onChange}
          placeholder="https://instagram.com/..."
        />
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="redes_sociales.facebook">
          <FontAwesomeIcon icon={faFacebook} />
          Facebook
        </label>
        <input
          type="url"
          id="redes_sociales.facebook"
          name="redes_sociales.facebook"
          value={formData.redes_sociales.facebook}
          onChange={onChange}
          placeholder="https://facebook.com/..."
        />
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="redes_sociales.whatsapp">
          <FontAwesomeIcon icon={faWhatsapp} />
          WhatsApp
        </label>
        <input
          type="url"
          id="redes_sociales.whatsapp"
          name="redes_sociales.whatsapp"
          value={formData.redes_sociales.whatsapp}
          onChange={onChange}
          placeholder="https://wa.me/..."
        />
      </div>
    </div>
  );
}
