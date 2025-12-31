import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/banned-user-card.css";

/**
 * Tarjeta que se muestra cuando un usuario baneado intenta iniciar sesión
 * @param {Object} props
 * @param {string} props.reason - Motivo del baneo
 * @param {string} props.bannedAt - Fecha del baneo
 * @param {function} props.onClose - Función para cerrar/aceptar
 */
export default function BannedUserCard({ reason, bannedAt, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="banned-overlay">
      <div className="banned-card">
        {/* Logo */}
        <div className="banned-card__logo">
          <img src="/img/Logo_extrovertidos.png" alt="Extrovertidos" />
        </div>

        {/* Icono de advertencia */}
        <div className="banned-card__icon">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>

        {/* Título */}
        <h2 className="banned-card__title">Cuenta Suspendida</h2>

        {/* Descripción */}
        <p className="banned-card__description">
          Tu cuenta ha sido suspendida por no respetar las normas de la
          comunidad.
        </p>

        {/* Motivo del baneo */}
        <div className="banned-card__reason">
          <span className="banned-card__reason-label">Motivo:</span>
          <p className="banned-card__reason-text">"{reason}"</p>
          {bannedAt && (
            <span className="banned-card__date">
              Fecha de suspensión: {formatDate(bannedAt)}
            </span>
          )}
        </div>

        {/* Información adicional */}
        <p className="banned-card__info">
          Tu cuenta podrá ser restaurada cuando el administrador revise tu
          situación.
        </p>

        {/* Contacto */}
        <div className="banned-card__contact">
          <p>Si crees que esto es un error, contáctanos en:</p>
          <a
            href="mailto:atencion@extrovertidos.cl"
            className="banned-card__email">
            <FontAwesomeIcon icon={faEnvelope} />
            atencion@extrovertidos.cl
          </a>
        </div>

        {/* Botón */}
        <button className="banned-card__button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
