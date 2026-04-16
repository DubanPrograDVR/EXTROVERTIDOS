import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faLock,
  faCalendarXmark,
  faExclamationTriangle,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./styles/plan-block-modal.css";

/**
 * Configuración de escenarios de bloqueo de publicación.
 * Cada escenario tiene: icono, título, mensaje y etiqueta de botón primario.
 */
const BLOCK_SCENARIOS = {
  // Sin plan contratado
  no_plan: {
    customImage: "/img/P_Extro.png",
    iconColor: "#ff6600",
    title: "¡Estás a un paso de publicar tu panorama!",
    getMessage: () =>
      "Adquiere una nueva suscripción a Panoramas para publicar",
    primaryLabel: "Ver planes",
  },

  // Plan vencido
  plan_expired: {
    customImage: "/img/P_Extro.png",
    iconColor: "#e74c3c",
    title: "¡Renueva tu plan ahora!",
    getMessage: ({ planExpiresAt }) => {
      const fecha = planExpiresAt
        ? new Date(planExpiresAt).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "N/A";
      return `Tu plan venció el ${fecha}.\nTe invitamos a seguir publicando tus panoramas en Extrovertidos.`;
    },
    primaryLabel: "Renovar plan",
  },

  // Cupos agotados
  quota_exceeded: {
    icon: faLock,
    iconColor: "#f39c12",
    title: "Has usado todos tus cupos",
    getMessage: ({ publicationsUsed, publicationsTotal }) => {
      return `Has utilizado ${publicationsUsed || 0} de ${publicationsTotal || 0} publicaciones de tu plan.\n\n¡Pero no te preocupes! Puedes volver a suscribirte para seguir publicando tus panoramas.`;
    },
    primaryLabel: "Volver a suscribirme",
  },

  // Error de servidor
  server_error: {
    icon: faExclamationTriangle,
    iconColor: "#e74c3c",
    title: "Error de conexión",
    getMessage: () =>
      "No pudimos verificar tu plan en este momento. Intenta nuevamente en unos segundos.",
    primaryLabel: "Reintentar",
  },
};

/**
 * Detecta el escenario de bloqueo basado en los datos de la suscripción y plan.
 *
 * @param {Object} params
 * @param {Object|null} params.subscription - Suscripción activa del usuario
 * @param {boolean} params.planesEnabled - Si las restricciones están activadas
 * @param {Object|null} params.planInfo - Info del plan (de getPlanInfo)
 * @returns {string|null} Clave del escenario o null si puede publicar
 */
export function detectBlockScenario({
  subscription,
  planesEnabled,
  planInfo,
  isAdmin,
  isModerator,
}) {
  // Admins y moderadores nunca se bloquean
  if (isAdmin || isModerator) return null;

  // Si planes no están habilitados, no bloquear
  if (!planesEnabled) return null;

  // Sin plan contratado
  if (!subscription) return "no_plan";

  // Plan vencido (fecha_fin <= ahora)
  if (subscription.fecha_fin) {
    const now = new Date();
    const endDate = new Date(subscription.fecha_fin);
    if (endDate <= now) return "plan_expired";
  }

  // Cupos agotados (solo para planes con límite)
  const planLimits = {
    panorama_unica: 1,
    panorama_pack4: 4,
    panorama_ilimitado: 0, // 0 = sin límite
  };
  const limit = planLimits[subscription.plan] ?? 0;
  if (limit > 0 && subscription.publicaciones_usadas >= limit) {
    return "quota_exceeded";
  }

  return null; // Puede publicar
}

/**
 * Modal interceptor que bloquea el acceso al formulario de publicación.
 * Se muestra ANTES del formulario cuando el usuario no tiene permisos para publicar.
 *
 * Escenarios:
 * - no_plan: No tiene plan contratado
 * - plan_expired: Plan vencido
 * - quota_exceeded: Cupos de publicación agotados
 * - server_error: Error al verificar el plan
 */
const PlanBlockModal = ({
  scenario = "no_plan",
  subscription = null,
  onRetry = null,
}) => {
  const navigate = useNavigate();

  const config = BLOCK_SCENARIOS[scenario] || BLOCK_SCENARIOS.no_plan;

  // Datos para el mensaje
  const messageData = {
    publicationsUsed: subscription?.publicaciones_usadas,
    publicationsTotal: subscription?.publicaciones_total,
    planExpiresAt: subscription?.fecha_fin,
  };

  const message = config.getMessage(messageData);

  const handlePrimary = () => {
    if (scenario === "server_error" && onRetry) {
      onRetry();
    } else {
      navigate("/activar-plan");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div
      className="plan-block-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={config.title}>
      <div className="plan-block-modal">
        {/* Botón cerrar (vuelve atrás) */}
        <button
          className="plan-block-modal__close"
          onClick={handleGoBack}
          aria-label="Volver atrás">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Icono o logo */}
        {config.customImage ? (
          <div className="plan-block-modal__icon">
            <img
              src={config.customImage}
              alt="Logo"
              style={{
                width: "160px",
                height: "auto",
                filter:
                  "drop-shadow(0 0 20px rgba(255, 102, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 102, 0, 0.4))",
              }}
            />
          </div>
        ) : (
          <div
            className="plan-block-modal__icon"
            style={{ color: config.iconColor }}>
            <FontAwesomeIcon icon={config.icon} />
          </div>
        )}

        {/* Título */}
        <h2 className="plan-block-modal__title">{config.title}</h2>

        {/* Mensaje (soporta \n para saltos de línea) */}
        <div className="plan-block-modal__message">
          {message.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="plan-block-modal__actions">
          <button
            className="plan-block-modal__btn plan-block-modal__btn--primary"
            onClick={handlePrimary}>
            {config.primaryLabel}
          </button>

          <button
            className="plan-block-modal__btn plan-block-modal__btn--secondary"
            onClick={handleGoBack}>
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanBlockModal;
