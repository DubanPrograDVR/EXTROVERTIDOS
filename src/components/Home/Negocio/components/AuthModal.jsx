import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../../../context/AuthContext";
import "../../../../components/Auth/styles/authModal.css";

/**
 * Modal de autenticación para publicar negocio
 */
const AuthModal = ({ isOpen, onClose }) => {
  const { signInWithGoogle, showToast } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        if (showToast) showToast("Error al iniciar sesión con Google", "error");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGoogleLoading(false);
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
          Para poder publicar tu negocio tienes que registrarte
        </p>

        <button
          className="auth-form__google-btn"
          onClick={handleGoogleLogin}
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

export default AuthModal;
