import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getEventsByUser,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationDB,
  countDrafts,
} from "../../lib/database";
import {
  PerfilSidebar,
  PerfilHeader,
  PerfilStats,
  PerfilPublicaciones,
  PerfilNotificaciones,
  PerfilFavoritos,
  PerfilNegocios,
  PerfilConfiguracion,
  PerfilBorradores,
} from "./components";
import "./styles/perfil.css";

export default function Perfil() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [activeSection, setActiveSection] = useState("publicaciones");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userPublications, setUserPublications] = useState([]);
  const [loadingPublications, setLoadingPublications] = useState(false);

  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estado de borradores
  const [draftsCount, setDraftsCount] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

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

  // Cargar cantidad de borradores
  useEffect(() => {
    const loadDraftsCount = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const count = await countDrafts(user.id);
          setDraftsCount(count);
        } catch (error) {
          console.error("Error contando borradores:", error);
          setDraftsCount(0);
        }
      }
    };

    loadDraftsCount();
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
      <div className="perfil-loading">
        <div className="perfil-loading__spinner"></div>
        <p>Cargando...</p>
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

  return (
    <div className="perfil-layout">
      <PerfilSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        unreadCount={unreadCount}
        draftsCount={draftsCount}
        userAvatar={userAvatar}
        userName={userName}
      />

      <main className="perfil-main">
        <PerfilHeader
          userAvatar={userAvatar}
          userName={userName}
          userEmail={userEmail}
          createdAt={createdAt}
          onSignOut={handleSignOut}
        />

        <PerfilStats
          publicationsCount={userPublications.length}
          unreadCount={unreadCount}
        />

        <section className="perfil-content">
          {activeSection === "publicaciones" && (
            <PerfilPublicaciones
              publications={userPublications}
              loading={loadingPublications}
            />
          )}

          {activeSection === "borradores" && <PerfilBorradores />}

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
      </main>
    </div>
  );
}
