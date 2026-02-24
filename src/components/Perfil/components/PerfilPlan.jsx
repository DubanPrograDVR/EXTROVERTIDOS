import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faStar,
  faRocket,
  faStore,
  faSpinner,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import { getUserSubscriptions } from "../../../lib/database";
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

export default function PerfilPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const getActiveSub = (planKey) => {
    return subscriptions.find(
      (s) => s.plan === planKey && s.estado === "activa",
    );
  };

  const hasAnyActive = subscriptions.some((s) => s.estado === "activa");

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
          const activeSub = getActiveSub(plan.key);
          const isContracted = !!activeSub;

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
                  <span className="perfil-plan__card-badge">Contratado</span>
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
      {!hasAnyActive && (
        <div className="perfil-plan__cta">
          <div className="perfil-plan__cta-icon">
            <img src={iconExtro} alt="Extrovertidos" />
          </div>
          <h3>¡Publica en Extrovertidos!</h3>
          <p>¡Elige un Plan para poder activar todas tus Publicaciones!</p>
          <button
            className="perfil-plan__cta-btn"
            onClick={() => navigate("/activar-plan")}>
            Ver Planes
          </button>
        </div>
      )}
    </div>
  );
}
