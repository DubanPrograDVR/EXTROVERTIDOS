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
      // ✅ OPTIMIZADO: Ejecutar todas las consultas en paralelo
      const defaultStats = {
        eventos: { pendientes: 0, publicados: 0, rechazados: 0 },
        negocios: { pendientes: 0 },
        usuarios: { total: 0 },
      };

      // Definir todas las promesas base
      const basePromises = [
        getPendingEvents(user.id).catch((err) => {
          console.warn("Error al cargar eventos pendientes:", err);
          return [];
        }),
        getAdminStats(user.id).catch((err) => {
          console.warn("Error al cargar estadísticas:", err);
          return defaultStats;
        }),
        getEventsPerDay(user.id).catch((err) => {
          console.warn("Error al cargar eventos por día:", err);
          return [];
        }),
        getUsersPerDay(user.id).catch((err) => {
          console.warn("Error al cargar usuarios por día:", err);
          return [];
        }),
      ];

      // Si es admin, agregar la consulta de usuarios
      if (isAdmin) {
        basePromises.push(
          getAllUsersWithBanStatus(user.id).catch((err) => {
            console.warn("Error al cargar usuarios:", err);
            // Fallback a la función antigua
            return getAllUsers(user.id).catch(() => []);
          })
        );
      }

      // Ejecutar todas en paralelo
      const results = await Promise.all(basePromises);

      // Extraer resultados
      const [
        eventsData,
        statsData,
        eventsPerDayData,
        usersPerDayData,
        usersData,
      ] = results;

      // Actualizar estados una sola vez
      setPendingEvents(eventsData || []);
      setStats(statsData || defaultStats);
      setChartData({
        eventsPerDay: eventsPerDayData || [],
        usersPerDay: usersPerDayData || [],
      });

      if (isAdmin) {
        setUsers(usersData || []);
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
