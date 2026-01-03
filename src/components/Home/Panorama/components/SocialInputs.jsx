import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

/**
 * Componente para inputs de redes sociales
 */
const SocialInputs = ({ redes_sociales, onChange }) => {
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
      name: "redes_whatsapp",
      icon: faWhatsapp,
      placeholder: "+56 9 1234 5678",
      value: redes_sociales.whatsapp,
      type: "text",
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
      </div>
    </div>
  );
};

export default SocialInputs;
