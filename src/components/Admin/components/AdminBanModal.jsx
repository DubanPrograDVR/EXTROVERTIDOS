import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Modal para que el admin ingrese el motivo del baneo
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Object} props.user - Usuario a banear { id, nombre, email, avatar_url }
 * @param {function} props.onConfirm - Callback con el motivo del baneo
 * @param {function} props.onCancel - Callback para cancelar
 * @param {boolean} props.loading - Estado de carga
 */
export default function AdminBanModal({
  isOpen,
  user,
  onConfirm,
  onCancel,
  loading,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (reason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }

    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onCancel();
  };

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div
        className="admin-modal admin-modal--ban"
        role="dialog"
        aria-modal="true"
        aria-label="Suspender usuario"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal__header admin-modal__header--warning">
          <div className="admin-modal__icon">
            <FontAwesomeIcon icon={faBan} />
          </div>
          <h3 className="admin-modal__title">Suspender Usuario</h3>
          <button className="admin-modal__close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* User Info */}
        <div className="admin-modal__user-info">
          <img
            src={user.avatar_url || "/img/default-avatar.png"}
            alt={user.nombre}
            className="admin-modal__avatar"
          />
          <div className="admin-modal__user-details">
            <span className="admin-modal__user-name">
              {user.nombre || "Sin nombre"}
            </span>
            <span className="admin-modal__user-email">{user.email}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="admin-modal__warning">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>
            Esta acción suspenderá la cuenta del usuario. No podrá iniciar
            sesión hasta que sea desbaneado.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-modal__form">
          <div className="admin-modal__field">
            <label htmlFor="ban-reason">Motivo de la suspensión *</label>
            <textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Escribe el motivo de la suspensión (mínimo 10 caracteres)..."
              rows={4}
              disabled={loading}
              autoFocus
            />
            {error && <span className="admin-modal__error">{error}</span>}
            <span className="admin-modal__char-count">
              {reason.length}/10 caracteres mínimo
            </span>
          </div>

          {/* Actions */}
          <div className="admin-modal__actions">
            <button
              type="button"
              className="admin-modal__btn admin-modal__btn--secondary"
              onClick={handleClose}
              disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-modal__btn admin-modal__btn--danger"
              disabled={loading || reason.trim().length < 10}>
              {loading ? "Suspendiendo..." : "Confirmar suspensión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
