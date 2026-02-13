import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";

/**
 * Sección de contacto del negocio
 */
const ContactoSection = ({ formData, errors, onChange, onFieldFocus }) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faPhone} />
        Contacto
      </h2>

      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="telefono">
            Teléfono
            <span className="publicar-negocio__label-required">
              Obligatorio
            </span>
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="+56 9 1234 5678"
            className={errors.telefono ? "error" : ""}
          />
          {errors.telefono && (
            <span className="publicar-negocio__error">{errors.telefono}</span>
          )}
        </div>

        <div className="publicar-negocio__field">
          <label htmlFor="email">
            Email
            <span className="publicar-negocio__label-hint">(Opcional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            onFocus={onFieldFocus}
            placeholder="contacto@minegocio.cl"
          />
        </div>
      </div>
    </section>
  );
};

export default ContactoSection;
