import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";

/**
 * Header del panel de administración
 */
export default function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header__content">
        <div className="admin-header__title">
          <FontAwesomeIcon icon={faShieldAlt} />
          <h1>Panel de Administración</h1>
        </div>
        <p className="admin-header__subtitle">
          Gestiona publicaciones, usuarios y contenido de la plataforma
        </p>
      </div>
    </header>
  );
}
