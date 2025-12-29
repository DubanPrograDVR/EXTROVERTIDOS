import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/formatters";

/**
 * Tabla de gestión de usuarios (solo admin)
 */
export default function AdminUserList({
  users,
  currentUserId,
  actionLoading,
  onRoleChange,
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
function UserRow({ user, isCurrentUser, isLoading, onRoleChange }) {
  return (
    <tr>
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
      <td>{formatDate(user.created_at)}</td>
      <td>
        {isCurrentUser ? (
          <span className="admin-you-badge">Tú</span>
        ) : (
          <select
            value={user.rol || "user"}
            onChange={(e) => onRoleChange(e.target.value)}
            disabled={isLoading}
            className="admin-role-select">
            <option value="user">Usuario</option>
            <option value="moderator">Moderador</option>
            <option value="admin">Administrador</option>
          </select>
        )}
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
