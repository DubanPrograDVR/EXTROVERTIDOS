import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faHashtag, faCheck } from "@fortawesome/free-solid-svg-icons";
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

/**
 * Modal para seleccionar etiquetas complementarias
 */
const TagsModal = ({ isOpen, onClose, selectedTags = [], onSave }) => {
  const [internalSelected, setInternalSelected] = useState([]);
  const [dbTags, setDbTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sincronizar con tags externos cuando se abre
  useEffect(() => {
    if (isOpen) {
      setInternalSelected(selectedTags || []);
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
      <div className="tags-modal" onClick={(e) => e.stopPropagation()}>
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

        {/* Content */}
        <div className="tags-modal__content">
          {loading ? (
            <div className="tags-modal__loading">Cargando etiquetas...</div>
          ) : (
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
