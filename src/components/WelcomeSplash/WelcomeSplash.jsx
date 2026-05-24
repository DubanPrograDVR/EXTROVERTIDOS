import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import "./WelcomeSplash.css";

/**
 * Splash principal para usuarios no autenticados.
 *
 * - Se muestra cuando SPLASH_ENABLED = true y no existe sesión activa.
 * - Usuarios autenticados entran normalmente al sitio, paneles y rutas privadas.
 * - ACCESS_ROUTE queda libre para que el cliente pueda iniciar sesión.
 *
 * Desactivar el splash globalmente (sitio abierto a todos):
 *   SPLASH_ENABLED = false
 */
export const SPLASH_ENABLED = true;
export const ACCESS_ROUTE = "/acceso-extra";
const SPLASH_RELEASE_AT = "2026-05-25T20:00:00-04:00";

const getCountdown = () => {
  const releaseAt = new Date(SPLASH_RELEASE_AT).getTime();
  const remainingMs = Math.max(0, releaseAt - Date.now());
  const totalSeconds = Math.ceil(remainingMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: totalSeconds <= 0,
  };
};

const padTime = (value) => String(value).padStart(2, "0");

const WelcomeSplash = () => {
  const { user, loading } = useAuth();
  const [countdown, setCountdown] = useState(getCountdown);
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const isExcludedPath =
    currentPath === ACCESS_ROUTE || currentPath.startsWith("/auth/callback");
  const shouldShow =
    SPLASH_ENABLED &&
    !countdown.isComplete &&
    !loading &&
    !user &&
    !isExcludedPath;

  useEffect(() => {
    if (!SPLASH_ENABLED || countdown.isComplete) return undefined;

    const timerId = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [countdown.isComplete]);

  useEffect(() => {
    if (!shouldShow) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return createPortal(
    <div
      className="welcome-splash"
      role="dialog"
      aria-modal="true"
      aria-label="Algo EXTRA grande está por venir">
      <div className="welcome-splash__backdrop" />
      <div className="welcome-splash__content">
        <img
          src="/img/Logo_con_r_v3.png"
          alt="Extrovertidos"
          className="welcome-splash__logo"
          draggable="false"
        />
        <h1
          className="welcome-splash__title"
          aria-label="¡Algo Extra grande está por venir!">
          ¡Algo <span className="welcome-splash__title-emphasis">Extra</span>{" "}
          grande está por venir!
        </h1>
        <div
          className="welcome-splash__countdown"
          aria-label={`Cuenta regresiva: ${countdown.days} días, ${countdown.hours} horas, ${countdown.minutes} minutos y ${countdown.seconds} segundos`}>
          <span className="welcome-splash__countdown-item">
            <strong>{padTime(countdown.days)}</strong>
            <span>Días</span>
          </span>
          <span className="welcome-splash__countdown-item">
            <strong>{padTime(countdown.hours)}</strong>
            <span>Horas</span>
          </span>
          <span className="welcome-splash__countdown-item">
            <strong>{padTime(countdown.minutes)}</strong>
            <span>Min</span>
          </span>
          <span className="welcome-splash__countdown-item">
            <strong>{padTime(countdown.seconds)}</strong>
            <span>Seg</span>
          </span>
        </div>
        <p className="welcome-splash__release-note">
          Lunes 25 de mayo · 20:00 hrs · Región del Maule
        </p>
      </div>
    </div>,
    document.body,
  );
};

export default WelcomeSplash;
