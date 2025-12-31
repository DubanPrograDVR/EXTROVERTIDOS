import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faExclamationCircle,
  faTimes,
  faInfoCircle,
  faTrash,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/section.css";
import "./styles/notificaciones.css";

export default function PerfilNotificaciones({
  notifications,
  unreadCount,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) {
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
        {unreadCount > 0 && (
          <button
            className="perfil-section__btn perfil-section__btn--secondary"
            onClick={onMarkAllAsRead}>
            <FontAwesomeIcon icon={faCheck} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faBell} />
          <h3>No tienes notificaciones</h3>
          <p>Aquí aparecerán las actualizaciones de tus publicaciones</p>
        </div>
      ) : (
        <div className="perfil-notifications">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`perfil-notification ${notification.type} ${
                notification.read ? "read" : "unread"
              }`}
              onClick={() => onMarkAsRead(notification.id)}>
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
              <button
                className="perfil-notification__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
