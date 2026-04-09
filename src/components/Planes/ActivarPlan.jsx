import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  getPlanPrices,
  isPlanesEnabled,
  getUserSubscriptions,
} from "../../lib/database";
import { initiatePayment, PaymentError } from "../../lib/payment";
import AuthModal from "../Auth/AuthModal";
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
  faSpinner,
  faCircleCheck,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/activar-plan.css";

// Iconos del sitio
const logoExtro = "/img/Logo_con_r.png";
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

const PANORAMA_PLAN_TYPES = [
  "panorama_unica",
  "panorama_pack4",
  "panorama_ilimitado",
];

const isSubscriptionExpired = (subscription) => {
  if (!subscription?.fecha_fin) return false;
  return new Date(subscription.fecha_fin) <= new Date();
};

const hasRemainingQuota = (subscription) => {
  if (!subscription) return false;
  if (subscription.plan === "panorama_ilimitado") return true;

  const total = Number(subscription.publicaciones_total ?? 0);
  const used = Number(subscription.publicaciones_usadas ?? 0);
  return used < total;
};

const isRenewablePanoramaSubscription = (subscription) =>
  PANORAMA_PLAN_TYPES.includes(subscription?.plan) &&
  subscription.estado === "activa" &&
  !isSubscriptionExpired(subscription) &&
  !hasRemainingQuota(subscription);

const isBlockingPanoramaSubscription = (subscription) =>
  PANORAMA_PLAN_TYPES.includes(subscription?.plan) &&
  subscription.estado === "activa" &&
  !isSubscriptionExpired(subscription) &&
  hasRemainingQuota(subscription);

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsRef = useRef(null);
  const [planPrices, setPlanPrices] = useState(DEFAULT_PLAN_PRICES);
  const [activePlans, setActivePlans] = useState(new Set());
  const [renewablePlans, setRenewablePlans] = useState(new Set());
  const [hasActivePanorama, setHasActivePanorama] = useState(false);
  const [hasActiveSuperguia, setHasActiveSuperguia] = useState(false);

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
        const renewableSet = new Set();
        let panoramaActivo = false;
        let superguiaActiva = false;

        (subs || []).forEach((s) => {
          if (s.estado !== "activa" || isSubscriptionExpired(s)) {
            return;
          }

          const frontendId = PLAN_TYPE_TO_ID[s.plan];

          if (isBlockingPanoramaSubscription(s)) {
            if (frontendId) activeSet.add(frontendId);
            if (PANORAMA_PLAN_TYPES.includes(s.plan)) {
              panoramaActivo = true;
            }
          } else if (isRenewablePanoramaSubscription(s) && frontendId) {
            renewableSet.add(frontendId);
          }

          if (s.plan === "superguia") {
            superguiaActiva = true;
          }
        });

        setActivePlans(activeSet);
        setRenewablePlans(renewableSet);
        setHasActivePanorama(panoramaActivo);
        setHasActiveSuperguia(superguiaActiva);
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
      // Pago con Webpay Plus - redirección a Transbank
      await initiatePayment({
        panoramaPlan: selectedPlan,
        addSuperguia,
        resourceId: null,
      });
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

  if (!isAuthenticated) {
    return (
      <div className="activar-plan">
        <AuthModal isOpen={true} onClose={() => navigate("/")} persistent />
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
          {planesPanoramas.map((plan) => {
            const isOwnActive = activePlans.has(plan.id);
            const isRenewable = renewablePlans.has(plan.id);
            const isOtherActive = hasActivePanorama && !isOwnActive;
            const isPlanDisabled = isOwnActive || isOtherActive;
            return (
              <div
                key={plan.id}
                className={`activar-plan__card ${
                  plan.destacado ? "activar-plan__card--featured" : ""
                } ${selectedPlan === plan.id ? "activar-plan__card--selected" : ""} ${isPlanDisabled ? "activar-plan__card--disabled" : ""} ${isOwnActive ? "activar-plan__card--own-active" : ""} ${isOtherActive ? "activar-plan__card--other-active" : ""}`}
                onClick={() => {
                  if (!isPlanDisabled) {
                    const newPlan = selectedPlan === plan.id ? null : plan.id;
                    setSelectedPlan(newPlan);
                    if (newPlan) {
                      setTimeout(() => {
                        termsRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 100);
                    }
                  }
                }}>
                {/* Badge de plan activo */}
                {isOwnActive && (
                  <span className="activar-plan__card-active-badge">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Plan Activo
                  </span>
                )}

                {isRenewable && (
                  <span className="activar-plan__card-active-badge activar-plan__card-active-badge--renewable">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Puedes volver a suscribirte
                  </span>
                )}

                {/* Etiqueta destacada */}
                {plan.etiqueta && !isOwnActive && !isRenewable && (
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
                {isOwnActive ? (
                  <div className="activar-plan__card-active-msg activar-plan__card-active-msg--own">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    <span>Suscripción activa</span>
                  </div>
                ) : isRenewable ? (
                  <div className="activar-plan__card-active-msg activar-plan__card-active-msg--renewable">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    <span>Puedes volver a suscribirte o cambiar de plan</span>
                  </div>
                ) : isOtherActive ? (
                  <div className="activar-plan__card-active-msg activar-plan__card-active-msg--other">
                    <FontAwesomeIcon icon={faLock} />
                    <span>Ya tienes otro plan de panorama activo</span>
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
            );
          })}
        </div>
      </section>

      {/* Plan Superguía */}
      <section className="activar-plan__section activar-plan__section--superguia">
        <div className="activar-plan__section-header">
          <img
            src={iconSuperguia}
            alt="Superguía"
            className="activar-plan__section-icon"
          />
          <h2 className="activar-plan__section-title">
            Superguía Extrovertidos
          </h2>
        </div>

        <div
          className={`activar-plan__superguia ${
            addSuperguia ? "activar-plan__superguia--selected" : ""
          } ${hasActiveSuperguia ? "activar-plan__superguia--disabled activar-plan__superguia--own-active" : ""}`}
          onClick={() => {
            if (!hasActiveSuperguia) {
              setAddSuperguia(!addSuperguia);
              if (!addSuperguia) {
                setTimeout(() => {
                  termsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 100);
              }
            }
          }}>
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
          {hasActiveSuperguia ? (
            <div className="activar-plan__card-active-msg activar-plan__card-active-msg--own activar-plan__superguia-active-msg">
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>Superguía activa</span>
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

      {/* Términos y condiciones previos al pago */}
      {(selectedPlan || addSuperguia) && (
        <section className="activar-plan__terms" ref={termsRef}>
          <label className="activar-plan__terms-label">
            <input
              type="checkbox"
              className="activar-plan__terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="activar-plan__terms-text">
              He leído y acepto los{" "}
              <Link to="/terminos" className="activar-plan__terms-link">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link to="/privacidad" className="activar-plan__terms-link">
                Política de Privacidad
              </Link>
              . Comprendo y acepto que:
            </span>
          </label>
          <ul className="activar-plan__terms-list">
            <li>
              En caso de que mi publicación sea rechazada por incumplir las
              normas del sitio, cuento con un máximo de 3 intentos de edición
              para corregir y obtener su aprobación.
            </li>
            <li>
              Si tras el tercer rechazo consecutivo el contenido persiste en su
              incumplimiento, el cupo se considerará utilizado y el servicio
              prestado, sin derecho a nuevos intentos ni reembolsos.
            </li>
            <li>
              Según el Art. 3 bis de la Ley 19.496, no aplica derecho a retracto
              una vez realizado el pago.
            </li>
            <li>
              Declaro que mi contenido no infringe las prohibiciones de lenguaje
              ofensivo, odio o incitación al desorden público.
            </li>
          </ul>
        </section>
      )}

      {/* Footer con resumen y botón de pagar */}
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
          disabled={
            (!selectedPlan && !addSuperguia) ||
            !termsAccepted ||
            processingPayment
          }
          onClick={handleSiguiente}>
          {processingPayment ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Procesando pago...
            </>
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
