import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";
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

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/share/18g6zk79dP/?mibextid=wwXIfr",
    icon: faFacebook,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/extrovertidos.cl?igsh=ejFqOTlic2ptbTFz&utm_source=qr",
    icon: faInstagram,
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@extrovertidos.cl?_r=1&_t=ZS-98VNLdEWCXQ",
    icon: faTiktok,
  },
];

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
      aria-label="Estamos mejorando la experiencia de Extrovertidos">
      <div className="welcome-splash__backdrop" />
      <div className="welcome-splash__content">
        <img
          src="/img/Logo_con_r_v3.png"
          alt="Extrovertidos"
          className="welcome-splash__logo"
          draggable="false"
        />
        <h1 className="welcome-splash__title">
          ¡Estamos mejorando la experiencia de{" "}
          <span className="welcome-splash__title-emphasis">Extrovertidos</span>!
        </h1>
        <p className="welcome-splash__social-note">
          Síguenos en todas nuestras redes sociales
        </p>
        <div className="welcome-splash__social">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="welcome-splash__social-link"
              aria-label={social.name}
              title={social.name}>
              <FontAwesomeIcon icon={social.icon} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WelcomeSplash;
