import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/header.css";

export default function PerfilHeader({
  userAvatar,
  userName,
  userEmail,
  createdAt,
  onSignOut,
}) {
  return (
    <header className="perfil-header">
      <div className="perfil-header__background"></div>
      <div className="perfil-header__content">
        <div className="perfil-header__avatar-wrapper">
          <img
            src={userAvatar}
            alt={userName}
            className="perfil-header__avatar"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="perfil-header__info">
          <h1 className="perfil-header__name">{userName}</h1>
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
