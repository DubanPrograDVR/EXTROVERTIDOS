import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faTiktok,
  faYoutube,
  faXTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

/**
 * Componente para inputs de redes sociales
 */
const SocialInputs = ({ redes_sociales, sitio_web, onChange }) => {
  const socialNetworks = [
    {
      name: "redes_instagram",
      icon: faInstagram,
      placeholder: "https://instagram.com/tu_evento",
      value: redes_sociales.instagram,
      type: "url",
    },
    {
      name: "redes_facebook",
      icon: faFacebook,
      placeholder: "https://facebook.com/tu_evento",
      value: redes_sociales.facebook,
      type: "url",
    },
    {
      name: "redes_tiktok",
      icon: faTiktok,
      placeholder: "https://tiktok.com/@tu_evento",
      value: redes_sociales.tiktok,
      type: "url",
    },
    {
      name: "redes_youtube",
      icon: faYoutube,
      placeholder: "https://youtube.com/watch?v=...",
      value: redes_sociales.youtube || "",
      type: "url",
    },
    {
      name: "redes_whatsapp",
      icon: faWhatsapp,
      placeholder: "+56 9 1234 5678",
      value: redes_sociales.whatsapp,
      type: "text",
    },
    {
      name: "redes_twitter",
      icon: faXTwitter,
      placeholder: "https://x.com/tu_evento",
      value: redes_sociales.twitter || "",
      type: "url",
    },
    {
      name: "redes_linkedin",
      icon: faLinkedin,
      placeholder: "https://linkedin.com/company/tu_evento",
      value: redes_sociales.linkedin || "",
      type: "url",
    },
  ];

  return (
    <div className="publicar-form__group">
      <label className="publicar-form__label">Redes Sociales</label>
      <div className="publicar-form__social-inputs">
        {socialNetworks.map((network) => (
          <div key={network.name} className="publicar-form__social-input">
            <FontAwesomeIcon icon={network.icon} />
            <input
              type={network.type}
              name={network.name}
              placeholder={network.placeholder}
              value={network.value}
              onChange={onChange}
            />
          </div>
        ))}

        {/* Sitio Web */}
        <div className="publicar-form__social-input">
          <FontAwesomeIcon icon={faGlobe} />
          <input
            type="url"
            name="sitio_web"
            placeholder="https://www.mievento.cl"
            value={sitio_web || ""}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialInputs;
