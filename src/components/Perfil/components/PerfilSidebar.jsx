import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faNewspaper,
  faBell,
  faHeart,
  faStore,
  faCog,
  faFileAlt,
  faShieldAlt,
  faCrown,
  faBookmark,
  faChevronDown,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./styles/sidebar.css";

export default function PerfilSidebar({
  activeSection,
  onSectionChange,
  sidebarOpen,
  setSidebarOpen,
  unreadCount,
  draftsCount = 0,
  userAvatar,
  userName,
  isStaff = false,
  planesEnabled = false,
}) {
  const navigate = useNavigate();

  const pubSubSections = ["publicaciones", "negocios"];
  const [pubMenuOpen, setPubMenuOpen] = useState(
    pubSubSections.includes(activeSection),
  );

  const favSubSections = ["favoritos", "negocios-guardados"];
  const [favMenuOpen, setFavMenuOpen] = useState(
    favSubSections.includes(activeSection),
  );

  // Opciones del menú lateral
  const allMenuItems = [
    {
      id: "borradores",
      label: "Mis Borradores",
      icon: faFileAlt,
      badge: draftsCount,
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: faBell,
      badge: unreadCount,
    },
    { id: "plan", label: "Mi Plan", icon: faCrown },
    { id: "configuracion", label: "Configuración", icon: faCog },
  ];

  // Filtrar "Mi Plan" si los planes no están habilitados
  const menuItems = planesEnabled
    ? allMenuItems
    : allMenuItems.filter((item) => item.id !== "plan");

  // Cambiar sección y cerrar sidebar en móvil
  const handleSectionChange = (sectionId) => {
    onSectionChange(sectionId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleGoToAdmin = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    navigate("/admin");
  };

  return (
    <>
      {/* Botón hamburguesa móvil */}
      <button
        className={`perfil-layout__mobile-toggle ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
        onClick={() => setSidebarOpen(!sidebarOpen)}>
        <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="perfil-layout__overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`perfil-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="perfil-sidebar__logo">
          <img src="/img/Logo_con_r.png" alt="Extrovertidos" />
        </div>

        {/* Link al panel admin */}
        {isStaff && (
          <div className="perfil-sidebar__admin-section">
            <button
              className="perfil-sidebar__admin-btn"
              onClick={handleGoToAdmin}>
              <FontAwesomeIcon icon={faShieldAlt} />
              <span>Panel Admin</span>
            </button>
          </div>
        )}

        {/* Navegación */}
        <nav className="perfil-sidebar__nav">
          {/* Dropdown: Mis Publicaciones */}
          <div className="perfil-sidebar__dropdown">
            <button
              className={`perfil-sidebar__item perfil-sidebar__dropdown-toggle ${
                pubSubSections.includes(activeSection) ? "active-parent" : ""
              }`}
              onClick={() => setPubMenuOpen(!pubMenuOpen)}>
              <FontAwesomeIcon icon={faNewspaper} />
              <span>Mis Publicaciones</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`perfil-sidebar__chevron ${pubMenuOpen ? "open" : ""}`}
              />
            </button>
            {pubMenuOpen && (
              <div className="perfil-sidebar__sub-items">
                <button
                  className={`perfil-sidebar__sub-item ${
                    activeSection === "publicaciones" ? "active" : ""
                  }`}
                  onClick={() => handleSectionChange("publicaciones")}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Panoramas</span>
                </button>
                <button
                  className={`perfil-sidebar__sub-item ${
                    activeSection === "negocios" ? "active" : ""
                  }`}
                  onClick={() => handleSectionChange("negocios")}>
                  <FontAwesomeIcon icon={faStore} />
                  <span>Mis Negocios</span>
                </button>
              </div>
            )}
          </div>

          {/* Dropdown: Guardados */}
          <div className="perfil-sidebar__dropdown">
            <button
              className={`perfil-sidebar__item perfil-sidebar__dropdown-toggle ${
                favSubSections.includes(activeSection) ? "active-parent" : ""
              }`}
              onClick={() => setFavMenuOpen(!favMenuOpen)}>
              <FontAwesomeIcon icon={faHeart} />
              <span>Guardados</span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`perfil-sidebar__chevron ${favMenuOpen ? "open" : ""}`}
              />
            </button>
            {favMenuOpen && (
              <div className="perfil-sidebar__sub-items">
                <button
                  className={`perfil-sidebar__sub-item ${
                    activeSection === "favoritos" ? "active" : ""
                  }`}
                  onClick={() => handleSectionChange("favoritos")}>
                  <FontAwesomeIcon icon={faHeart} />
                  <span>Panoramas Favoritos</span>
                </button>
                <button
                  className={`perfil-sidebar__sub-item ${
                    activeSection === "negocios-guardados" ? "active" : ""
                  }`}
                  onClick={() => handleSectionChange("negocios-guardados")}>
                  <FontAwesomeIcon icon={faBookmark} />
                  <span>Negocios Favoritos</span>
                </button>
              </div>
            )}
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`perfil-sidebar__item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => handleSectionChange(item.id)}>
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="perfil-sidebar__badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Info usuario */}
        <div className="perfil-sidebar__user">
          <img src={userAvatar} alt={userName} referrerPolicy="no-referrer" />
          <div>
            <p>{userName}</p>
            <span>{isStaff ? "Staff" : "Mi Cuenta"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
