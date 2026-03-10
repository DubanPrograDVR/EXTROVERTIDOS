import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSpinner,
  faMapMarkerAlt,
  faNewspaper,
  faEye,
  faEdit,
  faTrash,
  faPause,
  faPlay,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import {
  getCategories,
  updateEvent,
  deleteEvent,
  pauseEvent,
} from "../../../lib/database";
import { useToast } from "../../../context/ToastContext";
import PublicationModal from "../../Superguia/PublicationModal";
import { UserEditModal } from "./editar";
import "./styles/section.css";
import "./styles/publicaciones.css";

export default function PerfilPublicaciones({
  publications,
  loading,
  onPublicationUpdate,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Estados para los modales
  const [viewModal, setViewModal] = useState({
    open: false,
    publication: null,
  });
  const [editModal, setEditModal] = useState({
    open: false,
    publication: null,
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [pausing, setPausing] = useState(null); // ID del evento en pausa/reactivación
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Cargar categorías para el modal de edición
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };
    loadCategories();
  }, []);

  // Abrir modal de ver
  const handleView = (publication) => {
    setViewModal({ open: true, publication });
  };

  // Cerrar modal de ver
  const handleCloseView = () => {
    setViewModal({ open: false, publication: null });
  };

  // Abrir modal de editar
  const handleEdit = (publication) => {
    setEditModal({ open: true, publication });
  };

  // Cerrar modal de editar
  const handleCloseEdit = () => {
    setEditModal({ open: false, publication: null });
  };

  // Abrir modal de confirmación de eliminación
  const handleDeleteClick = (publication) => {
    setDeleteConfirm(publication);
  };

  // Cancelar eliminación
  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(deleteConfirm.id);
    try {
      await deleteEvent(deleteConfirm.id);
      if (showToast) {
        showToast("Publicación eliminada correctamente", "success");
      }
      setDeleteConfirm(null);
      if (onPublicationUpdate) {
        onPublicationUpdate();
      }
    } catch (error) {
      console.error("Error al eliminar publicación:", error);
      if (showToast) {
        showToast("Error al eliminar la publicación", "error");
      }
    } finally {
      setDeleting(null);
    }
  };

  // Pausar / reactivar publicación
  const handlePause = async (publication) => {
    const willPause = !publication.is_paused;
    setPausing(publication.id);
    try {
      await pauseEvent(publication.id, willPause);
      if (showToast) {
        showToast(
          willPause
            ? "Publicación pausada. Ya no es visible en Panorama."
            : "Publicación reactivada y visible nuevamente.",
          "success",
        );
      }
      if (onPublicationUpdate) onPublicationUpdate();
    } catch (error) {
      console.error("Error al pausar publicación:", error);
      if (showToast)
        showToast("Error al cambiar el estado de la publicación", "error");
    } finally {
      setPausing(null);
    }
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (eventId, eventData) => {
    setSaving(true);
    try {
      await updateEvent(eventId, eventData);

      if (showToast) {
        showToast("¡Publicación actualizada exitosamente!", "success");
      }

      handleCloseEdit();

      // Notificar al padre para recargar las publicaciones
      if (onPublicationUpdate) {
        onPublicationUpdate();
      }
    } catch (error) {
      console.error("Error al actualizar publicación:", error);
      if (showToast) {
        showToast("Error al actualizar la publicación", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Mis Publicaciones</h2>
        <button
          className="perfil-section__btn"
          onClick={() => navigate("/publicar-panorama")}>
          <FontAwesomeIcon icon={faPlus} />
          Nueva Publicación
        </button>
      </div>

      {loading ? (
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando publicaciones...</p>
        </div>
      ) : publications.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faNewspaper} />
          <h3>No tienes publicaciones aún</h3>
          <p>¡Crea tu primera publicación y compártela con la comunidad!</p>
          <button onClick={() => navigate("/publicar-panorama")}>
            Crear Publicación
          </button>
        </div>
      ) : (
        <div className="perfil-publications__grid">
          {publications.map((pub) => {
            // Obtener la primera imagen del array o usar placeholder
            const imageUrl =
              Array.isArray(pub.imagenes) && pub.imagenes.length > 0
                ? pub.imagenes[0]
                : "/img/Home1.png";

            return (
              <article key={pub.id} className="perfil-publication-card">
                <div className="perfil-publication-card__image">
                  <img
                    src={imageUrl}
                    alt={pub.titulo}
                    onError={(e) => {
                      e.target.src = "/img/Home1.png";
                    }}
                  />
                  <span
                    className={`perfil-publication-card__status ${
                      pub.estado || "activo"
                    }`}>
                    {pub.estado || "activo"}
                  </span>
                </div>
                <div className="perfil-publication-card__content">
                  <span className="perfil-publication-card__category">
                    {pub.categories?.nombre || "Sin categoría"}
                  </span>
                  <h3 className="perfil-publication-card__title">
                    {pub.titulo}
                  </h3>
                  <p className="perfil-publication-card__info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {pub.comuna}, {pub.provincia} •{" "}
                    {new Date(pub.fecha_evento).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="perfil-publication-card__actions">
                    <button
                      className="perfil-publication-card__btn"
                      onClick={() => handleView(pub)}>
                      <FontAwesomeIcon icon={faEye} />
                      Ver
                    </button>
                    <button
                      className="perfil-publication-card__btn"
                      onClick={() => handleEdit(pub)}>
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>
                    {pub.estado === "publicado" && (
                      <button
                        className={`perfil-publication-card__btn ${
                          pub.is_paused
                            ? "perfil-publication-card__btn--unpause"
                            : "perfil-publication-card__btn--pause"
                        }`}
                        onClick={() => handlePause(pub)}
                        disabled={pausing === pub.id}>
                        <FontAwesomeIcon
                          icon={
                            pausing === pub.id
                              ? faSpinner
                              : pub.is_paused
                                ? faPlay
                                : faPause
                          }
                          spin={pausing === pub.id}
                        />
                        {pausing === pub.id
                          ? "..."
                          : pub.is_paused
                            ? "Reactivar"
                            : "Pausar"}
                      </button>
                    )}
                    <button
                      className="perfil-publication-card__btn perfil-publication-card__btn--delete"
                      onClick={() => handleDeleteClick(pub)}
                      disabled={deleting === pub.id}>
                      <FontAwesomeIcon
                        icon={deleting === pub.id ? faSpinner : faTrash}
                        spin={deleting === pub.id}
                      />
                      {deleting === pub.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de vista previa */}
      <PublicationModal
        publication={viewModal.publication}
        isOpen={viewModal.open}
        onClose={handleCloseView}
      />

      {/* Modal de edición */}
      <UserEditModal
        isOpen={editModal.open}
        onClose={handleCloseEdit}
        event={editModal.publication}
        categories={categories}
        onSave={handleSaveEdit}
        loading={saving}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div
          className="perfil-delete-modal-overlay"
          onClick={handleDeleteCancel}>
          <div
            className="perfil-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="perfil-delete-modal__icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3>¿Eliminar publicación?</h3>
            <p>
              Estás a punto de eliminar permanentemente{" "}
              <strong>"{deleteConfirm.titulo}"</strong>.
            </p>
            <p className="perfil-delete-modal__warning">
              Esta acción no se puede deshacer.
            </p>
            <div className="perfil-delete-modal__actions">
              <button
                className="perfil-delete-modal__btn perfil-delete-modal__btn--cancel"
                onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button
                className="perfil-delete-modal__btn perfil-delete-modal__btn--confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting === deleteConfirm.id}>
                {deleting === deleteConfirm.id ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Eliminando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
