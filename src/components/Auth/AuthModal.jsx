import { useState, useEffect } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../context/AuthContext";

export default function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        alert("Error al iniciar sesión con Google. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal auth-modal--simple">
        <button className="auth-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="auth-modal__logo">
          <img src="/img/Logo_extrovertidos.png" alt="Extrovertidos" />
        </div>

        <h2 className="auth-modal__title">¡Bienvenido a Extrovertidos!</h2>
        <p className="auth-modal__subtitle">
          Inicia sesión para acceder a todas las funcionalidades
        </p>

        <button
          type="button"
          className="auth-form__google-btn"
          onClick={handleGoogleLogin}
          disabled={isLoading}>
          <FontAwesomeIcon icon={faGoogle} />
          {isLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <p className="auth-modal__terms">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
          <a href="#">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
