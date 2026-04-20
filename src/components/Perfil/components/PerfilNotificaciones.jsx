import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faExclamationCircle,
  faTimes,
  faInfoCircle,
  faTrash,
  faSpinner,
  faEye,
  faCheckSquare,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import { faSquare } from "@fortawesome/free-regular-svg-icons";
import { getEventById } from "../../../lib/database";
import PublicationModal from "../../Superguia/PublicationModal";
import "./styles/section.css";
import "./styles/notificaciones.css";

export default function PerfilNotificaciones({
  notifications,
  unreadCount,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteMultiple,
}) {
  const [viewModal, setViewModal] = useState({
    open: false,
    publication: null,
  });
  const [loadingEvent, setLoadingEvent] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const isApproved = (notification) =>
    notification.type === "success" ||
    notification.rawType === "publication_approved";

  const handleGoTo = (e, notification) => {
    e.stopPropagation();
    if (notification.businessId) {
      navigate(`/superguia?highlight=${notification.businessId}`);
    } else if (notification.eventId) {
      navigate(`/panoramas?highlight=${notification.eventId}`);
    }
  };

  const allSelected =
    notifications.length > 0 && selectedIds.size === notifications.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    try {
      await onDeleteMultiple([...selectedIds]);
      setSelectedIds(new Set());
    } finally {
      setDeleting(false);
    }
  };

  // Ver publicación asociada a la notificación
  const handleViewPublication = async (e, notification) => {
    e.stopPropagation(); // No marcar como leída al hacer clic en el botón

    if (!notification.eventId) return;

    setLoadingEvent(notification.id);
    try {
      const event = await getEventById(notification.eventId);
      if (event) {
        setViewModal({ open: true, publication: event });
      }
    } catch (error) {
      console.error("Error al cargar publicación:", error);
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleCloseView = () => {
    setViewModal({ open: false, publication: null });
  };
  // Formatear fecha relativa
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Justo ahora";
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

  // Estado de carga
  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Notificaciones</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Notificaciones</h2>
        <div className="perfil-section__header-actions">
          {selectedIds.size > 0 && (
            <button
              className="perfil-section__btn perfil-section__btn--danger"
              onClick={handleDeleteSelected}
              disabled={deleting}>
              <FontAwesomeIcon
                icon={deleting ? faSpinner : faTrash}
                spin={deleting}
              />
              Eliminar ({selectedIds.size})
            </button>
          )}
          {unreadCount > 0 && (
            <button
              className="perfil-section__btn perfil-section__btn--secondary"
              onClick={onMarkAllAsRead}>
              <FontAwesomeIcon icon={faCheck} />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faBell} />
          <h3>No tienes notificaciones</h3>
          <p>Aquí aparecerán las actualizaciones de tus publicaciones</p>
        </div>
      ) : (
        <div className="perfil-notifications">
          <div className="perfil-notifications__select-all">
            <button
              className="perfil-notification__checkbox"
              onClick={toggleSelectAll}
              title={allSelected ? "Deseleccionar todas" : "Seleccionar todas"}>
              <FontAwesomeIcon icon={allSelected ? faCheckSquare : faSquare} />
            </button>
            <span className="perfil-notifications__select-label">
              {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
            </span>
          </div>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`perfil-notification ${notification.type} ${
                notification.read ? "read" : "unread"
              } ${selectedIds.has(notification.id) ? "selected" : ""}`}
              onClick={() => onMarkAsRead(notification.id)}>
              <button
                className="perfil-notification__checkbox"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(notification.id);
                }}
                title="Seleccionar">
                <FontAwesomeIcon
                  icon={
                    selectedIds.has(notification.id) ? faCheckSquare : faSquare
                  }
                />
              </button>
              <div className={`perfil-notification__icon ${notification.type}`}>
                <FontAwesomeIcon
                  icon={getNotificationIcon(notification.type)}
                />
              </div>
              <div className="perfil-notification__content">
                <h4 className="perfil-notification__title">
                  {notification.title}
                  {!notification.read && (
                    <span className="perfil-notification__new">Nuevo</span>
                  )}
                </h4>
                <p className="perfil-notification__message">
                  {notification.message}
                </p>
                <span className="perfil-notification__date">
                  {formatRelativeDate(notification.date)}
                </span>
              </div>
              <div className="perfil-notification__actions">
                {isApproved(notification) &&
                  (notification.eventId || notification.businessId) && (
                    <button
                      type="button"
                      className="perfil-notification__goto"
                      onClick={(e) => handleGoTo(e, notification)}
                      title={
                        notification.businessId
                          ? "Ver en Superguía"
                          : "Ver en Panoramas"
                      }>
                      <FontAwesomeIcon icon={faLocationArrow} />
                      Ir
                    </button>
                  )}
                {notification.eventId && (
                  <button
                    className="perfil-notification__view"
                    onClick={(e) => handleViewPublication(e, notification)}
                    disabled={loadingEvent === notification.id}
                    title="Ver publicación">
                    <FontAwesomeIcon
                      icon={
                        loadingEvent === notification.id ? faSpinner : faEye
                      }
                      spin={loadingEvent === notification.id}
                    />
                  </button>
                )}
                <button
                  className="perfil-notification__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de vista previa de publicación */}
      <PublicationModal
        publication={viewModal.publication}
        isOpen={viewModal.open}
        onClose={handleCloseView}
      />
    </div>
  );
}
