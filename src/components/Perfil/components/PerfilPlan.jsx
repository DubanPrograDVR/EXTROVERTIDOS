import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faStar,
  faRocket,
  faStore,
  faSpinner,
  faTimes,
  faExclamationTriangle,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  getUserSubscriptions,
  cancelSubscription,
} from "../../../lib/database";
import { useToast } from "../../../context/ToastContext";
import "./styles/section.css";
import "./styles/plan.css";

// Iconos del sitio
const iconPanorama = "/img/P_Extro.png";
const iconExtro = "/img/E_Extro.png";
const iconSuperguia = "/img/SG_Extro.png";

/**
 * Todos los planes disponibles con sus datos visuales
 */
const ALL_PLANS = [
  {
    key: "panorama_ilimitado",
    nombre: "¡Plan Publica sin límites!",
    icon: faCrown,
    img: iconPanorama,
  },
  {
    key: "superguia",
    nombre: "¡Superguía Extrovertidos!",
    icon: faStore,
    img: iconSuperguia,
  },
  {
    key: "panorama_unica",
    nombre: "¡Publicación Única!",
    icon: faStar,
    img: iconExtro,
  },
  {
    key: "panorama_pack4",
    nombre: "¡Pack 4 Publicaciones!",
    icon: faRocket,
    img: iconExtro,
  },
];

/**
 * Formatear fecha corta dd/MM/yyyy
 */
function formatDateShort(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isExpired(subscription) {
  if (!subscription?.fecha_fin) return false;
  return new Date(subscription.fecha_fin) <= new Date();
}

function hasRemainingQuota(subscription) {
  if (!subscription) return false;
  if (subscription.plan === "panorama_ilimitado") {
    return true;
  }
  if (subscription.plan === "superguia") {
    const total = Number(subscription.publicaciones_total ?? 0);
    // Suscripciones antiguas con total=0 no tienen límite
    if (total === 0) return true;
    const used = Number(subscription.publicaciones_usadas ?? 0);
    return used < total;
  }

  const total = Number(subscription.publicaciones_total ?? 0);
  const used = Number(subscription.publicaciones_usadas ?? 0);
  return used < total;
}

function isRenewablePanorama(subscription) {
  return (
    ["panorama_unica", "panorama_pack4", "superguia"].includes(
      subscription?.plan,
    ) &&
    subscription.estado === "activa" &&
    !isExpired(subscription) &&
    !hasRemainingQuota(subscription)
  );
}

export default function PerfilPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, sub: null });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserSubscriptions(user.id);
        setSubscriptions(data || []);
      } catch (error) {
        console.error("Error cargando suscripciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [user?.id]);

  /**
   * Buscar suscripción activa de un plan específico
   */
  const getPlanStatus = (planKey) => {
    const planSubs = subscriptions.filter((s) => s.plan === planKey);
    const activeUsable = planSubs.find(
      (s) => s.estado === "activa" && !isExpired(s) && hasRemainingQuota(s),
    );

    if (activeUsable) {
      return { type: "active", subscription: activeUsable };
    }

    const renewable = planSubs.find((s) => isRenewablePanorama(s));
    if (renewable) {
      return { type: "renewable", subscription: renewable };
    }

    return { type: "inactive", subscription: null };
  };

  const PANORAMA_PLANS = [
    "panorama_unica",
    "panorama_pack4",
    "panorama_ilimitado",
  ];

  const hasAnyActive = subscriptions.some(
    (s) => s.estado === "activa" && !isExpired(s),
  );
  const hasActiveWithQuota = subscriptions.some(
    (s) => s.estado === "activa" && !isExpired(s) && hasRemainingQuota(s),
  );
  const hasRenewablePlan = subscriptions.some((s) => isRenewablePanorama(s));

  // Verificar si ya tiene un plan panorama activo con cupo
  const hasActivePanoramaWithQuota = subscriptions.some(
    (s) =>
      PANORAMA_PLANS.includes(s.plan) &&
      s.estado === "activa" &&
      !isExpired(s) &&
      hasRemainingQuota(s),
  );
  // Verificar si ya tiene superguía activa con cupo
  const hasActiveSuperguiaWithQuota = subscriptions.some(
    (s) =>
      s.plan === "superguia" &&
      s.estado === "activa" &&
      !isExpired(s) &&
      hasRemainingQuota(s),
  );

  /**
   * Abrir modal de confirmación de cancelación
   */
  const handleCancelClick = (sub, planName) => {
    setCancelModal({ open: true, sub, planName });
  };

  /**
   * Confirmar cancelación de suscripción
   */
  const handleConfirmCancel = async () => {
    if (!cancelModal.sub || cancelling) return;

    setCancelling(true);
    try {
      await cancelSubscription(cancelModal.sub.id);
      showToast("Suscripción cancelada exitosamente", "success");
      // Recargar suscripciones
      const data = await getUserSubscriptions(user.id);
      setSubscriptions(data || []);
      setCancelModal({ open: false, sub: null });
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);
      showToast(
        "Error al cancelar la suscripción. Intenta nuevamente.",
        "error",
      );
    } finally {
      setCancelling(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mi PLAN</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando información del plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-section">
      {/* Header con botón Ver Planes */}
      <div className="perfil-section__header">
        <h2>Mi PLAN</h2>
        <button
          className="perfil-plan__ver-planes-btn"
          onClick={() => navigate("/activar-plan")}>
          Ver Planes
        </button>
      </div>

      {/* Grilla 2x2 de todos los planes */}
      <div className="perfil-plan__grid">
        {ALL_PLANS.map((plan) => {
          const planStatus = getPlanStatus(plan.key);
          const activeSub = planStatus.subscription;
          const isContracted = planStatus.type === "active";
          const isRenewable = planStatus.type === "renewable";

          return (
            <div
              key={plan.key}
              className={`perfil-plan__card ${
                isContracted
                  ? "perfil-plan__card--active"
                  : "perfil-plan__card--inactive"
              }`}>
              <div className="perfil-plan__card-icon">
                <img src={plan.img} alt={plan.nombre} />
              </div>
              <h3 className="perfil-plan__card-name">{plan.nombre}</h3>

              {isContracted ? (
                <>
                  <div className="perfil-plan__card-dates">
                    <p>
                      <strong>Activación:</strong>{" "}
                      {formatDateShort(activeSub.fecha_inicio)}
                    </p>
                    <p>
                      <strong>Término:</strong>{" "}
                      {formatDateShort(activeSub.fecha_fin)}
                    </p>
                  </div>

                  {/* Mostrar cupos utilizados para planes limitados */}
                  {["panorama_unica", "panorama_pack4"].includes(plan.key) && (
                    <div className="perfil-plan__card-quota">
                      <span>{Number(activeSub.publicaciones_usadas ?? 0)}</span>
                      <span className="perfil-plan__card-quota-separator">
                        /
                      </span>
                      <span>{Number(activeSub.publicaciones_total ?? 0)}</span>
                      <span className="perfil-plan__card-quota-label">
                        publicaciones usadas
                      </span>
                    </div>
                  )}

                  {/* Mostrar cupos para plan Superguía */}
                  {plan.key === "superguia" &&
                    Number(activeSub.publicaciones_total ?? 0) > 0 && (
                      <div className="perfil-plan__card-quota">
                        <span>
                          {Number(activeSub.publicaciones_usadas ?? 0)}
                        </span>
                        <span className="perfil-plan__card-quota-separator">
                          /
                        </span>
                        <span>
                          {Number(activeSub.publicaciones_total ?? 0)}
                        </span>
                        <span className="perfil-plan__card-quota-label">
                          negocio publicado
                        </span>
                      </div>
                    )}

                  <span className="perfil-plan__card-badge">Contratado</span>
                  <button
                    className="perfil-plan__cancel-btn"
                    onClick={() => handleCancelClick(activeSub, plan.nombre)}>
                    Cancelar Plan
                  </button>
                </>
              ) : (
                <div className="perfil-plan__card-inactive-msg">
                  <p>No contratado</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA inferior */}
      {!hasActiveWithQuota && (
        <div className="perfil-plan__cta">
          <div className="perfil-plan__cta-icon">
            <img src={iconExtro} alt="Extrovertidos" />
          </div>
          <h3>
            {hasRenewablePlan
              ? "¡Ya puedes volver a suscribirte!"
              : "Aún no tienes una suscripción activa"}
          </h3>
          <p>
            {hasRenewablePlan
              ? "Tu cupo ya fue utilizado. Puedes activar nuevamente el mismo plan o elegir una opción distinta."
              : "¡Suscríbete a un plan para poder publicar en Extrovertidos!"}
          </p>
          <button
            className="perfil-plan__cta-btn"
            onClick={() => navigate("/activar-plan")}>
            {hasRenewablePlan ? "Volver a suscribirme" : "Ver Planes"}
          </button>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {cancelModal.open && (
        <div
          className="perfil-plan__modal-overlay"
          onClick={() =>
            !cancelling && setCancelModal({ open: false, sub: null })
          }>
          <div
            className="perfil-plan__modal"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="perfil-plan__modal-close"
              onClick={() =>
                !cancelling && setCancelModal({ open: false, sub: null })
              }>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <div className="perfil-plan__modal-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3>¿Estás seguro que quieres cancelar tu suscripción?</h3>
            <p>
              Se cancelará tu plan <strong>{cancelModal.planName}</strong>. Esta
              acción no se puede deshacer.
            </p>
            <div className="perfil-plan__modal-actions">
              <button
                className="perfil-plan__modal-btn perfil-plan__modal-btn--cancel"
                onClick={() => setCancelModal({ open: false, sub: null })}
                disabled={cancelling}>
                No, mantener plan
              </button>
              <button
                className="perfil-plan__modal-btn perfil-plan__modal-btn--confirm"
                onClick={handleConfirmCancel}
                disabled={cancelling}>
                {cancelling ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Cancelando...
                  </>
                ) : (
                  "Sí, cancelar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
