import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faStore,
  faSpinner,
  faClock,
  faHourglassHalf,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faEye,
  faEdit,
  faTrash,
  faPause,
  faPlay,
  faExclamationTriangle,
  faRedoAlt,
  faLocationArrow,
  faCalendarXmark,
  faBoltLightning,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  getBusinessesByUser,
  getBusinessCategories,
  updateBusiness,
  deleteOwnBusiness,
  pauseBusiness,
  getActiveSuperguiaWithQuota,
} from "../../../lib/database";
import {
  resubmitBusiness,
  republishBusiness,
  isBusinessExpired,
  getDiasRestantesNegocio,
} from "../../../lib/database/businesses";
import { useToast } from "../../../context/ToastContext";
import { useRealtimeRefetch } from "../../../hooks/useRealtimeRefetch";
import BusinessModal from "../../Superguia/BusinessModal";
import "./styles/section.css";
import "./styles/publicaciones.css";

export default function PerfilNegocios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, business: null });
  const [editModal, setEditModal] = useState({ open: false, business: null });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [pausing, setPausing] = useState(null);
  const [resubmitting, setResubmitting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [republishing, setRepublishing] = useState(null);
  const [superguiaQuota, setSuperguiaQuota] = useState({
    subscription: null,
    hasQuota: false,
    isExpired: false,
    diasRestantesPlan: null,
    hasActiveBusiness: false,
  });

  const reloadSuperguiaQuota = useCallback(async () => {
    if (!user) return;
    try {
      const info = await getActiveSuperguiaWithQuota(user.id);
      setSuperguiaQuota(info);
    } catch (err) {
      console.error("Error cargando suscripción superguía:", err);
    }
  }, [user]);

  useEffect(() => {
    reloadSuperguiaQuota();
  }, [reloadSuperguiaQuota]);

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBusinessesByUser(user.id);
        setBusinesses(data || []);
      } catch (err) {
        console.error("Error cargando negocios:", err);
        setError("No se pudieron cargar tus negocios");
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [user]);

  // Cargar categorías de negocio para el editor
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getBusinessCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };
    loadCategories();
  }, []);

  const reloadBusinesses = async () => {
    if (!user) return;
    try {
      const data = await getBusinessesByUser(user.id);
      setBusinesses(data || []);
    } catch (err) {
      console.error("Error recargando negocios:", err);
    }
  };

  // Tiempo real: refrescar negocios del usuario en vivo
  useRealtimeRefetch({
    table: "businesses",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(user?.id),
    onChange: () => reloadBusinesses(),
  });

  // Tiempo real: refrescar cupo de suscripción superguía en vivo
  useRealtimeRefetch({
    table: "subscriptions",
    event: "*",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(user?.id),
    onChange: () => reloadSuperguiaQuota(),
  });

  // Guardar edición
  const handleSaveEdit = async (businessId, businessData) => {
    setSaving(true);
    try {
      await updateBusiness(businessId, businessData, user.id);
      if (showToast) {
        showToast("¡Negocio actualizado exitosamente!", "success");
      }
      // Mantener el modal abierto reflejando los cambios en vivo
      setEditModal((prev) => ({
        ...prev,
        business: { ...prev.business, ...businessData },
      }));
      await reloadBusinesses();
    } catch (err) {
      console.error("Error al actualizar negocio:", err);
      if (showToast) {
        showToast("Error al actualizar el negocio", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Reenviar negocio rechazado a revisión
  const handleResubmit = async (business) => {
    setResubmitting(business.id);
    try {
      await resubmitBusiness(business.id);
      if (showToast) {
        showToast("¡Negocio reenviado a revisión!", "success");
      }
      await reloadBusinesses();
    } catch (error) {
      console.error("Error al reenviar negocio:", error);
      if (showToast) {
        showToast(error.message || "Error al reenviar el negocio", "error");
      }
    } finally {
      setResubmitting(null);
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !user) return;
    setDeleting(deleteConfirm.id);
    try {
      await deleteOwnBusiness(deleteConfirm.id, user.id);
      if (showToast) {
        showToast("Negocio eliminado correctamente", "success");
      }
      setDeleteConfirm(null);
      await reloadBusinesses();
    } catch (err) {
      console.error("Error al eliminar negocio:", err);
      if (showToast) {
        showToast("Error al eliminar el negocio", "error");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handlePauseBusiness = async (business) => {
    const willPause = !business.is_paused;
    setPausing(business.id);
    try {
      await pauseBusiness(business.id, willPause);
      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === business.id ? { ...item, is_paused: willPause } : item,
        ),
      );
      if (showToast) {
        showToast(
          willPause
            ? "Negocio pausado. Ya no es visible en Superguía."
            : "Negocio reactivado y visible nuevamente.",
          "success",
        );
      }
    } catch (err) {
      console.error("Error al pausar negocio:", err);
      if (showToast) {
        showToast("Error al cambiar el estado del negocio", "error");
      }
    } finally {
      setPausing(null);
    }
  };

  // Republicar (reactivar) un negocio expirado, consumiendo cupo del plan.
  const handleRepublish = async (business) => {
    if (!user) return;
    setRepublishing(business.id);
    try {
      await republishBusiness(business.id, user.id);
      if (showToast) {
        showToast(
          "¡Negocio reactivado y publicado nuevamente por 30 días!",
          "success",
        );
      }
      await Promise.all([reloadBusinesses(), reloadSuperguiaQuota()]);
    } catch (err) {
      console.error("Error al republicar negocio:", err);
      if (showToast) {
        showToast(
          err?.message || "No se pudo reactivar el negocio",
          "error",
        );
      }
    } finally {
      setRepublishing(null);
    }
  };

  // Llevar al usuario a la página de planes para reactivar/comprar Superguía.
  const handleGoActivarPlan = (business) => {
    navigate(`/activar-plan?reactivar=${business.id}`);
  };

  // Renderizar badge de estado
  const renderStatusBadge = (business) => {
    if (isBusinessExpired(business)) {
      return (
        <span className="status-badge status-badge--expired">
          <FontAwesomeIcon icon={faCalendarXmark} />
          Expirado
        </span>
      );
    }

    if (business.estado === "publicado" && business.is_paused) {
      return (
        <span className="status-badge status-badge--paused">
          <FontAwesomeIcon icon={faPause} />
          Pausado
        </span>
      );
    }

    const statusConfig = {
      pendiente: {
        icon: faClock,
        label: "Pendiente",
        className: "status-badge--pending",
      },
      en_revision: {
        icon: faHourglassHalf,
        label: "En revisión",
        className: "status-badge--review",
      },
      publicado: {
        icon: faCheckCircle,
        label: "Publicado",
        className: "status-badge--published",
      },
      rechazado: {
        icon: faTimesCircle,
        label: "Rechazado",
        className: "status-badge--rejected",
      },
    };

    const config = statusConfig[business.estado] || statusConfig.pendiente;

    return (
      <span className={`status-badge ${config.className}`}>
        <FontAwesomeIcon icon={config.icon} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Negocios</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Cargando negocios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Negocios</h2>
        </div>
        <div className="perfil-section__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Mis Negocios</h2>
        <button
          className="perfil-section__btn"
          onClick={() => navigate("/publicar-negocio")}>
          <FontAwesomeIcon icon={faPlus} />
          Nuevo Negocio
        </button>
      </div>

      {businesses.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faStore} />
          <h3>No tienes negocios registrados</h3>
          <p>Registra tu negocio y llega a más clientes con Extrovertidos</p>
          <button onClick={() => navigate("/publicar-negocio")}>
            Registrar Negocio
          </button>
        </div>
      ) : (
        <div className="perfil-negocios__grid">
          {businesses.map((business) => {
            const imageUrl =
              (Array.isArray(business.imagenes) && business.imagenes.length > 0
                ? business.imagenes[0]
                : null) ||
              business.imagen_url ||
              null;
            const expired = isBusinessExpired(business);
            const diasRestantes = getDiasRestantesNegocio(business);
            const isActivePublished =
              business.estado === "publicado" &&
              !business.is_paused &&
              !expired;

            return (
              <article key={business.id} className="perfil-business-card">
                <div className="perfil-business-card__image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={business.nombre}
                      onError={(e) => {
                        e.target.src = "/img/Home1.png";
                      }}
                    />
                  ) : (
                    <div className="perfil-business-card__placeholder">
                      <FontAwesomeIcon icon={faStore} />
                    </div>
                  )}
                  {renderStatusBadge(business)}
                </div>
                <div className="perfil-business-card__content">
                  {business.categoria && (
                    <span className="perfil-business-card__category">
                      {business.categoria}
                    </span>
                  )}
                  <div className="perfil-business-card__title-row">
                    <h3 className="perfil-business-card__title">
                      {business.nombre}
                    </h3>
                    {isActivePublished && (
                      <button
                        type="button"
                        className="perfil-business-card__goto"
                        onClick={() =>
                          navigate(`/superguia?highlight=${business.id}`)
                        }
                        title="Ver en Superguía">
                        <FontAwesomeIcon icon={faLocationArrow} />
                        Ir
                      </button>
                    )}
                  </div>
                  <p className="perfil-business-card__info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {business.direccion || "Sin dirección"}
                    {business.telefono ? ` • ${business.telefono}` : ""}
                  </p>

                  {/* Mini tarjeta: días restantes (negocio activo) */}
                  {isActivePublished && diasRestantes !== null && (
                    <div className="perfil-business-card__plan-info">
                      <FontAwesomeIcon icon={faClock} />
                      <span>
                        {diasRestantes > 0
                          ? `Termina en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`
                          : "Termina hoy"}
                      </span>
                    </div>
                  )}

                  {/* Bloque expirado: opciones de reactivación */}
                  {expired && (
                    <div className="perfil-business-card__expired-block">
                      <p className="perfil-business-card__expired-msg">
                        Tu Publicación de Negocio en la Superguía ha terminado.
                        <br />
                        Haz click en Reactivar plan para publicarlo nuevamente.
                      </p>
                      {superguiaQuota.hasQuota ? (
                        <>
                          <button
                            className="perfil-publication-card__btn perfil-publication-card__btn--reactivar"
                            onClick={() => handleRepublish(business)}
                            disabled={republishing === business.id}>
                            <FontAwesomeIcon
                              icon={
                                republishing === business.id
                                  ? faSpinner
                                  : faBoltLightning
                              }
                              spin={republishing === business.id}
                            />
                            {republishing === business.id
                              ? "Reactivando..."
                              : "Volver a publicar negocio"}
                          </button>
                          <button
                            className="perfil-business-card__btn"
                            onClick={() => navigate("/publicar-negocio")}>
                            <FontAwesomeIcon icon={faPlus} />
                            Crear negocio nuevo
                          </button>
                        </>
                      ) : (
                        <button
                          className="perfil-publication-card__btn perfil-publication-card__btn--reactivar"
                          onClick={() => handleGoActivarPlan(business)}>
                          <FontAwesomeIcon icon={faRedoAlt} />
                          Reactivar Plan
                        </button>
                      )}
                    </div>
                  )}

                  {business.estado === "pendiente" && (
                    <div className="perfil-publication-card__review">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>
                        Tu negocio está en revisión. Un administrador lo
                        revisará pronto.
                      </span>
                    </div>
                  )}
                  {business.estado === "en_revision" && (
                    <div className="perfil-publication-card__review">
                      <FontAwesomeIcon icon={faHourglassHalf} />
                      <span>
                        Tu publicación está en revisión. Un administrador la
                        revisará pronto.
                      </span>
                    </div>
                  )}
                  {business.estado === "rechazado" && (
                    <div className="perfil-business-card__rejection">
                      {business.motivo_rechazo && (
                        <p className="perfil-publication-card__rejection-reason">
                          <strong>Motivo del rechazo:</strong>{" "}
                          {business.motivo_rechazo}
                        </p>
                      )}
                      {(business.revision_count || 0) < 3 ? (
                        <button
                          className="perfil-publication-card__btn perfil-publication-card__btn--resubmit"
                          onClick={() => handleResubmit(business)}
                          disabled={resubmitting === business.id}>
                          <FontAwesomeIcon
                            icon={
                              resubmitting === business.id
                                ? faSpinner
                                : faRedoAlt
                            }
                            spin={resubmitting === business.id}
                          />
                          {resubmitting === business.id
                            ? "Reenviando..."
                            : `Reenviar a revisión (${3 - (business.revision_count || 0)} intentos restantes)`}
                        </button>
                      ) : (
                        <p className="perfil-publication-card__rejection-limit">
                          Has alcanzado el máximo de 3 intentos de revisión
                        </p>
                      )}
                    </div>
                  )}

                  {/* Acciones estándar: ocultas cuando el negocio está expirado */}
                  {!expired && (
                    <div className="perfil-business-card__actions">
                      <button
                        className="perfil-business-card__btn"
                        onClick={() => setViewModal({ open: true, business })}>
                        <FontAwesomeIcon icon={faEye} />
                        Ver
                      </button>
                      <button
                        className="perfil-business-card__btn"
                        onClick={() => setEditModal({ open: true, business })}
                        disabled={
                          business.estado === "pendiente" ||
                          business.estado === "en_revision"
                        }
                        title={
                          business.estado === "pendiente" ||
                          business.estado === "en_revision"
                            ? "No puedes editar mientras está en revisión"
                            : "Editar"
                        }>
                        <FontAwesomeIcon icon={faEdit} />
                        Editar
                      </button>
                      {business.estado === "publicado" && (
                        <button
                          className={`perfil-business-card__btn ${
                            business.is_paused
                              ? "perfil-publication-card__btn--unpause"
                              : "perfil-publication-card__btn--pause"
                          }`}
                          onClick={() => handlePauseBusiness(business)}
                          disabled={pausing === business.id}>
                          <FontAwesomeIcon
                            icon={
                              pausing === business.id
                                ? faSpinner
                                : business.is_paused
                                  ? faPlay
                                  : faPause
                            }
                            spin={pausing === business.id}
                          />
                          {pausing === business.id
                            ? "..."
                            : business.is_paused
                              ? "Reactivar"
                              : "Pausar"}
                        </button>
                      )}
                      <button
                        className="perfil-business-card__btn perfil-business-card__btn--delete"
                        onClick={() => setDeleteConfirm(business)}
                        disabled={deleting === business.id}>
                        <FontAwesomeIcon
                          icon={deleting === business.id ? faSpinner : faTrash}
                          spin={deleting === business.id}
                        />
                        {deleting === business.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de vista previa de negocio */}
      <BusinessModal
        business={viewModal.business}
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, business: null })}
      />

      {/* Modal de edición de negocio */}
      <BusinessModal
        business={editModal.business}
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, business: null })}
        startInEditMode={true}
        onUpdate={(updatedBusiness) => {
          // Reflejar cambios en vivo sin cerrar el modal
          if (updatedBusiness) {
            setEditModal((prev) => ({
              ...prev,
              business: { ...prev.business, ...updatedBusiness },
            }));
          }
          reloadBusinesses();
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div
          className="perfil-delete-modal-overlay"
          onClick={() => setDeleteConfirm(null)}>
          <div
            className="perfil-delete-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="perfil-delete-modal__icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3>¿Eliminar negocio?</h3>
            <p>
              Estás a punto de eliminar <strong>{deleteConfirm.nombre}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="perfil-delete-modal__actions">
              <button
                className="perfil-delete-modal__btn perfil-delete-modal__btn--cancel"
                onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                className="perfil-delete-modal__btn perfil-delete-modal__btn--confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting}>
                <FontAwesomeIcon
                  icon={deleting ? faSpinner : faTrash}
                  spin={!!deleting}
                />
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
