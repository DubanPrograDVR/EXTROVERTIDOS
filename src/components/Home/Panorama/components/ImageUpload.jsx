import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faTimes } from "@fortawesome/free-solid-svg-icons";
import { IMAGE_CONFIG } from "../constants";

/**
 * Componente para subir y previsualizar imágenes
 */
const ImageUpload = ({
  previewImages,
  onImageChange,
  onRemoveImage,
  error,
}) => {
  const { maxFiles } = IMAGE_CONFIG;

  return (
    <div className="publicar-form__group">
      <label className="publicar-form__label">
        <FontAwesomeIcon icon={faImage} /> Imágenes del Evento *
      </label>
      <p className="publicar-form__hint">
        Sube hasta {maxFiles} imágenes (PNG, JPG - máx. 5MB cada una)
      </p>

      {/* Preview de imágenes */}
      {previewImages.length > 0 && (
        <div className="publicar-form__image-previews">
          {previewImages.map((preview, index) => (
            <div key={index} className="publicar-form__preview-item">
              <img src={preview} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                className="publicar-form__preview-remove"
                onClick={() => onRemoveImage(index)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input de imagen */}
      {previewImages.length < maxFiles && (
        <div className="publicar-form__image-upload">
          <input
            type="file"
            id="imagenes"
            name="imagenes"
            accept="image/*"
            onChange={onImageChange}
            className="publicar-form__file-input"
            multiple
          />
          <label htmlFor="imagenes" className="publicar-form__file-label">
            <FontAwesomeIcon icon={faImage} />
            <span>Haz clic para subir imágenes</span>
            <span className="publicar-form__file-hint">
              {previewImages.length}/{maxFiles} imágenes
            </span>
          </label>
        </div>
      )}

      {error && <span className="publicar-form__error">{error}</span>}
    </div>
  );
};

export default ImageUpload;
