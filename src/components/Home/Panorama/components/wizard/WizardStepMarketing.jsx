import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faTags,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import TagsModal from "../TagsModal";

/**
 * Wizard Step 4: Marketing y Etiquetas
 * Marketing 1, Marketing 2, Etiquetas complementarias, Etiqueta destacada
 */
const WizardStepMarketing = ({ formData, errors, onChange }) => {
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  const handleTagsSave = (tags) => {
    const tagsString = tags.join(" ");
    onChange({ target: { name: "hashtags", value: tagsString } });
  };

  const getSelectedTags = () => {
    if (!formData.hashtags) return [];
    return formData.hashtags
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => `#${tag.toUpperCase()}`);
  };

  return (
    <div className="wizard-step">
      {/* Mensaje de Marketing 1 */}
      <div className="publicar-form__group publicar-form__group--marketing">
        <label className="publicar-form__label">
          <FontAwesomeIcon icon={faBullhorn} /> Mensaje de Marketing N° 1
          <span className="publicar-form__label-hint"> (Opcional)</span>
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Engancha a tu público
          </span>
        </label>
        <div className="publicar-form__marketing-title">
          <label
            className="publicar-form__label-small"
            htmlFor="titulo_marketing">
            Título
          </label>
          <input
            type="text"
            id="titulo_marketing"
            name="titulo_marketing"
            className="publicar-form__input"
            placeholder="Ej: ¡Oferta Especial! o Beneficios Exclusivos"
            value={formData.titulo_marketing || ""}
            onChange={onChange}
            maxLength={100}
          />
        </div>
        <textarea
          id="mensaje_marketing"
          name="mensaje_marketing"
          className="publicar-form__textarea publicar-form__textarea--marketing"
          placeholder="Ej: ¡Las primeras 50 personas recibirán una bebida gratis! 🎉 Sorpresas exclusivas para quienes lleguen temprano..."
          value={formData.mensaje_marketing}
          onChange={onChange}
          rows={3}
          maxLength={500}
        />
        <span className="publicar-form__char-count">
          {formData.mensaje_marketing?.length || 0}/500
        </span>
      </div>

      {/* Mensaje de Marketing 2 */}
      <div className="publicar-form__group publicar-form__group--marketing">
        <label className="publicar-form__label">
          <FontAwesomeIcon icon={faBullhorn} /> Mensaje de Marketing N° 2
          <span className="publicar-form__label-hint"> (Opcional)</span>
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Mensaje adicional
          </span>
        </label>
        <div className="publicar-form__marketing-title">
          <label
            className="publicar-form__label-small"
            htmlFor="titulo_marketing_2">
            Título
          </label>
          <input
            type="text"
            id="titulo_marketing_2"
            name="titulo_marketing_2"
            className="publicar-form__input"
            placeholder="Ej: ¡No te lo pierdas! o Información Importante"
            value={formData.titulo_marketing_2 || ""}
            onChange={onChange}
            maxLength={100}
          />
        </div>
        <textarea
          id="mensaje_marketing_2"
          name="mensaje_marketing_2"
          className="publicar-form__textarea publicar-form__textarea--marketing"
          placeholder="Ej: ¡No te pierdas la experiencia VIP con acceso backstage! 🌟 Cupos limitados..."
          value={formData.mensaje_marketing_2 || ""}
          onChange={onChange}
          rows={3}
          maxLength={500}
        />
        <span className="publicar-form__char-count">
          {formData.mensaje_marketing_2?.length || 0}/500
        </span>
      </div>

      {/* Etiquetas Complementarias */}
      <div className="publicar-form__group">
        <label className="publicar-form__label">
          <FontAwesomeIcon icon={faTags} /> Etiquetas Complementarias (10 Max)
          <span
            style={{
              color: "gray",
              fontSize: "12px",
              marginTop: "5px",
              marginLeft: "10px",
            }}>
            Mejora la visibilidad
          </span>
          <span className="publicar-form__label-hint"> (Opcional)</span>
        </label>
        <button
          type="button"
          className="publicar-form__modal-trigger publicar-form__modal-trigger--tags"
          onClick={() => setIsTagsModalOpen(true)}>
          <FontAwesomeIcon icon={faTags} />
          Ver Etiquetas
        </button>
        <span className="publicar-form__hint">
          Selecciona o crea tu etiqueta
        </span>
        {getSelectedTags().length > 0 && (
          <div className="publicar-form__selected-tags">
            {getSelectedTags().map((tag) => (
              <span key={tag} className="publicar-form__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Etiqueta Directa */}
      <div className="publicar-form__group">
        <label className="publicar-form__label" htmlFor="etiqueta_directa">
          <FontAwesomeIcon icon={faBookmark} /> Etiqueta Destacada
          <span className="publicar-form__label-required">Obligatorio</span>
        </label>
        <input
          type="text"
          id="etiqueta_directa"
          name="etiqueta_directa"
          className={`publicar-form__input ${errors.etiqueta_directa ? "error" : ""}`}
          placeholder="Ej: ¡Imperdible! o Entrada Liberada"
          value={formData.etiqueta_directa || ""}
          onChange={onChange}
          maxLength={50}
        />
        <span className="publicar-form__hint">
          Esta etiqueta se mostrará destacada en tu publicación
        </span>
        {errors.etiqueta_directa && (
          <span className="publicar-form__error">
            {errors.etiqueta_directa}
          </span>
        )}
      </div>

      {/* Modal de selección de etiquetas */}
      <TagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        selectedTags={getSelectedTags()}
        onSave={handleTagsSave}
      />
    </div>
  );
};

export default WizardStepMarketing;
