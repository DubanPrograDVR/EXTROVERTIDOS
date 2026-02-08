import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

/**
 * Modal de autenticación para usuarios no registrados
 */
const PublicarAuthModal = ({
  isOpen,
  onClose,
  onGoogleLogin,
  isGoogleLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal auth-modal--simple"
        role="dialog"
        aria-modal="true"
        aria-label="Iniciar sesión"
        onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <img
          src="/img/Logo_extrovertidos.png"
          alt="Extrovertidos"
          className="auth-modal__logo"
        />

        <h2 className="auth-modal__title">¡Regístrate para publicar!</h2>
        <p className="auth-modal__message">
          Para poder crear una publicación tienes que registrarte
        </p>

        <button
          className="auth-form__google-btn"
          onClick={onGoogleLogin}
          disabled={isGoogleLoading}>
          <FontAwesomeIcon icon={faGoogle} />
          {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <p className="auth-modal__terms">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
          <a href="#">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
};

export default PublicarAuthModal;
