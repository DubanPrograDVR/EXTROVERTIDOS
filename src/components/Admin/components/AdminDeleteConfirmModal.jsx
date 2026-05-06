import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function AdminDeleteConfirmModal({
  title,
  itemName,
  itemType = "elemento",
  loading = false,
  loadingText = "Eliminando...",
  confirmText = "Eliminar",
  onCancel,
  onConfirm,
}) {
  return (
    <div className="admin-delete-modal-overlay" onClick={onCancel}>
      <div className="admin-delete-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title || `¿Eliminar ${itemType}?`}</h3>
        <p>
          Estás a punto de eliminar <strong>"{itemName}"</strong>. Esta acción
          no se puede deshacer.
        </p>
        <div className="admin-delete-modal__actions">
          <button
            className="admin-delete-modal__btn admin-delete-modal__btn--cancel"
            onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="admin-delete-modal__btn admin-delete-modal__btn--confirm"
            onClick={onConfirm}
            disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> {loadingText}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} /> {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
