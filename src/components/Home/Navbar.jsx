import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./styles/navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBars,
  faTimes,
  faSignInAlt,
  faSignOutAlt,
  faShieldAlt,
  faExchangeAlt,
  faPlus,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import AuthModal from "../Auth/AuthModal";
import LoginReminderModal from "../Auth/LoginReminderModal";
import { usePlansVisibility } from "../../hooks/usePlansVisibility";
import { useAdminPendingCount } from "../../hooks/useAdminPendingCount";
import { useUnreadNotificationsCount } from "../../hooks/useUnreadNotificationsCount";

// Imágenes servidas desde public/
const logo = "/img/E_Extro_v3.png";
const manchaExtro = "/img/Mancha_Extro.png";
import { useAuth } from "../../context/AuthContext";

// Únicas rutas a las que navega la navbar. Los antiguos NAV_LINKS
// (Panoramas, Superguía, Publicar Panorama, Publicar Negocio, Activar Plan)
// se retiraron: la navegación de secciones ahora vive fuera de la navbar.
const CREAR_PUBLICACION_PATH = "/crear-publicacion";
const ACTIVAR_PLAN_PATH = "/activar-plan";
const ADMIN_PATH = "/admin";

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    isModerator,
    signOut,
    loginReminder,
    closeLoginReminder,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const { anyVisible: planesVisible } = usePlansVisibility();
  const userDropdownRef = useRef(null);

  // Obtener datos del usuario
  const userAvatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "Usuario";

  // Contador de notificaciones admin en tiempo real (solo moderadores)
  const { total: adminPendingTotal } = useAdminPendingCount(
    Boolean(isModerator),
  );
  // Contador de notificaciones no leídas del usuario (solo usuarios normales)
  const unreadNotifications = useUnreadNotificationsCount(
    !isModerator && isAuthenticated ? user?.id : null,
  );
  const navbarBadgeCount = isModerator
    ? adminPendingTotal
    : unreadNotifications;
  const navbarBadgeLabel = isModerator
    ? "solicitudes pendientes"
    : "notificaciones sin leer";

  // El CTA principal es siempre Crear publicación. Admin/moderator conservan
  // el acceso secundario al panel dentro del menú de usuario.
  const showActivarPlan = !isModerator && planesVisible;

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  // Botón principal de la navbar.
  // Si el usuario no ha iniciado sesión abrimos el modal de login en vez de
  // navegar (mismo comportamiento que tenían los links `userOnly` anteriores).
  const handleCrearPublicacion = () => {
    closeAllMenus();
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
      return;
    }
    // Si ya estamos en la ruta, forzamos recarga para reiniciar el flujo.
    if (location.pathname === CREAR_PUBLICACION_PATH) {
      window.location.href = CREAR_PUBLICACION_PATH;
      return;
    }
    navigate(CREAR_PUBLICACION_PATH);
  };

  const goToAdmin = () => {
    closeAllMenus();
    navigate(ADMIN_PATH);
  };

  // Activar Plan ya no es un link de nivel superior: vive dentro del menú
  // de usuario (dropdown en desktop, panel hamburguesa en móvil).
  const goToActivarPlan = () => {
    closeAllMenus();
    navigate(ACTIVAR_PLAN_PATH);
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
    closeAllMenus();
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Estado para evitar múltiples clicks durante logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Evitar múltiples clicks

    setIsLoggingOut(true);
    closeAllMenus();

    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Navegar de todos modos ya que el estado local ya se limpió
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const goToProfile = () => {
    closeAllMenus();
    navigate("/perfil");
  };

  // Cambiar de cuenta: cerrar sesión y abrir modal de login
  const handleSwitchAccount = async () => {
    closeAllMenus();
    try {
      await signOut();
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
    } catch (error) {
      console.error("Error al cambiar cuenta:", error);
    }
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
          <span className="navbar-slogan">
            <span className="navbar-slogan__line">¡Somos tu</span>
            <span className="navbar-slogan__line">panorama!</span>
          </span>
        </Link>

        {/* Overlay para cerrar el menú */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={handleOverlayClick}></div>
        )}

        {/* Panel lateral (solo móvil): acceso a sesión, perfil y admin.
            En ≤768px la sección de usuario de escritorio está oculta, por lo
            que este panel es el ÚNICO acceso a login/logout en celular. */}
        <nav className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          {/* Logo del menú móvil */}
          <div className="navbar-menu-logo-wrapper">
            <img
              src="/img/Logo_con_r_v3.png"
              alt="Extrovertidos"
              className="navbar-menu-logo"
            />
          </div>

          {/* Botones de autenticación en menú móvil */}
          <div className="navbar-mobile-auth">
            {isAuthenticated ? (
              <>
                <div className="navbar-mobile-user-info">
                  <div className="navbar-mobile-avatar-wrapper">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="navbar-mobile-user-avatar"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    {navbarBadgeCount > 0 && (
                      <span
                        className="navbar-user-badge"
                        aria-label={`${navbarBadgeCount} ${navbarBadgeLabel}`}
                        title={`${navbarBadgeCount} ${navbarBadgeLabel}`}>
                        {navbarBadgeCount > 99 ? "99+" : navbarBadgeCount}
                      </span>
                    )}
                  </div>
                  <span className="navbar-mobile-user-name">{userName}</span>
                </div>
                {/* Mi Perfil visible para todos los usuarios autenticados */}
                <button
                  onClick={goToProfile}
                  className="navbar-mobile-auth-btn navbar-mobile-auth-btn--profile">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Mi Perfil</span>
                </button>
                {isModerator && (
                  <button
                    onClick={goToAdmin}
                    className="navbar-mobile-auth-btn navbar-mobile-auth-btn--admin">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <span>Panel Admin</span>
                  </button>
                )}
                {showActivarPlan && (
                  <button
                    onClick={goToActivarPlan}
                    className="navbar-mobile-auth-btn navbar-mobile-auth-btn--plan">
                    <FontAwesomeIcon icon={faCrown} />
                    <span>Activar Plan</span>
                  </button>
                )}
                <button
                  onClick={handleSwitchAccount}
                  className="navbar-mobile-auth-btn navbar-mobile-auth-btn--switch">
                  <FontAwesomeIcon icon={faExchangeAlt} />
                  <span>Cambiar Cuenta</span>
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

        {/* Botón principal: única acción de navegación de la navbar. */}
        <div className="navbar-cta">
          <button
            type="button"
            onClick={handleCrearPublicacion}
            className="navbar-cta-btn"
            aria-label="Crear publicación"
            title="Crear publicación">
            <FontAwesomeIcon icon={faPlus} className="navbar-cta-icon" />
            <span className="navbar-cta-label">Crear publicación</span>
          </button>
        </div>

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
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="navbar-user-icon" />
              )}
              {isAuthenticated && navbarBadgeCount > 0 && (
                <span
                  className="navbar-user-badge"
                  aria-label={`${navbarBadgeCount} ${navbarBadgeLabel}`}
                  title={`${navbarBadgeCount} ${navbarBadgeLabel}`}>
                  {navbarBadgeCount > 99 ? "99+" : navbarBadgeCount}
                </span>
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
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <span className="navbar-dropdown-username">
                        {userName}
                      </span>
                    </div>
                    <div className="navbar-dropdown-divider"></div>
                    {/* Mi Perfil visible para todos los usuarios autenticados */}
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
                        onClick={goToAdmin}
                        className="navbar-dropdown-item navbar-dropdown-item--admin">
                        <FontAwesomeIcon
                          icon={faShieldAlt}
                          className="navbar-dropdown-icon"
                        />
                        <span>Panel Admin</span>
                      </button>
                    )}
                    {/* Activar Plan: ya no es link de navbar, vive aquí */}
                    {showActivarPlan && (
                      <button
                        onClick={goToActivarPlan}
                        className="navbar-dropdown-item navbar-dropdown-item--plan">
                        <FontAwesomeIcon
                          icon={faCrown}
                          className="navbar-dropdown-icon"
                        />
                        <span>Activar Plan</span>
                      </button>
                    )}
                    <div className="navbar-dropdown-divider"></div>
                    <button
                      onClick={handleSwitchAccount}
                      className="navbar-dropdown-item navbar-dropdown-item--switch">
                      <FontAwesomeIcon
                        icon={faExchangeAlt}
                        className="navbar-dropdown-icon"
                      />
                      <span>Cambiar Cuenta</span>
                    </button>
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

      {/* Modal de recordatorio post-login */}
      <LoginReminderModal
        isOpen={loginReminder.show}
        onClose={closeLoginReminder}
        data={loginReminder.data}
        onVerPerfil={() => navigate("/perfil")}
        onActivarPlan={() => navigate(ACTIVAR_PLAN_PATH)}
      />
    </header>
  );
}
