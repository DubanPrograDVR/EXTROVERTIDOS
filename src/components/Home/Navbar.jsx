import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBars,
  faTimes,
  faSignInAlt,
  faUserPlus,
  faSignOutAlt,
  faCog,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../public/img/Logo_extrovertidos.png";
import manchaExtro from "../../../public/img/Mancha_Extro.png";
import AuthModal from "../Auth/AuthModal";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { href: "/panoramas", label: "Panoramas" },
  { href: "/superguia", label: "Superguía Extrovertidos" },
  { href: "/publicar-panorama", label: "Publicar Panorama" },
  { href: "/publicar-negocio", label: "Publicar Negocio" },
];

export default function Navbar() {
  const { user, isAuthenticated, isModerator, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const userDropdownRef = useRef(null);

  // Obtener datos del usuario
  const userAvatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "Usuario";

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  const toggleUserDropdown = (e) => {
    e.preventDefault();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const openLoginModal = (e) => {
    e.preventDefault();
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
    setIsUserDropdownOpen(false);
  };

  const openRegisterModal = (e) => {
    e.preventDefault();
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
    setIsUserDropdownOpen(false);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
    navigate("/");
  };

  const goToProfile = () => {
    setIsUserDropdownOpen(false);
    navigate("/perfil");
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Extrovertidos" className="logo" />
        </Link>

        {/* Overlay para cerrar el menú */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={handleOverlayClick}></div>
        )}

        <nav className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          {NAV_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="nav-link"
              onClick={handleLinkClick}>
              {link.label}
            </a>
          ))}

          {/* Botones de autenticación en menú móvil */}
          <div className="navbar-mobile-auth">
            {isAuthenticated ? (
              <>
                <div className="navbar-mobile-user-info">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="navbar-mobile-user-avatar"
                    referrerPolicy="no-referrer"
                  />
                  <span className="navbar-mobile-user-name">{userName}</span>
                </div>
                <button
                  onClick={goToProfile}
                  className="navbar-mobile-auth-btn navbar-mobile-auth-btn--profile">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="navbar-mobile-auth-btn navbar-mobile-auth-btn--logout">
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <button
                onClick={openLoginModal}
                className="navbar-mobile-auth-btn navbar-mobile-auth-btn--login">
                <FontAwesomeIcon icon={faSignInAlt} />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </nav>

        {/* Separador y botón de usuario */}
        <div className="navbar-user-section">
          <div className="navbar-divider"></div>
          <div className="navbar-user-wrapper" ref={userDropdownRef}>
            <button className="navbar-user-btn" onClick={toggleUserDropdown}>
              <img src={manchaExtro} alt="" className="navbar-user-mancha" />
              {isAuthenticated && userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="navbar-user-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="navbar-user-icon" />
              )}
            </button>

            {/* Dropdown de usuario */}
            {isUserDropdownOpen && (
              <div className="navbar-user-dropdown">
                {isAuthenticated ? (
                  <>
                    <div className="navbar-dropdown-user-info">
                      {userAvatar && (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="navbar-dropdown-avatar"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="navbar-dropdown-username">
                        {userName}
                      </span>
                    </div>
                    <div className="navbar-dropdown-divider"></div>
                    <button
                      onClick={goToProfile}
                      className="navbar-dropdown-item">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="navbar-dropdown-icon"
                      />
                      <span>Mi Perfil</span>
                    </button>
                    {isModerator && (
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          navigate("/admin");
                        }}
                        className="navbar-dropdown-item navbar-dropdown-item--admin">
                        <FontAwesomeIcon
                          icon={faShieldAlt}
                          className="navbar-dropdown-icon"
                        />
                        <span>Panel Admin</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        navigate("/publicar-panorama");
                      }}
                      className="navbar-dropdown-item">
                      <FontAwesomeIcon
                        icon={faCog}
                        className="navbar-dropdown-icon"
                      />
                      <span>Crear Publicación</span>
                    </button>
                    <div className="navbar-dropdown-divider"></div>
                    <button
                      onClick={handleSignOut}
                      className="navbar-dropdown-item navbar-dropdown-item--logout">
                      <FontAwesomeIcon
                        icon={faSignOutAlt}
                        className="navbar-dropdown-icon"
                      />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openLoginModal}
                    className="navbar-dropdown-item">
                    <FontAwesomeIcon
                      icon={faSignInAlt}
                      className="navbar-dropdown-icon"
                    />
                    <span>Iniciar sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-actions">
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu">
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </button>
        </div>
      </div>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </header>
  );
}
