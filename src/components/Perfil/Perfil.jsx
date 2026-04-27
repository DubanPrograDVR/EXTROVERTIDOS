import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getEventsByUser,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationDB,
  deleteNotifications as deleteNotificationsDB,
  countDrafts,
  countUserFavorites,
  isPlanesEnabled,
  getUserSubscriptions,
} from "../../lib/database";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import {
  PerfilSidebar,
  PerfilHeader,
  PerfilStats,
  PerfilPublicaciones,
  PerfilNotificaciones,
  PerfilFavoritos,
  PerfilNegociosFavoritos,
  PerfilNegocios,
  PerfilConfiguracion,
  PerfilBorradores,
  PerfilPlan,
} from "./components";
import "./styles/perfil.css";

export default function Perfil() {
  const { user, signOut, isAuthenticated, loading, isModerator, userRole } =
    useAuth();
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

  // Estado de favoritos (conteo)
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Estado de planes habilitados
  const [planesEnabled, setPlanesEnabled] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // Cargar publicaciones del usuario
  const loadUserPublications = async ({ silent = false } = {}) => {
    if (isAuthenticated && user?.id) {
      if (!silent) setLoadingPublications(true);
      try {
        const publications = await getEventsByUser(user.id);
        // Filtrar eventos cuya fecha ya pasó
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = (publications || []).filter((pub) => {
          const endDate = new Date(
            (pub.fecha_fin || pub.fecha_evento) + "T23:59:59",
          );
          return endDate >= today;
        });
        setUserPublications(active);
      } catch (error) {
        console.error("Error cargando publicaciones:", error);
        if (!silent) setUserPublications([]);
      } finally {
        if (!silent) setLoadingPublications(false);
      }
    }
  };

  useEffect(() => {
    loadUserPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Tiempo real: refrescar publicaciones del usuario en vivo
  useRealtimeRefetch({
    table: "events",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(isAuthenticated && user?.id),
    onChange: () => loadUserPublications({ silent: true }),
  });

  // Consultar si los planes están habilitados y cargar suscripciones activas
  useEffect(() => {
    const checkPlanes = async () => {
      try {
        const enabled = await isPlanesEnabled();
        setPlanesEnabled(enabled);
        if (enabled && user?.id) {
          const subs = await getUserSubscriptions(user.id);
          const now = new Date();
          const activeSubs = (subs || []).filter((s) => {
            if (s.estado !== "activa") return false;
            // Excluir suscripciones expiradas
            if (s.fecha_fin && new Date(s.fecha_fin) <= now) return false;
            // Excluir suscripciones sin cupo restante (ilimitado siempre pasa)
            if (s.plan === "panorama_ilimitado") return true;
            if (s.plan === "superguia") {
              const total = Number(s.publicaciones_total ?? 0);
              if (total === 0) return true; // legacy sin límite
              return Number(s.publicaciones_usadas ?? 0) < total;
            }
            const total = Number(s.publicaciones_total ?? 0);
            return Number(s.publicaciones_usadas ?? 0) < total;
          });
          // Mostrar solo un badge por tipo de plan (el más reciente)
          const uniqueByPlan = [];
          const seenPlans = new Set();
          for (const sub of activeSubs) {
            if (!seenPlans.has(sub.plan)) {
              seenPlans.add(sub.plan);
              uniqueByPlan.push(sub);
            }
          }
          setActiveSubscriptions(uniqueByPlan);
        }
      } catch (error) {
        console.error("Error verificando planes:", error);
        setPlanesEnabled(false);
      }
    };
    checkPlanes();
  }, [user?.id]);

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
  const loadNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || !user?.id) return;
      if (!silent) setLoadingNotifications(true);
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
          businessId: n.related_business_id,
          businessName: n.businesses?.nombre,
          rawType: n.type,
        }));
        setNotifications(formattedNotifications);
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
        if (!silent) setNotifications([]);
      } finally {
        if (!silent) setLoadingNotifications(false);
      }
    },
    [isAuthenticated, user?.id],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Tiempo real: actualizar notificaciones del usuario en vivo
  useRealtimeRefetch({
    table: "notifications",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(isAuthenticated && user?.id),
    onChange: () => loadNotifications({ silent: true }),
  });

  // Cargar conteo de favoritos
  const loadFavoritesCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const count = await countUserFavorites(user.id);
      setFavoritesCount(count || 0);
    } catch (error) {
      console.error("Error contando favoritos:", error);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    loadFavoritesCount();
  }, [loadFavoritesCount]);

  // Tiempo real: actualizar conteo de favoritos en vivo
  useRealtimeRefetch({
    table: "user_favorites",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(isAuthenticated && user?.id),
    onChange: () => loadFavoritesCount(),
  });

  useRealtimeRefetch({
    table: "business_favorites",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(isAuthenticated && user?.id),
    onChange: () => loadFavoritesCount(),
  });

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
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
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

  // Eliminar múltiples notificaciones
  const handleDeleteNotifications = async (notificationIds) => {
    try {
      await deleteNotificationsDB(notificationIds, user.id);
      setNotifications((prev) =>
        prev.filter((n) => !notificationIds.includes(n.id)),
      );
    } catch (error) {
      console.error("Error al eliminar notificaciones:", error);
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
        isStaff={isModerator}
        planesEnabled={planesEnabled}
      />

      <main className="perfil-main">
        <PerfilHeader
          userAvatar={userAvatar}
          userName={userName}
          userEmail={userEmail}
          createdAt={createdAt}
          userRole={userRole}
          onSignOut={handleSignOut}
          planesEnabled={planesEnabled}
          activeSubscriptions={activeSubscriptions}
        />

        <PerfilStats
          publicationsCount={userPublications.length}
          notificationsCount={notifications.length}
          favoritesCount={favoritesCount}
        />

        <section className="perfil-content">
          {activeSection === "publicaciones" && (
            <PerfilPublicaciones
              publications={userPublications}
              loading={loadingPublications}
              onPublicationUpdate={loadUserPublications}
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
              onDeleteMultiple={handleDeleteNotifications}
            />
          )}

          {activeSection === "favoritos" && <PerfilFavoritos />}

          {activeSection === "negocios-guardados" && (
            <PerfilNegociosFavoritos />
          )}

          {activeSection === "plan" && planesEnabled && <PerfilPlan />}

          {activeSection === "negocios" && <PerfilNegocios />}

          {activeSection === "configuracion" && (
            <PerfilConfiguracion userName={userName} userEmail={userEmail} />
          )}
        </section>
      </main>
    </div>
  );
}
