import { useState } from "react";
import "./styles/navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBars,
  faTimes,
  faMapMarkedAlt,
  faCompass,
  faCamera,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../public/img/Logo_extrovertidos.png";

const NAV_LINKS = [
  { href: "/", label: "Inicio", icon: faMapMarkedAlt },
  { href: "/eventos", label: "Eventos", icon: faCompass },
  { href: "/crear-negocio", label: "Crea tu negocio", icon: faStore },
  { href: "/iniciar-sesion", label: "Iniciar sesión", icon: faUser },
  { href: "/registrarse", label: "Registrarse", icon: faCamera },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="Extrovertidos" className="logo" />
        </div>

        {/* Overlay para cerrar el menú */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={handleOverlayClick}></div>
        )}

        <nav className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          {NAV_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={`nav-link ${index === 0 ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <FontAwesomeIcon icon={link.icon} className="nav-icon" />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <button className="user-btn" aria-label="Usuario">
            <FontAwesomeIcon icon={faUser} />
          </button>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </button>
        </div>
      </div>
    </header>
  );
}
