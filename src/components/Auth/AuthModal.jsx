import { useState, useEffect } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../context/AuthContext";

export default function AuthModal({ isOpen, onClose, persistent = false }) {
  const { signInWithGooglePopup, showToast, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Cerrar modal automáticamente al iniciar sesión
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  useEffect(() => {
    if (persistent) return;
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, persistent]);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await signInWithGooglePopup();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        showToast(
          "Error al iniciar sesión con Google. Intenta nuevamente.",
          "error",
        );
      }
    } catch (err) {
      console.error("Error:", err);
      showToast(
        "No fue posible iniciar sesión con Google. Intenta nuevamente.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => !persistent && e.target === e.currentTarget && onClose()}>
      <div
        className="auth-modal auth-modal--simple"
        role="dialog"
        aria-modal="true"
        aria-label="Autenticación">
        {!persistent && (
          <button className="auth-modal__close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
        {persistent && onClose && (
          <button
            className="auth-modal__close"
            onClick={onClose}
            title="Volver al inicio">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        <div className="auth-modal__logo">
          <img src="/img/Logo_con_r.png" alt="Extrovertidos" />
        </div>

        <h2 className="auth-modal__title">¡Bienvenido a Extrovertidos!</h2>
        <p className="auth-modal__subtitle">
          Inicia sesión para acceder a todas las funcionalidades
        </p>

        <div className="auth-modal__google-wrapper">
          <button
            type="button"
            className={`auth-form__google-btn${isLoading ? " auth-form__google-btn--disabled" : ""}`}
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
        </div>

        <p className="auth-modal__terms">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
          <a href="#">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
