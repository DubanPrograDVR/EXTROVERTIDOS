import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faUserShield,
  faBan,
  faUserCheck,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/formatters";

/**
 * Tabla de gestión de usuarios (solo admin)
 */
export default function AdminUserList({
  users,
  currentUserId,
  actionLoading,
  onRoleChange,
  onBanClick,
  onUnbanClick,
}) {
  return (
    <div className="admin-users">
      <h2>Gestión de Usuarios</h2>
      <div className="admin-users__table-wrapper">
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol Actual</th>
              <th>Estado</th>
              <th>Fecha de Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                isLoading={actionLoading === user.id}
                onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
                onBanClick={() => onBanClick(user)}
                onUnbanClick={() => onUnbanClick(user)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Fila individual de usuario en la tabla
 */
function UserRow({
  user,
  isCurrentUser,
  isLoading,
  onRoleChange,
  onBanClick,
  onUnbanClick,
}) {
  const isBanned = user.is_banned;
  const isAdmin = user.rol === "admin";

  return (
    <tr className={isBanned ? "admin-users__row--banned" : ""}>
      <td>
        <div className="admin-user-cell">
          <img
            src={user.avatar_url || "/img/default-avatar.png"}
            alt={user.nombre}
          />
          <span>{user.nombre || "Sin nombre"}</span>
        </div>
      </td>
      <td>{user.email}</td>
      <td>
        <RoleBadge rol={user.rol} />
      </td>
      <td>
        <StatusBadge isBanned={isBanned} banInfo={user.ban_info} />
      </td>
      <td>{formatDate(user.created_at)}</td>
      <td>
        <div className="admin-users__actions">
          {isCurrentUser ? (
            <span className="admin-you-badge">Tú</span>
          ) : (
            <>
              {/* Selector de rol */}
              <select
                value={user.rol || "user"}
                onChange={(e) => onRoleChange(e.target.value)}
                disabled={isLoading || isBanned}
                className="admin-role-select">
                <option value="user">Usuario</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Administrador</option>
              </select>

              {/* Botón de banear/desbanear */}
              {!isAdmin && (
                <>
                  {isBanned ? (
                    <button
                      className="admin-ban-btn admin-ban-btn--unban"
                      onClick={onUnbanClick}
                      disabled={isLoading}
                      title="Restaurar usuario">
                      <FontAwesomeIcon icon={faUserCheck} />
                      Restaurar
                    </button>
                  ) : (
                    <button
                      className="admin-ban-btn admin-ban-btn--ban"
                      onClick={onBanClick}
                      disabled={isLoading}
                      title="Suspender usuario">
                      <FontAwesomeIcon icon={faBan} />
                      Suspender
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Badge del rol del usuario
 */
function RoleBadge({ rol }) {
  const roleIcons = {
    admin: faShieldAlt,
    moderator: faUserShield,
  };

  return (
    <span className={`admin-role-badge admin-role-badge--${rol || "user"}`}>
      {roleIcons[rol] && <FontAwesomeIcon icon={roleIcons[rol]} />}
      {rol || "user"}
    </span>
  );
}

/**
 * Badge del estado del usuario (activo/baneado)
 */
function StatusBadge({ isBanned, banInfo }) {
  if (isBanned) {
    return (
      <div>
        <span className="admin-status-badge admin-status-badge--banned">
          <FontAwesomeIcon icon={faBan} />
          Suspendido
        </span>
        {banInfo?.ban_reason && (
          <div className="admin-ban-info">
            <span className="admin-ban-info__reason" title={banInfo.ban_reason}>
              {banInfo.ban_reason}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="admin-status-badge admin-status-badge--active">
      <FontAwesomeIcon icon={faCheckCircle} />
      Activo
    </span>
  );
}
