import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faCheck,
  faTimes,
  faTrash,
  faEye,
  faSearch,
  faMapMarkerAlt,
  faClock,
  faPhone,
  faPencil,
  faPause,
  faPlay,
  faCheckSquare,
  faSquare,
  faSpinner,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Lista de negocios para el panel de administración
 */
export default function AdminBusinessList({
  businesses = [],
  loading = false,
  actionLoading = null,
  onApprove,
  onReject,
  onDelete,
  onPause,
  onView,
  onEdit,
  showActions = true,
  title = "Negocios",
  emptyMessage,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Filtrar negocios
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.comuna?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.profiles?.nombre
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || business.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Obtener clase de estado
  const getStatusClass = (estado) => {
    switch (estado) {
      case "publicado":
        return "status--published";
      case "pendiente":
        return "status--pending";
      case "en_revision":
        return "status--review";
      case "rechazado":
        return "status--rejected";
      default:
        return "";
    }
  };

  // Obtener texto de estado
  const getStatusText = (estado) => {
    switch (estado) {
      case "publicado":
        return "Publicado";
      case "pendiente":
        return "Pendiente";
      case "en_revision":
        return "En revisión";
      case "rechazado":
        return "Rechazado";
      default:
        return estado;
    }
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
    if (selectedIds.size === filteredBusinesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBusinesses.map((b) => b.id)));
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

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-section__header">
          <h2>{title}</h2>
        </div>
        <div className="admin-loading-inline">
          <div className="admin-loading-inline__spinner"></div>
          <p>Cargando negocios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2>{title}</h2>
        <span className="admin-section__count">
          {filteredBusinesses.length} de {businesses.length} negocios
        </span>
      </div>

      {/* Filtros */}
      <div className="admin-filters">
        <div className="admin-filters__search">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filters__select">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En revisión</option>
            <option value="publicado">Publicados</option>
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

      {/* Lista de negocios */}
      {filteredBusinesses.length === 0 ? (
        <div className="admin-empty">
          <FontAwesomeIcon icon={faStore} />
          <h3>{emptyMessage || "No hay negocios"}</h3>
          <p>No se encontraron negocios con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th-checkbox">
                    <button
                      className="admin-select-btn"
                      onClick={toggleSelectAll}
                      title={
                        selectedIds.size === filteredBusinesses.length
                          ? "Deseleccionar todos"
                          : "Seleccionar todos"
                      }>
                      <FontAwesomeIcon
                        icon={
                          selectedIds.size === filteredBusinesses.length &&
                          filteredBusinesses.length > 0
                            ? faCheckSquare
                            : faSquare
                        }
                      />
                    </button>
                  </th>
                  <th>Negocio</th>
                  <th>Propietario</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr
                    key={business.id}
                    className={
                      selectedIds.has(business.id) ? "admin-row--selected" : ""
                    }>
                    <td className="admin-td-checkbox">
                      <button
                        className="admin-select-btn"
                        onClick={() => toggleSelect(business.id)}>
                        <FontAwesomeIcon
                          icon={
                            selectedIds.has(business.id)
                              ? faCheckSquare
                              : faSquare
                          }
                        />
                      </button>
                    </td>
                    {/* Negocio */}
                    <td>
                      <div className="admin-table__business">
                        <div className="admin-table__business-image">
                          {business.imagen_url || business.logo_url ? (
                            <img
                              src={business.imagen_url || business.logo_url}
                              alt={business.nombre}
                            />
                          ) : (
                            <div className="admin-table__business-placeholder">
                              <FontAwesomeIcon icon={faStore} />
                            </div>
                          )}
                        </div>
                        <div className="admin-table__business-info">
                          <span className="admin-table__business-name">
                            {business.nombre}
                          </span>
                          <span className="admin-table__business-category">
                            {business.categoria || "Sin categoría"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Propietario */}
                    <td>
                      <div className="admin-table__user">
                        {business.profiles?.avatar_url ? (
                          <img
                            src={business.profiles.avatar_url}
                            alt={business.profiles.nombre}
                          />
                        ) : (
                          <div className="admin-table__user-placeholder">
                            {business.profiles?.nombre?.charAt(0) || "?"}
                          </div>
                        )}
                        <span>
                          {business.profiles?.nombre || "Desconocido"}
                        </span>
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td>
                      <div className="admin-table__location">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span>
                          {business.comuna}, {business.provincia}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <span
                        className={`admin-table__status ${getStatusClass(
                          business.estado,
                        )}`}>
                        {getStatusText(business.estado)}
                      </span>
                    </td>

                    {/* Fecha de creación */}
                    <td>{formatDate(business.created_at)}</td>

                    {/* Acciones */}
                    <td>
                      <div className="admin-table__actions">
                        {/* Ir (solo publicados) */}
                        {business.estado === "publicado" && (
                          <button
                            className="admin-table__action admin-table__action--goto"
                            onClick={() =>
                              navigate(`/superguia?highlight=${business.id}`)
                            }
                            title="Ir a Superguía">
                            <FontAwesomeIcon icon={faLocationArrow} />
                          </button>
                        )}
                        {/* Ver */}
                        {onView && (
                          <button
                            className="admin-table__action admin-table__action--view"
                            onClick={() => onView(business.id)}
                            title="Ver negocio">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        )}

                        {/* Editar */}
                        {onEdit && (
                          <button
                            className="admin-table__action admin-table__action--edit"
                            onClick={() => onEdit(business.id)}
                            title="Editar negocio">
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                        )}

                        {/* Aprobar (pendientes o en revisión) */}
                        {showActions &&
                          (business.estado === "pendiente" ||
                            business.estado === "en_revision") && (
                            <>
                              <button
                                className="admin-table__action admin-table__action--approve"
                                onClick={() => onApprove(business.id)}
                                disabled={actionLoading === business.id}
                                title="Aprobar negocio">
                                <FontAwesomeIcon icon={faCheck} />
                              </button>

                              <button
                                className="admin-table__action admin-table__action--reject"
                                onClick={() => onReject(business.id)}
                                disabled={actionLoading === business.id}
                                title="Rechazar negocio">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </>
                          )}

                        {/* Eliminar */}
                        {onDelete && (
                          <button
                            className="admin-table__action admin-table__action--delete"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar el negocio "${business.nombre}"?`,
                                )
                              ) {
                                onDelete(business.id);
                              }
                            }}
                            disabled={actionLoading === business.id}
                            title="Eliminar negocio">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}

                        {/* Pausar/Reactivar */}
                        {onPause && (
                          <button
                            className={`admin-table__action ${
                              business.is_paused
                                ? "admin-table__action--approve"
                                : "admin-table__action--pause"
                            }`}
                            onClick={() =>
                              onPause(business.id, !business.is_paused)
                            }
                            disabled={actionLoading === business.id}
                            title={
                              business.is_paused
                                ? "Reactivar negocio"
                                : "Pausar negocio"
                            }>
                            <FontAwesomeIcon
                              icon={business.is_paused ? faPlay : faPause}
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
                  selectedIds.size === filteredBusinesses.length &&
                  filteredBusinesses.length > 0
                    ? faCheckSquare
                    : faSquare
                }
              />
              {selectedIds.size === filteredBusinesses.length &&
              filteredBusinesses.length > 0
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          {/* Vista móvil - Cards */}
          <div className="admin-business__mobile-list">
            {filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className={`admin-pub-mobile-card ${selectedIds.has(business.id) ? "admin-row--selected" : ""}`}>
                <button
                  className="admin-select-btn admin-select-btn--mobile"
                  onClick={() => toggleSelect(business.id)}>
                  <FontAwesomeIcon
                    icon={
                      selectedIds.has(business.id) ? faCheckSquare : faSquare
                    }
                  />
                </button>
                {business.imagen_url || business.logo_url ? (
                  <img
                    className="admin-pub-mobile-card__image"
                    src={business.imagen_url || business.logo_url}
                    alt={business.nombre}
                    onError={(e) => {
                      e.target.src = "/img/Home2.png";
                    }}
                  />
                ) : (
                  <div className="admin-pub-mobile-card__image admin-pub-mobile-card__image--placeholder">
                    <FontAwesomeIcon icon={faStore} />
                  </div>
                )}
                <div className="admin-pub-mobile-card__content">
                  <div className="admin-pub-mobile-card__header">
                    <h3 className="admin-pub-mobile-card__title">
                      {business.nombre}
                    </h3>
                    <span className="admin-pub-mobile-card__category">
                      {business.categoria || "Sin categoría"}
                    </span>
                  </div>

                  <div className="admin-pub-mobile-card__meta">
                    <span>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {business.comuna}
                      {business.provincia ? `, ${business.provincia}` : ""}
                    </span>
                  </div>

                  <div className="admin-pub-mobile-card__author">
                    {business.profiles?.avatar_url ? (
                      <img
                        src={business.profiles.avatar_url}
                        alt={business.profiles.nombre}
                      />
                    ) : (
                      <div className="admin-table__user-placeholder">
                        {business.profiles?.nombre?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="admin-pub-mobile-card__author-info">
                      <span className="admin-pub-mobile-card__author-name">
                        {business.profiles?.nombre || "Desconocido"}
                      </span>
                      <span className="admin-pub-mobile-card__author-date">
                        Creado: {formatDate(business.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-pub-mobile-card__footer">
                    <span
                      className={`admin-table__status ${getStatusClass(
                        business.estado,
                      )}`}>
                      {getStatusText(business.estado)}
                    </span>
                    <div className="admin-pub-mobile-card__actions">
                      {business.estado === "publicado" && (
                        <button
                          className="admin-pub-btn admin-pub-btn--goto"
                          onClick={() =>
                            navigate(`/superguia?highlight=${business.id}`)
                          }
                          title="Ir">
                          <FontAwesomeIcon icon={faLocationArrow} />
                        </button>
                      )}
                      {onView && (
                        <button
                          className="admin-pub-btn admin-pub-btn--view"
                          onClick={() => onView(business.id)}
                          title="Ver">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className="admin-pub-btn admin-pub-btn--edit"
                          onClick={() => onEdit(business.id)}
                          title="Editar">
                          <FontAwesomeIcon icon={faPencil} />
                        </button>
                      )}
                      {showActions &&
                        (business.estado === "pendiente" ||
                          business.estado === "en_revision") && (
                          <>
                            <button
                              className="admin-pub-btn admin-pub-btn--approve"
                              onClick={() => onApprove(business.id)}
                              disabled={actionLoading === business.id}
                              title="Aprobar">
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className="admin-pub-btn admin-pub-btn--reject"
                              onClick={() => onReject(business.id)}
                              disabled={actionLoading === business.id}
                              title="Rechazar">
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </>
                        )}
                      {onDelete && (
                        <button
                          className="admin-pub-btn admin-pub-btn--delete"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar el negocio "${business.nombre}"?`,
                              )
                            ) {
                              onDelete(business.id);
                            }
                          }}
                          disabled={actionLoading === business.id}
                          title="Eliminar">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                      {onPause && (
                        <button
                          className={`admin-pub-btn ${
                            business.is_paused
                              ? "admin-pub-btn--unpause"
                              : "admin-pub-btn--pause"
                          }`}
                          onClick={() =>
                            onPause(business.id, !business.is_paused)
                          }
                          disabled={actionLoading === business.id}
                          title={business.is_paused ? "Reactivar" : "Pausar"}>
                          <FontAwesomeIcon
                            icon={business.is_paused ? faPlay : faPause}
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

      {/* Modal de confirmación de eliminación masiva */}
      {bulkDeleteConfirm && (
        <div
          className="admin-delete-modal-overlay"
          onClick={() => setBulkDeleteConfirm(false)}>
          <div
            className="admin-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar {selectedIds.size} negocios?</h3>
            <p>
              Estás a punto de eliminar{" "}
              <strong>{selectedIds.size} negocios</strong>. Esta acción no se
              puede deshacer.
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
