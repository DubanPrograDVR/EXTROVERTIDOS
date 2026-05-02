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
  faRedoAlt,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import {
  getCategories,
  getEventById,
  updateEvent,
  deleteEvent,
  pauseEvent,
} from "../../../lib/database";
import { resubmitEvent } from "../../../lib/database/events";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
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
  const { user, isAdmin, isModerator } = useAuth();

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
  const [resubmitting, setResubmitting] = useState(null);
  const [loadingView, setLoadingView] = useState(null);
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
  const handleView = async (publication) => {
    setLoadingView(publication.id);
    try {
      const fullPublication = await getEventById(publication.id);
      setViewModal({
        open: true,
        publication: fullPublication || publication,
      });
    } catch (error) {
      console.error("Error al cargar publicación completa:", error);
      if (showToast) {
        showToast(
          "No se pudo cargar toda la información de la publicación",
          "error",
        );
      }
      setViewModal({ open: true, publication });
    } finally {
      setLoadingView(null);
    }
  };

  // Ir a la publicación en la página pública con resaltado
  const handleGoToPublication = (publication) => {
    navigate(`/panoramas?highlight=${publication.id}`);
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
      await updateEvent(eventId, eventData, {
        adminOverride: isAdmin || isModerator,
      });

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

  // Reenviar publicación rechazada a revisión
  const handleResubmit = async (pub) => {
    setResubmitting(pub.id);
    try {
      await resubmitEvent(pub.id, user?.id, isAdmin, isModerator);
      if (showToast) {
        showToast("¡Publicación reenviada a revisión!", "success");
      }
      if (onPublicationUpdate) {
        onPublicationUpdate();
      }
    } catch (error) {
      console.error("Error al reenviar publicación:", error);
      if (showToast) {
        showToast(error.message || "Error al reenviar la publicación", "error");
      }
    } finally {
      setResubmitting(null);
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
            const isReviewLocked =
              pub.estado === "en_revision" || pub.estado === "pendiente";

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
                    {pub.estado === "en_revision"
                      ? "En revisión"
                      : pub.estado === "publicado"
                        ? "Publicado"
                        : pub.estado === "rechazado"
                          ? "Rechazado"
                          : pub.estado === "pendiente"
                            ? "Pendiente"
                            : pub.estado || "activo"}
                  </span>
                </div>
                <div className="perfil-publication-card__content">
                  <span className="perfil-publication-card__category">
                    {pub.categories?.nombre || "Sin categoría"}
                  </span>
                  <div className="perfil-publication-card__title-row">
                    <h3 className="perfil-publication-card__title">
                      {pub.titulo}
                    </h3>
                    {pub.estado === "publicado" && (
                      <button
                        type="button"
                        className="perfil-publication-card__goto"
                        onClick={() => handleGoToPublication(pub)}
                        title="Ver en Panoramas">
                        <FontAwesomeIcon icon={faLocationArrow} />
                        Ir
                      </button>
                    )}
                  </div>
                  <p className="perfil-publication-card__info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {pub.comuna}, {pub.provincia} •{" "}
                    {new Date(pub.fecha_evento).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {pub.estado === "en_revision" && (
                    <div className="perfil-publication-card__review">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>
                        Tu publicación está en revisión. Un administrador la
                        revisará pronto.
                      </span>
                    </div>
                  )}
                  {pub.estado === "rechazado" && (
                    <div className="perfil-publication-card__rejection">
                      {pub.motivo_rechazo && (
                        <p className="perfil-publication-card__rejection-reason">
                          <strong>Motivo del rechazo:</strong>{" "}
                          {pub.motivo_rechazo}
                        </p>
                      )}
                      {(pub.revision_count || 0) < 3 ? (
                        <button
                          className="perfil-publication-card__btn perfil-publication-card__btn--resubmit"
                          onClick={() => handleResubmit(pub)}
                          disabled={resubmitting === pub.id}>
                          <FontAwesomeIcon
                            icon={
                              resubmitting === pub.id ? faSpinner : faRedoAlt
                            }
                            spin={resubmitting === pub.id}
                          />
                          {resubmitting === pub.id
                            ? "Reenviando..."
                            : `Reenviar a revisión (${3 - (pub.revision_count || 0)} intentos restantes)`}
                        </button>
                      ) : (
                        <p className="perfil-publication-card__rejection-limit">
                          Has alcanzado el máximo de 3 intentos de revisión
                        </p>
                      )}
                    </div>
                  )}
                  <div className="perfil-publication-card__actions">
                    <button
                      className="perfil-publication-card__btn"
                      onClick={() => handleView(pub)}
                      disabled={loadingView === pub.id}>
                      <FontAwesomeIcon
                        icon={loadingView === pub.id ? faSpinner : faEye}
                        spin={loadingView === pub.id}
                      />
                      {loadingView === pub.id ? "Cargando..." : "Ver"}
                    </button>
                    <button
                      className={`perfil-publication-card__btn ${
                        isReviewLocked
                          ? "perfil-publication-card__btn--locked"
                          : ""
                      }`}
                      onClick={() => handleEdit(pub)}
                      disabled={isReviewLocked}
                      title={
                        isReviewLocked
                          ? "No puedes editar mientras está en revisión"
                          : "Editar"
                      }>
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
        modalVariant="panoramas"
      />

      {/* Modal de edición */}
      <UserEditModal
        isOpen={editModal.open}
        onClose={handleCloseEdit}
        event={editModal.publication}
        categories={categories}
        onSave={handleSaveEdit}
        loading={saving}
        userId={user?.id}
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
