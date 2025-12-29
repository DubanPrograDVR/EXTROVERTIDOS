import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente de error para el panel de administración
 */
export default function AdminError({ message, onRetry }) {
  return (
    <div className="admin-error">
      <FontAwesomeIcon
        icon={faExclamationTriangle}
        className="admin-error__icon"
      />
      <p className="admin-error__text">{message}</p>
      {onRetry && (
        <button className="admin-error__btn" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
