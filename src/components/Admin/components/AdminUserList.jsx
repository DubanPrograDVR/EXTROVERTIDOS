import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faUserShield,
  faBan,
  faUserCheck,
  faCheckCircle,
  faCalendarAlt,
  faTrash,
  faSpinner,
  faExclamationTriangle,
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
  onDeleteUser,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteClick = (user) => {
    setDeleteConfirm(user);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm && onDeleteUser) {
      const result = await onDeleteUser(deleteConfirm.id);
      if (result.success) {
        setDeleteConfirm(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="admin-users">
      <h2>Gestión de Usuarios</h2>

      {/* Vista de tabla para desktop */}
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
                onDeleteClick={() => handleDeleteClick(user)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="admin-users__mobile-list">
        {users.map((user) => (
          <UserMobileCard
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUserId}
            isLoading={actionLoading === user.id}
            onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
            onBanClick={() => onBanClick(user)}
            onUnbanClick={() => onUnbanClick(user)}
            onDeleteClick={() => handleDeleteClick(user)}
          />
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div
          className="admin-delete-modal-overlay"
          onClick={handleDeleteCancel}>
          <div
            className="admin-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="admin-delete-modal__icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3>¿Eliminar usuario?</h3>
            <p>
              Estás a punto de eliminar permanentemente a{" "}
              <strong>{deleteConfirm.nombre || deleteConfirm.email}</strong>.
            </p>
            <p className="admin-delete-modal__warning">
              Esta acción eliminará todas sus publicaciones, favoritos y datos
              asociados. No se puede deshacer.
            </p>
            <div className="admin-delete-modal__actions">
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--cancel"
                onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button
                className="admin-delete-modal__btn admin-delete-modal__btn--confirm"
                onClick={handleDeleteConfirm}
                disabled={actionLoading === deleteConfirm.id}>
                {actionLoading === deleteConfirm.id ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Eliminando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} /> Eliminar Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card de usuario para vista móvil
 */
function UserMobileCard({
  user,
  isCurrentUser,
  isLoading,
  onRoleChange,
  onBanClick,
  onUnbanClick,
  onDeleteClick,
}) {
  const isBanned = user.is_banned;
  const isAdmin = user.rol === "admin";

  return (
    <div
      className={`admin-user-mobile-card ${
        isBanned ? "admin-user-mobile-card--banned" : ""
      }`}>
      <div className="admin-user-mobile-card__header">
        <img
          src={user.avatar_url || "/img/default-avatar.png"}
          alt={user.nombre}
        />
        <div className="admin-user-mobile-card__info">
          <h4 className="admin-user-mobile-card__name">
            {user.nombre || "Sin nombre"}
          </h4>
          <span className="admin-user-mobile-card__email">{user.email}</span>
        </div>
      </div>

      <div className="admin-user-mobile-card__details">
        <div className="admin-user-mobile-card__detail">
          <span className="admin-user-mobile-card__detail-label">Rol</span>
          <span className="admin-user-mobile-card__detail-value">
            <RoleBadge rol={user.rol} />
          </span>
        </div>
        <div className="admin-user-mobile-card__detail">
          <span className="admin-user-mobile-card__detail-label">Estado</span>
          <span className="admin-user-mobile-card__detail-value">
            <StatusBadge isBanned={isBanned} banInfo={user.ban_info} />
          </span>
        </div>
        <div className="admin-user-mobile-card__detail">
          <span className="admin-user-mobile-card__detail-label">Registro</span>
          <span className="admin-user-mobile-card__detail-value">
            <FontAwesomeIcon
              icon={faCalendarAlt}
              style={{ marginRight: 6, opacity: 0.5 }}
            />
            {formatDate(user.created_at)}
          </span>
        </div>
      </div>

      <div className="admin-user-mobile-card__actions">
        {isCurrentUser ? (
          <span className="admin-you-badge">Tú</span>
        ) : (
          <>
            <select
              value={user.rol || "user"}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={isLoading || isBanned}
              className="admin-role-select">
              <option value="user">Usuario</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Administrador</option>
            </select>

            {!isAdmin && (
              <>
                {isBanned ? (
                  <button
                    className="admin-ban-btn admin-ban-btn--unban"
                    onClick={onUnbanClick}
                    disabled={isLoading}>
                    <FontAwesomeIcon icon={faUserCheck} />
                    Restaurar
                  </button>
                ) : (
                  <button
                    className="admin-ban-btn admin-ban-btn--ban"
                    onClick={onBanClick}
                    disabled={isLoading}>
                    <FontAwesomeIcon icon={faBan} />
                    Suspender
                  </button>
                )}

                <button
                  className="admin-ban-btn admin-ban-btn--delete"
                  onClick={onDeleteClick}
                  disabled={isLoading}
                  title="Eliminar usuario">
                  <FontAwesomeIcon icon={faTrash} />
                  Eliminar
                </button>
              </>
            )}
          </>
        )}
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
  onDeleteClick,
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

                  {/* Botón de eliminar */}
                  <button
                    className="admin-ban-btn admin-ban-btn--delete"
                    onClick={onDeleteClick}
                    disabled={isLoading}
                    title="Eliminar usuario permanentemente">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
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
