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
}) {
  const navigate = useNavigate();

  // Opciones del menú lateral
  const menuItems = [
    { id: "publicaciones", label: "Mis Publicaciones", icon: faNewspaper },
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
    { id: "favoritos", label: "Favoritos", icon: faHeart },
    { id: "negocios", label: "Mis Negocios", icon: faStore },
    { id: "configuracion", label: "Configuración", icon: faCog },
  ];

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
          <img src="/img/logo-extrovertidos.png" alt="Extrovertidos" />
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
