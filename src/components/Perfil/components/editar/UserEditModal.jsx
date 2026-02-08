import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faSave,
  faSpinner,
  faImage,
  faMapMarkerAlt,
  faTicketAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

// Hook y componentes
import { useEditForm } from "./useEditForm";
import InfoTab from "./InfoTab";
import LocationTab from "./LocationTab";
import DetailsTab from "./DetailsTab";
import MediaTab from "./MediaTab";

// Estilos
import "../styles/user-edit-modal.css";

/**
 * Modal para que el usuario edite sus publicaciones
 */
export default function UserEditModal({
  isOpen,
  onClose,
  event,
  categories = [],
  onSave,
  loading = false,
}) {
  // Hook personalizado para el formulario
  const {
    formData,
    errors,
    activeTab,
    setActiveTab,
    handleChange,
    handleRemoveImage,
    validateForm,
    prepareDataToSave,
  } = useEditForm(event, isOpen);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, loading]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setActiveTab("info");
      return;
    }

    const dataToSave = prepareDataToSave();
    await onSave(event.id, dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="user-edit-modal__overlay" onClick={onClose}>
      <div
        className="user-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="user-edit-modal__header">
          <h2>Editar Publicación</h2>
          <button
            className="user-edit-modal__close"
            onClick={onClose}
            disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Nota informativa */}
        <div className="user-edit-modal__notice">
          <FontAwesomeIcon icon={faInfoCircle} />
          <p>
            Al guardar los cambios, tu publicación pasará a revisión nuevamente
            antes de ser publicada.
          </p>
        </div>

        {/* Tabs */}
        <div className="user-edit-modal__tabs">
          <button
            className={`user-edit-modal__tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}>
            <FontAwesomeIcon icon={faInfoCircle} />
            Información
          </button>
          <button
            className={`user-edit-modal__tab ${activeTab === "location" ? "active" : ""}`}
            onClick={() => setActiveTab("location")}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Ubicación
          </button>
          <button
            className={`user-edit-modal__tab ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}>
            <FontAwesomeIcon icon={faTicketAlt} />
            Detalles
          </button>
          <button
            className={`user-edit-modal__tab ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}>
            <FontAwesomeIcon icon={faImage} />
            Imágenes
          </button>
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit} className="user-edit-modal__form">
          {/* Tab: Información */}
          {activeTab === "info" && (
            <InfoTab
              formData={formData}
              errors={errors}
              categories={categories}
              onChange={handleChange}
            />
          )}

          {/* Tab: Ubicación */}
          {activeTab === "location" && (
            <LocationTab
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}

          {/* Tab: Detalles */}
          {activeTab === "details" && (
            <DetailsTab
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}

          {/* Tab: Imágenes */}
          {activeTab === "media" && (
            <MediaTab formData={formData} onRemoveImage={handleRemoveImage} />
          )}

          {/* Footer con botones */}
          <div className="user-edit-modal__footer">
            <button
              type="button"
              className="user-edit-modal__btn user-edit-modal__btn--cancel"
              onClick={onClose}
              disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="user-edit-modal__btn user-edit-modal__btn--save"
              disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Guardando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
