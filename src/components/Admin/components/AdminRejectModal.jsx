import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

/**
 * Modal para rechazar una publicación o negocio con motivo
 */
export default function AdminRejectModal({
  isOpen,
  isLoading,
  onConfirm,
  onClose,
  title = "Rechazar Publicación",
  placeholder = "Ej: La imagen no cumple con las normas de la comunidad...",
}) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Rechazar publicación"
        onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>Por favor, indica el motivo del rechazo (opcional):</p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={4}
        />

        <div className="admin-modal__actions">
          <button
            className="admin-modal__btn admin-modal__btn--cancel"
            onClick={handleClose}
            disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="admin-modal__btn admin-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading}>
            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
}
