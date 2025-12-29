import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Componentes modulares
import AdminHeader from "./components/AdminHeader";
import AdminTabs from "./components/AdminTabs";
import AdminDashboard from "./components/AdminDashboard";
import AdminPendingList from "./components/AdminPendingList";
import AdminUserList from "./components/AdminUserList";
import AdminRejectModal from "./components/AdminRejectModal";
import AdminLoading from "./components/AdminLoading";

// Custom hook para manejo de datos
import { useAdminData } from "./hooks/useAdminData";

// Estilos
import "./styles/admin.css";

/**
 * Panel de Administración Principal
 * Componente orquestador que coordina todos los módulos del panel de admin
 */
export default function AdminPanel() {
  const { user, isAdmin, isModerator, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estado local para UI
  const [activeTab, setActiveTab] = useState("dashboard");
  const [rejectModal, setRejectModal] = useState({
    open: false,
    eventId: null,
  });

  // Hook personalizado para manejo de datos
  const {
    pendingEvents,
    users,
    stats,
    loading,
    actionLoading,
    loadData,
    handleApproveEvent,
    handleRejectEvent,
    handleRoleChange,
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

  // Estados de carga
  if (authLoading || loading) {
    return <AdminLoading message="Cargando panel de administración..." />;
  }

  // Si no tiene permisos, no renderizar nada
  if (!isModerator) {
    return null;
  }

  return (
    <div className="admin-page">
      {/* Header del panel */}
      <AdminHeader />

      {/* Navegación por tabs */}
      <AdminTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={stats?.eventos?.pendientes || 0}
        isAdmin={isAdmin}
      />

      {/* Contenido principal */}
      <main className="admin-content">
        {/* Dashboard con estadísticas */}
        {activeTab === "dashboard" && stats && (
          <AdminDashboard
            stats={stats}
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
    </div>
  );
}
