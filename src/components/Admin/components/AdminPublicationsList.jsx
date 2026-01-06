import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faSpinner,
  faCheckCircle,
  faClock,
  faTimesCircle,
  faMapMarkerAlt,
  faCalendarAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/formatters";

/**
 * Lista de todas las publicaciones para administración
 */
export default function AdminPublicationsList({
  events,
  loading,
  actionLoading,
  onView,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filtrar eventos
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.profiles?.nombre
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      event.comuna?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || event.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Confirmar eliminación
  const handleDeleteClick = (event) => {
    setDeleteConfirm(event);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // Obtener badge de estado
  const getStatusBadge = (estado) => {
    const statusConfig = {
      publicado: {
        icon: faCheckCircle,
        label: "Publicado",
        className: "admin-status--published",
      },
      pendiente: {
        icon: faClock,
        label: "Pendiente",
        className: "admin-status--pending",
      },
      rechazado: {
        icon: faTimesCircle,
        label: "Rechazado",
        className: "admin-status--rejected",
      },
    };

    const config = statusConfig[estado] || statusConfig.pendiente;

    return (
      <span className={`admin-status-badge ${config.className}`}>
        <FontAwesomeIcon icon={config.icon} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-publications">
        <h2>Gestión de Publicaciones</h2>
        <div className="admin-publications__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-publications">
      <div className="admin-publications__header">
        <h2>Gestión de Publicaciones</h2>
        <span className="admin-publications__count">
          {filteredEvents.length} de {events.length} publicaciones
        </span>
      </div>

      {/* Filtros */}
      <div className="admin-publications__filters">
        <div className="admin-publications__search">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Buscar por título, autor o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-publications__filter">
          <FontAwesomeIcon icon={faFilter} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="pendiente">Pendientes</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filteredEvents.length === 0 ? (
        <div className="admin-publications__empty">
          <p>No se encontraron publicaciones</p>
        </div>
      ) : (
        <>
          {/* Tabla de publicaciones - Desktop */}
          <div className="admin-publications__table-wrapper">
            <table className="admin-publications__table">
              <thead>
                <tr>
                  <th>Publicación</th>
                  <th>Autor</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Fecha Evento</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="admin-pub-cell">
                        <img
                          src={
                            Array.isArray(event.imagenes) && event.imagenes[0]
                              ? event.imagenes[0]
                              : "/img/Home1.png"
                          }
                          alt={event.titulo}
                          onError={(e) => {
                            e.target.src = "/img/Home1.png";
                          }}
                        />
                        <div>
                          <span className="admin-pub-cell__title">
                            {event.titulo}
                          </span>
                          <span className="admin-pub-cell__category">
                            {event.categories?.nombre || "Sin categoría"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-pub-author">
                        <img
                          src={
                            event.profiles?.avatar_url ||
                            "/img/default-avatar.png"
                          }
                          alt={event.profiles?.nombre}
                        />
                        <span>{event.profiles?.nombre || "Sin autor"}</span>
                      </div>
                    </td>
                    <td>
                      {event.comuna}
                      {event.provincia ? `, ${event.provincia}` : ""}
                    </td>
                    <td>{getStatusBadge(event.estado)}</td>
                    <td>{formatDate(event.fecha_evento)}</td>
                    <td>{formatDate(event.created_at)}</td>
                    <td>
                      <div className="admin-publications__actions">
                        <button
                          className="admin-pub-btn admin-pub-btn--view"
                          onClick={() => onView(event.id)}
                          title="Ver publicación">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          className="admin-pub-btn admin-pub-btn--edit"
                          onClick={() => onEdit(event.id)}
                          title="Editar publicación">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="admin-pub-btn admin-pub-btn--delete"
                          onClick={() => handleDeleteClick(event)}
                          disabled={actionLoading === event.id}
                          title="Eliminar publicación">
                          {actionLoading === event.id ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faTrash} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de cards - Móvil */}
          <div className="admin-publications__mobile-list">
            {filteredEvents.map((event) => (
              <div key={event.id} className="admin-pub-mobile-card">
                <img
                  className="admin-pub-mobile-card__image"
                  src={
                    Array.isArray(event.imagenes) && event.imagenes[0]
                      ? event.imagenes[0]
                      : "/img/Home1.png"
                  }
                  alt={event.titulo}
                  onError={(e) => {
                    e.target.src = "/img/Home1.png";
                  }}
                />
                <div className="admin-pub-mobile-card__content">
                  <div className="admin-pub-mobile-card__header">
                    <h3 className="admin-pub-mobile-card__title">
                      {event.titulo}
                    </h3>
                    <span className="admin-pub-mobile-card__category">
                      {event.categories?.nombre || "Sin categoría"}
                    </span>
                  </div>

                  <div className="admin-pub-mobile-card__meta">
                    <span>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {event.comuna}
                      {event.provincia ? `, ${event.provincia}` : ""}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {formatDate(event.fecha_evento)}
                    </span>
                  </div>

                  <div className="admin-pub-mobile-card__author">
                    <img
                      src={
                        event.profiles?.avatar_url || "/img/default-avatar.png"
                      }
                      alt={event.profiles?.nombre}
                    />
                    <div className="admin-pub-mobile-card__author-info">
                      <span className="admin-pub-mobile-card__author-name">
                        {event.profiles?.nombre || "Sin autor"}
                      </span>
                      <span className="admin-pub-mobile-card__author-date">
                        Creado: {formatDate(event.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-pub-mobile-card__footer">
                    {getStatusBadge(event.estado)}
                    <div className="admin-pub-mobile-card__actions">
                      <button
                        className="admin-pub-btn admin-pub-btn--view"
                        onClick={() => onView(event.id)}
                        title="Ver">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        className="admin-pub-btn admin-pub-btn--edit"
                        onClick={() => onEdit(event.id)}
                        title="Editar">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="admin-pub-btn admin-pub-btn--delete"
                        onClick={() => handleDeleteClick(event)}
                        disabled={actionLoading === event.id}
                        title="Eliminar">
                        {actionLoading === event.id ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faTrash} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div
          className="admin-delete-modal-overlay"
          onClick={handleDeleteCancel}>
          <div
            className="admin-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar publicación?</h3>
            <p>
              Estás a punto de eliminar{" "}
              <strong>"{deleteConfirm.titulo}"</strong>. Esta acción no se puede
              deshacer.
            </p>
            <div className="admin-delete-modal__actions">
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--cancel"
                onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--confirm"
                onClick={handleDeleteConfirm}
                disabled={actionLoading === deleteConfirm.id}>
                {actionLoading === deleteConfirm.id ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Eliminando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
