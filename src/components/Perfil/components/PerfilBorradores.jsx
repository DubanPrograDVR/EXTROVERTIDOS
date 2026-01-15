import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faFileAlt,
  faPencilAlt,
  faTrash,
  faCalendarAlt,
  faStore,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import { getDrafts, deleteDraft } from "../../../lib/database";
import "./styles/section.css";
import "./styles/borradores.css";

export default function PerfilBorradores() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [previewDraft, setPreviewDraft] = useState(null);

  // Cargar borradores al montar
  useEffect(() => {
    const loadDrafts = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const userDrafts = await getDrafts(user.id);
        setDrafts(userDrafts);
      } catch (error) {
        console.error("Error al cargar borradores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDrafts();
  }, [user?.id]);

  // Eliminar borrador
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm("¿Estás seguro de eliminar este borrador?")) return;

    setDeleting(draftId);
    try {
      await deleteDraft(draftId, user.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Error al eliminar borrador:", error);
      alert("Error al eliminar el borrador");
    } finally {
      setDeleting(null);
    }
  };

  // Continuar editando borrador
  const handleContinueDraft = (draft) => {
    // Guardar el ID del borrador en sessionStorage para cargarlo en el formulario
    sessionStorage.setItem("draftToLoad", JSON.stringify(draft));

    // Navegar al formulario correspondiente
    if (draft.tipo === "negocio") {
      navigate("/agregar-negocio");
    } else {
      navigate("/publicar-panorama");
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener icono según tipo
  const getTypeIcon = (tipo) => {
    return tipo === "negocio" ? faStore : faCalendarAlt;
  };

  // Obtener label según tipo
  const getTypeLabel = (tipo) => {
    return tipo === "negocio" ? "Negocio" : "Evento";
  };

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Mis Borradores</h2>
        <span className="perfil-section__count">
          {drafts.length} {drafts.length === 1 ? "borrador" : "borradores"}
        </span>
      </div>

      {loading ? (
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando borradores...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faFileAlt} />
          <h3>No tienes borradores guardados</h3>
          <p>
            Los borradores te permiten guardar tu progreso y continuar más
            tarde.
          </p>
        </div>
      ) : (
        <div className="perfil-borradores__grid">
          {drafts.map((draft) => {
            const draftData = draft.data || {};
            const titulo = draft.titulo || draftData.titulo || "Sin título";
            const categoria =
              draftData.categoria_nombre ||
              draftData.categoria ||
              "Sin categoría";
            const descripcion = draftData.descripcion || "";

            // Obtener imagen de preview - buscar en varios lugares
            const imagenPreview =
              draft.imagen_preview ||
              (draftData.imagenes_preview && draftData.imagenes_preview[0]) ||
              null;

            return (
              <article key={draft.id} className="perfil-borrador-card">
                {/* Imagen preview */}
                <div className="perfil-borrador-card__image">
                  {imagenPreview ? (
                    <img
                      src={imagenPreview}
                      alt={titulo}
                      onError={(e) => {
                        e.target.src = "/img/Home1.png";
                      }}
                    />
                  ) : (
                    <div className="perfil-borrador-card__placeholder">
                      <FontAwesomeIcon icon={getTypeIcon(draft.tipo)} />
                    </div>
                  )}
                  <span className={`perfil-borrador-card__type ${draft.tipo}`}>
                    <FontAwesomeIcon icon={getTypeIcon(draft.tipo)} />
                    {getTypeLabel(draft.tipo)}
                  </span>
                </div>

                {/* Contenido */}
                <div className="perfil-borrador-card__content">
                  <span className="perfil-borrador-card__category">
                    {categoria}
                  </span>
                  <h3 className="perfil-borrador-card__title">{titulo}</h3>

                  {descripcion && (
                    <p className="perfil-borrador-card__description">
                      {descripcion.slice(0, 100)}
                      {descripcion.length > 100 ? "..." : ""}
                    </p>
                  )}

                  <p className="perfil-borrador-card__date">
                    Guardado: {formatDate(draft.updated_at)}
                  </p>

                  {/* Acciones */}
                  <div className="perfil-borrador-card__actions">
                    <button
                      className="perfil-borrador-card__btn perfil-borrador-card__btn--preview"
                      onClick={() => setPreviewDraft(draft)}
                      title="Ver borrador">
                      <FontAwesomeIcon icon={faEye} />
                      Ver
                    </button>
                    <button
                      className="perfil-borrador-card__btn perfil-borrador-card__btn--continue"
                      onClick={() => handleContinueDraft(draft)}
                      title="Continuar editando">
                      <FontAwesomeIcon icon={faPencilAlt} />
                      Terminar
                    </button>
                    <button
                      className="perfil-borrador-card__btn perfil-borrador-card__btn--delete"
                      onClick={() => handleDeleteDraft(draft.id)}
                      disabled={deleting === draft.id}
                      title="Eliminar borrador">
                      {deleting === draft.id ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faTrash} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de preview */}
      {previewDraft && (
        <DraftPreviewModal
          draft={previewDraft}
          onClose={() => setPreviewDraft(null)}
          onContinue={() => {
            setPreviewDraft(null);
            handleContinueDraft(previewDraft);
          }}
        />
      )}
    </div>
  );
}

// Componente modal para previsualizar borrador
function DraftPreviewModal({ draft, onClose, onContinue }) {
  const draftData = draft.data || {};

  // Campos a mostrar
  const fields = [
    { label: "Título", value: draftData.titulo },
    {
      label: "Categoría",
      value: draftData.categoria_nombre || draftData.categoria,
    },
    { label: "Descripción", value: draftData.descripcion },
    { label: "Comuna", value: draftData.comuna },
    { label: "Dirección", value: draftData.direccion },
    { label: "Fecha inicio", value: draftData.fecha_inicio },
    { label: "Fecha término", value: draftData.fecha_termino },
    {
      label: "Horario",
      value:
        draftData.hora_inicio && draftData.hora_termino
          ? `${draftData.hora_inicio} - ${draftData.hora_termino}`
          : null,
    },
    { label: "Precio", value: draftData.precio_entrada },
  ].filter((f) => f.value);

  return (
    <div className="draft-preview-modal__overlay" onClick={onClose}>
      <div className="draft-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="draft-preview-modal__header">
          <h3>Vista previa del borrador</h3>
          <button className="draft-preview-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="draft-preview-modal__content">
          {/* Imagen */}
          {draft.imagen_preview && (
            <div className="draft-preview-modal__image">
              <img src={draft.imagen_preview} alt="Preview" />
            </div>
          )}

          {/* Campos */}
          <div className="draft-preview-modal__fields">
            {fields.map((field, idx) => (
              <div key={idx} className="draft-preview-modal__field">
                <span className="draft-preview-modal__label">
                  {field.label}:
                </span>
                <span className="draft-preview-modal__value">
                  {field.value}
                </span>
              </div>
            ))}
          </div>

          {/* Imágenes adicionales */}
          {draftData.imagenes_preview?.length > 0 && (
            <div className="draft-preview-modal__gallery">
              <span className="draft-preview-modal__label">Imágenes:</span>
              <div className="draft-preview-modal__gallery-grid">
                {draftData.imagenes_preview.map((img, idx) => (
                  <img key={idx} src={img} alt={`Preview ${idx + 1}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="draft-preview-modal__footer">
          <button
            className="draft-preview-modal__btn--secondary"
            onClick={onClose}>
            Cerrar
          </button>
          <button
            className="draft-preview-modal__btn--primary"
            onClick={onContinue}>
            <FontAwesomeIcon icon={faPencilAlt} />
            Terminar publicación
          </button>
        </div>
      </div>
    </div>
  );
}
