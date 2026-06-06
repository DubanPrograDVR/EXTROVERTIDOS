import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  faHourglassHalf,
  faTimesCircle,
  faMapMarkerAlt,
  faCalendarAlt,
  faUser,
  faPause,
  faPlay,
  faCheckSquare,
  faSquare,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, formatDateTime } from "../utils/formatters";
import AdminDeleteConfirmModal from "./AdminDeleteConfirmModal";

const normalizeDateList = (dates) =>
  Array.from(
    new Set((Array.isArray(dates) ? dates : []).filter(Boolean)),
  ).sort();

const getInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const getScheduleInfo = (event) => {
  const recurrenceDates = normalizeDateList(event.fechas_recurrencia);

  if (event.es_recurrente && recurrenceDates.length > 0) {
    const firstDate = recurrenceDates[0];
    const lastDate = recurrenceDates[recurrenceDates.length - 1];
    return {
      type: "recurring",
      title: "Se repite",
      detail:
        firstDate && lastDate && firstDate !== lastDate
          ? `${recurrenceDates.length} fechas · ${formatDate(firstDate)} - ${formatDate(lastDate)}`
          : `${recurrenceDates.length} fecha${recurrenceDates.length > 1 ? "s" : ""}`,
    };
  }

  const startDate = event.fecha_evento;
  const endDate = event.fecha_fin;
  const isMultiDay = Boolean(
    startDate &&
    endDate &&
    endDate !== startDate &&
    (event.es_multidia || endDate > startDate),
  );

  if (isMultiDay) {
    const durationDays = getInclusiveDays(startDate, endDate);
    return {
      type: "range",
      title: `Dura ${durationDays} día${durationDays > 1 ? "s" : ""}`,
      detail: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    };
  }

  return {
    type: "single",
    title: "Un día",
    detail: startDate ? formatDate(startDate) : "Sin fecha definida",
  };
};

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
  onBulkDelete,
  onPause,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  // Selección individual
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Seleccionar/deseleccionar todos los filtrados
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  // Eliminar seleccionados
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await onDelete(id);
      }
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirm(false);
    }
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
      en_revision: {
        icon: faHourglassHalf,
        label: "En revisión",
        className: "admin-status--review",
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

  const renderScheduleCell = (event) => {
    const schedule = getScheduleInfo(event);

    return (
      <div className="admin-schedule-cell">
        <span
          className={`admin-schedule-badge admin-schedule-badge--${schedule.type}`}>
          <FontAwesomeIcon icon={faCalendarAlt} />
          {schedule.title}
        </span>
        <span className="admin-schedule-cell__detail">{schedule.detail}</span>
      </div>
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
            <option value="en_revision">En revisión</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Barra de selección masiva */}
      {selectedIds.size > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-bar__count">
            {selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}
          </span>
          <button
            className="admin-bulk-bar__btn admin-bulk-bar__btn--delete"
            onClick={() => setBulkDeleteConfirm(true)}
            disabled={bulkDeleting}>
            <FontAwesomeIcon icon={faTrash} />
            Eliminar seleccionados
          </button>
          <button
            className="admin-bulk-bar__btn admin-bulk-bar__btn--cancel"
            onClick={() => setSelectedIds(new Set())}>
            Cancelar selección
          </button>
        </div>
      )}

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
                  <th className="admin-th-checkbox">
                    <button
                      className="admin-select-btn"
                      onClick={toggleSelectAll}
                      title={
                        selectedIds.size === filteredEvents.length
                          ? "Deseleccionar todos"
                          : "Seleccionar todos"
                      }>
                      <FontAwesomeIcon
                        icon={
                          selectedIds.size === filteredEvents.length &&
                          filteredEvents.length > 0
                            ? faCheckSquare
                            : faSquare
                        }
                      />
                    </button>
                  </th>
                  <th>Publicación</th>
                  <th>Autor</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Fecha Evento</th>
                  <th>Duración</th>
                  <th>Creado</th>
                  <th className="admin-cell--actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={
                      selectedIds.has(event.id) ? "admin-row--selected" : ""
                    }>
                    <td className="admin-td-checkbox">
                      <button
                        className="admin-select-btn"
                        onClick={() => toggleSelect(event.id)}>
                        <FontAwesomeIcon
                          icon={
                            selectedIds.has(event.id) ? faCheckSquare : faSquare
                          }
                        />
                      </button>
                    </td>
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
                    <td className="admin-cell--location">
                      {event.comuna}
                      {event.provincia ? `, ${event.provincia}` : ""}
                    </td>
                    <td className="admin-cell--status">
                      {getStatusBadge(event.estado)}
                    </td>
                    <td className="admin-cell--date">
                      {formatDate(event.fecha_evento)}
                    </td>
                    <td className="admin-cell--schedule">
                      {renderScheduleCell(event)}
                    </td>
                    <td className="admin-cell--date">
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className="admin-cell--actions">
                      <div className="admin-publications__actions">
                        {event.estado === "publicado" && (
                          <button
                            className="admin-pub-btn admin-pub-btn--goto"
                            onClick={() =>
                              navigate(`/panoramas?highlight=${event.id}`)
                            }
                            title="Ir a Panoramas">
                            <FontAwesomeIcon icon={faLocationArrow} />
                          </button>
                        )}
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
                        {onPause && (
                          <button
                            className={`admin-pub-btn ${
                              event.is_paused
                                ? "admin-pub-btn--unpause"
                                : "admin-pub-btn--pause"
                            }`}
                            onClick={() => onPause(event.id, !event.is_paused)}
                            disabled={actionLoading === event.id}
                            title={
                              event.is_paused
                                ? "Reactivar publicación"
                                : "Pausar publicación"
                            }>
                            <FontAwesomeIcon
                              icon={event.is_paused ? faPlay : faPause}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Barra de "Seleccionar todos" solo en móvil */}
          <div className="admin-mobile-select-all">
            <button
              type="button"
              className="admin-mobile-select-all__btn"
              onClick={toggleSelectAll}>
              <FontAwesomeIcon
                icon={
                  selectedIds.size === filteredEvents.length &&
                  filteredEvents.length > 0
                    ? faCheckSquare
                    : faSquare
                }
              />
              {selectedIds.size === filteredEvents.length &&
              filteredEvents.length > 0
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          {/* Vista de cards - Móvil */}
          <div className="admin-publications__mobile-list">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`admin-pub-mobile-card ${selectedIds.has(event.id) ? "admin-row--selected" : ""}`}>
                <button
                  className="admin-select-btn admin-select-btn--mobile"
                  onClick={() => toggleSelect(event.id)}>
                  <FontAwesomeIcon
                    icon={selectedIds.has(event.id) ? faCheckSquare : faSquare}
                  />
                </button>
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
                    <div className="admin-pub-mobile-card__schedule">
                      {renderScheduleCell(event)}
                    </div>
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
                      {event.estado === "publicado" && (
                        <button
                          className="admin-pub-btn admin-pub-btn--goto"
                          onClick={() =>
                            navigate(`/panoramas?highlight=${event.id}`)
                          }
                          title="Ir">
                          <FontAwesomeIcon icon={faLocationArrow} />
                        </button>
                      )}
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
                      {onPause && (
                        <button
                          className={`admin-pub-btn ${
                            event.is_paused
                              ? "admin-pub-btn--unpause"
                              : "admin-pub-btn--pause"
                          }`}
                          onClick={() => onPause(event.id, !event.is_paused)}
                          disabled={actionLoading === event.id}
                          title={event.is_paused ? "Reactivar" : "Pausar"}>
                          <FontAwesomeIcon
                            icon={event.is_paused ? faPlay : faPause}
                          />
                        </button>
                      )}
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
        <AdminDeleteConfirmModal
          title="¿Eliminar publicación?"
          itemName={deleteConfirm.titulo}
          itemType="publicación"
          loading={actionLoading === deleteConfirm.id}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
      {/* Modal de confirmación de eliminación masiva */}
      {bulkDeleteConfirm && (
        <div
          className="admin-delete-modal-overlay"
          onClick={() => setBulkDeleteConfirm(false)}>
          <div
            className="admin-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar {selectedIds.size} publicaciones?</h3>
            <p>
              Estás a punto de eliminar{" "}
              <strong>{selectedIds.size} publicaciones</strong>. Esta acción no
              se puede deshacer.
            </p>
            <div className="admin-delete-modal__actions">
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--cancel"
                onClick={() => setBulkDeleteConfirm(false)}>
                Cancelar
              </button>
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--confirm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}>
                {bulkDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Eliminando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} /> Eliminar{" "}
                    {selectedIds.size}
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
