import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/formatters";

/**
 * Lista de publicaciones pendientes de aprobación
 */
export default function AdminPendingList({
  events,
  actionLoading,
  onApprove,
  onReject,
  onView,
}) {
  return (
    <div className="admin-pending">
      <h2>Publicaciones Pendientes de Aprobación</h2>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="admin-pending__list">
          {events.map((event) => (
            <PendingCard
              key={event.id}
              event={event}
              isLoading={actionLoading === event.id}
              onApprove={() => onApprove(event.id)}
              onReject={() => onReject(event.id)}
              onView={() => onView?.(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Estado vacío cuando no hay publicaciones pendientes
 */
function EmptyState() {
  return (
    <div className="admin-empty">
      <FontAwesomeIcon icon={faCheck} />
      <h3>¡Todo al día!</h3>
      <p>No hay publicaciones pendientes de revisar</p>
    </div>
  );
}

/**
 * Tarjeta individual de publicación pendiente
 */
function PendingCard({ event, isLoading, onApprove, onReject, onView }) {
  // Obtener la primera imagen del array o usar placeholder
  const imageUrl =
    Array.isArray(event.imagenes) && event.imagenes.length > 0
      ? event.imagenes[0]
      : "/img/Home1.png";

  return (
    <article className="admin-pending-card">
      {/* Imagen */}
      <div className="admin-pending-card__image">
        <img
          src={imageUrl}
          alt={event.titulo}
          onError={(e) => {
            e.target.src = "/img/Home1.png";
          }}
        />
      </div>

      {/* Contenido */}
      <div className="admin-pending-card__content">
        <div className="admin-pending-card__header">
          <span className="admin-pending-card__category">
            {event.categories?.nombre || "Sin categoría"}
          </span>
          <span className="admin-pending-card__date">
            {formatDate(event.created_at)}
          </span>
        </div>

        <h3 className="admin-pending-card__title">{event.titulo}</h3>

        <p className="admin-pending-card__description">
          {event.descripcion?.slice(0, 150)}...
        </p>

        <div className="admin-pending-card__meta">
          <span>
            📍 {event.comuna}, {event.provincia}
          </span>
          <span>📅 {formatDate(event.fecha_evento)}</span>
        </div>

        {/* Información del autor */}
        <div className="admin-pending-card__author">
          <img
            src={event.profiles?.avatar_url || "/img/default-avatar.png"}
            alt={event.profiles?.nombre}
          />
          <div>
            <span>{event.profiles?.nombre}</span>
            <span>{event.profiles?.email}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="admin-pending-card__actions">
        <button
          className="admin-pending-card__btn admin-pending-card__btn--view"
          onClick={onView}
          title="Ver detalle">
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button
          className="admin-pending-card__btn admin-pending-card__btn--approve"
          onClick={onApprove}
          disabled={isLoading}
          title="Aprobar">
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faCheck} />
          )}
        </button>
        <button
          className="admin-pending-card__btn admin-pending-card__btn--reject"
          onClick={onReject}
          disabled={isLoading}
          title="Rechazar">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </article>
  );
}
