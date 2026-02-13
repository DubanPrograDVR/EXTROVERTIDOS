import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faGlobe } from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faTiktok,
  faXTwitter,
  faYoutube,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

/**
 * Sección de redes sociales del negocio
 */
const RedesSocialesSection = ({ formData, onChange, onFieldFocus }) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faLink} />
        Redes Sociales y Sitio Web
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

      <div className="publicar-negocio__field">
        <label htmlFor="redes_tiktok">
          <FontAwesomeIcon icon={faTiktok} />
          TikTok
        </label>
        <input
          type="url"
          id="redes_tiktok"
          name="redes_tiktok"
          value={formData.redes_sociales.tiktok}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://tiktok.com/@minegocio"
        />
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_twitter">
          <FontAwesomeIcon icon={faXTwitter} />X (Twitter)
        </label>
        <input
          type="url"
          id="redes_twitter"
          name="redes_twitter"
          value={formData.redes_sociales.twitter}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://x.com/minegocio"
        />
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_youtube">
          <FontAwesomeIcon icon={faYoutube} />
          YouTube
        </label>
        <input
          type="url"
          id="redes_youtube"
          name="redes_youtube"
          value={formData.redes_sociales.youtube}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://youtube.com/@minegocio"
        />
      </div>

      <div className="publicar-negocio__field">
        <label htmlFor="redes_linkedin">
          <FontAwesomeIcon icon={faLinkedin} />
          LinkedIn
        </label>
        <input
          type="url"
          id="redes_linkedin"
          name="redes_linkedin"
          value={formData.redes_sociales.linkedin}
          onChange={onChange}
          onFocus={onFieldFocus}
          placeholder="https://linkedin.com/company/minegocio"
        />
      </div>

      {/* Sitio Web */}
      <div className="publicar-negocio__field">
        <label htmlFor="sitio_web">
          <FontAwesomeIcon icon={faGlobe} />
          Sitio Web
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

export default RedesSocialesSection;
