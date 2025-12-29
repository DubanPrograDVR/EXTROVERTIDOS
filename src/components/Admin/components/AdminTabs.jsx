import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Navegación por tabs del panel de administración
 */
export default function AdminTabs({
  activeTab,
  setActiveTab,
  pendingCount,
  isAdmin,
}) {
  return (
    <nav className="admin-tabs">
      <button
        className={`admin-tabs__btn ${
          activeTab === "dashboard" ? "active" : ""
        }`}
        onClick={() => setActiveTab("dashboard")}>
        <FontAwesomeIcon icon={faChartBar} />
        Dashboard
      </button>
      <button
        className={`admin-tabs__btn ${activeTab === "pending" ? "active" : ""}`}
        onClick={() => setActiveTab("pending")}>
        <FontAwesomeIcon icon={faClock} />
        Pendientes
        {pendingCount > 0 && (
          <span className="admin-tabs__badge">{pendingCount}</span>
        )}
      </button>
      {isAdmin && (
        <button
          className={`admin-tabs__btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}>
          <FontAwesomeIcon icon={faUsers} />
          Usuarios
        </button>
      )}
    </nav>
  );
}
