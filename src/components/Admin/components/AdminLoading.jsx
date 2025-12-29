import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente de carga para el panel de administración
 */
export default function AdminLoading({ message = "Cargando..." }) {
  return (
    <div className="admin-loading">
      <FontAwesomeIcon icon={faSpinner} spin className="admin-loading__icon" />
      <p className="admin-loading__text">{message}</p>
    </div>
  );
}
