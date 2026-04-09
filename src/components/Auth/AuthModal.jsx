import { useState, useEffect, useRef } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../context/AuthContext";

const GOOGLE_GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_GSI_TIMEOUT_MS = 10000;
const GOOGLE_GSI_POLL_INTERVAL_MS = 250;

export default function AuthModal({ isOpen, onClose, persistent = false }) {
  const { signInWithGoogle, showToast, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState("idle");
  const [googleLoadAttempt, setGoogleLoadAttempt] = useState(0);
  const googleBtnRef = useRef(null);

  const retryGoogleButtonLoad = () => {
    if (isLoading) return;
    setGoogleStatus("idle");
    setGoogleLoadAttempt((attempt) => attempt + 1);
  };

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

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!isOpen) {
      setGoogleStatus("idle");
      return;
    }

    if (!clientId) {
      setGoogleStatus("missing-config");
      return;
    }

    if (window.google?.accounts?.id) {
      setGoogleStatus("ready");
      return;
    }

    setGoogleStatus("loading");

    let isCancelled = false;
    let pollTimer = null;

    const existingScript = document.querySelector(
      `script[src="${GOOGLE_GSI_SCRIPT_SRC}"]`,
    );
    const script = existingScript || document.createElement("script");

    if (!existingScript) {
      script.src = GOOGLE_GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const markReady = () => {
      if (isCancelled || !window.google?.accounts?.id) return false;
      setGoogleStatus("ready");
      return true;
    };

    const handleError = () => {
      if (!isCancelled) {
        setGoogleStatus("error");
      }
    };

    const startPolling = () => {
      const startedAt = Date.now();

      const pollUntilReady = () => {
        if (isCancelled || markReady()) return;

        if (Date.now() - startedAt >= GOOGLE_GSI_TIMEOUT_MS) {
          setGoogleStatus("error");
          return;
        }

        pollTimer = window.setTimeout(
          pollUntilReady,
          GOOGLE_GSI_POLL_INTERVAL_MS,
        );
      };

      pollUntilReady();
    };

    script.addEventListener("load", markReady);
    script.addEventListener("error", handleError);

    if (!markReady()) {
      startPolling();
    }

    return () => {
      isCancelled = true;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
      script.removeEventListener("load", markReady);
      script.removeEventListener("error", handleError);
    };
  }, [isOpen, googleLoadAttempt]);

  // Inicializar el botón invisible de Google cuando GIS ya está disponible
  useEffect(() => {
    if (googleStatus !== "ready" || !isOpen || !googleBtnRef.current) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleIdentity = window.google?.accounts?.id;
    const buttonContainer = googleBtnRef.current;

    if (!clientId || !googleIdentity || !buttonContainer) return;

    buttonContainer.innerHTML = "";

    googleIdentity.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response?.credential) {
          showToast(
            "Google no devolvió una credencial válida. Intenta nuevamente.",
            "error",
          );
          return;
        }

        setIsLoading(true);
        try {
          const { error } = await signInWithGoogle(response.credential);
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
      },
    });

    googleIdentity.renderButton(buttonContainer, {
      type: "standard",
      size: "large",
      theme: "filled_black",
      text: "continue_with",
      shape: "rectangular",
      width: 320,
      locale: "es",
    });

    return () => {
      buttonContainer.innerHTML = "";
    };
  }, [googleStatus, isOpen, showToast, signInWithGoogle]);

  if (!isOpen) return null;

  const isGoogleLoading = googleStatus === "loading";
  const canRetryGoogle = googleStatus === "error";
  const isGoogleUnavailable = googleStatus === "missing-config";
  const isGoogleReady = googleStatus === "ready";

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
          {canRetryGoogle ? (
            <button
              type="button"
              className="auth-form__google-btn auth-form__google-btn--retry"
              onClick={retryGoogleButtonLoad}>
              <FontAwesomeIcon icon={faGoogle} />
              Reintentar con Google
            </button>
          ) : (
            <div
              className={`auth-form__google-btn${
                isLoading || isGoogleLoading || isGoogleUnavailable
                  ? " auth-form__google-btn--disabled"
                  : ""
              }`}
              aria-hidden="true">
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  Conectando...
                </>
              ) : isGoogleLoading ? (
                <>
                  <span className="auth-spinner" />
                  Cargando acceso con Google...
                </>
              ) : isGoogleUnavailable ? (
                <>
                  <FontAwesomeIcon icon={faGoogle} />
                  Google no disponible
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGoogle} />
                  Continuar con Google
                </>
              )}
            </div>
          )}

          {isGoogleReady && (
            <div ref={googleBtnRef} className="auth-modal__google-overlay" />
          )}
        </div>

        <p className="auth-modal__terms">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
          <a href="#">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
