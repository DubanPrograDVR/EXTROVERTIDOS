import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../../../context/AuthContext";

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
    <div className="publicar-negocio__auth-modal" onClick={onClose}>
      <div
        className="publicar-negocio__auth-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="publicar-negocio__auth-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h3>Inicia sesión para continuar</h3>
        <p>Necesitas una cuenta para publicar tu negocio</p>
        <button
          className="publicar-negocio__google-btn"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faGoogle} />
          )}
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
