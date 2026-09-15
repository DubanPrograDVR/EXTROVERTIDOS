import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../../../context/AuthContext";
import "../../../../components/Auth/styles/authModal.css";

const TERMS_CONSENT_KEY = "extrovertidos_terms_accepted";

/**
 * Modal de autenticación para publicar negocio
 */
const AuthModal = ({ isOpen, onClose }) => {
  const { signInWithGoogle, showToast } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasConsentError, setHasConsentError] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    try {
      return localStorage.getItem(TERMS_CONSENT_KEY) === "true";
    } catch {
      return false;
    }
  });

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

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    if (!acceptedTerms) {
      setHasConsentError(true);
      if (showToast) {
        showToast(
          "Debes aceptar los Términos y Condiciones para continuar.",
          "warning",
        );
      }
      return;
    }
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

        <div className="auth-modal__logo">
          <img src="/img/Logo_con_r_v3.png" alt="Extrovertidos" />
        </div>

        <h2 className="auth-modal__title">¡Regístrate para publicar!</h2>
        <p className="auth-modal__message">
          Para poder publicar tu negocio tienes que registrarte
        </p>

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

        <button
          className={`auth-form__google-btn${
            isGoogleLoading ? " auth-form__google-btn--disabled" : ""
          }${!acceptedTerms ? " auth-form__google-btn--unaccepted" : ""}`}
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          title={
            !acceptedTerms
              ? "Debes aceptar los Términos y Condiciones para continuar"
              : ""
          }>
          <FontAwesomeIcon icon={faGoogle} />
          {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;

