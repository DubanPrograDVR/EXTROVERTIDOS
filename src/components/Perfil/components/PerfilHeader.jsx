import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
  faShieldAlt,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { MAX_DIAS_CREACION } from "../../../lib/planRules";
import "./styles/header.css";

const ROLE_CONFIG = {
  admin: {
    label: "Administrador",
    icon: faShieldAlt,
    className: "perfil-header__role-badge--admin",
  },
  moderator: {
    label: "Moderador",
    icon: faUserShield,
    className: "perfil-header__role-badge--moderator",
  },
};

const PLAN_LABELS = {
  panorama_unica: "Publicación Única",
  panorama_pack4: "Pack 4 Publicaciones",
  panorama_ilimitado: "Publica Sin Límite",
  superguia: "Superguia Extrovertidos",
};

const PLAN_ICONS = {
  panorama_unica: "/img/P_Extro.png",
  panorama_pack4: "/img/P_Extro.png",
  panorama_ilimitado: "/img/P_Extro.png",
  superguia: "/img/SG_Extro.png",
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysLeftToPublish(sub) {
  if (!sub?.fecha_inicio) return null;
  const start = new Date(sub.fecha_inicio);
  if (Number.isNaN(start.getTime())) return null;
  const elapsed = Math.floor((Date.now() - start.getTime()) / MS_PER_DAY);
  return Math.max(MAX_DIAS_CREACION - elapsed, 0);
}

function formatShortDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getQuotaInfo(sub) {
  if (!sub) return null;

  const used = Number(sub.publicaciones_usadas ?? 0);

  if (sub.plan === "panorama_ilimitado") {
    return {
      used,
      total: "∞",
      label: "panoramas",
    };
  }

  if (sub.plan === "superguia") {
    const total = Math.max(Number(sub.publicaciones_total ?? 0), 1);
    return {
      used,
      total,
      label: total === 1 ? "negocio" : "negocios",
    };
  }

  const total = Number(sub.publicaciones_total ?? 0);
  return {
    used,
    total,
    label: total === 1 ? "panorama" : "panoramas",
  };
}

export default function PerfilHeader({
  userAvatar,
  userName,
  userEmail,
  createdAt,
  userRole,
  onSignOut,
  planesEnabled = false,
  activeSubscriptions = [],
}) {
  const roleConfig = ROLE_CONFIG[userRole];

  return (
    <header
      className={`perfil-header ${roleConfig ? "perfil-header--staff" : ""}`}>
      <div
        className={`perfil-header__background ${roleConfig ? "perfil-header__background--staff" : ""}`}></div>
      <div className="perfil-header__content">
        <div className="perfil-header__avatar-wrapper">
          <img
            src={userAvatar}
            alt={userName}
            className="perfil-header__avatar"
            referrerPolicy="no-referrer"
          />
          {roleConfig && (
            <span
              className={`perfil-header__avatar-badge ${roleConfig.className}`}>
              <FontAwesomeIcon icon={roleConfig.icon} />
            </span>
          )}
        </div>
        <div className="perfil-header__info">
          <div className="perfil-header__name-row">
            <h1 className="perfil-header__name">{userName}</h1>
            {roleConfig && (
              <span
                className={`perfil-header__role-badge ${roleConfig.className}`}>
                <FontAwesomeIcon icon={roleConfig.icon} />
                {roleConfig.label}
              </span>
            )}
          </div>
          <p className="perfil-header__email">
            <FontAwesomeIcon icon={faEnvelope} />
            {userEmail}
          </p>
          <p className="perfil-header__date">
            <FontAwesomeIcon icon={faCalendarAlt} />
            Miembro desde {createdAt}
          </p>
        </div>
        <div className="perfil-header__actions">
          {planesEnabled && activeSubscriptions.length > 0 && (
            <div className="perfil-header__plans">
              {activeSubscriptions.map((sub) => {
                const daysLeft = getDaysLeftToPublish(sub);
                const expiry = formatShortDate(sub.fecha_fin);
                const isSuperguia = sub.plan === "superguia";
                const quota = getQuotaInfo(sub);
                return (
                  <span
                    key={sub.id}
                    className={`perfil-header__plan-badge perfil-header__plan-badge--${
                      isSuperguia ? "superguia" : "panorama"
                    }`}>
                    <img
                      className="perfil-header__plan-badge-icon"
                      src={PLAN_ICONS[sub.plan] || "/img/P_Extro.png"}
                      alt=""
                      aria-hidden="true"
                    />
                    <span className="perfil-header__plan-badge-name">
                      {PLAN_LABELS[sub.plan] || sub.plan}
                    </span>
                    <span className="perfil-header__plan-badge-details">
                      {quota && (
                        <span className="perfil-header__plan-badge-quota">
                          <strong>{quota.used}</strong>
                          <span>/</span>
                          <strong>{quota.total}</strong>
                          {quota.label}
                        </span>
                      )}
                      {daysLeft !== null && (
                        <span className="perfil-header__plan-badge-meta">
                          <strong>{daysLeft}</strong>
                          {daysLeft === 1
                            ? " día para publicar"
                            : " días para publicar"}
                        </span>
                      )}
                      {expiry && (
                        <span className="perfil-header__plan-badge-expiry">
                          Vence {expiry}
                        </span>
                      )}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
          <button
            className="perfil-header__btn perfil-header__btn--logout"
            onClick={onSignOut}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
