import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
  faPlus,
  faMapMarkerAlt,
  faSpinner,
  faBars,
  faTimes,
  faBell,
  faCheck,
  faExclamationCircle,
  faInfoCircle,
  faNewspaper,
  faHeart,
  faCog,
  faStore,
  faChevronRight,
  faTrash,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../Home/Footer";
import { getEventsByUser } from "../../lib/database";
import "./styles/perfil.css";

// Notificaciones de ejemplo (en producción vendrían de la BD)
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "success",
    title: "¡Publicación aprobada!",
    message:
      "Tu evento 'Festival de Música' ha sido aprobado y ya está visible.",
    date: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Publicación en revisión",
    message:
      "Tu evento 'Feria Gastronómica' está siendo revisado por nuestro equipo.",
    date: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "Bienvenido a Extrovertidos",
    message: "¡Gracias por unirte! Explora y publica tus eventos favoritos.",
    date: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
];

export default function Perfil() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [activeSection, setActiveSection] = useState("publicaciones");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userPublications, setUserPublications] = useState([]);
  const [loadingPublications, setLoadingPublications] = useState(false);

  // Estados de notificaciones
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Cargar publicaciones del usuario desde Supabase
    const loadUserPublications = async () => {
      if (isAuthenticated && user?.id) {
        setLoadingPublications(true);
        try {
          const publications = await getEventsByUser(user.id);
          setUserPublications(publications || []);
        } catch (error) {
          console.error("Error cargando publicaciones:", error);
          setUserPublications([]);
        } finally {
          setLoadingPublications(false);
        }
      }
    };

    loadUserPublications();
  }, [isAuthenticated, user?.id]);

  // Calcular notificaciones no leídas
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Marcar notificación como leída
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Eliminar notificación
  const deleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Formatear fecha relativa
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-CL");
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return faCheck;
      case "warning":
        return faExclamationCircle;
      case "error":
        return faTimes;
      default:
        return faInfoCircle;
    }
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Obtener datos del usuario de Google
  const userAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "/img/default-avatar.png";
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || "Usuario";
  const userEmail = user.email;
  const createdAt = new Date(user.created_at).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Opciones del menú lateral
  const menuItems = [
    { id: "publicaciones", label: "Mis Publicaciones", icon: faNewspaper },
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

  return (
    <div className="perfil-page">
      {/* Layout principal - Sidebar + Contenido */}
      <div className="perfil-layout">
        {/* Botón toggle sidebar (móvil) */}
        <button
          className="perfil-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
        </button>

        {/* Overlay para móvil */}
        <div
          className={`perfil-sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar fija a la izquierda */}
        <aside className={`perfil-sidebar ${sidebarOpen ? "open" : ""}`}>
          {/* Logo en sidebar */}
          <div className="perfil-sidebar__logo">
            <img src="/img/Logo_extrovertidos.png" alt="Extrovertidos" />
          </div>

          <nav className="perfil-sidebar__nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`perfil-sidebar__item ${
                  activeSection === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  if (window.innerWidth < 992) setSidebarOpen(false);
                }}>
                <FontAwesomeIcon
                  icon={item.icon}
                  className="perfil-sidebar__icon"
                />
                <span className="perfil-sidebar__label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="perfil-sidebar__badge">{item.badge}</span>
                )}
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="perfil-sidebar__arrow"
                />
              </button>
            ))}
          </nav>

          {/* Acciones rápidas en sidebar */}
          <div className="perfil-sidebar__actions">
            <button
              className="perfil-sidebar__action-btn"
              onClick={() => navigate("/publicar-panorama")}>
              <FontAwesomeIcon icon={faPlus} />
              Nuevo Panorama
            </button>
            <button
              className="perfil-sidebar__action-btn perfil-sidebar__action-btn--secondary"
              onClick={() => navigate("/publicar-negocio")}>
              <FontAwesomeIcon icon={faStore} />
              Nuevo Negocio
            </button>
          </div>
        </aside>

        {/* Contenido principal (todo lo demás) */}
        <div className="perfil-content-wrapper">
          {/* Header del perfil */}
          <header className="perfil-header">
            <div className="perfil-header__background"></div>
            <div className="perfil-header__content">
              <div className="perfil-header__avatar-wrapper">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="perfil-header__avatar"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="perfil-header__info">
                <h1 className="perfil-header__name">{userName}</h1>
                <p className="perfil-header__email">
                  <FontAwesomeIcon icon={faEnvelope} />
                  {userEmail}
                </p>
                <p className="perfil-header__date">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Miembro desde {createdAt}
                </p>
              </div>
              <div className="perfil-header__actions">
                <button className="perfil-header__btn perfil-header__btn--edit">
                  <FontAwesomeIcon icon={faEdit} />
                  Editar Perfil
                </button>
                <button
                  className="perfil-header__btn perfil-header__btn--logout"
                  onClick={handleSignOut}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </header>

          {/* Estadísticas */}
          <section className="perfil-stats">
            <div className="perfil-stats__item">
              <span className="perfil-stats__number">
                {userPublications.length}
              </span>
              <span className="perfil-stats__label">Publicaciones</span>
            </div>
            <div className="perfil-stats__item">
              <span className="perfil-stats__number">{unreadCount}</span>
              <span className="perfil-stats__label">Notificaciones</span>
            </div>
            <div className="perfil-stats__item">
              <span className="perfil-stats__number">0</span>
              <span className="perfil-stats__label">Favoritos</span>
            </div>
          </section>

          {/* Contenido principal según sección activa */}
          <main className="perfil-main">
            {/* Sección: Publicaciones */}
            {activeSection === "publicaciones" && (
              <div className="perfil-section">
                <div className="perfil-section__header">
                  <h2>Mis Publicaciones</h2>
                  <button
                    className="perfil-section__btn"
                    onClick={() => navigate("/publicar-panorama")}>
                    <FontAwesomeIcon icon={faPlus} />
                    Nueva Publicación
                  </button>
                </div>

                {loadingPublications ? (
                  <div className="perfil-section__loading">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <p>Cargando publicaciones...</p>
                  </div>
                ) : userPublications.length === 0 ? (
                  <div className="perfil-section__empty">
                    <FontAwesomeIcon icon={faNewspaper} />
                    <h3>No tienes publicaciones aún</h3>
                    <p>
                      ¡Crea tu primera publicación y compártela con la
                      comunidad!
                    </p>
                    <button onClick={() => navigate("/publicar-panorama")}>
                      Crear Publicación
                    </button>
                  </div>
                ) : (
                  <div className="perfil-publications__grid">
                    {userPublications.map((pub) => (
                      <article key={pub.id} className="perfil-publication-card">
                        <div className="perfil-publication-card__image">
                          <img
                            src={pub.imagen_url || "/img/Home1.png"}
                            alt={pub.titulo}
                          />
                          <span
                            className={`perfil-publication-card__status ${
                              pub.estado || "activo"
                            }`}>
                            {pub.estado || "activo"}
                          </span>
                        </div>
                        <div className="perfil-publication-card__content">
                          <span className="perfil-publication-card__category">
                            {pub.categories?.nombre || "Sin categoría"}
                          </span>
                          <h3 className="perfil-publication-card__title">
                            {pub.titulo}
                          </h3>
                          <p className="perfil-publication-card__info">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            {pub.comuna}, {pub.provincia} •{" "}
                            {new Date(pub.fecha_evento).toLocaleDateString(
                              "es-CL",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <div className="perfil-publication-card__actions">
                            <button className="perfil-publication-card__btn">
                              <FontAwesomeIcon icon={faEye} />
                              Ver
                            </button>
                            <button className="perfil-publication-card__btn">
                              <FontAwesomeIcon icon={faEdit} />
                              Editar
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sección: Notificaciones */}
            {activeSection === "notificaciones" && (
              <div className="perfil-section">
                <div className="perfil-section__header">
                  <h2>Notificaciones</h2>
                  {unreadCount > 0 && (
                    <button
                      className="perfil-section__btn perfil-section__btn--secondary"
                      onClick={markAllAsRead}>
                      <FontAwesomeIcon icon={faCheck} />
                      Marcar todas como leídas
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="perfil-section__empty">
                    <FontAwesomeIcon icon={faBell} />
                    <h3>No tienes notificaciones</h3>
                    <p>
                      Aquí aparecerán las actualizaciones de tus publicaciones
                    </p>
                  </div>
                ) : (
                  <div className="perfil-notifications">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`perfil-notification ${notification.type} ${
                          notification.read ? "read" : "unread"
                        }`}
                        onClick={() => markAsRead(notification.id)}>
                        <div
                          className={`perfil-notification__icon ${notification.type}`}>
                          <FontAwesomeIcon
                            icon={getNotificationIcon(notification.type)}
                          />
                        </div>
                        <div className="perfil-notification__content">
                          <h4 className="perfil-notification__title">
                            {notification.title}
                            {!notification.read && (
                              <span className="perfil-notification__new">
                                Nuevo
                              </span>
                            )}
                          </h4>
                          <p className="perfil-notification__message">
                            {notification.message}
                          </p>
                          <span className="perfil-notification__date">
                            {formatRelativeDate(notification.date)}
                          </span>
                        </div>
                        <button
                          className="perfil-notification__delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sección: Favoritos */}
            {activeSection === "favoritos" && (
              <div className="perfil-section">
                <div className="perfil-section__header">
                  <h2>Mis Favoritos</h2>
                </div>
                <div className="perfil-section__empty">
                  <FontAwesomeIcon icon={faHeart} />
                  <h3>No tienes favoritos aún</h3>
                  <p>
                    Explora la Superguía y guarda tus eventos y negocios
                    favoritos
                  </p>
                  <button onClick={() => navigate("/superguia")}>
                    Explorar Superguía
                  </button>
                </div>
              </div>
            )}

            {/* Sección: Negocios */}
            {activeSection === "negocios" && (
              <div className="perfil-section">
                <div className="perfil-section__header">
                  <h2>Mis Negocios</h2>
                  <button
                    className="perfil-section__btn"
                    onClick={() => navigate("/publicar-negocio")}>
                    <FontAwesomeIcon icon={faPlus} />
                    Nuevo Negocio
                  </button>
                </div>
                <div className="perfil-section__empty">
                  <FontAwesomeIcon icon={faStore} />
                  <h3>No tienes negocios registrados</h3>
                  <p>Registra tu negocio y llega a más clientes en la región</p>
                  <button onClick={() => navigate("/publicar-negocio")}>
                    Registrar Negocio
                  </button>
                </div>
              </div>
            )}

            {/* Sección: Configuración */}
            {activeSection === "configuracion" && (
              <div className="perfil-section">
                <div className="perfil-section__header">
                  <h2>Configuración</h2>
                </div>
                <div className="perfil-settings">
                  <div className="perfil-settings__section">
                    <h3>Información Personal</h3>
                    <div className="perfil-settings__field">
                      <label>Nombre</label>
                      <input type="text" value={userName} disabled />
                    </div>
                    <div className="perfil-settings__field">
                      <label>Correo electrónico</label>
                      <input type="email" value={userEmail} disabled />
                    </div>
                    <p className="perfil-settings__note">
                      Los datos de tu cuenta están vinculados a tu cuenta de
                      Google
                    </p>
                  </div>

                  <div className="perfil-settings__section">
                    <h3>Preferencias de Notificaciones</h3>
                    <div className="perfil-settings__toggle">
                      <label>
                        <input type="checkbox" defaultChecked />
                        <span>Notificaciones de publicaciones aprobadas</span>
                      </label>
                    </div>
                    <div className="perfil-settings__toggle">
                      <label>
                        <input type="checkbox" defaultChecked />
                        <span>Notificaciones de nuevos seguidores</span>
                      </label>
                    </div>
                    <div className="perfil-settings__toggle">
                      <label>
                        <input type="checkbox" />
                        <span>Correos promocionales</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
