import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faFacebook, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

/**
 * Sección de redes sociales del negocio
 */
const RedesSocialesSection = ({
  formData,
  onChange,
  onFieldFocus,
}) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faLink} />
        Redes Sociales
        <span className="publicar-negocio__label-hint">(Opcional)</span>
      </h2>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_instagram">
          <FontAwesomeIcon icon={faInstagram} />
          Instagram
        </label>
        <input
          type="url"
          id="redes_instagram"
          name="redes_instagram"
          value={formData.redes_sociales.instagram}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://instagram.com/minegocio"
        />
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_facebook">
          <FontAwesomeIcon icon={faFacebook} />
          Facebook
        </label>
        <input
          type="url"
          id="redes_facebook"
          name="redes_facebook"
          value={formData.redes_sociales.facebook}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://facebook.com/minegocio"
        />
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_whatsapp">
          <FontAwesomeIcon icon={faWhatsapp} />
          WhatsApp
        </label>
        <input
          type="url"
          id="redes_whatsapp"
          name="redes_whatsapp"
          value={formData.redes_sociales.whatsapp}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://wa.me/56912345678"
        />
      </div>
    </section>
  );
};

export default RedesSocialesSection;
