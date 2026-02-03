import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faTrash,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Tab de imágenes del evento
 */
export default function MediaTab({ formData, onRemoveImage }) {
  return (
    <div className="user-edit-modal__content">
      <div className="user-edit-modal__images-info">
        <FontAwesomeIcon icon={faInfoCircle} />
        <p>
          Las imágenes existentes se muestran abajo. Puedes eliminarlas pero por
          ahora no es posible agregar nuevas desde aquí.
        </p>
      </div>

      <div className="user-edit-modal__images-grid">
        {formData.imagenes && formData.imagenes.length > 0 ? (
          formData.imagenes.map((img, index) => (
            <div key={index} className="user-edit-modal__image-item">
              <img src={img} alt={`Imagen ${index + 1}`} />
              <button
                type="button"
                className="user-edit-modal__image-remove"
                onClick={() => onRemoveImage(index)}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
              {index === 0 && (
                <span className="user-edit-modal__image-main">Principal</span>
              )}
            </div>
          ))
        ) : (
          <div className="user-edit-modal__no-images">
            <FontAwesomeIcon icon={faImage} />
            <p>No hay imágenes</p>
          </div>
        )}
      </div>
    </div>
  );
}
