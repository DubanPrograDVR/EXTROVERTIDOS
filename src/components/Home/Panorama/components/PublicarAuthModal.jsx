import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../../../context/AuthContext";

/**
 * Modal de autenticación para usuarios no registrados
 * Usa redirect OAuth en lugar de popup GIS para mayor fiabilidad
 */
const PublicarAuthModal = ({ isOpen, onClose }) => {
  const { signInWithGooglePopup, showToast } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await signInWithGooglePopup();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        showToast("Error al iniciar sesión con Google", "error");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
          src="/img/Logo_con_r.png"
          alt="Extrovertidos"
          className="auth-modal__logo"
        />

        <h2 className="auth-modal__title">¡Regístrate para publicar!</h2>
        <p className="auth-modal__message">
          Para poder crear una publicación tienes que registrarte
        </p>

        <button
          className="auth-form__google-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              Conectando con Google...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faGoogle} />
              Continuar con Google
            </>
          )}
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
