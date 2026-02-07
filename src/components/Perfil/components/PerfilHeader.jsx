import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
  faShieldAlt,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
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

export default function PerfilHeader({
  userAvatar,
  userName,
  userEmail,
  createdAt,
  userRole,
  onSignOut,
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
          <button className="perfil-header__btn perfil-header__btn--edit">
            <FontAwesomeIcon icon={faEdit} />
            Editar Perfil
          </button>
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
