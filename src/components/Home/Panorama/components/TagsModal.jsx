import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faHashtag,
  faCheck,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { getTags } from "../../../../lib/database";
import "./styles/tags-modal.css";

/**
 * Lista de etiquetas predefinidas disponibles
 */
const ETIQUETAS_PREDEFINIDAS = [
  "#JUVENIL",
  "#ADULTOS",
  "#VOCACION",
  "#INFANTIL",
  "#PAREJAS",
  "#MUSICA",
  "#SORTEOS",
  "#NUEVO DESAFIO",
  "#FAMILIAR",
  "#EXPERIENCIA",
  "#PREMIOS",
  "#EVENTO GRATIS",
  "#REGALOS",
  "#COMIDA",
  "#MASCOTAS",
  "#NIÑOS",
  "#JUEGOS INFANTILES",
  "#SALUD",
  "#BELLEZA",
  "#ESTACIONAMIENTO",
  "#SEGURIDAD",
  "#ADRENALINA",
  "#AVENTURA",
  "#NATURALEZA",
  "#SORPRESAS",
  "#HUMOR",
  "#AIRE LIBRE",
  "#APRENDIZAJE",
  "#COMPETENCIA",
  "#TESTING",
  "#CARRETE",
  "#ASIENTOS",
  "#CASILLEROS",
  "#MUSICA EN VIVO",
  "#BAÑOS",
  "#DUCHAS",
  "#HOMBRES",
  "#MUJERES",
  "#VENTA ESPECIAL",
  "#ONLINE",
  "#TRANSMISION EN VIVO",
  "#FOTOGRAFIAS",
  "#PASION",
  "#Z FUMADORES",
  "#CONCURSOS",
  "#PAISAJES",
  "#FOOD TRUCKS",
  "#TECNOLOGIA",
  "#PANTALLAS GIGANTES",
  "#AIRE ACONDICIONADO",
];

const MAX_TAGS = 10;
const CUSTOM_TAGS_KEY = "extrovertidos_custom_hashtags";

// Helpers localStorage
const loadCustomTagsFromStorage = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_TAGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCustomTagsToStorage = (tags) => {
  try {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error("Error guardando hashtags en localStorage:", e);
  }
};

/**
 * Modal para seleccionar etiquetas complementarias
 */
const TagsModal = ({ isOpen, onClose, selectedTags = [], onSave }) => {
  const [internalSelected, setInternalSelected] = useState([]);
  const [dbTags, setDbTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [customTagError, setCustomTagError] = useState("");
  const [savedCustomTags, setSavedCustomTags] = useState([]);
  const customInputRef = useRef(null);

  // Sincronizar con tags externos cuando se abre
  useEffect(() => {
    if (isOpen) {
      setInternalSelected(selectedTags || []);
      setCustomTag("");
      setCustomTagError("");
      setSavedCustomTags(loadCustomTagsFromStorage());
      loadDbTags();
    }
  }, [isOpen, selectedTags]);

  // Cargar tags de la base de datos (opcional, por si hay más)
  const loadDbTags = async () => {
    try {
      setLoading(true);
      const tags = await getTags();
      setDbTags(tags || []);
    } catch (error) {
      console.error("Error cargando tags:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selección de tag
  const handleToggleTag = (tag) => {
    setInternalSelected((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_TAGS) {
        return prev; // No agregar más si ya hay 10
      }
      return [...prev, tag];
    });
  };

  // Agregar hashtag personalizado
  const handleAddCustomTag = () => {
    setCustomTagError("");
    const raw = customTag.trim().toUpperCase();
    if (!raw) return;

    // Formatear: agregar # si no lo tiene
    const formatted = raw.startsWith("#") ? raw : `#${raw}`;

    // Validar
    if (formatted.length < 2) {
      setCustomTagError("El hashtag debe tener al menos 1 carácter");
      return;
    }
    if (formatted.length > 30) {
      setCustomTagError("El hashtag es demasiado largo (máx. 30)");
      return;
    }
    if (
      internalSelected.includes(formatted) ||
      ETIQUETAS_PREDEFINIDAS.includes(formatted)
    ) {
      setCustomTagError("Esta etiqueta ya existe");
      return;
    }
    if (internalSelected.length >= MAX_TAGS) {
      setCustomTagError(`Máximo ${MAX_TAGS} etiquetas`);
      return;
    }

    setInternalSelected((prev) => [...prev, formatted]);

    // Guardar en localStorage si no es predefinida
    if (!ETIQUETAS_PREDEFINIDAS.includes(formatted)) {
      const updated = [...new Set([...savedCustomTags, formatted])];
      setSavedCustomTags(updated);
      saveCustomTagsToStorage(updated);
    }

    setCustomTag("");
    customInputRef.current?.focus();
  };

  // Eliminar un tag personalizado guardado del localStorage
  const handleDeleteSavedTag = (tagToDelete) => {
    const updated = savedCustomTags.filter((t) => t !== tagToDelete);
    setSavedCustomTags(updated);
    saveCustomTagsToStorage(updated);
    setInternalSelected((prev) => prev.filter((t) => t !== tagToDelete));
  };

  // Handler para Enter en el input
  const handleCustomTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  // Guardar y cerrar
  const handleSave = () => {
    onSave(internalSelected);
    onClose();
  };

  // Cancelar
  const handleCancel = () => {
    setInternalSelected(selectedTags || []);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tags-modal-overlay" onClick={handleCancel}>
      <div
        className="tags-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar etiquetas"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tags-modal__header">
          <h3 className="tags-modal__title">
            <FontAwesomeIcon icon={faHashtag} />
            Selecciona hasta {MAX_TAGS} etiquetas complementarias
          </h3>
          <button
            type="button"
            className="tags-modal__close"
            onClick={handleCancel}
            aria-label="Cerrar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Input de hashtag personalizado */}
        <div className="tags-modal__custom">
          <div className="tags-modal__custom-input-row">
            <span className="tags-modal__custom-hash">#</span>
            <input
              ref={customInputRef}
              type="text"
              className="tags-modal__custom-input"
              placeholder="Escribe tu hashtag personalizado..."
              value={customTag}
              onChange={(e) => {
                let val = e.target.value;
                // Si el usuario borra todo, queda vacío
                if (val === "#") val = "";
                // Auto-prefijar # al empezar a escribir
                if (val && !val.startsWith("#")) val = "#" + val;
                setCustomTag(val);
                setCustomTagError("");
              }}
              onKeyDown={handleCustomTagKeyDown}
              maxLength={30}
              disabled={internalSelected.length >= MAX_TAGS}
            />
            <button
              type="button"
              className="tags-modal__custom-add"
              onClick={handleAddCustomTag}
              disabled={
                !customTag.trim() || internalSelected.length >= MAX_TAGS
              }>
              <FontAwesomeIcon icon={faPlus} />
              Agregar
            </button>
          </div>
          {customTagError && (
            <span className="tags-modal__custom-error">{customTagError}</span>
          )}
        </div>

        {/* Content */}
        <div className="tags-modal__content">
          {loading ? (
            <div className="tags-modal__loading">Cargando etiquetas...</div>
          ) : (
            <>
              {/* Tags personalizados guardados */}
              {savedCustomTags.length > 0 && (
                <div className="tags-modal__section">
                  <p className="tags-modal__section-title">
                    Mis hashtags personalizados
                  </p>
                  <div className="tags-modal__grid">
                    {savedCustomTags.map((tag) => (
                      <div key={tag} className="tags-modal__tag-wrapper">
                        <button
                          type="button"
                          className={`tags-modal__tag tags-modal__tag--custom ${
                            internalSelected.includes(tag) ? "selected" : ""
                          } ${
                            internalSelected.length >= MAX_TAGS &&
                            !internalSelected.includes(tag)
                              ? "disabled"
                              : ""
                          }`}
                          onClick={() => handleToggleTag(tag)}
                          disabled={
                            internalSelected.length >= MAX_TAGS &&
                            !internalSelected.includes(tag)
                          }>
                          {tag}
                          {internalSelected.includes(tag) && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="tags-modal__tag-check"
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          className="tags-modal__tag-delete"
                          onClick={() => handleDeleteSavedTag(tag)}
                          title="Eliminar hashtag guardado">
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etiquetas predefinidas */}
              <div className="tags-modal__section">
                {savedCustomTags.length > 0 && (
                  <p className="tags-modal__section-title">
                    Etiquetas predefinidas
                  </p>
                )}
                <div className="tags-modal__grid">
                  {ETIQUETAS_PREDEFINIDAS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tags-modal__tag ${
                        internalSelected.includes(tag) ? "selected" : ""
                      } ${
                        internalSelected.length >= MAX_TAGS &&
                        !internalSelected.includes(tag)
                          ? "disabled"
                          : ""
                      }`}
                      onClick={() => handleToggleTag(tag)}
                      disabled={
                        internalSelected.length >= MAX_TAGS &&
                        !internalSelected.includes(tag)
                      }>
                      {tag}
                      {internalSelected.includes(tag) && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="tags-modal__tag-check"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="tags-modal__footer">
          <span className="tags-modal__count">
            {internalSelected.length} / {MAX_TAGS} seleccionadas
          </span>
          <div className="tags-modal__actions">
            <button
              type="button"
              className="tags-modal__btn tags-modal__btn--cancel"
              onClick={handleCancel}>
              Cancelar
            </button>
            <button
              type="button"
              className="tags-modal__btn tags-modal__btn--save"
              onClick={handleSave}>
              Guardar Etiquetas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsModal;
