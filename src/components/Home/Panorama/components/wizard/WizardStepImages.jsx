import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faEye, faSave } from "@fortawesome/free-solid-svg-icons";
import ImageUpload from "../ImageUpload";

/**
 * Wizard Step 5: Imágenes y Publicar
 * Subida de imágenes + botones de acción
 */
const WizardStepImages = ({
  previewImages,
  errors,
  isSubmitting,
  isEditing,
  isSavingDraft,
  onImageChange,
  onRemoveImage,
  onSaveDraft,
}) => {
  return (
    <div className="wizard-step">
      {/* Imágenes */}
      <ImageUpload
        previewImages={previewImages}
        onImageChange={onImageChange}
        onRemoveImage={onRemoveImage}
        error={errors.imagenes}
      />

      {/* Botones de acción */}
      <div className="publicar-form__actions">
        {/* Botón Guardar Borrador - solo si no estamos editando */}
        {!isEditing && onSaveDraft && (
          <button
            type="button"
            className="publicar-form__save-draft-btn"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}>
            {isSavingDraft ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Guardando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                Guardar Borrador
              </>
            )}
          </button>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          className="publicar-form__submit"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              {isEditing ? "Guardando..." : "Publicando..."}
            </>
          ) : isEditing ? (
            "Guardar Cambios"
          ) : (
            "Publicar Evento"
          )}
        </button>
      </div>
    </div>
  );
};

export default WizardStepImages;
