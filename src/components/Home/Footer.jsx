import "./styles/footer.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faFacebook,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";
import logo from "../../../public/img/Logo_extrovertidos.png";

// ===== DATOS DE REDES SOCIALES =====
const socialLinks = [
  {
    id: 1,
    name: "Instagram",
    icon: faInstagram,
    url: "https://instagram.com/extrovertidos",
    ariaLabel: "Síguenos en Instagram",
  },
  {
    id: 2,
    name: "Facebook",
    icon: faFacebook,
    url: "https://facebook.com/extrovertidos",
    ariaLabel: "Síguenos en Facebook",
  },
  {
    id: 3,
    name: "TikTok",
    icon: faTiktok,
    url: "https://tiktok.com/@extrovertidos",
    ariaLabel: "Síguenos en TikTok",
  },
];

// ===== COMPONENTE FOOTER =====
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        {/* ===== SECCIÓN IZQUIERDA ===== */}
        <div className="footer__section footer__section--left">
          {/* Logo */}
          <div className="footer__logo-wrapper">
            <img src={logo} alt="Extrovertidos Logo" className="footer__logo" />
          </div>

          {/* Descripción */}
          <p className="footer__description">
            Los Panoramas, Actividades y Eventos de tu Ciudad
          </p>

          {/* Síguenos */}
          <div className="footer__social">
            <h3 className="footer__social-title">Síguenos</h3>
            <div className="footer__social-icons">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social-link"
                  aria-label={social.ariaLabel}>
                  <FontAwesomeIcon
                    icon={social.icon}
                    className="footer__social-icon"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="footer__contact">
            <h3 className="footer__contact-title">Contacto</h3>
            <a
              href="mailto:Atencion@extrovertidos.cl"
              className="footer__contact-email">
              Atencion@extrovertidos.cl
            </a>
          </div>
        </div>

        {/* ===== SECCIÓN DERECHA ===== */}
        <div className="footer__section footer__section--right">
          {/* ¿Te Ayudamos? */}
          <div className="footer__help">
            <h3 className="footer__help-title">¿Te Ayudamos?</h3>
            <p className="footer__help-text">
              ¿Quieres saber más de cómo publicar?
              <br />
              <strong>¡Escríbenos!</strong>
            </p>
          </div>

          {/* Coméntanos */}
          <div className="footer__feedback">
            <h3 className="footer__feedback-title">Coméntanos</h3>
            <p className="footer__feedback-text">
              Escríbenos y coméntanos para mejorar cada día.
              <br />
              <strong>¡Esperamos escuchar de ti, somos Extrovertidos!</strong>
            </p>
          </div>

          {/* Legal */}
          <div className="footer__legal">
            <h3 className="footer__legal-title">Legal</h3>
            <a href="/terminos" className="footer__legal-link">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>

      {/* ===== COPYRIGHT ===== */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          Extrovertidos {currentYear} - Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
