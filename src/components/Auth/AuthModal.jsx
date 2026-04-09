import { useState, useEffect, useRef } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../context/AuthContext";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  persistent = false,
}) {
  const { signInWithGoogle, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef(null);

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

  // Inicializar el botón invisible de Google cuando el modal se abre
  useEffect(() => {
    if (!isOpen || !window.google?.accounts?.id || !googleBtnRef.current)
      return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setIsLoading(true);
        try {
          const { error } = await signInWithGoogle(response.credential);
          if (error) {
            console.error("Error al iniciar sesión con Google:", error);
            alert("Error al iniciar sesión con Google. Intenta nuevamente.");
          }
        } catch (err) {
          console.error("Error:", err);
        } finally {
          setIsLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: "standard",
      size: "large",
      theme: "filled_black",
      text: "continue_with",
      shape: "rectangular",
      width: 320,
      locale: "es",
    });
  }, [isOpen, signInWithGoogle]);

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
          {/* Botón personalizado visible */}
          <div className="auth-form__google-btn" aria-hidden="true">
            {isLoading ? (
              <>
                <span className="auth-spinner" />
                Conectando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faGoogle} />
                Continuar con Google
              </>
            )}
          </div>
          {/* Botón real de Google invisible superpuesto */}
          <div ref={googleBtnRef} className="auth-modal__google-overlay" />
        </div>

        <p className="auth-modal__terms">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
          <a href="#">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
