import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faInfoCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { IMAGE_CONFIG } from "./constants";

/**
 * Sección de imágenes del negocio
 */
const ImagenesSection = ({
  previewImages,
  errors,
  onImageChange,
  onRemoveImage,
  onFieldFocus,
}) => {
  return (
    <section className="publicar-negocio__section">
      <h2 className="publicar-negocio__section-title">
        <FontAwesomeIcon icon={faImage} />
        Imágenes
      </h2>

      <div className="publicar-negocio__field">
        <label>
          Fotos del negocio
          <span className="publicar-negocio__label-required">Obligatorio</span>
        </label>
        <p className="publicar-negocio__hint">
          <FontAwesomeIcon icon={faInfoCircle} />
          Sube hasta {IMAGE_CONFIG.maxFiles} imágenes. La primera será la imagen principal.
        </p>

        <div className="publicar-negocio__images-grid">
          {previewImages.map((preview, index) => (
            <div key={index} className="publicar-negocio__image-preview">
              <img src={preview} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                className="publicar-negocio__image-remove"
                onClick={() => onRemoveImage(index)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              {index === 0 && (
                <span className="publicar-negocio__image-main">Principal</span>
              )}
            </div>
          ))}

          {previewImages.length < IMAGE_CONFIG.maxFiles && (
            <label className="publicar-negocio__image-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageChange}
                onFocus={onFieldFocus}
              />
              <FontAwesomeIcon icon={faImage} />
              <span>Agregar imagen</span>
            </label>
          )}
        </div>

        {errors.imagenes && (
          <span className="publicar-negocio__error">{errors.imagenes}</span>
        )}
      </div>
    </section>
  );
};

export default ImagenesSection;
