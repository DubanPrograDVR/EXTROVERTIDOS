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
  { href: "#panoramas", label: "Panoramas", icon: faMapMarkedAlt },
  { href: "#superguia", label: "Superguía", icon: faCompass },
  { href: "#publicar-panorama", label: "Publicar Panorama", icon: faCamera },
  { href: "#publicar-negocio", label: "Publicar Negocio", icon: faStore },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="Extrovertidos" className="logo" />
        </div>

        <nav className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          {NAV_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="nav-link"
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
