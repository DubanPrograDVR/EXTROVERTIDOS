import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCheck,
  faTimes,
  faUsers,
  faExclamationTriangle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Dashboard con estadísticas generales
 */
export default function AdminDashboard({ stats, onViewPending }) {
  if (!stats) return null;

  return (
    <div className="admin-dashboard">
      <h2>Resumen General</h2>

      {/* Tarjetas de estadísticas */}
      <div className="admin-stats">
        <StatCard
          icon={faClock}
          number={stats.eventos.pendientes}
          label="Eventos Pendientes"
          variant="warning"
        />
        <StatCard
          icon={faCheck}
          number={stats.eventos.publicados}
          label="Eventos Publicados"
          variant="success"
        />
        <StatCard
          icon={faTimes}
          number={stats.eventos.rechazados}
          label="Eventos Rechazados"
          variant="danger"
        />
        <StatCard
          icon={faUsers}
          number={stats.usuarios.total}
          label="Usuarios Registrados"
          variant="info"
        />
      </div>

      {/* Accesos rápidos */}
      {stats.eventos.pendientes > 0 && (
        <div className="admin-quick-actions">
          <h3>Acciones Rápidas</h3>
          <button className="admin-quick-action" onClick={onViewPending}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>
              Tienes {stats.eventos.pendientes} publicaciones esperando
              aprobación
            </span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de tarjeta de estadística individual
 */
function StatCard({ icon, number, label, variant }) {
  return (
    <div className={`admin-stat-card admin-stat-card--${variant}`}>
      <div className="admin-stat-card__icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="admin-stat-card__info">
        <span className="admin-stat-card__number">{number}</span>
        <span className="admin-stat-card__label">{label}</span>
      </div>
    </div>
  );
}
