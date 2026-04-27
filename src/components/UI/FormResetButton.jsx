import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./FormResetButton.css";

/**
 * Botón para resetear un formulario con confirmación modal.
 * Solo se muestra cuando `isDirty` es true (hay datos ingresados).
 * La confirmación evita resets accidentales.
 */
const FormResetButton = ({
  isDirty,
  onReset,
  label = "Limpiar formulario",
  confirmTitle = "¿Limpiar todo el formulario?",
  confirmMessage = "Se borrará toda la información que hayas ingresado. Esta acción no se puede deshacer.",
  className = "",
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsConfirmOpen(false);
    if (typeof onReset === "function") onReset();
  }, [onReset]);

  useEffect(() => {
    if (!isConfirmOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") setIsConfirmOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isConfirmOpen]);

  if (!isDirty) return null;

  return (
    <>
      <button
        type="button"
        className={`form-reset-btn ${className}`.trim()}
        onClick={handleClick}
        title={label}
        aria-label={label}>
        <FontAwesomeIcon icon={faArrowRotateLeft} />
        <span>{label}</span>
      </button>

      {isConfirmOpen &&
        createPortal(
          <div
            className="form-reset-confirm__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-reset-confirm-title"
            onClick={handleCancel}>
            <div
              className="form-reset-confirm__modal"
              onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="form-reset-confirm__close"
                onClick={handleCancel}
                aria-label="Cerrar">
                <FontAwesomeIcon icon={faXmark} />
              </button>
              <div className="form-reset-confirm__icon">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <h3
                id="form-reset-confirm-title"
                className="form-reset-confirm__title">
                {confirmTitle}
              </h3>
              <p className="form-reset-confirm__message">{confirmMessage}</p>
              <div className="form-reset-confirm__actions">
                <button
                  type="button"
                  className="form-reset-confirm__btn form-reset-confirm__btn--cancel"
                  onClick={handleCancel}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="form-reset-confirm__btn form-reset-confirm__btn--confirm"
                  onClick={handleConfirm}>
                  <FontAwesomeIcon icon={faArrowRotateLeft} />
                  Sí, limpiar todo
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default FormResetButton;
