import { useState, useEffect, useMemo } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { isInAppBrowser } from "../../lib/browserDetect";

const TERMS_CONSENT_KEY = "extrovertidos_terms_accepted";

export default function AuthModal({ isOpen, onClose, persistent = false }) {
  const { signInWithGooglePopup, showToast, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsentError, setHasConsentError] = useState(false);

  // Inicializar estado desde localStorage
  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    try {
      return localStorage.getItem(TERMS_CONSENT_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Sincronizar con localStorage cada vez que el modal se abre
  useEffect(() => {
    if (isOpen) {
      setHasConsentError(false);
      try {
        setAcceptedTerms(localStorage.getItem(TERMS_CONSENT_KEY) === "true");
      } catch (err) {
        console.warn("Error al leer consentimiento de localStorage:", err);
      }
    }
  }, [isOpen]);

  const handleTermsChange = (e) => {
    const isChecked = e.target.checked;
    setAcceptedTerms(isChecked);
    if (isChecked) {
      setHasConsentError(false);
    }
    try {
      if (isChecked) {
        localStorage.setItem(TERMS_CONSENT_KEY, "true");
        localStorage.setItem(`${TERMS_CONSENT_KEY}_at`, new Date().toISOString());
      } else {
        localStorage.removeItem(TERMS_CONSENT_KEY);
        localStorage.removeItem(`${TERMS_CONSENT_KEY}_at`);
      }
    } catch (err) {
      console.warn("Error al guardar consentimiento en localStorage:", err);
    }
  };

  // Detectar IAB una sola vez al montar.
  const inAppBrowser = useMemo(() => isInAppBrowser(), []);

  // Cerrar modal automáticamente al iniciar sesión
  useEffect(() => {
    if (user && isOpen) onClose();
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
    if (!acceptedTerms) {
      setHasConsentError(true);
      showToast(
        "Debes aceptar los Términos y Condiciones para continuar.",
        "warning",
      );
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signInWithGooglePopup();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        showToast("Error al iniciar sesión con Google. Intenta nuevamente.", "error");
      }
    } catch (err) {
      console.error("Error:", err);
      showToast("No fue posible iniciar sesión con Google. Intenta nuevamente.", "error");
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
          <button className="auth-modal__close" onClick={onClose} title="Volver al inicio">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        <div className="auth-modal__logo">
          <img src="/img/Logo_con_r_v3.png" alt="Extrovertidos" />
        </div>

        <h2 className="auth-modal__title">¡Bienvenido a Extrovertidos!</h2>
        <p className="auth-modal__subtitle">
          Inicia sesión para acceder a tu cuenta
        </p>

        {inAppBrowser ? (
          // ── Aviso para usuarios en navegador embebido (Instagram, Facebook, TikTok…) ──
          <div className="auth-modal__iab-notice" role="alert">
            <p className="auth-modal__iab-notice-text">
              Para iniciar sesión ingresa al sitio desde tu navegador principal Chrome o Safari
            </p>
            <a
              href="https://www.extrovertidos.cl"
              className="auth-modal__iab-link"
              target="_blank"
              rel="noopener noreferrer">
              www.extrovertidos.cl
            </a>
          </div>
        ) : (
          // ── Consentimiento y Botón estándar Google ──
          <>
            <div
              className={`auth-modal__consent${
                hasConsentError ? " auth-modal__consent--error" : ""
              }`}>
              <label className="auth-modal__consent-label">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={handleTermsChange}
                  className="auth-modal__consent-checkbox"
                />
                <span className="auth-modal__consent-text">
                  Acepto los{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}>
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}>
                    Política de Privacidad
                  </a>
                </span>
              </label>
              {hasConsentError && (
                <p className="auth-modal__consent-error-text">
                  * Debes marcar esta casilla para poder continuar
                </p>
              )}
            </div>

            <div className="auth-modal__google-wrapper">
              <button
                type="button"
                className={`auth-form__google-btn${
                  isLoading ? " auth-form__google-btn--disabled" : ""
                }${!acceptedTerms ? " auth-form__google-btn--unaccepted" : ""}`}
                onClick={handleGoogleLogin}
                disabled={isLoading}
                title={
                  !acceptedTerms
                    ? "Debes aceptar los Términos y Condiciones para continuar"
                    : ""
                }>
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
          </>
        )}
      </div>
    </div>
  );
}
