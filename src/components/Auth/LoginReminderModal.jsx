import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faHourglassHalf,
  faBoltLightning,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/loginReminderModal.css";

export default function LoginReminderModal({ isOpen, onClose, data, onVerPerfil, onActivarPlan }) {

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !data) return null;

  const { diasRestantes, expired } = data;

  const handleVerPerfil = () => {
    onVerPerfil?.();
    onClose();
  };

  const handleActivarPlan = () => {
    onActivarPlan?.();
    onClose();
  };

  return (
    <div
      className="login-reminder-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={
        expired
          ? "Tu publicacion ha expirado"
          : `Tu publicacion termina en ${diasRestantes} dias`
      }>
      <div className="login-reminder-card">
        <button
          className="login-reminder-card__close"
          onClick={onClose}
          title="Cerrar">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="login-reminder-card__logo">
          <img src="/img/Logo_con_r_v3.png" alt="Extrovertidos" />
        </div>

        {expired ? (
          <>
            <div className="login-reminder-card__icon login-reminder-card__icon--expired">
              <img src="/img/SG_Extro_v2.png" alt="Superguía" className="login-reminder-card__sg-icon" />
            </div>
            <h2 className="login-reminder-card__title">
              Tu Publicación de Negocio en la superguía ha terminado
            </h2>
            <p className="login-reminder-card__subtitle">
              Renueva tu plan ahora
            </p>
            <p className="login-reminder-card__message">
              Muchos te siguen buscando día a día
            </p>
            <p className="login-reminder-card__tagline">
              ¡Encontrarte aquí es más fácil!
            </p>
            <p className="login-reminder-card__brand">Extrovertidos</p>
            <button
              className="login-reminder-card__btn login-reminder-card__btn--expired"
              onClick={handleActivarPlan}>
              <FontAwesomeIcon icon={faBoltLightning} />
              Activar Plan
            </button>
          </>
        ) : (
          <>
            <div className="login-reminder-card__icon login-reminder-card__icon--warning">
              <FontAwesomeIcon icon={faHourglassHalf} />
            </div>
            <h2 className="login-reminder-card__title">
              Tu Publicación de Negocio en la super guía termina en{" "}
              {diasRestantes} día{diasRestantes !== 1 ? "s" : ""}
            </h2>
            <p className="login-reminder-card__tagline">
              ¡Encontrarte aquí es más fácil!
            </p>
            <p className="login-reminder-card__brand">Extrovertidos</p>
            <button
              className="login-reminder-card__btn login-reminder-card__btn--warning"
              onClick={handleVerPerfil}>
              <FontAwesomeIcon icon={faUser} />
              Ver perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
