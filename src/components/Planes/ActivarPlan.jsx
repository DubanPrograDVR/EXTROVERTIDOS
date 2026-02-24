import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  getPlanPrices,
  isPlanesEnabled,
  getUserSubscriptions,
} from "../../lib/database";
import { initiatePayment, PaymentError } from "../../lib/payment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faArrowRight,
  faStar,
  faCrown,
  faRocket,
  faStore,
  faCalendarDays,
  faInfinity,
  faPlus,
  faChevronRight,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/activar-plan.css";

// Iconos del sitio
const logoExtro = "/img/Logo_extrovertidos.png";
const iconPanorama = "/img/P_Extro.png";
const iconExtro = "/img/E_Extro.png";
const iconSuperguia = "/img/SG_Extro.png";

/**
 * Planes de Panoramas disponibles
 */
const BASE_PLANES_PANORAMAS = [
  {
    id: "unica",
    nombre: "Publicación Única",
    descripcion: "Publica un panorama individual",
    icon: faStar,
    features: [
      "1 publicación de panorama",
      "Visible por 30 días",
      "Imágenes incluidas",
      "Soporte básico",
    ],
    destacado: false,
  },
  {
    id: "pack4",
    nombre: "Pack 4 Publicaciones",
    descripcion: "¡Publica Tus 4 Panoramas!",
    precioOriginal: 100000,
    icon: faRocket,
    duracion: "Plan 30 días",
    features: [
      "4 publicaciones de panorama",
      "Visible por 30 días",
      "Imágenes ilimitadas",
      "Soporte prioritario",
      "Estadísticas básicas",
    ],
    destacado: true,
    etiqueta: "Más Popular",
  },
  {
    id: "ilimitado",
    nombre: "Publica Sin Límite",
    descripcion: "¡Publica Todos Tus Panoramas!",
    icon: faCrown,
    duracion: "Plan 30 días",
    features: [
      "Publicaciones ilimitadas",
      "Visible por 30 días",
      "Imágenes ilimitadas",
      "Soporte VIP",
      "Estadísticas completas",
      "Prioridad en el feed",
    ],
    destacado: false,
  },
];

/**
 * Plan de Superguía (negocios)
 */
const BASE_PLAN_SUPERGUIA = {
  id: "superguia",
  nombre: "Superguía Extrovertidos",
  descripcion: "¡Publica Tu Negocio!",
  duracion: "365 días",
  features: [
    "Tu negocio visible todo el año",
    "Perfil completo del negocio",
    "Horarios y contacto",
    "Ubicación en mapa",
  ],
};

const DEFAULT_PLAN_PRICES = {
  unica: 25000,
  pack4: 39990,
  ilimitado: 70000,
  superguia: 15000,
};

const PLAN_TYPE_TO_ID = {
  panorama_unica: "unica",
  panorama_pack4: "pack4",
  panorama_ilimitado: "ilimitado",
  superguia: "superguia",
};

// Mapeo inverso: ID de frontend → plan_type en BD
const ID_TO_PLAN_TYPE = {
  unica: "panorama_unica",
  pack4: "panorama_pack4",
  ilimitado: "panorama_ilimitado",
  superguia: "superguia",
};

/**
 * Formateador de precios CLP
 */
const formatPrecio = (precio) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(precio);
};

export default function ActivarPlan() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [addSuperguia, setAddSuperguia] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [planPrices, setPlanPrices] = useState(DEFAULT_PLAN_PRICES);
  const [activePlans, setActivePlans] = useState(new Set());

  // Verificar si los planes están habilitados
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const enabled = await isPlanesEnabled();
        // Si no está habilitado y no es admin, redirigir
        if (!enabled && !isAdmin) {
          navigate("/", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error verificando acceso a planes:", error);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [loading, isAdmin, navigate]);

  // Cargar suscripciones activas del usuario
  useEffect(() => {
    const loadActiveSubscriptions = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const subs = await getUserSubscriptions(user.id);
        const activeSet = new Set();
        (subs || []).forEach((s) => {
          if (s.estado === "activa") {
            const frontendId = PLAN_TYPE_TO_ID[s.plan];
            if (frontendId) activeSet.add(frontendId);
          }
        });
        setActivePlans(activeSet);
      } catch (error) {
        console.error("Error cargando suscripciones activas:", error);
      }
    };

    loadActiveSubscriptions();
  }, [isAuthenticated, user?.id]);

  // Cargar precios configurados en admin
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const pricesByType = await getPlanPrices();
        const mapped = { ...DEFAULT_PLAN_PRICES };

        Object.entries(pricesByType || {}).forEach(([key, value]) => {
          const planId = PLAN_TYPE_TO_ID[key];
          if (planId) {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) {
              mapped[planId] = parsed;
            }
          }
        });

        setPlanPrices(mapped);
      } catch (error) {
        console.error("Error cargando precios de planes:", error);
      }
    };

    loadPrices();
  }, []);

  const planesPanoramas = useMemo(
    () =>
      BASE_PLANES_PANORAMAS.map((plan) => ({
        ...plan,
        precio: planPrices[plan.id] ?? DEFAULT_PLAN_PRICES[plan.id],
      })),
    [planPrices],
  );

  const planSuperguia = useMemo(
    () => ({
      ...BASE_PLAN_SUPERGUIA,
      precio: planPrices.superguia ?? DEFAULT_PLAN_PRICES.superguia,
    }),
    [planPrices],
  );

  // Calcular total
  const getTotal = () => {
    let total = 0;
    if (selectedPlan) {
      const plan = planesPanoramas.find((p) => p.id === selectedPlan);
      if (plan) total += plan.precio;
    }
    if (addSuperguia) total += planSuperguia.precio;
    return total;
  };

  const handleSiguiente = async () => {
    if (!selectedPlan && !addSuperguia) return;
    if (processingPayment) return;

    setProcessingPayment(true);

    try {
      // Iniciar el pago con Transbank a través de la Edge Function
      // La función valida los montos server-side y redirige a Transbank
      await initiatePayment({
        panoramaPlan: selectedPlan,
        addSuperguia,
        resourceId: null, // TODO: pasar business UUID cuando se implemente selección de negocio
      });
      // Si llegamos aquí, el usuario será redirigido a Transbank
      // (la función initiatePayment hace un form.submit() que redirige)
    } catch (error) {
      console.error("Error al iniciar pago:", error);
      setProcessingPayment(false);

      if (error instanceof PaymentError) {
        switch (error.code) {
          case "AUTH_REQUIRED":
            showToast("Debes iniciar sesión para realizar un pago", "error");
            break;
          case "CREATE_FAILED":
            showToast(
              error.message || "Error al iniciar el pago. Intenta nuevamente.",
              "error",
            );
            break;
          default:
            showToast(error.message || "Error al procesar el pago", "error");
        }
      } else {
        showToast("Error inesperado. Por favor intenta nuevamente.", "error");
      }
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="activar-plan__loading">
        <div className="activar-plan__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="activar-plan">
      {/* Progress bar */}
      <div className="activar-plan__progress">
        <div className="activar-plan__progress-bar">
          <div
            className="activar-plan__progress-fill"
            style={{ width: "33%" }}></div>
        </div>
        <span className="activar-plan__progress-text">Paso 1 de 3</span>
      </div>

      {/* Header */}
      <header className="activar-plan__header">
        <img
          src={logoExtro}
          alt="Extrovertidos"
          className="activar-plan__logo"
        />
        <h1 className="activar-plan__title">¡Elige tu mejor opción!</h1>
        <p className="activar-plan__subtitle">
          Selecciona una alternativa para Publicar tus Panoramas
        </p>
      </header>

      {/* Planes de Panoramas */}
      <section className="activar-plan__section">
        <div className="activar-plan__section-header">
          <img
            src={iconPanorama}
            alt="Panoramas"
            className="activar-plan__section-icon"
          />
          <h2 className="activar-plan__section-title">Panoramas</h2>
        </div>

        <div className="activar-plan__cards">
          {planesPanoramas.map((plan) => (
            <div
              key={plan.id}
              className={`activar-plan__card ${
                plan.destacado ? "activar-plan__card--featured" : ""
              } ${selectedPlan === plan.id ? "activar-plan__card--selected" : ""} ${activePlans.has(plan.id) ? "activar-plan__card--disabled" : ""}`}
              onClick={() =>
                !activePlans.has(plan.id) && setSelectedPlan(plan.id)
              }>
              {/* Etiqueta destacada */}
              {plan.etiqueta && (
                <span className="activar-plan__card-badge">
                  {plan.etiqueta}
                </span>
              )}

              {/* Icono del plan */}
              <div className="activar-plan__card-icon">
                <img
                  src={iconPanorama}
                  alt=""
                  className="activar-plan__card-icon-img"
                />
              </div>

              {/* Info del plan */}
              <h3 className="activar-plan__card-name">{plan.nombre}</h3>
              <p className="activar-plan__card-desc">{plan.descripcion}</p>

              {/* Precio */}
              <div className="activar-plan__card-pricing">
                {plan.precioOriginal && (
                  <span className="activar-plan__card-original">
                    {formatPrecio(plan.precioOriginal)}
                  </span>
                )}
                <span className="activar-plan__card-price">
                  {formatPrecio(plan.precio)}
                </span>
              </div>

              {/* Duración */}
              {plan.duracion && (
                <span className="activar-plan__card-duration">
                  {plan.duracion}
                </span>
              )}

              {/* Features */}
              <ul className="activar-plan__card-features">
                {plan.features.map((feat, i) => (
                  <li key={i}>
                    <FontAwesomeIcon icon={faCheck} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Botón seleccionar o mensaje de plan activo */}
              {activePlans.has(plan.id) ? (
                <div className="activar-plan__card-active-msg">
                  <FontAwesomeIcon icon={faBan} />
                  <span>Ya tienes esta suscripción activa</span>
                </div>
              ) : (
                <button
                  type="button"
                  className={`activar-plan__card-btn ${
                    selectedPlan === plan.id
                      ? "activar-plan__card-btn--active"
                      : ""
                  }`}>
                  {selectedPlan === plan.id ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Seleccionado
                    </>
                  ) : (
                    "Seleccionar"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Plan Superguía */}
      <section className="activar-plan__section activar-plan__section--superguia">
        <div className="activar-plan__section-header">
          <img
            src={iconExtro}
            alt="Extrovertidos"
            className="activar-plan__section-icon"
          />
          <h2 className="activar-plan__section-title">
            Superguía Extrovertidos
          </h2>
        </div>

        <div
          className={`activar-plan__superguia ${
            addSuperguia ? "activar-plan__superguia--selected" : ""
          } ${activePlans.has("superguia") ? "activar-plan__superguia--disabled" : ""}`}
          onClick={() =>
            !activePlans.has("superguia") && setAddSuperguia(!addSuperguia)
          }>
          <div className="activar-plan__superguia-content">
            <div className="activar-plan__superguia-icon">
              <FontAwesomeIcon icon={faStore} />
            </div>
            <div className="activar-plan__superguia-info">
              <h3>{planSuperguia.descripcion}</h3>
              <div className="activar-plan__superguia-price">
                <span className="activar-plan__superguia-amount">
                  {formatPrecio(planSuperguia.precio)}
                </span>
                <span className="activar-plan__superguia-duration">
                  <FontAwesomeIcon icon={faCalendarDays} /> ¡Por{" "}
                  {planSuperguia.duracion}!
                </span>
              </div>
              <ul className="activar-plan__superguia-features">
                {planSuperguia.features.map((feat, i) => (
                  <li key={i}>
                    <FontAwesomeIcon icon={faCheck} /> {feat}
                  </li>
                ))}
              </ul>
              <p className="activar-plan__superguia-slogan">
                ¡Haz que siempre te encuentren!
              </p>
            </div>
          </div>
          {activePlans.has("superguia") ? (
            <div className="activar-plan__card-active-msg activar-plan__superguia-active-msg">
              <FontAwesomeIcon icon={faBan} />
              <span>Ya tienes esta suscripción activa</span>
            </div>
          ) : (
            <button
              type="button"
              className={`activar-plan__superguia-btn ${
                addSuperguia ? "activar-plan__superguia-btn--active" : ""
              }`}>
              {addSuperguia ? (
                <>
                  <FontAwesomeIcon icon={faCheck} /> Agregado
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} /> Agregar
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* Footer con resumen y botón siguiente */}
      <footer className="activar-plan__footer">
        <div className="activar-plan__footer-summary">
          {(selectedPlan || addSuperguia) && (
            <div className="activar-plan__total">
              <span className="activar-plan__total-label">Total:</span>
              <span className="activar-plan__total-amount">
                {formatPrecio(getTotal())}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="activar-plan__next-btn"
          disabled={(!selectedPlan && !addSuperguia) || processingPayment}
          onClick={handleSiguiente}>
          {processingPayment ? (
            <>Procesando pago...</>
          ) : (
            <>
              Pagar con Webpay
              <FontAwesomeIcon icon={faChevronRight} />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
