import { useState, useEffect } from "react";
import {
  getPendingEvents,
  getAllUsers,
  approveEvent,
  rejectEvent,
  updateUserRole,
  getAdminStats,
  getEventsPerDay,
  getUsersPerDay,
  getAllUsersWithBanStatus,
  banUser,
  unbanUser,
} from "../../../lib/database";

/**
 * Hook personalizado para manejar la lógica de datos del panel de administración
 */
export const useAdminData = (user, isAdmin, isModerator) => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    eventsPerDay: [],
    usersPerDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  const loadData = async () => {
    if (!user || !isModerator) {
      if (!user) {
        console.error(
          "useAdminData: No se pudo cargar el usuario - user es null o undefined"
        );
      }
      if (!isModerator) {
        console.error(
          "useAdminData: El usuario no tiene permisos de moderador/admin"
        );
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cargar datos con manejo de errores individual
      let eventsData = [];
      let statsData = {
        eventos: { pendientes: 0, publicados: 0, rechazados: 0 },
        negocios: { pendientes: 0 },
        usuarios: { total: 0 },
      };

      try {
        eventsData = await getPendingEvents(user.id);
      } catch (err) {
        console.warn("Error al cargar eventos pendientes:", err);
      }

      try {
        statsData = await getAdminStats(user.id);
      } catch (err) {
        console.warn("Error al cargar estadísticas:", err);
      }

      // Cargar datos para gráficos
      let eventsPerDayData = [];
      let usersPerDayData = [];

      try {
        eventsPerDayData = await getEventsPerDay(user.id);
      } catch (err) {
        console.warn("Error al cargar eventos por día:", err);
      }

      try {
        usersPerDayData = await getUsersPerDay(user.id);
      } catch (err) {
        console.warn("Error al cargar usuarios por día:", err);
      }

      setPendingEvents(eventsData || []);
      setStats(statsData);
      setChartData({
        eventsPerDay: eventsPerDayData,
        usersPerDay: usersPerDayData,
      });

      // Solo cargar usuarios si es admin (con estado de baneo)
      if (isAdmin) {
        try {
          const usersData = await getAllUsersWithBanStatus(user.id);
          setUsers(usersData || []);
        } catch (err) {
          console.warn("Error al cargar usuarios:", err);
          // Fallback a la función antigua si falla
          try {
            const usersData = await getAllUsers(user.id);
            setUsers(usersData || []);
          } catch (fallbackErr) {
            console.warn("Error en fallback:", fallbackErr);
            setUsers([]);
          }
        }
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambie el usuario o permisos
  useEffect(() => {
    if (user && isModerator) {
      loadData();
    }
  }, [user, isModerator]);

  // Aprobar evento
  const handleApproveEvent = async (eventId) => {
    setActionLoading(eventId);
    try {
      await approveEvent(eventId, user.id);
      setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      setStats((prev) => ({
        ...prev,
        eventos: {
          ...prev.eventos,
          pendientes: prev.eventos.pendientes - 1,
          publicados: prev.eventos.publicados + 1,
        },
      }));
      return { success: true };
    } catch (err) {
      console.error("Error al aprobar:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  // Rechazar evento
  const handleRejectEvent = async (eventId, reason = "") => {
    setActionLoading(eventId);
    try {
      await rejectEvent(eventId, user.id, reason);
      setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      setStats((prev) => ({
        ...prev,
        eventos: {
          ...prev.eventos,
          pendientes: prev.eventos.pendientes - 1,
          rechazados: prev.eventos.rechazados + 1,
        },
      }));
      return { success: true };
    } catch (err) {
      console.error("Error al rechazar:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  // Cambiar rol de usuario
  const handleRoleChange = async (targetUserId, newRole) => {
    setActionLoading(targetUserId);
    try {
      await updateUserRole(targetUserId, newRole, user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, rol: newRole } : u))
      );
      return { success: true };
    } catch (err) {
      console.error("Error al cambiar rol:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  // Banear usuario
  const handleBanUser = async (targetUserId, reason) => {
    setActionLoading(targetUserId);
    try {
      const banData = await banUser(targetUserId, user.id, reason);
      // Actualizar el estado local del usuario
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? { ...u, is_banned: true, ban_info: banData }
            : u
        )
      );
      return { success: true };
    } catch (err) {
      console.error("Error al banear usuario:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  // Desbanear usuario
  const handleUnbanUser = async (targetUserId, banId) => {
    setActionLoading(targetUserId);
    try {
      await unbanUser(banId, user.id);
      // Actualizar el estado local del usuario
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, is_banned: false, ban_info: null } : u
        )
      );
      return { success: true };
    } catch (err) {
      console.error("Error al desbanear usuario:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  return {
    // Estado
    pendingEvents,
    users,
    stats,
    chartData,
    loading,
    actionLoading,
    error,
    // Acciones
    loadData,
    handleApproveEvent,
    handleRejectEvent,
    handleRoleChange,
    handleBanUser,
    handleUnbanUser,
  };
};

export default useAdminData;
