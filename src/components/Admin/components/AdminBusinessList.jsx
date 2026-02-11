import { useState } from "react";
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
  onView,
  showActions = true, // Para diferenciar entre pendientes y todos
  title = "Negocios",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
      case "rechazado":
        return "Rechazado";
      default:
        return estado;
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
            <option value="publicado">Publicados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Lista de negocios */}
      {filteredBusinesses.length === 0 ? (
        <div className="admin-empty">
          <FontAwesomeIcon icon={faStore} />
          <h3>No hay negocios</h3>
          <p>No se encontraron negocios con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
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
                  <tr key={business.id}>
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
                        {/* Ver */}
                        {onView && (
                          <button
                            className="admin-table__action admin-table__action--view"
                            onClick={() => onView(business.id)}
                            title="Ver negocio">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        )}

                        {/* Aprobar (solo para pendientes) */}
                        {showActions && business.estado === "pendiente" && (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil - Cards */}
          <div className="admin-business__mobile-list">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="admin-biz-mobile-card">
                <div className="admin-biz-mobile-card__header">
                  <div className="admin-biz-mobile-card__image">
                    {business.imagen_url || business.logo_url ? (
                      <img
                        src={business.imagen_url || business.logo_url}
                        alt={business.nombre}
                      />
                    ) : (
                      <div className="admin-biz-mobile-card__placeholder">
                        <FontAwesomeIcon icon={faStore} />
                      </div>
                    )}
                  </div>
                  <div className="admin-biz-mobile-card__info">
                    <span className="admin-biz-mobile-card__name">
                      {business.nombre}
                    </span>
                    <span className="admin-biz-mobile-card__category">
                      {business.categoria || "Sin categoría"}
                    </span>
                    <span
                      className={`admin-table__status ${getStatusClass(
                        business.estado,
                      )}`}>
                      {getStatusText(business.estado)}
                    </span>
                  </div>
                </div>

                <div className="admin-biz-mobile-card__details">
                  <div className="admin-biz-mobile-card__detail">
                    <span className="admin-biz-mobile-card__detail-label">
                      Propietario
                    </span>
                    <span className="admin-biz-mobile-card__detail-value">
                      {business.profiles?.nombre || "Desconocido"}
                    </span>
                  </div>
                  <div className="admin-biz-mobile-card__detail">
                    <span className="admin-biz-mobile-card__detail-label">
                      Ubicación
                    </span>
                    <span className="admin-biz-mobile-card__detail-value">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
                      {business.comuna}
                      {business.provincia && `, ${business.provincia}`}
                    </span>
                  </div>
                  <div className="admin-biz-mobile-card__detail">
                    <span className="admin-biz-mobile-card__detail-label">
                      Creado
                    </span>
                    <span className="admin-biz-mobile-card__detail-value">
                      {formatDate(business.created_at)}
                    </span>
                  </div>
                </div>

                <div className="admin-biz-mobile-card__actions">
                  {onView && (
                    <button
                      className="admin-biz-mobile-card__btn admin-biz-mobile-card__btn--view"
                      onClick={() => onView(business.id)}>
                      <FontAwesomeIcon icon={faEye} /> Ver
                    </button>
                  )}
                  {showActions && business.estado === "pendiente" && (
                    <>
                      <button
                        className="admin-biz-mobile-card__btn admin-biz-mobile-card__btn--approve"
                        onClick={() => onApprove(business.id)}
                        disabled={actionLoading === business.id}>
                        <FontAwesomeIcon icon={faCheck} /> Aprobar
                      </button>
                      <button
                        className="admin-biz-mobile-card__btn admin-biz-mobile-card__btn--reject"
                        onClick={() => onReject(business.id)}
                        disabled={actionLoading === business.id}>
                        <FontAwesomeIcon icon={faTimes} /> Rechazar
                      </button>
                    </>
                  )}
                  {onDelete && (
                    <button
                      className="admin-biz-mobile-card__btn admin-biz-mobile-card__btn--delete"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar el negocio "${business.nombre}"?`,
                          )
                        ) {
                          onDelete(business.id);
                        }
                      }}
                      disabled={actionLoading === business.id}>
                      <FontAwesomeIcon icon={faTrash} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
