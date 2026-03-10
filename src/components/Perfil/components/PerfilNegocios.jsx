import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faStore,
  faSpinner,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faEye,
  faEdit,
  faTrash,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  getBusinessesByUser,
  getBusinessCategories,
  updateBusiness,
  deleteOwnBusiness,
} from "../../../lib/database";
import { useToast } from "../../../context/ToastContext";
import BusinessModal from "../../Superguia/BusinessModal";
import { UserBusinessEditModal } from "./editar";
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  // Guardar edición
  const handleSaveEdit = async (businessId, businessData) => {
    setSaving(true);
    try {
      await updateBusiness(businessId, businessData, user.id);
      if (showToast) {
        showToast(
          "Negocio actualizado. Pasará a revisión nuevamente.",
          "success",
        );
      }
      setEditModal({ open: false, business: null });
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

  // Renderizar badge de estado
  const renderStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: {
        icon: faClock,
        label: "Pendiente",
        className: "status-badge--pending",
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

    const config = statusConfig[estado] || statusConfig.pendiente;

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
          <p>Registra tu negocio y llega a más clientes en la región</p>
          <button onClick={() => navigate("/publicar-negocio")}>
            Registrar Negocio
          </button>
        </div>
      ) : (
        <div className="perfil-negocios__grid">
          {businesses.map((business) => {
            const imageUrl =
              business.imagen_url ||
              (Array.isArray(business.imagenes) && business.imagenes.length > 0
                ? business.imagenes[0]
                : null);

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
                  {renderStatusBadge(business.estado)}
                </div>
                <div className="perfil-business-card__content">
                  {business.categoria && (
                    <span className="perfil-business-card__category">
                      {business.categoria}
                    </span>
                  )}
                  <h3 className="perfil-business-card__title">
                    {business.nombre}
                  </h3>
                  <p className="perfil-business-card__info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {business.direccion || "Sin dirección"}
                    {business.telefono ? ` • ${business.telefono}` : ""}
                  </p>
                  {business.estado === "rechazado" &&
                    business.motivo_rechazo && (
                      <div className="perfil-business-card__rejection">
                        <strong>Motivo del rechazo:</strong>
                        <p>{business.motivo_rechazo}</p>
                      </div>
                    )}
                  <div className="perfil-business-card__actions">
                    <button
                      className="perfil-business-card__btn"
                      onClick={() => setViewModal({ open: true, business })}>
                      <FontAwesomeIcon icon={faEye} />
                      Ver
                    </button>
                    <button
                      className="perfil-business-card__btn"
                      onClick={() => setEditModal({ open: true, business })}>
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>
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
      <UserBusinessEditModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, business: null })}
        business={editModal.business}
        categories={categories}
        onSave={handleSaveEdit}
        loading={saving}
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
