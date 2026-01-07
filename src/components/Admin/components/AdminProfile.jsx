import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getEventsByUser,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationDB,
} from "../../../lib/database";
import {
  PerfilHeader,
  PerfilStats,
  PerfilPublicaciones,
  PerfilNotificaciones,
  PerfilFavoritos,
  PerfilNegocios,
  PerfilConfiguracion,
} from "../../Perfil/components";

// Importar estilos del perfil
import "../../Perfil/styles/perfil.css";
import "./AdminProfile.css";

/**
 * Componente de Perfil embebido en el Panel de Administración
 * Reutiliza los componentes del perfil existente con estilos adaptados
 */
export default function AdminProfile() {
  const { user, signOut, isAuthenticated, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [activeSection, setActiveSection] = useState("publicaciones");
  const [userPublications, setUserPublications] = useState([]);
  const [loadingPublications, setLoadingPublications] = useState(false);

  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar publicaciones del usuario
  useEffect(() => {
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

  // Cargar notificaciones del usuario desde Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      if (isAuthenticated && user?.id) {
        setLoadingNotifications(true);
        try {
          const data = await getUserNotifications(user.id);
          // Transformar datos para el componente
          const formattedNotifications = (data || []).map((n) => ({
            id: n.id,
            type: mapNotificationType(n.type),
            title: n.title,
            message: n.message,
            date: n.created_at,
            read: n.read,
            eventId: n.related_event_id,
            eventTitle: n.events?.titulo,
          }));
          setNotifications(formattedNotifications);
        } catch (error) {
          console.error("Error cargando notificaciones:", error);
          setNotifications([]);
        } finally {
          setLoadingNotifications(false);
        }
      }
    };

    loadNotifications();
  }, [isAuthenticated, user?.id]);

  // Mapear tipo de notificación a tipo visual
  const mapNotificationType = (dbType) => {
    switch (dbType) {
      case "publication_approved":
        return "success";
      case "publication_rejected":
        return "error";
      case "publication_pending":
        return "warning";
      case "welcome":
        return "info";
      default:
        return "info";
    }
  };

  // Contar notificaciones no leídas
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, user.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Eliminar notificación
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotificationDB(notificationId, user.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  // Estado para evitar múltiples clicks durante logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Evitar múltiples clicks

    setIsLoggingOut(true);

    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile__loading">
        <div className="admin-profile__loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Datos del usuario
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

  // Tabs de navegación interna del perfil
  const profileTabs = [
    { id: "publicaciones", label: "Publicaciones" },
    { id: "notificaciones", label: "Notificaciones", badge: unreadCount },
    { id: "favoritos", label: "Favoritos" },
    { id: "negocios", label: "Negocios" },
    { id: "configuracion", label: "Configuración" },
  ];

  return (
    <div className="admin-profile">
      {/* Header del perfil */}
      <PerfilHeader
        userAvatar={userAvatar}
        userName={userName}
        userEmail={userEmail}
        createdAt={createdAt}
        onSignOut={handleSignOut}
      />

      {/* Stats */}
      <PerfilStats
        publicationsCount={userPublications.length}
        unreadCount={unreadCount}
      />

      {/* Navegación interna del perfil */}
      <div className="admin-profile__tabs">
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-profile__tab ${
              activeSection === tab.id ? "active" : ""
            }`}
            onClick={() => setActiveSection(tab.id)}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="admin-profile__tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido según sección activa */}
      <section className="admin-profile__content">
        {activeSection === "publicaciones" && (
          <PerfilPublicaciones
            publications={userPublications}
            loading={loadingPublications}
          />
        )}

        {activeSection === "notificaciones" && (
          <PerfilNotificaciones
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loadingNotifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={handleDeleteNotification}
          />
        )}

        {activeSection === "favoritos" && <PerfilFavoritos />}

        {activeSection === "negocios" && <PerfilNegocios />}

        {activeSection === "configuracion" && (
          <PerfilConfiguracion userName={userName} userEmail={userEmail} />
        )}
      </section>

      {/* Badge indicando rol de admin */}
      <div className="admin-profile__role-badge">
        {isAdmin ? "Administrador" : "Moderador"}
      </div>
    </div>
  );
}
