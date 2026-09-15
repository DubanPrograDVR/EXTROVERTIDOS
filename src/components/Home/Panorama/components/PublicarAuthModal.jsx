import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../../../../context/AuthContext";
import "../../../../components/Auth/styles/authModal.css";

const TERMS_CONSENT_KEY = "extrovertidos_terms_accepted";

/**
 * Modal de autenticación para usuarios no registrados
 * Usa redirect OAuth en lugar de popup GIS para mayor fiabilidad
 */
const PublicarAuthModal = ({ isOpen, onClose }) => {
  const { signInWithGooglePopup, showToast } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
          src="/img/Logo_con_r_v3.png"
          alt="Extrovertidos"
          className="auth-modal__logo"
        />

        <h2 className="auth-modal__title">¡Regístrate para publicar!</h2>
        <p className="auth-modal__message">
          Para poder crear una publicación tienes que registrarte
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
    </div>
  );
};

export default PublicarAuthModal;

