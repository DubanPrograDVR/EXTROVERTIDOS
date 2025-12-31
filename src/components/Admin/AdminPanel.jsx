import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClock,
  faUsers,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

// Componentes modulares
import AdminDashboard from "./components/AdminDashboard";
import AdminPendingList from "./components/AdminPendingList";
import AdminUserList from "./components/AdminUserList";
import AdminRejectModal from "./components/AdminRejectModal";
import AdminBanModal from "./components/AdminBanModal";
import AdminLoading from "./components/AdminLoading";

// Custom hook para manejo de datos
import { useAdminData } from "./hooks/useAdminData";

// Estilos
import "./styles/admin.css";

/**
 * Panel de Administración Principal
 * Componente con sidebar para navegación
 */
export default function AdminPanel() {
  const { user, isAdmin, isModerator, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estado local para UI
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    eventId: null,
  });
  const [banModal, setBanModal] = useState({
    open: false,
    user: null,
  });

  // Hook personalizado para manejo de datos
  const {
    pendingEvents,
    users,
    stats,
    chartData,
    loading,
    actionLoading,
    loadData,
    handleApproveEvent,
    handleRejectEvent,
    handleRoleChange,
    handleBanUser,
    handleUnbanUser,
  } = useAdminData(user, isAdmin, isModerator);

  // Verificar acceso - redirigir si no es moderador/admin
  useEffect(() => {
    if (!authLoading && !isModerator) {
      navigate("/");
    }
  }, [authLoading, isModerator, navigate]);

  // Manejar aprobación de evento
  const onApprove = async (eventId) => {
    await handleApproveEvent(eventId);
  };

  // Manejar rechazo de evento (abrir modal)
  const onRejectClick = (eventId) => {
    setRejectModal({ open: true, eventId });
  };

  // Confirmar rechazo de evento
  const onRejectConfirm = async (reason) => {
    if (!rejectModal.eventId) return;
    await handleRejectEvent(rejectModal.eventId, reason);
    setRejectModal({ open: false, eventId: null });
  };

  // Cerrar modal de rechazo
  const onRejectCancel = () => {
    setRejectModal({ open: false, eventId: null });
  };

  // Abrir modal de baneo
  const onBanClick = (userToBan) => {
    setBanModal({ open: true, user: userToBan });
  };

  // Confirmar baneo
  const onBanConfirm = async (reason) => {
    if (!banModal.user) return;
    const result = await handleBanUser(banModal.user.id, reason);
    if (result.success) {
      setBanModal({ open: false, user: null });
    }
    return result;
  };

  // Cerrar modal de baneo
  const onBanCancel = () => {
    setBanModal({ open: false, user: null });
  };

  // Desbanear usuario
  const onUnbanClick = async (userToUnban) => {
    if (!userToUnban.ban_info?.id) return;
    if (
      window.confirm(
        `¿Estás seguro de restaurar a ${
          userToUnban.nombre || userToUnban.email
        }?`
      )
    ) {
      await handleUnbanUser(userToUnban.id, userToUnban.ban_info.id);
    }
  };

  // Cambiar tab y cerrar sidebar en móvil
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Estados de carga
  if (authLoading || loading) {
    return <AdminLoading message="Cargando panel de administración..." />;
  }

  // Si no tiene permisos, no renderizar nada
  if (!isModerator) {
    return null;
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: faChartLine,
      show: true,
    },
    {
      id: "pending",
      label: "Pendientes",
      icon: faClock,
      badge: stats?.eventos?.pendientes || 0,
      show: true,
    },
    {
      id: "users",
      label: "Usuarios",
      icon: faUsers,
      show: isAdmin,
    },
  ];

  return (
    <div className="admin-layout">
      {/* Botón hamburguesa móvil */}
      <button
        className={`admin-layout__mobile-toggle ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
        onClick={() => setSidebarOpen(!sidebarOpen)}>
        <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="admin-layout__overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <img src="/img/logo-extrovertidos.png" alt="Extrovertidos" />
          <span>Admin</span>
        </div>

        {/* Navegación */}
        <nav className="admin-sidebar__nav">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.id}
                className={`admin-sidebar__item ${
                  activeTab === item.id ? "active" : ""
                }`}
                onClick={() => handleTabChange(item.id)}>
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="admin-sidebar__badge">{item.badge}</span>
                )}
              </button>
            ))}
        </nav>

        {/* Info usuario */}
        <div className="admin-sidebar__user">
          <img
            src={user?.user_metadata?.avatar_url || "/img/default-avatar.png"}
            alt="Avatar"
          />
          <div>
            <p>{user?.user_metadata?.full_name || "Admin"}</p>
            <span>{isAdmin ? "Administrador" : "Moderador"}</span>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="admin-main">
        {/* Dashboard con estadísticas */}
        {activeTab === "dashboard" && stats && (
          <AdminDashboard
            stats={stats}
            chartData={chartData}
            onViewPending={() => setActiveTab("pending")}
          />
        )}

        {/* Lista de publicaciones pendientes */}
        {activeTab === "pending" && (
          <AdminPendingList
            events={pendingEvents}
            actionLoading={actionLoading}
            onApprove={onApprove}
            onReject={onRejectClick}
          />
        )}

        {/* Gestión de usuarios (solo admin) */}
        {activeTab === "users" && isAdmin && (
          <AdminUserList
            users={users}
            currentUserId={user?.id}
            actionLoading={actionLoading}
            onRoleChange={handleRoleChange}
            onBanClick={onBanClick}
            onUnbanClick={onUnbanClick}
          />
        )}
      </main>

      {/* Modal de rechazo */}
      <AdminRejectModal
        isOpen={rejectModal.open}
        isLoading={actionLoading === rejectModal.eventId}
        onConfirm={onRejectConfirm}
        onClose={onRejectCancel}
      />

      {/* Modal de baneo */}
      <AdminBanModal
        isOpen={banModal.open}
        user={banModal.user}
        onConfirm={onBanConfirm}
        onCancel={onBanCancel}
        loading={actionLoading === banModal.user?.id}
      />
    </div>
  );
}
