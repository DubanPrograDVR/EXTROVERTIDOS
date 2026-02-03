import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faGlobe } from "@fortawesome/free-solid-svg-icons";

/**
 * Sección de contacto del negocio
 */
const ContactoSection = ({
  formData,
  errors,
  onChange,
  onFieldFocus,
}) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faPhone} />
        Contacto
      </h2>

      <div className="publicar-negocio__row">
        <div className="publicar-negocio__field">
          <label htmlFor="telefono">
            Teléfono <span className="required">*</span>
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
          <label htmlFor="email">Email (opcional)</label>
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

      <div className="publicar-negocio__field">
        <label htmlFor="sitio_web">
          <FontAwesomeIcon icon={faGlobe} />
          Sitio Web (opcional)
        </label>
        <input
          type="url"
          id="sitio_web"
          name="sitio_web"
          value={formData.sitio_web}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://www.minegocio.cl"
        />
      </div>
    </section>
  );
};

export default ContactoSection;
