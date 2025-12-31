import "./styles/section.css";
import "./styles/configuracion.css";

export default function PerfilConfiguracion({ userName, userEmail }) {
  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Configuración</h2>
      </div>
      <div className="perfil-settings">
        <div className="perfil-settings__section">
          <h3>Información Personal</h3>
          <div className="perfil-settings__field">
            <label>Nombre</label>
            <input type="text" value={userName} disabled />
          </div>
          <div className="perfil-settings__field">
            <label>Correo electrónico</label>
            <input type="email" value={userEmail} disabled />
          </div>
          <p className="perfil-settings__note">
            Los datos de tu cuenta están vinculados a tu cuenta de Google
          </p>
        </div>

        <div className="perfil-settings__section">
          <h3>Preferencias de Notificaciones</h3>
          <div className="perfil-settings__toggle">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Notificaciones de publicaciones aprobadas</span>
            </label>
          </div>
          <div className="perfil-settings__toggle">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Notificaciones de nuevos seguidores</span>
            </label>
          </div>
          <div className="perfil-settings__toggle">
            <label>
              <input type="checkbox" />
              <span>Correos promocionales</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
