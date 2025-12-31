import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faFacebook,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import "./styles/footer.css";

// Logo servido desde public/
const logo = "/img/Logo_extrovertidos.png";

// ===== DATOS =====
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

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/eventos", label: "Eventos" },
  { to: "/superguia", label: "Superguía" },
  { to: "/publicar", label: "Publicar" },
  { to: "/faq", label: "Preguntas Frecuentes" },
];

const legalLinks = [
  { to: "/terminos", label: "Términos y Condiciones" },
  { to: "/privacidad", label: "Política de Privacidad" },
];

// ===== COMPONENTE FOOTER =====
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo" aria-label="Pie de página">
      {/* Main Footer Content */}
      <div className="footer__main">
        <div className="footer__grid">
          {/* Columna 1: Marca */}
          <div className="footer__column footer__column--brand">
            <Link to="/" className="footer__logo-link">
              <img src={logo} alt="Extrovertidos" className="footer__logo" />
            </Link>
            <p className="footer__slogan">
              Los Panoramas, Actividades y Eventos de tu Ciudad
            </p>
          </div>

          {/* Columna 2: Navegación */}
          <div className="footer__column">
            <h3 className="footer__title">Explora</h3>
            <nav aria-label="Enlaces de navegación">
              <ul className="footer__nav-list">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="footer__nav-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Columna 3: Contacto */}
          <div className="footer__column">
            <h3 className="footer__title">Contacto</h3>
            <div className="footer__contact-list">
              <a
                href="mailto:atencion@extrovertidos.cl"
                className="footer__contact-link">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="footer__contact-icon"
                />
                atencion@extrovertidos.cl
              </a>
              <a
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__contact-link">
                <FontAwesomeIcon
                  icon={faCommentDots}
                  className="footer__contact-icon"
                />
                WhatsApp
              </a>
              <p className="footer__contact-cta">
                ¿Tienes dudas?{" "}
                <a
                  href="mailto:atencion@extrovertidos.cl"
                  className="footer__cta-link">
                  ¡Escríbenos!
                </a>
              </p>
            </div>
          </div>

          {/* Columna 4: Redes Sociales */}
          <div className="footer__column">
            <h3 className="footer__title">Síguenos</h3>
            <div className="footer__social">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="footer__social-link">
                  <FontAwesomeIcon
                    icon={social.icon}
                    className="footer__social-icon"
                  />
                </a>
              ))}
            </div>
            <p className="footer__social-cta">
              Escríbenos y cuéntanos para mejorar cada día
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-content">
          {/* Legal Links */}
          <nav aria-label="Enlaces legales">
            <ul className="footer__legal-list">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="footer__legal-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <p className="footer__copyright">
            © {currentYear} Extrovertidos - Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
