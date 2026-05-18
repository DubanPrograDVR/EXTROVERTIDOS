import { useEffect } from "react";
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

const WelcomeSplash = () => {
  const { user, loading } = useAuth();
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const isExcludedPath =
    currentPath === ACCESS_ROUTE || currentPath.startsWith("/auth/callback");
  const shouldShow = SPLASH_ENABLED && !loading && !user && !isExcludedPath;

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
          src="/img/Logo_con_r_v2.png"
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
      </div>
    </div>,
    document.body,
  );
};

export default WelcomeSplash;
